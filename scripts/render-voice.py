"""Render a reviewed lesson with Piper locally. No network calls."""
import json
import sys
import subprocess
import wave
from pathlib import Path

from piper import PiperVoice
import imageio_ffmpeg

model, target = Path(sys.argv[1]), Path(sys.argv[2])
segments = json.loads((target / "segments.json").read_text(encoding="utf-8"))
voice = PiperVoice.load(model)
rate = voice.config.sample_rate
count = 0
cues = []
with wave.open(str(target / "lesson.wav"), "wb") as track:
    track.setparams((1, 2, rate, 0, "NONE", ""))
    for segment in segments:
        start = count / rate
        for chunk in voice.synthesize(segment["text"]):
            data = chunk.audio_int16_bytes
            track.writeframesraw(data)
            count += len(data) // 2
        if count / rate > start:
            track.writeframesraw(bytes(2 * (rate // 4)))
            count += rate // 4
            cues.append({"anchor": segment["anchor"], "start": start, "end": count / rate})
if not cues:
    raise ValueError("Aula sem trechos narráveis")
subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-loglevel", "error", "-y", "-i",
                str(target / "lesson.wav"), "-codec:a", "libmp3lame", "-b:a", "48k",
                str(target / "lesson.mp3")], check=True)
(target / "cues.json").write_text(json.dumps(cues), encoding="utf-8")
(target / "lesson.wav").unlink()
