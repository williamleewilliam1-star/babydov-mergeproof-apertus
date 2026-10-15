#!/usr/bin/env python3
"""Create a 7-scene narrated video from actual demo screenshot and evaluated facts."""
from pathlib import Path
from subprocess import run,check_output
import math

here=Path(__file__).resolve().parent
parts=[]
durations=[]
for i in range(7):
    token=f"{i:02}"
    png=here/f"slide-{token}.png"
    audio=here/f"narration-{token}.aiff"
    assert png.exists() and audio.exists(), f"Scene {token} missing"
    duration=float(check_output(["ffprobe","-v","error","-show_entries","format=duration","-of","default=nokey=1:noprint_wrappers=1",str(audio)],text=True))
    duration=round(duration+0.60,3)
    durations.append(duration)
    out=here/f"segment-{token}.mp4"
    args=["ffmpeg","-y","-loglevel","error","-loop","1","-framerate","24","-i",str(png),"-i",str(audio),
          "-t",str(duration),"-vf",f"scale=1280:720,format=yuv420p,fade=t=in:st=0:d=0.18,fade=t=out:st={max(0,duration-0.2)}:d=0.18",
          "-c:v","libx264","-preset","veryfast","-crf","24","-pix_fmt","yuv420p","-r","24",
          "-af","apad","-ar","48000","-c:a","aac","-b:a","128k","-movflags","+faststart",str(out)]
    r=run(args,capture_output=True,text=True)
    if r.returncode:raise RuntimeError(f"Segment {token} failed: {r.stderr[-500:]}")
    print("ENCODED",token,"SECONDS",duration,flush=True)
    parts.append(out)
playlist=here/"demo_segments.ffconcat"
playlist.write_text("ffconcat version 1.0\n"+"".join("file '"+str(p)+"'\n" for p in parts))
out=here/"MergeProof_HackApertus_Track2B_Demo.mp4"
r=run(["ffmpeg","-y","-loglevel","error","-f","concat","-safe","0","-i",str(playlist),"-c","copy","-movflags","+faststart",str(out)],capture_output=True,text=True)
if r.returncode:raise RuntimeError("concat failed: "+r.stderr[-500:])
result=check_output(["ffprobe","-v","error","-show_entries","format=duration,size","-of","default=noprint_wrappers=1",str(out)],text=True)
print("FINAL",out,result,flush=True)
seconds=float([s.split("=")[1] for s in result.splitlines() if s.startswith("duration=")][0])
if not 40<seconds<120:raise AssertionError(f"Video length violates 2 minute cap: {seconds}")
print("VIDEO_DURATION_OK",seconds,flush=True)
