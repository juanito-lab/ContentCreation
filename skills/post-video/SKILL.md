---
name: post-video
description: "Publish, schedule or draft a rendered short video on Instagram Reels and TikTok through Zernio with tools/post.py, only after the creator approved the exact file and caption. Use when the creator says 'post it', 'schedule it for 6 pm', 'put it on TikTok', or asks whether a post went live."
version: 1.0.0
platforms: [linux, macos]
metadata:
  hermes:
    tags: [Zernio, Instagram, TikTok, Reels, Posting, Scheduling]
    related_skills: [shortform-video]
---

# Post a video (Zernio)

Workspace: the root of the ContentCreation repo. Full guide: `docs/posting.md`. Account rules: `CREATOR.md`.

## Hard rule

**Nothing goes public without the creator's explicit "yes" to this exact video file and this exact caption**, given
in the conversation for this post. A QA reviewer's ✅ is not approval. An earlier "yes" for another version is not
approval. If the file or caption changes, ask again.

## Steps

1. **Check it's ready.** `videos/<id>/out/` has `<id>_1080x1920.mp4` and `caption.txt` (from `tools/make.sh`).
   Read `caption.txt`: it is posted exactly as written.
2. **Show the creator what will go out:** the mp4, the cover, the exact caption, the platforms, and when (now / a time /
   as a draft). Ask for "yes".
3. **After "yes":** record the approval (hashes of the file and caption):
   ```bash
   python3 tools/post.py approve videos/<id> --yes --by "<creator name>"
   ```
4. **Dry run first** (sends nothing, prints the exact requests):
   ```bash
   python3 tools/post.py publish videos/<id> --to instagram,tiktok --now --dry-run
   ```
5. **Then one of:**
   ```bash
   python3 tools/post.py publish videos/<id> --to instagram,tiktok --now
   python3 tools/post.py publish videos/<id> --to instagram,tiktok --at 2026-10-12T18:30      # time zone from posting.json
   python3 tools/post.py publish videos/<id> --to tiktok --draft                              # finish in the Zernio dashboard
   ```
6. **Report** in one line per platform: status + URL (from the output or `python3 tools/post.py status <post-id>`).

## If something fails

- `not approved yet` / `caption changed` / `different content`: the approval doesn't match. Show the creator the current
  file + caption and ask again. Never run `approve --yes` without that new "yes".
- `no Zernio API key`: the creator puts `ZERNIO_API_KEY=sk_...` in `.env` (see `docs/posting.md`). Never ask for the
  key in chat and never print it.
- An HTTP error or timeout: **do not retry blindly.** Run `post.py status <id>` or check the Zernio dashboard first; a
  timed-out request may have posted. (Retries of the same approved post reuse an idempotency key, but check anyway.)
- `N instagram accounts`: set `accounts.instagram` in `posting.json` (ids from `python3 tools/post.py accounts`).

## Limits worth knowing

- Instagram Reels via the API: 3–90 s, max 300 MB, 1080×1920, max 5 hashtags. The cover is the frame at `covers[0]`.
- TikTok: 3 s–10 min, no custom cover via this route except a frame time (`covers[0]`), privacy from `posting.json`
  (`--tiktok-privacy SELF_ONLY` for a private test post).
- Platform music can't be added through the API. For a trending sound, post the `_no-music` file manually in the app.
