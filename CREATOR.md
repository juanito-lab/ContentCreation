# Creator profile

The agent skills in `skills/` read this file before every video, so the videos sound like one person and follow that person's rules. **This is the maintainer's profile. If you use this repo for yourself, replace every value below with your own** (keep the headings, the skills look for them).

## Account

- **Name:** Juan Simon
- **Handle:** @juansimon.builds
- **Platforms:** Instagram Reels (live), TikTok (planned)
- **Approver:** Juan. Nothing is posted until he says "yes" to the exact file and the exact caption.
- **Time zone:** Europe/Berlin (used for scheduled posts)

## What the account is about

A founder building a startup (MantAI: vehicle monitoring and acoustic failure prediction) in public, while studying in Berlin. Building hardware, first pilots, the move from Zürich to Berlin to San Francisco, what works and what doesn't.

## How the videos start

Most videos start from **related content found online**: a reference reel whose structure works. The video is rebuilt with the creator's own words, numbers and footage. The reference is only a template for structure and pacing; its footage, audio, handle and watermark never appear.

## Voice and copy rules

- Every line carries a number or a mechanism. No fluffy metaphors, no filler.
- Strongest image and line first. About 40 words per 15 seconds.
- Plain, direct, confident. Real numbers only.
- Captions end with a question. 3 to 5 specific hashtags, never #fyp or #viral.

## Facts

- Only use claims and numbers the creator gave you or wrote in their notes. If a number is missing, ask; never invent one.
- Never name customers, prospects or partners unless the creator explicitly cleared that name.
- Illustrations (e.g. a sample alert card) must not look like real customer data.

## Look

- Colours: white and red (`#E10600`) on footage, black and red on light cards. Red is for the one emotional word per beat.
- Fonts (bundled in `studio/public/fonts`): Inter Tight 700 (`sans`), Libre Caslon Display (`serif`), Great Vibes (`script`).
- Pattern per beat: one bold sans word + one red script word; small serif connectors.

## Voice recording

- Recorded in [voice-coach](https://github.com/juanito-lab/voice-coach) before any timing work. Three takes at most.
- In the mix the voice sits lower than you'd think (`voVolume` 0.45–0.6); the master is normalised to −14 LUFS anyway.

## Posting

- Through Zernio (`tools/post.py`), after approval. Always keep the no-music version when the video has music, so a trending sound can be added in the app.
