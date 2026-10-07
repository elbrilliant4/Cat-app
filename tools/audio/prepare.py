"""Prepares Mochi's sounds from the source recordings.

    python3 tools/audio/prepare.py sources/audio/kerzoven-opengameart dist/assets/sounds [report-dir]

For each chosen call: cut it out, high-pass (removes rumble and handling
thumps), reduce steady background noise by spectral gating, fade the ends and
normalise. The purr loop gets a gentle low-pass for hiss and a crossfaded loop
seam. Writes 16-bit mono WAVs (no encoder padding, so loops stay seamless)
and prints a measurement report. Needs numpy.
"""
import os, sys, json, wave
import numpy as np

SRC, DST = sys.argv[1], sys.argv[2]
REPORT = sys.argv[3] if len(sys.argv) > 3 else None

# file, start s, end s, kind, output name. Chosen by listening notes +
# measurements: clean harmonic calls only; anything with clicks left out.
CALLS = [
    ('cat_softmew.wav', 1.33, 1.95, 'mew', 'mew-soft-1.wav'),
    ('cat_mewfood.wav', 0.565, 1.0, 'meow', 'meow-ask-1.wav'),
]
# Auditioned and left out: cat_softmew 0.31-0.66 s (breathy, weakly voiced
# after cleanup) and its later half (handling clicks); cat_mewfood's faint
# first call (barely above the background); cat_mewpurr and cat_mewpurr2
# (rough, broadband); cat_purractive_loop (brighter and busier than the
# sleepy loop).
PURR = ('cat_purrsleepy_loop.wav', 'purr-sleepy-loop.wav')


def load(path):
    w = wave.open(path)
    sr, n, sw, ch = w.getframerate(), w.getnframes(), w.getsampwidth(), w.getnchannels()
    assert sw == 2, 'expects 16-bit WAV'
    d = np.frombuffer(w.readframes(n), np.int16).astype(np.float64) / 32768
    return (d.reshape(-1, ch).mean(1) if ch > 1 else d), sr


def save(path, d, sr):
    w = wave.open(path, 'wb')
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
    w.writeframes((np.clip(d, -1, 1) * 32767).astype(np.int16).tobytes())
    w.close()


def biquad(d, b, a):
    y = np.zeros_like(d); x1 = x2 = y1 = y2 = 0.0
    b0, b1, b2 = b; a0, a1, a2 = a
    for i, x in enumerate(d):
        v = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0
        x2, x1, y2, y1 = x1, x, y1, v
        y[i] = v
    return y


def highpass(d, sr, f, q=0.707):
    w0 = 2 * np.pi * f / sr; al = np.sin(w0) / (2 * q); c = np.cos(w0)
    return biquad(d, ((1 + c) / 2, -(1 + c), (1 + c) / 2), (1 + al, -2 * c, 1 - al))


def lowpass(d, sr, f, q=0.707):
    w0 = 2 * np.pi * f / sr; al = np.sin(w0) / (2 * q); c = np.cos(w0)
    return biquad(d, ((1 - c) / 2, 1 - c, (1 - c) / 2), (1 + al, -2 * c, 1 - al))


def denoise(d, noise, n=1024, hop=256, strength=1.6, floor=0.12):
    """Spectral gating: subtract the noise's average spectrum, gently."""
    win = np.hanning(n)
    def stft(x):
        x = np.concatenate([np.zeros(n), x, np.zeros(n)])
        return np.array([np.fft.rfft(x[i:i + n] * win) for i in range(0, len(x) - n, hop)])
    N = np.abs(stft(noise)).mean(0)
    X = stft(d)
    g = np.maximum(1 - strength * N / (np.abs(X) + 1e-12), floor)
    # Smooth the gains over time so the gating doesn't warble.
    k = np.ones(3) / 3
    g = np.apply_along_axis(lambda c: np.convolve(c, k, 'same'), 0, g)
    Y = X * g
    out = np.zeros(len(d) + 2 * n)
    norm = np.zeros_like(out)
    for j, fr in enumerate(Y):
        out[j * hop:j * hop + n] += np.fft.irfft(fr) * win
        norm[j * hop:j * hop + n] += win ** 2
    return (out / np.maximum(norm, 1e-6))[n:n + len(d)]


def quietest(d, sr, seconds=0.25):
    """The quietest stretch of a file, as its background-noise sample."""
    hop = int(sr * 0.01); L = int(sr * seconds)
    e = np.array([np.mean(d[i:i + L] ** 2) for i in range(0, len(d) - L, hop)])
    # Skip digital silence (the files are gated): need some real noise.
    ok = e > 1e-9
    i = int(np.argmin(np.where(ok, e, np.inf))) * hop
    return d[i:i + L]


