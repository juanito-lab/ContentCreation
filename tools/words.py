#!/usr/bin/env python3
"""Word timestamps for a voiceover or a reference clip (needs: pip install faster-whisper).

  python3 tools/words.py videos/<id>/vo.wav            -> prints [{"w": "word", "t": 0.42}, ...] (seconds)
  python3 tools/words.py refs/tiktok-123.wav --model small

Use the times to set scene "dur" and each word's "t" (t is relative to the scene start).
"""
import argparse, json
from faster_whisper import WhisperModel

ap = argparse.ArgumentParser()
ap.add_argument("audio"); ap.add_argument("--model", default="small"); ap.add_argument("--lang", default=None)
a = ap.parse_args()
model = WhisperModel(a.model, device="cpu", compute_type="int8")
segs, _ = model.transcribe(a.audio, word_timestamps=True, language=a.lang)
print(json.dumps([{"w": w.word.strip(), "t": round(w.start, 2), "end": round(w.end, 2)} for s in segs for w in s.words], ensure_ascii=False, indent=1))
