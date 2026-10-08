#!/usr/bin/env python3
"""Map a raw voice take: speech chunks (from pauses) + what was said in each (offline ASR, PocketSphinx)
+ optional word-level start times. Use the output to build lines.json for voice_assemble.py.

  python3 tools/voice_chunks.py take.webm                 # chunks + recognized text
  python3 tools/voice_chunks.py take.webm --words         # + word start times (for text pops)
  python3 tools/voice_chunks.py take.webm --noise -32 --min-pause 0.18

Why PocketSphinx: it ships its English model inside the pip package (no model download), so it works on
servers where Hugging Face / OpenAI model hosts are blocked. Its text is rough ("call found it" =
"co-founder") but more than good enough to tell which script line a chunk is, and its word times are usable.
Install: pip install pocketsphinx (needs ffmpeg)."""
import argparse, re, subprocess
from pocketsphinx import Decoder

ap = argparse.ArgumentParser()
ap.add_argument("audio"); ap.add_argument("--noise", type=float, default=-32); ap.add_argument("--min-pause", type=float, default=0.18)
ap.add_argument("--words", action="store_true")
a = ap.parse_args()

dur = float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",a.audio],capture_output=True,text=True).stdout.strip() or 0)
if not dur:  # webm from browsers often has no duration header
    raw = subprocess.run(["ffmpeg","-v","error","-i",a.audio,"-f","s16le","-ac","1","-ar","16000","-"],capture_output=True).stdout
    dur = len(raw) / 32000
log = subprocess.run(["ffmpeg","-hide_banner","-nostats","-i",a.audio,"-af",f"highpass=f=90,silencedetect=noise={a.noise}dB:d={a.min_pause}","-f","null","-"],capture_output=True,text=True).stderr
st = [float(x) for x in re.findall(r"silence_start: ([0-9.]+)", log)]; en = [float(x) for x in re.findall(r"silence_end: ([0-9.]+)", log)]
en += [dur] * (len(st) - len(en))
chunks, prev = [], 0.0
for s, e in zip(st, en):
    if s - prev > 0.05: chunks.append((prev, s))
    prev = e
if dur - prev > 0.05: chunks.append((prev, dur))

dec = Decoder(samprate=16000)
for s, e in chunks:
    a0 = max(0, s - 0.1)
    pcm = subprocess.run(["ffmpeg","-v","error","-ss",str(a0),"-to",str(e+0.15),"-i",a.audio,"-ac","1","-ar","16000","-f","s16le","-"],capture_output=True).stdout
    dec.start_utt(); dec.process_raw(pcm, full_utt=True); dec.end_utt()
    h = dec.hyp(); line = f"{s:7.2f}-{e:7.2f}  {h.hypstr if h else ''}"
    if a.words:
        ws = [f"{x.word}@{a0 + x.start_frame/100:.2f}" for x in dec.seg() if not x.word.startswith(("<","["))]
        line += "\n          " + " ".join(ws)
    print(line)
