# Posting to Instagram Reels and TikTok (Zernio)

`tools/post.py` uploads a rendered video and publishes, schedules or drafts it on Instagram Reels and TikTok through [Zernio](https://zernio.com), a social-media posting API. It is built around one rule: **nothing goes public unless the account owner approved that exact file and that exact caption.**

```
make.sh ─▶ out/<id>_1080x1920.mp4 + out/caption.txt
                       │
     post.py approve ──┴─▶ out/approval.json   (SHA-256 of the video + the caption, who, when)
                       │
     post.py publish ──┴─▶ checks the hashes ─▶ uploads ─▶ POST /v1/posts ─▶ out/post-log.jsonl
                                 │ mismatch → refuses
```

## Setup (once, ~10 minutes)

1. **Zernio account.** Sign up at zernio.com and connect your accounts in its dashboard:
   - **Instagram:** a Business or Creator account (personal accounts can't post through any API).
   - **TikTok:** your TikTok account (TikTok asks you to authorize Zernio).
2. **API key.** Create one at <https://zernio.com/dashboard/api-keys>. It starts with `sk_` and is shown only once.
   ```bash
   cp .env.example .env        # .env is git-ignored
   # then edit .env:  ZERNIO_API_KEY=sk_...
   ```
   An exported `ZERNIO_API_KEY` in your shell works too and wins over `.env`.
3. **Check it:**
   ```bash
   python3 tools/post.py accounts
   ```
   lists every connected account with its id. With one account per platform you're done; `post.py` finds them by itself.
4. **Optional settings:** `cp posting.example.json posting.json` (git-ignored) and change what you need:

| Key | Default | Meaning |
|---|---|---|
| `timezone` | `Europe/Berlin` | Used for `--at` times without an offset |
| `accounts.instagram`, `accounts.tiktok` | `""` | Account ids from `post.py accounts`; only needed with several accounts per platform |
| `tiktok.privacy_level` | `PUBLIC_TO_EVERYONE` | Or `MUTUAL_FOLLOW_FRIENDS`, `FOLLOWER_OF_CREATOR`, `SELF_ONLY` (must be allowed for your account) |
| `tiktok.allow_comment` / `allow_duet` / `allow_stitch` | `true` / `false` / `true` | Interaction settings |
| `tiktok.video_made_with_ai` | `false` | TikTok's AI-generated-content label. Set `true` if the visuals or voice are AI-generated |
| `instagram.shareToFeed` | `true` | `false` = Reels tab only, not the profile grid |
| `instagram.trialParams` | none | `{"graduationStrategy": "MANUAL"}` posts a **trial reel** shown to non-followers first; `"SS_PERFORMANCE"` shares it with everyone automatically if it performs |

Any other Zernio platform field can be added under `tiktok` or `instagram` the same way (see Zernio's [TikTok](https://docs.zernio.com/platforms/tiktok) and [Instagram](https://docs.zernio.com/platforms/instagram) docs).

## Approve

```bash
python3 tools/post.py approve videos/<id>
```

Shows the file (resolution, length, size, loudness) and the caption **exactly as it will be posted**, with warnings (more than 5 hashtags, wrong size, too long for Reels). Type `yes`. It writes `out/approval.json`:

```json
{ "file": "2026-10-12-first-pilot_1080x1920.mp4", "videoSha256": "…", "captionSha256": "…",
  "caption": "…", "approvedBy": "Juan", "approvedAt": "2026-10-12T17:02:11+02:00" }
```

Options: `--file NAME.mp4` (e.g. the `_no-music` version), `--by "Name"`. In scripts and agents, `--yes` skips the prompt. **Use it only after the account owner said yes to that file and caption.**

Re-render the video or edit `caption.txt` and the approval stops matching: approve again.

## Publish

```bash
python3 tools/post.py publish videos/<id> --to instagram,tiktok                 # plan only, sends nothing
python3 tools/post.py publish videos/<id> --to instagram,tiktok --now --dry-run # prints the exact requests, sends nothing
python3 tools/post.py publish videos/<id> --to instagram,tiktok --now           # publish immediately
python3 tools/post.py publish videos/<id> --to instagram,tiktok --at 2026-10-12T18:30            # schedule (posting.json time zone)
python3 tools/post.py publish videos/<id> --to tiktok --at 2026-10-12T18:30 --tz America/Los_Angeles
python3 tools/post.py publish videos/<id> --to instagram,tiktok --draft         # a draft in Zernio, finish it in their dashboard
python3 tools/post.py publish videos/<id> --to tiktok --now --tiktok-privacy SELF_ONLY   # a private test post
```

What happens on `--now` / `--at` / `--draft`:

1. Checks: the caption isn't empty, has no `%23` (it would be posted literally; write a real `#`), is under 2,200 characters; the video is 1080×1920 and within each platform's limits; **the approval matches**.
2. Finds the account ids (from `posting.json` or the single connected account per platform).
3. Uploads the file to Zernio's temporary storage (presigned URL, kept 7 days).
4. Creates the post. The cover is the frame at `covers[0]` of the spec (Instagram `thumbOffset`, TikTok `video_cover_timestamp_ms`). TikTok's two required consent flags (`content_preview_confirmed`, `express_consent_given`) are set, because the approval records exactly that preview and consent.
5. Prints the status and live URL per platform and appends a line to `out/post-log.jsonl`.

Every request carries an **idempotency key** derived from the approved file, caption, platforms and mode, so a retried request returns the same post instead of creating a second one.

## Status

```bash
python3 tools/post.py status <post-id>
```

Post status (`draft`, `scheduled`, `publishing`, `published`, `partial`, `failed`) and per platform `status`, URL and error.

## Limits

| | Instagram Reels | TikTok |
|---|---|---|
| Length | 3–90 s | 3 s – 10 min |
| File size | 300 MB | 4 GB |
| Format | MP4/MOV, H.264, 9:16, 1080×1920, 30 fps | MP4/MOV/WebM, H.264, 9:16, 1080×1920 |
| Hashtags | max 5 | 3–4 recommended |
| Cover | a frame (`thumbOffset`) or a custom image | a frame (`video_cover_timestamp_ms`) |
| Platform music | not through the API | Commercial Music Library, business accounts only |

`make.sh` output fits both. Limits change; Zernio's platform pages are the source.

## When something goes wrong

| Message | Fix |
|---|---|
| `not approved yet` / `the caption changed` / `different content` | Show the current file and caption to the owner and run `approve` again. |
| `no Zernio API key` | Put `ZERNIO_API_KEY=sk_...` in `.env`. Never paste the key into a chat or a commit. |
| `N instagram accounts in Zernio` | Set `accounts.instagram` in `posting.json` (ids from `post.py accounts`). |
| `Zernio answered 401` | The key is wrong or revoked: create a new one. |
| `Zernio answered 409` | A duplicate: the same content was already posted to that account. Check `post.py status` or the dashboard. |
| A timeout or network error during publish | **Don't run it again blindly.** The post may have gone through: check `post.py status` or the Zernio dashboard first. |
| Status `failed` with `auth_expired` | Reconnect the account in the Zernio dashboard. |

## Posting by hand instead

Some things only work in the apps: a trending sound from the music library, Instagram's "Upload at highest quality" switch, collaborators on TikTok. For those, open the app and upload `out/<id>_1080x1920.mp4` (or `_no-music.mp4` plus a sound from the library) with the text from `caption.txt`. Upload the original file natively; never a file with another app's watermark.

## Composio (alternative)

Zernio is also reachable through [Composio](https://composio.dev) as the `zernio_mcp` toolkit, for agents that already use Composio. `post.py` talks to Zernio's REST API directly so it needs nothing but Python and an API key. Jasper Kallfelz's [shortform-edit-kit](https://github.com/JasperKallfelz/shortform-edit-kit) has a Composio-based poster (documentation in German).
