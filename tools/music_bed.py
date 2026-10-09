#!/usr/bin/env python3
"""Original instrumental music bed, synthesized from scratch (no samples, so no copyright questions).
120 BPM, A minor (Am-F-C-G). The bar grid is aligned so a downbeat lands exactly on the climax.
Sections: pad intro -> half-time verse (from 6.9 s) -> four-on-the-floor build with a riser -> 0.5 s of silence
-> drop on the climax -> soft outro.

usage: python3 tools/music_bed.py out.wav total_s climax_s build_start_s works_s outro_s
  total_s        length of the video
  climax_s       time of the climax cut (the downbeat + drum + crash land here)
  build_start_s  where the build (kick, snare, 16th hats, riser) starts
  works_s        a second accent (soft crash), e.g. a payoff line after the climax
  outro_s        where the drop ends and the outro starts
Example (the founder reel): python3 tools/music_bed.py bed.wav 37.75 27.83 21.35 32.98 34.6
Check the energy curve afterwards (RMS per second): the build must be louder than the verse.
Details: docs/sound-and-music.md"""
import sys, numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
import scipy.io.wavfile as wf
SR=48000
out, TOTAL, CLIMAX, BUILD, WORKS, OUTRO = sys.argv[1], *map(float, sys.argv[2:7])
BEAT=0.5; BAR=4*BEAT
origin = CLIMAX - round(CLIMAX/BAR)*BAR          # bar grid through the climax
N=int((TOTAL+1.5)*SR); L=np.zeros(N); R=np.zeros(N)
rng=np.random.default_rng(7)
def add(sig, t, gain=1.0, pan=0.0):
    i=int(t*SR)
    if i>=N or i+len(sig)<0: return
    j=min(N, i+len(sig)); s=sig[:j-i]*gain
    L[i:j]+=s*np.sqrt(0.5*(1-pan)); R[i:j]+=s*np.sqrt(0.5*(1+pan))
def lp(x,f,o=2): return sosfilt(butter(o,f,'low',fs=SR,output='sos'),x)
def hp(x,f,o=2): return sosfilt(butter(o,f,'high',fs=SR,output='sos'),x)
def bp(x,a,b): return sosfilt(butter(2,[a,b],'band',fs=SR,output='sos'),x)
def env(n,a,r): e=np.ones(n); ai=int(a*SR); ri=int(r*SR); e[:ai]=np.linspace(0,1,max(ai,1)); e[-ri:]*=np.linspace(1,0,ri); return e
def nt(m): return 440*2**((m-69)/12)
def saw(f,d,det=(0,)):
    t=np.arange(int(d*SR))/SR; return sum(2*((t*f*(1+x))%1)-1 for x in det)/len(det)
def kick(g=1):
    d=0.42; t=np.arange(int(d*SR))/SR; f=45+80*np.exp(-t*28); ph=2*np.pi*np.cumsum(f)/SR
    return np.sin(ph)*np.exp(-t*7)*g
def snare():
    d=0.25; t=np.arange(int(d*SR))/SR
    return bp(rng.standard_normal(len(t)),1500,7000)*np.exp(-t*18)*0.6 + np.sin(2*np.pi*190*t)*np.exp(-t*25)*0.4
def hat(open_=False):
    d=0.18 if open_ else 0.05; t=np.arange(int(d*SR))/SR
    return hp(rng.standard_normal(len(t)),7000)*np.exp(-t*(14 if open_ else 70))*0.35
CH=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]]   # Am F C G (midi)
ROOT=[45,41,48,43]
def bar_index(t): return int(np.floor((t-origin)/BAR+1e-6))
# ---- pads (whole track), brighter after the climax
t=origin
while t<TOTAL+BAR:
    k=bar_index(t)%4; bright = t>=CLIMAX-0.01
    d=BAR+0.25
    sig=sum(saw(nt(m),d,(-0.004,0,0.005)) for m in CH[k]+[CH[k][0]+12])/4
    sig=lp(sig, 2600 if bright else 1100)*env(len(sig),0.35,0.5)
    g=0.16 if bright else 0.11
    if CLIMAX-0.5<=t<CLIMAX: g=0
    if t>=OUTRO: g=0.12
    add(sig,max(0,t),g,-0.25); add(lp(sig,1800),max(0,t)+0.012,g*0.8,0.25)
    t+=BAR
