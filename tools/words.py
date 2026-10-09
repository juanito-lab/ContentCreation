#!/usr/bin/env python3
"""Word timestamps for a voiceover or a reference clip.

  python3 tools/words.py videos/<id>/vo.wav                 -> [{"w": "word", "t": 0.42, "end": 0.61}, ...] (seconds)
  python3 tools/words.py refs/tiktok-123.wav --model small  (faster-whisper model: tiny, base, small, medium)
  python3 tools/words.py vo.wav --engine sphinx             force the offline PocketSphinx engine

Engines:
  whisper  faster-whisper (pip install faster-whisper). Accurate words and times. Downloads a model the first time
           (from Hugging Face), so it needs that host to be reachable once.
  sphinx   PocketSphinx (pip install pocketsphinx). Ships its English model inside the package, works fully offline.
           The words are rough ("call found it" = "co-founder") but the times are usable for timing cuts.
By default whisper is used when installed, else sphinx.

Use the times to set each scene "dur" and each word "t" in spec.json (t is relative to its scene start).
"""
import argparse
import json
import re
import subprocess
import sys


def whisper_words(path, model_name, lang):
    from faster_whisper import WhisperModel
    model = WhisperModel(model_name, device="cpu", compute_type="int8")
    segs, _ = model.transcribe(path, word_timestamps=True, language=lang)
    return [{"w": w.word.strip(), "t": round(w.start, 2), "end": round(w.end, 2)} for s in segs for w in s.words]


def sphinx_words(path):
    from pocketsphinx import Decoder
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                         capture_output=True, check=True).stdout
    dec = Decoder(samprate=16000)
    dec.start_utt(); dec.process_raw(pcm, full_utt=True); dec.end_utt()
    return [{"w": re.sub(r"\(\d+\)$", "", s.word), "t": round(s.start_frame / 100, 2), "end": round(s.end_frame / 100, 2)}
            for s in dec.seg() if not s.word.startswith(("<", "[")) and s.word != "<sil>"]


def main():
    ap = argparse.ArgumentParser(description="Word timestamps for a voiceover or reference clip.")
    ap.add_argument("audio")
    ap.add_argument("--model", default="small", help="faster-whisper model (default small)")
    ap.add_argument("--lang", default=None, help="language code, e.g. en (default: auto-detect)")
    ap.add_argument("--engine", choices=["auto", "whisper", "sphinx"], default="auto")
    a = ap.parse_args()
    engine = a.engine
    if engine == "auto":
        try:
            import faster_whisper  # noqa: F401
            engine = "whisper"
        except ImportError:
            engine = "sphinx"
            print("faster-whisper not installed, using PocketSphinx (rough words, usable times)", file=sys.stderr)
    try:
        words = whisper_words(a.audio, a.model, a.lang) if engine == "whisper" else sphinx_words(a.audio)
    except ImportError as e:
        sys.exit(f"{e.name} is not installed: pip install {'faster-whisper' if engine == 'whisper' else 'pocketsphinx'}")
    print(json.dumps(words, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
