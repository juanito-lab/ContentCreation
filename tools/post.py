#!/usr/bin/env python3
"""Post a rendered video to Instagram Reels and TikTok through Zernio (https://zernio.com), with an approval lock.

Nothing is published by accident: you approve one exact file + caption, and publishing refuses anything else.

  python3 tools/post.py accounts
      List the social accounts connected to your Zernio account (read-only). Put the ids in posting.json, or
      leave them out when you have only one account per platform.

  python3 tools/post.py approve videos/<id> [--file NAME.mp4] [--by "Your Name"]
      Show the file, its length and loudness, and the exact caption, then ask you to type "yes". Writes
      videos/<id>/out/approval.json with SHA-256 hashes of the video and the caption. Change either one and the
      approval no longer matches, so you have to approve again.

  python3 tools/post.py publish videos/<id> --to instagram,tiktok (--now | --draft | --at 2026-10-12T18:30) [--dry-run]
      Without --now / --draft / --at it only prints the plan. --dry-run prints the exact API requests and sends
      nothing. --now publishes immediately, --at schedules (time zone from posting.json or --tz), --draft saves a
      draft in Zernio that you finish in its dashboard. Refuses unless approval.json matches the file and caption.

  python3 tools/post.py status <post-id>
      Read a post's status and the live URLs per platform.

Setup (once):
  1. Create a Zernio account, connect Instagram (Business or Creator account) and TikTok in its dashboard.
  2. Create an API key at https://zernio.com/dashboard/api-keys and put it in .env as ZERNIO_API_KEY=sk_...
     (or export it). .env is git-ignored.
  3. Optional: cp posting.example.json posting.json and adjust (account ids, TikTok privacy, Instagram options).

Every real action is appended to videos/<id>/out/post-log.jsonl. Only the Python standard library is used.
Full guide: docs/posting.md.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
API = os.environ.get("ZERNIO_API_BASE", "https://zernio.com/api/v1")
PLATFORMS = ("instagram", "tiktok")
DEFAULT_CONFIG = {
    "timezone": "Europe/Berlin",
    "accounts": {"instagram": "", "tiktok": ""},
    "tiktok": {
        "privacy_level": "PUBLIC_TO_EVERYONE",
        "allow_comment": True,
        "allow_duet": False,
        "allow_stitch": True,
        "video_made_with_ai": False,
    },
    "instagram": {"shareToFeed": True},
}
LIMITS = {  # Zernio platform docs, Oct 2026
    "instagram": {"min_s": 3, "max_s": 90, "max_bytes": 300 * 1024**2},
    "tiktok": {"min_s": 3, "max_s": 600, "max_bytes": 4 * 1024**3},
}
HASHTAG_LIMIT = 5


class PostError(Exception):
    """An expected problem with a message for the person running the tool."""


# ---------------------------------------------------------------------------------------------------- pure helpers

def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def read_caption(path: Path) -> str:
    """caption.txt as written by make.sh: trailing whitespace stripped, inner line breaks kept."""
    return path.read_text(encoding="utf-8").rstrip()


def hashtags(caption: str) -> list[str]:
    return [w.strip(".,!?;:").lower() for w in caption.split() if w.startswith("#") and len(w) > 1]


def caption_problems(caption: str) -> list[str]:
    """Hard problems that block publishing."""
    probs = []
    if not caption.strip():
        probs.append("the caption is empty")
    if "%23" in caption:
        probs.append('the caption contains "%23"; write a real "#" (it would be published literally)')
    if len(caption) > 2200:
        probs.append(f"the caption is {len(caption)} characters; Instagram and TikTok allow 2,200")
    return probs


def caption_warnings(caption: str) -> list[str]:
    warns = []
    n = len(hashtags(caption))
    if n > HASHTAG_LIMIT:
        warns.append(f"{n} hashtags: Instagram allows at most {HASHTAG_LIMIT}")
    return warns


def load_config(path: Path | None) -> dict:
    cfg = json.loads(json.dumps(DEFAULT_CONFIG))
    p = path or ROOT / "posting.json"
    if p.is_file():
        user = json.loads(p.read_text(encoding="utf-8"))
        for k, v in user.items():
            if isinstance(v, dict) and isinstance(cfg.get(k), dict):
                cfg[k].update(v)
            else:
                cfg[k] = v
    return cfg


def load_api_key() -> str:
    key = os.environ.get("ZERNIO_API_KEY", "").strip()
    env = ROOT / ".env"
    if not key and env.is_file():
        for line in env.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("ZERNIO_API_KEY="):
                key = line.split("=", 1)[1].strip().strip('"').strip("'")
    if not key:
        raise PostError("no Zernio API key: set ZERNIO_API_KEY in .env or in your shell (see docs/posting.md)")
    return key


def mask(text: str, secrets: tuple[str, ...]) -> str:
    for s in secrets:
        if s and len(s) >= 6:
            text = text.replace(s, f"<secret, {len(s)} chars>")
    return text


def cover_ms(spec: dict) -> int:
    """Cover frame for both platforms: the first entry of spec "covers" (frames at 30 fps), else 1 s."""
    covers = spec.get("covers") or []
    return int(round(covers[0] / 30 * 1000)) if covers else 1000


def build_post_body(*, media_url: str, caption: str, platforms: list[str], accounts: dict, cfg: dict, spec: dict,
                    mode: str, at: str | None = None, tz: str | None = None) -> dict:
    """The JSON body for POST /v1/posts. mode: now | draft | at."""
    thumb = cover_ms(spec)
    body: dict = {"content": caption, "mediaItems": [{"url": media_url, "type": "video"}], "platforms": []}
    for p in platforms:
        entry: dict = {"platform": p, "accountId": accounts[p]}
        if p == "instagram":
            ig = dict(cfg.get("instagram", {}))
            ig.setdefault("thumbOffset", thumb)
            entry["platformSpecificData"] = ig
        body["platforms"].append(entry)
    if "tiktok" in platforms:
        tt = dict(cfg.get("tiktok", {}))
        tt.setdefault("video_cover_timestamp_ms", thumb)
        # TikTok requires both to be true. They state that the creator previewed the exact video and consented to
        # posting it, which is what approval.json records.
        tt["content_preview_confirmed"] = True
        tt["express_consent_given"] = True
        body["tiktokSettings"] = tt
    if mode == "now":
        body["publishNow"] = True
    elif mode == "draft":
        body["isDraft"] = True
    elif mode == "at":
        if not at:
            raise PostError("--at needs a time, e.g. 2026-10-12T18:30")
        body["scheduledFor"] = at
        body["timezone"] = tz or cfg.get("timezone") or "UTC"
    else:
        raise PostError(f"unknown mode {mode}")
    body["metadata"] = {"source": "ContentCreation/tools/post.py", "video": spec.get("_id", "")}
    return body


def idempotency_key(video_sha: str, caption_sha: str, platforms: list[str], mode: str, at: str | None) -> str:
    """Same approved post + same mode = same key, so a retried request never creates a second post."""
    return str(uuid.uuid5(uuid.NAMESPACE_URL, "|".join([video_sha, caption_sha, ",".join(sorted(platforms)), mode, at or ""])))


def check_approval(approval: dict | None, video_name: str, video_sha: str, caption_sha: str) -> None:
    if not approval:
        raise PostError("not approved yet: run  python3 tools/post.py approve videos/<id>  first")
    if approval.get("file") != video_name or approval.get("videoSha256") != video_sha:
        raise PostError(f"the approval is for {approval.get('file')} with different content; approve this exact file again")
    if approval.get("captionSha256") != caption_sha:
        raise PostError("the caption changed after approval; approve again")


# ---------------------------------------------------------------------------------------------------- media facts

def probe(path: Path) -> dict:
    info = {"seconds": None, "width": None, "height": None, "lufs": None}
    try:
        r = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration",
                            "-of", "json", str(path)], capture_output=True, text=True, timeout=60)
        j = json.loads(r.stdout or "{}")
        st = (j.get("streams") or [{}])[0]
        info.update(width=st.get("width"), height=st.get("height"), seconds=float(j.get("format", {}).get("duration", 0)) or None)
        e = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128", "-f", "null", "-"],
                           capture_output=True, text=True, timeout=300).stderr
        vals = [ln.split()[1] for ln in e.splitlines() if ln.strip().startswith("I:")]
        info["lufs"] = float(vals[-1]) if vals else None
    except (OSError, ValueError, subprocess.TimeoutExpired, json.JSONDecodeError):
        pass
    return info


def media_problems(info: dict, size: int, platforms: list[str]) -> list[str]:
    probs = []
    if info.get("width") and info.get("height") and (info["width"], info["height"]) != (1080, 1920):
        probs.append(f"the video is {info['width']}x{info['height']}; both platforms expect 1080x1920 (9:16)")
    secs = info.get("seconds")
    for p in platforms:
        lim = LIMITS[p]
        if secs is not None and not (lim["min_s"] <= secs <= lim["max_s"]):
            probs.append(f"{p}: the video is {secs:.1f} s; allowed is {lim['min_s']}-{lim['max_s']} s")
        if size > lim["max_bytes"]:
            probs.append(f"{p}: the file is {size / 1024**2:.0f} MB; the limit is {lim['max_bytes'] / 1024**2:.0f} MB")
    return probs


# ---------------------------------------------------------------------------------------------------- Zernio API

class Zernio:
    def __init__(self, key: str, dry_run: bool = False):
        self.key, self.dry_run = key, dry_run

    def request(self, method: str, path: str, body: dict | None = None, headers: dict | None = None) -> tuple[int, dict]:
        url = API + path
        if self.dry_run:
            print(f"[dry-run] {method} {url}")
            if body is not None:
                print(json.dumps(body, indent=1, ensure_ascii=False))
            return 0, {}
        data = json.dumps(body).encode("utf-8") if body is not None else None
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header("Authorization", f"Bearer {self.key}")
        req.add_header("Accept", "application/json")
        if data is not None:
            req.add_header("Content-Type", "application/json")
        for k, v in (headers or {}).items():
            req.add_header(k, v)
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                return r.status, json.loads(r.read() or b"{}")
        except urllib.error.HTTPError as e:
            raw = e.read().decode("utf-8", "replace")
            try:
                payload = json.loads(raw)
            except json.JSONDecodeError:
                payload = {"error": raw[:500]}
            return e.code, payload
        except urllib.error.URLError as e:
            raise PostError(f"could not reach Zernio ({e.reason}); check your network") from e

    def accounts(self) -> list[dict]:
        code, j = self.request("GET", "/accounts")
        if code != 200:
            raise PostError(f"listing accounts failed ({code}): {mask(json.dumps(j), (self.key,))}")
        return j.get("accounts", [])

    def upload(self, path: Path) -> str:
        """Presign, PUT the bytes to storage, return the public URL (valid 7 days in Zernio's temp storage)."""
        size = path.stat().st_size
        code, j = self.request("POST", "/media/presign", {"filename": path.name, "contentType": "video/mp4", "size": size})
        if self.dry_run:
            print(f"[dry-run] PUT <uploadUrl> ({size / 1024**2:.1f} MB, Content-Type: video/mp4)")
            return "https://example.invalid/uploaded-after-presign.mp4"
        if code != 200 or not j.get("uploadUrl"):
            raise PostError(f"presign failed ({code}): {mask(json.dumps(j), (self.key,))}")
        req = urllib.request.Request(j["uploadUrl"], data=path.read_bytes(), method="PUT")
        req.add_header("Content-Type", "video/mp4")
        try:
            with urllib.request.urlopen(req, timeout=900) as r:
                if r.status not in (200, 201, 204):
                    raise PostError(f"upload failed with HTTP {r.status}")
        except urllib.error.HTTPError as e:
            raise PostError(f"upload failed with HTTP {e.code}") from e
        return j["publicUrl"]


# ---------------------------------------------------------------------------------------------------- commands

def video_paths(video_dir: Path, file: str | None) -> tuple[Path, Path, dict]:
    out = video_dir / "out"
    spec_path = video_dir / "spec.json"
    if not spec_path.is_file():
        raise PostError(f"no spec.json in {video_dir}")
    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    spec["_id"] = video_dir.name
    video = out / (file or f"{video_dir.name}_1080x1920.mp4")
    if not video.is_file():
        raise PostError(f"{video} not found: render it first with  tools/make.sh {video_dir}")
    caption = out / "caption.txt"
    if not caption.is_file():
        raise PostError(f"{caption} not found: render it first with  tools/make.sh {video_dir}")
    return video, caption, spec


def log(video_dir: Path, entry: dict) -> None:
    entry = {"time": dt.datetime.now().astimezone().isoformat(timespec="seconds"), **entry}
    with open(video_dir / "out" / "post-log.jsonl", "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")


def cmd_accounts(a) -> int:
    z = Zernio(load_api_key())
    rows = z.accounts()
    if not rows:
        print("No accounts connected. Connect Instagram / TikTok in the Zernio dashboard first.")
        return 1
    print(f"{'platform':<12} {'username':<28} {'active':<7} accountId")
    for r in rows:
        print(f"{r.get('platform', ''):<12} {r.get('username', ''):<28} {str(r.get('isActive', '')):<7} {r.get('_id', '')}")
    print("\nPut the ids under \"accounts\" in posting.json (only needed when a platform has more than one account).")
    return 0


def cmd_approve(a) -> int:
    video_dir = Path(a.video_dir).resolve()
    video, caption_path, spec = video_paths(video_dir, a.file)
    caption = read_caption(caption_path)
    probs = caption_problems(caption)
    if probs:
        raise PostError("; ".join(probs))
    info = probe(video)
    size = video.stat().st_size
    print(f"\nVideo:    {video.relative_to(ROOT) if video.is_relative_to(ROOT) else video}")
    print(f"          {info.get('width')}x{info.get('height')}, {info.get('seconds') or 0:.2f} s, {size / 1024**2:.1f} MB, "
          f"{info.get('lufs')} LUFS")
    print("Caption:  (exactly as it will be posted)\n" + "-" * 60 + f"\n{caption}\n" + "-" * 60)
    for w in caption_warnings(caption) + media_problems(info, size, list(PLATFORMS)):
        print(f"warning: {w}")
    print("\nWatch the whole video with sound before you approve it.")
    if a.yes:
        answer = "yes"
    elif sys.stdin.isatty():
        answer = input('Type "yes" to approve this exact file and caption: ').strip().lower()
    else:
        raise PostError('not a terminal: pass --yes only after the creator has said "yes" to this exact file and caption')
    if answer != "yes":
        print("Not approved.")
        return 1
    approval = {
        "file": video.name,
        "videoSha256": sha256_file(video),
        "captionSha256": sha256_text(caption),
        "caption": caption,
        "approvedBy": a.by or os.environ.get("USER", ""),
        "approvedAt": dt.datetime.now().astimezone().isoformat(timespec="seconds"),
    }
    (video_dir / "out" / "approval.json").write_text(json.dumps(approval, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    log(video_dir, {"action": "approve", "file": video.name, "by": approval["approvedBy"]})
    print(f"Approved: {video_dir.name}/out/approval.json")
    return 0


def resolve_accounts(z: Zernio | None, cfg: dict, platforms: list[str]) -> dict:
    accounts = {p: (cfg.get("accounts") or {}).get(p, "") for p in platforms}
    missing = [p for p in platforms if not accounts[p]]
    if missing and z and not z.dry_run:
        listed = z.accounts()
        for p in missing:
            matches = [r for r in listed if r.get("platform") == p and r.get("isActive", True)]
            if len(matches) == 1:
                accounts[p] = matches[0]["_id"]
            elif not matches:
                raise PostError(f"no active {p} account connected in Zernio")
            else:
                raise PostError(f"{len(matches)} {p} accounts in Zernio: set accounts.{p} in posting.json (see: post.py accounts)")
    for p in platforms:
        accounts[p] = accounts[p] or f"<{p}-account-id>"
    return accounts


def cmd_publish(a) -> int:
    video_dir = Path(a.video_dir).resolve()
    platforms = [p.strip().lower() for p in a.to.split(",") if p.strip()]
    bad = [p for p in platforms if p not in PLATFORMS]
    if bad or not platforms:
        raise PostError(f"--to takes a comma list of: {', '.join(PLATFORMS)}")
    mode = "now" if a.now else "draft" if a.draft else "at" if a.at else None
    video, caption_path, spec = video_paths(video_dir, a.file)
    caption = read_caption(caption_path)
    cfg = load_config(Path(a.config) if a.config else None)

    probs = caption_problems(caption)
    if probs:
        raise PostError("; ".join(probs))
    approval_path = video_dir / "out" / "approval.json"
    approval = json.loads(approval_path.read_text(encoding="utf-8")) if approval_path.is_file() else None
    video_sha, caption_sha = sha256_file(video), sha256_text(caption)
    try:
        check_approval(approval, video.name, video_sha, caption_sha)
        approved = True
    except PostError as e:
        if mode is not None and not a.dry_run:
            raise
        print(f"note: {e}")
        approved = False
    info = probe(video)
    mprobs = media_problems(info, video.stat().st_size, platforms)
    if mprobs:
        raise PostError("; ".join(mprobs))
    for w in caption_warnings(caption):
        print(f"warning: {w}")

    if mode is None:
        print(f"Plan: post {video.name} ({info.get('seconds') or 0:.1f} s) to {', '.join(platforms)}.")
        if approved:
            print(f"Approved by {approval.get('approvedBy') or 'unknown'} at {approval.get('approvedAt')}.")
        print("Nothing sent. Add --now, --draft or --at <time> (and --dry-run to see the exact requests).")
        return 0

    key = "" if a.dry_run else load_api_key()
    z = Zernio(key, dry_run=a.dry_run)
    accounts = resolve_accounts(z, cfg, platforms)
    if a.tiktok_privacy:
        cfg.setdefault("tiktok", {})["privacy_level"] = a.tiktok_privacy
    media_url = z.upload(video)
    body = build_post_body(media_url=media_url, caption=caption, platforms=platforms, accounts=accounts, cfg=cfg,
                           spec=spec, mode=mode, at=a.at, tz=a.tz)
    ikey = idempotency_key(video_sha, caption_sha, platforms, mode, a.at)
    code, j = z.request("POST", "/posts", body, headers={"Idempotency-Key": ikey})
    if a.dry_run:
        print("[dry-run] nothing was uploaded or created.")
        return 0
    post = j.get("post", {}) if isinstance(j, dict) else {}
    results = [{"platform": p.get("platform"), "status": p.get("status"), "url": p.get("platformPostUrl"),
                "error": p.get("errorMessage")} for p in post.get("platforms", [])]
    log(video_dir, {"action": f"publish-{mode}", "http": code, "postId": post.get("_id"), "status": post.get("status"),
                    "platforms": results, "file": video.name})
    if code not in (200, 201, 207):
        raise PostError(f"Zernio answered {code}: {mask(json.dumps(j, ensure_ascii=False), (key,))}. "
                        "Nothing is retried automatically; check  post.py status  or the Zernio dashboard before trying again.")
    print(f"Post {post.get('_id')}: {post.get('status')}")
    for r in results:
        print(f"  {r['platform']:<10} {r['status']:<11} {r['url'] or ''} {r['error'] or ''}")
    if mode == "at":
        print(f"Scheduled for {a.at} ({body.get('timezone')}).")
    return 0 if post.get("status") not in ("failed", "partial") else 2


def cmd_status(a) -> int:
    z = Zernio(load_api_key())
    code, j = z.request("GET", f"/posts/{a.post_id}")
    if code != 200:
        raise PostError(f"Zernio answered {code}: {mask(json.dumps(j), (z.key,))}")
    post = j.get("post", {})
    print(f"Post {post.get('_id')}: {post.get('status')}  scheduledFor={post.get('scheduledFor')}")
    for p in post.get("platforms", []):
        print(f"  {p.get('platform'):<10} {p.get('status'):<11} {p.get('platformPostUrl') or ''} {p.get('errorMessage') or ''}")
    return 0


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="Post a rendered video to Instagram Reels and TikTok through Zernio.",
                                 epilog="Full guide: docs/posting.md")
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("accounts", help="list connected social accounts")
    p = sub.add_parser("approve", help="approve one exact file + caption")
    p.add_argument("video_dir"); p.add_argument("--file"); p.add_argument("--by")
    p.add_argument("--yes", action="store_true", help="non-interactive; only after the creator said yes to this file + caption")
    p = sub.add_parser("publish", help="publish, schedule or draft an approved video")
    p.add_argument("video_dir"); p.add_argument("--to", required=True, help="instagram,tiktok")
    m = p.add_mutually_exclusive_group()
    m.add_argument("--now", action="store_true"); m.add_argument("--draft", action="store_true"); m.add_argument("--at")
    p.add_argument("--tz"); p.add_argument("--file"); p.add_argument("--config")
    p.add_argument("--tiktok-privacy", choices=["PUBLIC_TO_EVERYONE", "MUTUAL_FOLLOW_FRIENDS", "FOLLOWER_OF_CREATOR", "SELF_ONLY"])
    p.add_argument("--dry-run", action="store_true")
    p = sub.add_parser("status", help="status and URLs of a post"); p.add_argument("post_id")
    a = ap.parse_args(argv)
    try:
        return {"accounts": cmd_accounts, "approve": cmd_approve, "publish": cmd_publish, "status": cmd_status}[a.cmd](a)
    except PostError as e:
        print(f"error: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