# ---- arp plucks from 2.45s until the build
t=origin
while t<TOTAL:
    k=bar_index(t)%4
    for i in range(8):
        tt=t+i*BEAT/2
        if 2.4<=tt<BUILD or CLIMAX<=tt<OUTRO:
            m=CH[k][i%3]+(12 if i%4==3 else 0)+12
            p=saw(nt(m),0.25)*np.exp(-np.arange(int(0.25*SR))/SR*14); p=lp(p,3500)
            add(p,tt,0.07 if tt<CLIMAX else 0.09,(-0.5 if i%2 else 0.5))
    t+=BAR
# ---- drums & bass
t=origin
while t<TOTAL:
    for b in range(4):
        tb=t+b*BEAT
        if tb<0 or tb>=TOTAL: continue
        k=bar_index(tb)%4
        inGap = CLIMAX-0.5<=tb<CLIMAX
        if inGap: continue
        if 6.9<=tb<BUILD:                     # verse: half-time
            if b in (0,2): add(kick(0.4),tb)
            add(hat(),tb+BEAT/2,0.45)
            if b==0: add(lp(np.sin(2*np.pi*nt(ROOT[k])*np.arange(int(BAR*SR))/SR),300)*env(int(BAR*SR),0.02,0.3),tb,0.07)
        elif BUILD<=tb<CLIMAX:                # build: 4 on the floor, snares, 16th hats
            add(kick(0.85),tb); add(snare(),tb,0.45 if b in (1,3) else 0)
            for h in range(4): add(hat(),tb+h*BEAT/4,0.6+0.5*(tb-BUILD)/(CLIMAX-BUILD))
            if b==0: add(lp(saw(nt(ROOT[k]),BAR,(0,0.003)),400)*env(int(BAR*SR),0.02,0.2),tb,0.2)
        elif CLIMAX<=tb<OUTRO:                # drop
            add(kick(1.0),tb); add(snare(),tb,0.5 if b in (1,3) else 0)
            add(hat(True),tb+BEAT/2,0.55); add(hat(),tb+BEAT/4,0.35); add(hat(),tb+3*BEAT/4,0.35)
            if b==0: add(lp(saw(nt(ROOT[k]),BAR,(0,0.004)),520)*env(int(BAR*SR),0.01,0.2),tb,0.26)
        elif tb>=OUTRO:                       # outro: soft kick, fading
            if b==0: add(kick(0.5),tb)
    t+=BAR
# ---- riser into the climax + impacts
d=CLIMAX-BUILD; tt=np.arange(int(d*SR))/SR
noise=rng.standard_normal(len(tt)); riser=np.zeros(len(tt)); seg=int(0.05*SR)
for i in range(0,len(tt),seg):
    f=300+6000*(i/len(tt))**2; riser[i:i+seg]=bp(noise[i:i+seg],f,min(f*1.8,20000))
riser*= (tt/d)**2 * (tt < d-0.5)
add(riser,BUILD,0.25)
crash=hp(rng.standard_normal(int(2.0*SR)),3000)*np.exp(-np.arange(int(2.0*SR))/SR*2.2)
add(crash,CLIMAX,0.3); add(kick(1.2),CLIMAX); add(crash,WORKS,0.18)
sub=np.sin(2*np.pi*nt(33)*np.arange(int(1.2*SR))/SR)*np.exp(-np.arange(int(1.2*SR))/SR*2.5); add(sub,CLIMAX,0.5)
# ---- reverb (exp-decay noise IR), master
ir=rng.standard_normal(int(1.6*SR))*np.exp(-np.arange(int(1.6*SR))/SR*3.2); ir/=np.abs(ir).sum()/6
Lw=L+0.25*fftconvolve(L,ir)[:N]; Rw=R+0.25*fftconvolve(R,ir[::-1])[:N]
mix=np.stack([Lw,Rw],1)[:int(TOTAL*SR)]
g=np.ones(len(mix)); a0,a1=int((CLIMAX-0.5)*SR),int((CLIMAX-0.03)*SR); g[a0:a1]=0.02; g[a0-int(0.04*SR):a0]=np.linspace(1,0.02,int(0.04*SR)); mix*=g[:,None]  # hard drop-out before the climax
mix[int(CLIMAX*SR)-int(0.03*SR):]+=0
fade=int(1.2*SR); mix[-fade:]*=np.linspace(1,0,fade)[:,None]; mix[:int(0.3*SR)]*=np.linspace(0,1,int(0.3*SR))[:,None]
mix=np.tanh(mix*1.4)/1.4; mix/=np.abs(mix).max()/0.89
wf.write(out,SR,(mix*32767).astype(np.int16)); print("ok", round(TOTAL,2), "origin", round(origin,3))
