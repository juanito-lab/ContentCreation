# library/

Your own media, shared across videos: clips, photos, voice takes, music you own. **Everything in this folder except this README and the template is git-ignored**, so nothing personal is ever pushed.

A spec can name a file from here directly (`"media": {"file": "dorm1.mp4"}`): `tools/make.sh` looks in the video's own folder first, then in `library/`.

```
library/
  LIBRARY.md     one line per file: what it is, who is in it, where it was used (copy LIBRARY.template.md)
  inbox/         new material lands here first; give each file one line in LIBRARY.md before using it
  *.mp4, *.jpg   edit-ready media (run phone originals through tools/media_prep.py first)
```

Why this exists: on the first real video, the same clips had to be found and identified from scratch three times. A one-line description per file turns "find me a shot of X" into a 10-second lookup for you or an agent. See [docs/media.md](../docs/media.md).
