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
- Captions: the ending changes from video to video (question, statement, "save this", cliffhanger…); a question in at most a third of a batch. 3 to 5 specific hashtags, never #fyp or #viral, and not the same set every time.

## Facts

- Only use claims and numbers the creator gave you or wrote in their notes. If a number is missing, ask; never invent one.
- Never name customers, prospects or partners unless the creator explicitly cleared that name.
- Illustrations (e.g. a sample alert card) must not look like real customer data.

## Look

- Colours: white and red (`#E10600`) on footage, black and red on light cards. Red is for the one emotional word per beat.
- Fonts (bundled in `studio/public/fonts`): Inter Tight 700 (`sans`), Libre Caslon Display (`serif`), Great Vibes (`script`).
- House look: one bold sans word + one red script word per beat, small serif connectors. **Use it in at most 2 of every 14 videos**: when every video wore it, a whole batch looked like one video. The other videos take their text look from their brief (meme top text, notes app, handwritten, labels and arrows, subtitles, big kinetic type, none).

## Funnel and week

- Posts per week: 7. Briefs and builds per week: 14 (5 reach · 5 update · 4 depth); the creator picks 7.
- Calendar: Mon reach · Tue depth · Wed update · Thu reach · Fri depth · Sat reach · Sun update. Never the same stage two days in a row.
- The creator's own words: top funnel = depth, middle funnel = update, bottom funnel = reach.
- Details: [docs/batches-and-funnel.md](docs/batches-and-funnel.md).

## On screen

- Allowed: Juan, and his co-founder Santi. Nobody else as the face or main subject of a shot; reference photos live outside the repo.
- Unsure who someone is in a clip: don't use it, ask.
- Real footage only, never generated visuals. Fresh clips every video: nothing used in an earlier video unless the creator asks.

## Voice recording

- Recorded in [voice-coach](https://github.com/juanito-lab/voice-coach) before any timing work. Three takes at most.
- In the mix the voice sits lower than you'd think (`voVolume` 0.45–0.6); the master is normalised to −14 LUFS anyway.

## Posting

- Through Zernio (`tools/post.py`), after approval. Always keep the no-music version when the video has music, so a trending sound can be added in the app.
