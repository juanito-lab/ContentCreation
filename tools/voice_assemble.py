#!/usr/bin/env python3
"""Voice assembler: clean + level a raw take, optionally speed it up, keep only the given chunks
(in script order), cap the pauses, add stutters. Writes the VO wav and a plan json with a time map.
usage: assemble3.py raw.wav out.wav plan.json lines.json [tempo] [maxgap] [tail]
lines.json: list of lines; each line = list of chunks [start,end] (source seconds), or
            {"stutter":[start,end], "n":2, "gap":0.05} to repeat a short slice before the next chunk."""
import json, subprocess, sys
src, out, plan_out, lines_file = sys.argv[1:5]
TEMPO = float(sys.argv[5]) if len(sys.argv) > 5 else 1.0
MAXGAP = float(sys.argv[6]) if len(sys.argv) > 6 else 0.3
TAIL = float(sys.argv[7]) if len(sys.argv) > 7 else 0.28
PRE, POST = 0.06, 0.12
LINES = json.load(open(lines_file))
chain = "highpass=f=80,lowpass=f=15000,afftdn=nf=-50:nr=10,deesser=i=0.35,acompressor=threshold=-22dB:ratio=2.5:attack=10:release=150:makeup=1.5"
if TEMPO != 1.0: chain += f",atempo={TEMPO}"
chain += ",loudnorm=I=-16:TP=-1.5:LRA=7"
subprocess.run(["ffmpeg","-v","error","-y","-i",src,"-af",chain,"-ac","1","-ar","48000","/tmp/clean_v.wav"],check=True)
sc = lambda x: x / TEMPO
pieces=[]; t=0.0; lines=[]; cmap=[]
for chunks in LINES:
    ls=t; offs=[]; prev_end=None
    for c in chunks:
        if isinstance(c, dict):
            a,b = sc(c["stutter"][0]), sc(c["stutter"][1])
            for _ in range(c.get("n",2)):
                pieces.append((max(0,a-0.02), b, t, True)); t += b-max(0,a-0.02) + c.get("gap",0.05)
            continue
        a,b = sc(c[0]), sc(c[1]); a2,b2 = max(0,a-PRE), b+POST
        if prev_end is not None: t += min(MAXGAP, max(0.1, a-prev_end))
        offs.append(round(t-ls,3)); pieces.append((a2,b2,t,False)); cmap.append((a2,b2,t)); t += b2-a2; prev_end=b
    lines.append({"start":round(ls,3),"len":round(t-ls,3),"chunks":offs}); t += TAIL
total=t; filt=[]
for i,(a,b,at,stut) in enumerate(pieces):
    ms=int(round(at*1000)); fo=0.015 if stut else 0.04
    filt.append(f"[0]atrim={a:.3f}:{b:.3f},asetpts=PTS-STARTPTS,afade=t=in:d=0.01,afade=t=out:st={max(0,b-a-fo):.3f}:d={fo},adelay={ms}|{ms}[p{i}]")
filt.append("".join(f"[p{i}]" for i in range(len(pieces)))+f"amix=inputs={len(pieces)}:normalize=0,apad,atrim=0:{total+0.4:.3f}[o]")
subprocess.run(["ffmpeg","-v","error","-y","-i","/tmp/clean_v.wav","-filter_complex",";".join(filt),"-map","[o]","-ar","48000","-ac","1",out],check=True)
json.dump({"tempo":TEMPO,"total":round(total,3),"lines":lines,"map":cmap},open(plan_out,"w"),indent=1)
print("total",round(total,2))