def declick(d, sr, ratio=10, half=0.0015):
    """Isolated clicks (sudden spikes far above the local texture) are
    bridged over by straight-line interpolation."""
    h = np.abs(np.diff(d, 2)); hop = int(sr * 0.005)
    e = np.array([h[i:i + hop].max() for i in range(0, len(h) - hop, hop)])
    med = np.median(e) + 1e-12
    d = d.copy(); w = int(sr * half); fixed = []
    for k in np.nonzero(e > ratio * med)[0]:
        c = k * hop + int(np.argmax(h[k * hop:(k + 1) * hop])) + 1
        a, b = max(0, c - w), min(len(d) - 1, c + w)
        d[a:b + 1] = np.linspace(d[a], d[b], b - a + 1)
        fixed.append(round(c / sr, 3))
    return d, fixed


def fade(d, sr, fin=0.012, fout=0.06):
    a, b = int(sr * fin), int(sr * fout)
    d = d.copy()
    d[:a] *= np.sin(np.linspace(0, np.pi / 2, a)) ** 2
    d[-b:] *= np.cos(np.linspace(0, np.pi / 2, b)) ** 2
    return d


def measure(d, sr):
    hop = int(sr * 0.02)
    db = 20 * np.log10(np.array([np.sqrt(np.mean(d[i:i + hop] ** 2)) + 1e-9 for i in range(0, len(d) - hop, hop)]))
    S = np.abs(np.fft.rfft(d)) ** 2; f = np.fft.rfftfreq(len(d), 1 / sr)
    return {'seconds': round(len(d) / sr, 3), 'peak_dbfs': round(20 * np.log10(np.abs(d).max() + 1e-9), 1),
            'rms_dbfs': round(10 * np.log10(np.mean(d ** 2) + 1e-12), 1),
            'snr_db': round(float(db.max() - np.percentile(db, 10)), 1),
            'above_4k_pct': round(float(S[f > 4000].sum() / S.sum() * 100), 2),
            'below_150_pct': round(float(S[f < 150].sum() / S.sum() * 100), 2)}


os.makedirs(DST, exist_ok=True)
report, clips = {}, []
TARGET_RMS = -24.0  # dBFS: all calls equally loud before per-kind gain
for src, a, b, kind, name in CALLS:
    d, sr = load(os.path.join(SRC, src))
    noise = quietest(highpass(d, sr, 180), sr)
    seg = d[int(a * sr):int(b * sr)]
    before = measure(seg, sr)
    y = highpass(highpass(seg, sr, 180), sr, 180)        # 4th order: rumble and thumps out
    y = denoise(y, noise)
    y = fade(y, sr)
    rms = 10 * np.log10(np.mean(y ** 2) + 1e-12)
    y *= 10 ** ((TARGET_RMS - rms) / 20)
    y *= min(1, 10 ** (-3 / 20) / np.abs(y).max())         # never above -3 dBFS
    save(os.path.join(DST, name), y, sr)
    report[name] = {'from': f'{src} {a}-{b}s', 'before': before, 'after': measure(y, sr)}
    clips.append({'file': name, 'kind': kind})

src, name = PURR
d, sr = load(os.path.join(SRC, src))
d, clicks = declick(d, sr)
y = lowpass(lowpass(highpass(d, sr, 20), sr, 3500), sr, 3500)
xf = int(sr * 0.35)                                     # loop seam crossfade
t = np.linspace(0, np.pi / 2, xf)
y[:xf] = y[:xf] * np.sin(t) + y[-xf:] * np.cos(t)
y = y[:-xf]
y *= 10 ** ((-20 - 10 * np.log10(np.mean(y ** 2))) / 20)
y *= min(1, 10 ** (-3 / 20) / np.abs(y).max())
save(os.path.join(DST, name), y, sr)
seam = abs(y[-1] - y[0])
report[name] = {'from': src, 'before': measure(d, sr), 'after': measure(y, sr), 'loop_seam_step': round(float(seam), 4), 'clicks_repaired_at_s': clicks}
clips.append({'file': name, 'kind': 'purr'})

print(json.dumps(report, indent=1))
if REPORT:
    os.makedirs(REPORT, exist_ok=True)
    json.dump(report, open(os.path.join(REPORT, 'audio-report.json'), 'w'), indent=1)
print(json.dumps(clips))
