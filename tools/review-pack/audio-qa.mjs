// Measurements for a 16-bit PCM WAV clip, for the review pack's sound table:
// level, clipping, background noise, clicks and (for loops) the seam.
//   import {readWav, analyse, loopThrice} from './audio-qa.mjs'

export function readWav(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = o => String.fromCharCode(...bytes.subarray(o, o + 4));
  if (tag(0) !== 'RIFF' || tag(8) !== 'WAVE') throw new Error('not a WAV file');
  let fmt = null, data = null;
  for (let o = 12; o + 8 <= bytes.length;) {
    const id = tag(o), size = dv.getUint32(o + 4, true);
    if (id === 'fmt ') fmt = {channels: dv.getUint16(o + 10, true), rate: dv.getUint32(o + 12, true), bits: dv.getUint16(o + 22, true)};
    if (id === 'data') data = {offset: o + 8, size};
    o += 8 + size + (size & 1);
  }
  if (!fmt || !data || fmt.bits !== 16) throw new Error('expects a 16-bit PCM WAV');
  const n = Math.floor(data.size / 2 / fmt.channels), x = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let c = 0; c < fmt.channels; c++) s += dv.getInt16(data.offset + (i * fmt.channels + c) * 2, true);
    x[i] = s / fmt.channels / 32768;
  }
  return {x, rate: fmt.rate, header: bytes.subarray(0, data.offset), dataOffset: data.offset};
}

const db = v => 20 * Math.log10(Math.max(v, 1e-9));
const median = a => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };

export function analyse({x, rate}, {loop = false} = {}) {
  const n = x.length, hop = Math.round(rate * 0.02), frames = [];
  let peak = 0, clipped = 0, sum = 0;
  for (let i = 0; i < n; i++) { const a = Math.abs(x[i]); peak = Math.max(peak, a); if (a >= 0.999) clipped++; sum += x[i]; }
  for (let i = 0; i + hop <= n; i += hop) { let e = 0; for (let k = i; k < i + hop; k++) e += x[k] * x[k]; frames.push(db(Math.sqrt(e / hop))); }
  const sorted = [...frames].sort((p, q) => p - q);
  const floor = sorted[Math.floor(sorted.length * 0.1)], loudest = sorted[sorted.length - 1];
  // Clicks: a sudden spike in the second difference, far above the local
  // texture, away from the first and last few milliseconds.
  const w = Math.round(rate * 0.005), spikes = [];
  for (let i = 1; i + w < n - 1; i += w) {
    let m = 0;
    for (let k = i; k < i + w; k++) m = Math.max(m, Math.abs(x[k + 1] - 2 * x[k] + x[k - 1]));
    spikes.push(m);
  }
  // A click stands out from its own surroundings (a voiced onset raises its
  // neighbours too, so it doesn't count).
  const typical = median(spikes) + 1e-9, edge = Math.round(0.01 * rate / w);
  const clicks = [];
  spikes.forEach((m, k) => {
    if (k <= edge || k >= spikes.length - edge) return;
    const around = median([...spikes.slice(Math.max(0, k - 5), k), ...spikes.slice(k + 1, k + 6)]) + 1e-9;
    if (m > 6 * around && m > 4 * typical) clicks.push(+((k * w) / rate).toFixed(3));
  });
  const out = {
    seconds: +(n / rate).toFixed(2), peakDb: +db(peak).toFixed(1), clippedSamples: clipped,
    dcOffset: +(sum / n).toFixed(4), noiseFloorDb: +floor.toFixed(1), loudestDb: +loudest.toFixed(1),
    signalToNoiseDb: +(loudest - floor).toFixed(1), clicks,
  };
  if (loop) {
    // Seam: the step from the last sample back to the first, compared with
    // ordinary sample-to-sample steps, and the loudness either side of it.
    const steps = []; for (let i = 1; i < n; i++) steps.push(Math.abs(x[i] - x[i - 1]));
    const L = Math.round(rate * 0.3); // long enough to average out the purr's flutter
    const rms = (a, b) => { let e = 0; for (let i = a; i < b; i++) e += x[i] * x[i]; return Math.sqrt(e / (b - a)); };
    out.loopSeam = {
      stepVsTypical: +(Math.abs(x[0] - x[n - 1]) / (median(steps) + 1e-9)).toFixed(2),
      loudnessChangeDb: +(db(rms(0, L)) - db(rms(n - L, n))).toFixed(1),
    };
  }
  return out;
}

// The clip three times end to end, as a WAV, to hear the loop seam.
export function loopThrice(bytes, wav) {
  const pcm = bytes.subarray(wav.dataOffset);
  const out = new Uint8Array(wav.dataOffset + pcm.length * 3);
  out.set(wav.header, 0);
  for (let k = 0; k < 3; k++) out.set(pcm, wav.dataOffset + k * pcm.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(4, out.length - 8, true);
  dv.setUint32(wav.dataOffset - 4, pcm.length * 3, true);
  return out;
}
