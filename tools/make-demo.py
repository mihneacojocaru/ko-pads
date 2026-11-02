import math
import random
import struct
import sys
import wave

RATE = 22050
BPM = 96
STEP = 60 / BPM / 4
BARS = 4
LENGTH = int(RATE * STEP * 16 * BARS)

random.seed(133)
buf = [0.0] * LENGTH


def add(start, samples):
    for i, s in enumerate(samples):
        j = start + i
        if j >= LENGTH:
            break
        buf[j] += s


def kick():
    n = int(RATE * 0.45)
    phase = 0.0
    out = []
    for i in range(n):
        t = i / RATE
        phase += 2 * math.pi * (45 + 110 * math.exp(-t * 30)) / RATE
        out.append(math.sin(phase) * math.exp(-t * 7) * 0.9)
    return out


def snare():
    n = int(RATE * 0.25)
    return [
        (random.uniform(-1, 1) * 0.5 + math.sin(2 * math.pi * 190 * i / RATE) * 0.4)
        * math.exp(-i / RATE * 18) * 0.55
        for i in range(n)
    ]


def hat(decay):
    n = int(RATE * 0.12)
    prev = 0.0
    out = []
    for i in range(n):
        noise = random.uniform(-1, 1)
        out.append((noise - prev) * math.exp(-i / RATE * decay) * 0.18)
        prev = noise
    return out


def bass(freq, length):
    n = int(RATE * length)
    return [
        (1 if (i * freq / RATE) % 1 < 0.5 else -1) * 0.16
        * min(1, i / 200) * math.exp(-i / RATE * 3)
        for i in range(n)
    ]


KICK = "x.....x...x....." "x.....x..x..x..."
SNARE = "....x.......x..." "....x.......x.x."
HAT = "x.x.x.x.x.x.xxx." "x.x.x.x.x.x.x.x."
NOTES = [55.0, 55.0, 65.41, 49.0]

k, s = kick(), snare()
for bar in range(BARS):
    half = (bar % 2) * 16
    for step in range(16):
        pos = int((bar * 16 + step) * STEP * RATE)
        if KICK[half + step] == "x":
            add(pos, k)
        if SNARE[half + step] == "x":
            add(pos, s)
        if HAT[half + step] == "x":
            add(pos, hat(60 if step % 4 else 25))
        if step in (0, 3, 6, 10, 14):
            add(pos, bass(NOTES[bar], STEP * 2.5))

peak = max(abs(v) for v in buf)
with wave.open(sys.argv[1], "wb") as f:
    f.setnchannels(1)
    f.setsampwidth(2)
    f.setframerate(RATE)
    f.writeframes(b"".join(struct.pack("<h", int(v / peak * 0.9 * 32767)) for v in buf))
