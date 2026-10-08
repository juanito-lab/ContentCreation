#!/usr/bin/env python3
"""Synthesize a jet flyby SFX (no samples → no license questions), optionally layered with a CC0 air whoosh.
  python3 tools/sfx_plane.py out.wav [duration_s=2.4] [whoosh.wav]
Peak (closest point) at 55% of the duration; that's the 'lead' to put on the cut.
Layers: low jet rumble (brown noise, LP sweep), broadband roar (band-passed noise opening up as it passes),
turbine whine with Doppler drop (pitch falls ~12% through the pass), stereo pan left → right, bell envelope."""
import sys, numpy as np
from scipy.signal import butter, sosfilt
import scipy.io.wavfile as wf
SR=48000; out=sys.argv[1]; D=float(sys.argv[2]) if len(sys.argv)>2 else 2.4; extra=sys.argv[3] if len(sys.argv)>3 else None
n=int(D*SR); t=np.arange(n)/SR; peak=0.55*D; rng=np.random.default_rng(3)
x=(t-peak)/D                                   # -0.55 .. 0.45
envl=np.exp(-(x/0.22)**2)                      # closeness bell
def filt_sweep(sig, cut, kind="low"):
    o=np.zeros_like(sig); seg=int(0.02*SR)
    for i in range(0,len(sig),seg):
        c=float(np.clip(cut[min(i,len(cut)-1)],60,20000))
        o[i:i+seg]=sosfilt(butter(2,c,kind,fs=SR,output='sos'),sig[i:i+seg+256])[:len(sig[i:i+seg])]
    return o
brown=np.cumsum(rng.standard_normal(n)); brown-=np.convolve(brown,np.ones(4800)/4800,'same'); brown/=np.abs(brown).max()
rumble=filt_sweep(brown, 120+500*envl)*0.9
roar=filt_sweep(rng.standard_normal(n), 600+7000*envl)*0.35
f=2100*(1+0.06*np.tanh(-x/0.08))              # Doppler: high approaching, low leaving
whine=np.sin(2*np.pi*np.cumsum(f)/SR)*0.12+np.sin(2*np.pi*np.cumsum(f*1.5)/SR)*0.05
mono=(rumble+roar+whine*envl)*(0.15+0.85*envl)
pan=np.clip(0.5+x*1.4,0,1)                     # left → right
L=mono*np.sqrt(1-pan); R=mono*np.sqrt(pan)
if extra:
    sr2,w=wf.read(extra); w=w.astype(float); w=w.mean(1) if w.ndim>1 else w; w/=np.abs(w).max()+1e-9
    if sr2!=SR: w=np.interp(np.arange(int(len(w)*SR/sr2))*sr2/SR, np.arange(len(w)), w)
    w=w[:n] if len(w)>=n else np.pad(w,(0,n-len(w)))
    w=w*envl*0.35; L+=w*np.sqrt(1-pan); R+=w*np.sqrt(pan)
fade=int(0.05*SR); m=np.stack([L,R],1); m[:fade]*=np.linspace(0,1,fade)[:,None]; m[-fade:]*=np.linspace(1,0,fade)[:,None]
m=np.tanh(m*1.3); m/=np.abs(m).max()/0.89
wf.write(out,SR,(m*32767).astype(np.int16)); print(f"{out}: len {D*1000:.0f} ms, lead {peak*1000:.0f} ms")
