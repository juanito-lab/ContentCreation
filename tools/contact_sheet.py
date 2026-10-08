#!/usr/bin/env python3
"""Numbered contact sheets of a folder of photos/videos, to pick material fast (an agent can look at 60 thumbs per image).
  python3 tools/contact_sheet.py SRC_DIR OUT_PREFIX [--tile 240] [--per 60]
Writes OUT_PREFIX-0.jpg, -1.jpg ... and OUT_PREFIX-list.txt (index -> filename). Photos get EXIF rotation; videos use the frame at 1.5 s.
To see motion inside a few clips: ffmpeg -i clip.mov -vf "fps=5/DUR,scale=-2:220,tile=5x1" -frames:v 1 strip.jpg"""
import argparse, os, subprocess, tempfile
from PIL import Image, ImageOps, ImageDraw
ap = argparse.ArgumentParser(); ap.add_argument("src"); ap.add_argument("out"); ap.add_argument("--tile", type=int, default=240); ap.add_argument("--per", type=int, default=60)
a = ap.parse_args(); T, cols = a.tile, 10
files = sorted(f for f in os.listdir(a.src) if not f.startswith("."))
open(a.out + "-list.txt", "w").write("\n".join(f"{i+1}\t{f}" for i, f in enumerate(files)))
tmp = os.path.join(tempfile.mkdtemp(), "f.jpg")
for p in range(0, len(files), a.per):
    batch = files[p:p+a.per]; rows = (len(batch) + cols - 1) // cols
    S = Image.new("RGB", (cols*T, rows*T), "white")
    for k, f in enumerate(batch):
        path = os.path.join(a.src, f)
        try:
            if f.lower().endswith((".jpg", ".jpeg", ".png")): im = ImageOps.exif_transpose(Image.open(path))
            else:
                subprocess.run(["ffmpeg","-v","error","-y","-ss","1.5","-i",path,"-frames:v","1",tmp],stdin=subprocess.DEVNULL); im = Image.open(tmp)
            im = im.convert("RGB"); im.thumbnail((T, T))
        except Exception: im = Image.new("RGB", (T, T), "red")
        t = Image.new("RGB", (T, T), "white"); t.paste(im, ((T-im.width)//2, (T-im.height)//2))
        d = ImageDraw.Draw(t); d.rectangle([0, 0, 52, 22], fill="black"); d.text((4, 4), str(p+k+1), fill="yellow")
        S.paste(t, ((k % cols)*T, (k//cols)*T))
    S.save(f"{a.out}-{p//a.per}.jpg", quality=85); print(f"{a.out}-{p//a.per}.jpg")
