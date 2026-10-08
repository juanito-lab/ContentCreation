#!/usr/bin/env python3
"""Turn phone originals into edit-ready media.
  python3 tools/media_prep.py SRC_DIR OUT_DIR jobs.json
jobs.json: [["name.mp4", "IMG_1234.MOV", start_s, dur_s], ["photo.jpg", "IMG_5678.HEIC.jpeg", 0, 0], ...]
- Photos: EXIF rotation applied (phones store many photos sideways), max 1600 px, JPEG.
- Videos: cut [start, start+dur], max 1080 px on the short side, 30 fps, H.264, no audio.
  iPhone HDR (HLG / PQ) is tone-mapped to SDR so it doesn't look washed out; SDR clips are NOT tone-mapped
  (tone-mapping SDR darkens it - check color_transfer first, as done here).
- A video "photo" (name ends .jpg but source is a video): grabs one frame with -frames:v 1."""
import json, os, subprocess, sys
from PIL import Image, ImageOps
src, out, jobs = sys.argv[1], sys.argv[2], json.load(open(sys.argv[3]))
os.makedirs(out, exist_ok=True)
SCALE = "scale='if(gt(iw,ih),-2,1080)':'if(gt(iw,ih),1080,-2)'"
TONEMAP = "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p,"
for name, f, start, dur in jobs:
    i, o = os.path.join(src, f), os.path.join(out, name)
    is_img_src = f.lower().endswith((".jpg", ".jpeg", ".png", ".heic"))
    if is_img_src:
        im = ImageOps.exif_transpose(Image.open(i)).convert("RGB"); im.thumbnail((1600, 1600)); im.save(o, quality=90)
    else:
        trc = subprocess.run(["ffprobe","-v","error","-select_streams","v:0","-show_entries","stream=color_transfer","-of","csv=p=0",i],capture_output=True,text=True).stdout.strip()
        vf = (TONEMAP if trc in ("arib-std-b67","smpte2084") else "") + SCALE
        if name.lower().endswith((".jpg",".png")):
            subprocess.run(["ffmpeg","-v","error","-y","-ss",str(start or 1),"-i",i,"-frames:v","1","-vf",vf,"-q:v","3",o],stdin=subprocess.DEVNULL)
        else:
            subprocess.run(["ffmpeg","-v","error","-y","-ss",str(start),"-t",str(dur),"-i",i,"-vf",vf,"-r","30","-c:v","libx264","-preset","veryfast","-crf","20","-pix_fmt","yuv420p","-an",o],stdin=subprocess.DEVNULL)
    print(name, "<-", f, os.path.getsize(o) if os.path.exists(o) else "FAILED")
