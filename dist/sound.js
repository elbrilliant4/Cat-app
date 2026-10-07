// Mochi's sounds, on two separately controlled buses:
//   cat  - her voice: recorded meows (assets/sounds/sounds.json lists them)
//          and a soft synthesized purr,
//   room - ambience: a quiet, warm room tone.
// The old looping fountain trickle (filtered white noise with a fast wobble,
// heard as a constant "maracas" shake) is gone; the fountain is visual only.
//
// Meows never overlap and leave quiet gaps between them. Each recording's
// loudness envelope is measured when it loads, so the mouth can open and
// close with the actual sound.

const MANIFEST = 'sounds.json';

export class Sounds {
  constructor(base = './assets/sounds/') {
    this.base = base;
    this.ctx = null;
    this.enabled = false;
    this.volume = {cat: .8, room: .5};
    this.clips = [];
    this.credits = [];
    this.busyUntil = 0; // nothing new starts before this (seconds, ctx time)
    this.lastClip = null;
    this.room = null;
  }

  // Must first be called from a user gesture (browsers keep audio locked
  // until then).
  start() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this.bus = {cat: this.ctx.createGain(), room: this.ctx.createGain()};
      for (const [k, g] of Object.entries(this.bus)) { g.gain.value = this.volume[k]; g.connect(this.master); }
      this.master.gain.value = this.enabled ? 1 : 0;
      this.loading = this.load();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  }

  async load() {
    try {
      const res = await fetch(this.base + MANIFEST);
      if (!res.ok) return;
      const list = await res.json();
      this.credits = list.credits || [];
      await Promise.all((list.clips || []).map(async c => {
        const data = await (await fetch(this.base + c.file)).arrayBuffer();
        const buffer = await this.ctx.decodeAudioData(data);
        this.clips.push({...c, buffer, env: envelope(buffer)});
      }));
    } catch (e) { console.warn('Sounds unavailable:', e); }
  }

  setEnabled(on) {
    this.enabled = on;
    if (on) this.start();
    if (this.ctx) this.master.gain.setTargetAtTime(on ? 1 : 0, this.ctx.currentTime, .08);
    if (on) this.startRoom(); else this.stopRoom();
  }
  setVolume(kind, v) {
    this.volume[kind] = v;
    if (this.ctx) this.bus[kind].gain.setTargetAtTime(v, this.ctx.currentTime, .08);
  }

  /**
   * A meow. kind: 'mew' | 'meow' | 'chirp' | 'sleepy'. priority 'reply' (she
   * answers you) may follow a short pause; 'idle' needs a longer quiet spell.
   * Returns {dur, env, rate} for the mouth (env: loudness 0..1 at `rate` per
   * second), or null when it's too soon to speak again.
   */
  meow(kind = 'meow', priority = 'reply') {
    const now = this.ctx ? this.ctx.currentTime : performance.now() / 1000;
    const gap = priority === 'idle' ? 6 + Math.random() * 6 : 1.2;
    if (now < this.busyUntil + gap) return null;
    const pool = this.clips.filter(c => c.kind === kind && c !== this.lastClip);
    const any = this.clips.filter(c => c.kind !== 'purr' && c !== this.lastClip);
    const clip = pick(pool.length ? pool : any);
    if (!clip) {
      // No recordings available: she meows silently (the mouth still moves).
      const dur = {chirp: .25, mew: .4, meow: .6, sleepy: .8}[kind] ?? .6;
      this.busyUntil = now + dur;
      return {dur, env: null, rate: 0};
    }
    this.lastClip = clip;
    this.busyUntil = now + clip.buffer.duration;
    if (this.enabled && this.ctx) {
      const src = this.ctx.createBufferSource(), g = this.ctx.createGain();
      src.buffer = clip.buffer;
      src.playbackRate.value = 1 + (Math.random() - .5) * .06; // tiny natural variation
      g.gain.value = clip.gain ?? 1;
      src.connect(g).connect(this.bus.cat);
      src.start();
    }
    return {dur: clip.buffer.duration, env: clip.env, rate: ENV_RATE};
  }

  purr(seconds = 2.2) {
    if (!this.enabled || !this.start()) return;
    const recorded = this.clips.filter(c => c.kind === 'purr');
    if (recorded.length) {
      const clip = pick(recorded), src = this.ctx.createBufferSource(), g = this.ctx.createGain(), t = this.ctx.currentTime;
      src.buffer = clip.buffer; src.loop = true;
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(clip.gain ?? 1, t + .4);
      g.gain.setValueAtTime(clip.gain ?? 1, t + seconds - .5);
      g.gain.exponentialRampToValueAtTime(.0001, t + seconds);
      src.connect(g).connect(this.bus.cat);
      src.start(t); src.stop(t + seconds);
      return;
    }
    synthPurr(this.ctx, this.bus.cat, this.ctx.currentTime, seconds);
  }

  startRoom() {
    if (this.room || !this.enabled || !this.start()) return;
    this.room = roomTone(this.ctx, this.bus.room);
  }
  stopRoom() {
    if (!this.room) return;
    this.room.stop();
    this.room = null;
  }
  setNight(night) { this.room?.setLevel(night ? .55 : 1, this.ctx.currentTime); }
}

const pick = list => list[Math.floor(Math.random() * list.length)];

// Loudness envelope of a recording, 0..1 at ENV_RATE samples per second.
const ENV_RATE = 60;
function envelope(buffer) {
  const data = buffer.getChannelData(0), hop = Math.floor(buffer.sampleRate / ENV_RATE);
  const out = new Float32Array(Math.ceil(data.length / hop));
  let peak = 1e-6;
  for (let k = 0; k < out.length; k++) {
    let s = 0;
    const end = Math.min(data.length, (k + 1) * hop);
    for (let i = k * hop; i < end; i++) s += data[i] * data[i];
    out[k] = Math.sqrt(s / Math.max(1, end - k * hop));
    peak = Math.max(peak, out[k]);
  }
  // Normalise, ignore the noise floor, and smooth so the jaw doesn't chatter.
  let prev = 0;
  for (let k = 0; k < out.length; k++) {
    const v = Math.max(0, (out[k] / peak - .08) / .92);
    prev = prev + (v - prev) * (v > prev ? .6 : .3);
    out[k] = Math.pow(prev, .7);
  }
  return out;
}

// A purr: a ~26 Hz flutter of low, breathy noise, louder on the out-breath
// and softer on the in-breath, which alternate about every second.
export function synthPurr(ctx, out, t, seconds) {
  const sr = ctx.sampleRate, len = Math.floor(sr * seconds);
  const buf = ctx.createBuffer(1, len, sr), d = buf.getChannelData(0);
  let lp = 0;
  for (let i = 0; i < len; i++) {
    const tt = i / sr;
    lp += ((Math.random() * 2 - 1) - lp) * .06;
    const breath = Math.sin(Math.PI * 2 * tt / 2.1);
    const rate = breath > 0 ? 26 : 23;
    const flutter = Math.pow(.5 + .5 * Math.sin(Math.PI * 2 * rate * tt), 3);
    d[i] = lp * flutter * (breath > 0 ? 1 : .6) * 6;
  }
  const src = ctx.createBufferSource(), low = ctx.createBiquadFilter(), g = ctx.createGain();
  src.buffer = buf;
  low.type = 'lowpass'; low.frequency.value = 380; low.Q.value = .5;
  g.gain.setValueAtTime(.0001, t);
  g.gain.exponentialRampToValueAtTime(.9, t + .35);
  g.gain.setValueAtTime(.9, t + Math.max(.4, seconds - .5));
  g.gain.exponentialRampToValueAtTime(.0001, t + seconds);
  src.connect(low).connect(g).connect(out);
  src.start(t); src.stop(t + seconds);
}

// A quiet, warm room tone: soft low rumble with a very slow swell, no
// rhythm and no hiss.
export function roomTone(ctx, out) {
  const sr = ctx.sampleRate, len = sr * 8;
  const buf = ctx.createBuffer(1, len, sr), d = buf.getChannelData(0);
  let b = 0;
  for (let i = 0; i < len; i++) { b = (b + .02 * (Math.random() * 2 - 1)) / 1.02; d[i] = b * 3.5; }
  // Cross-fade the loop's ends so it repeats without a click.
  const fadeN = sr * .5;
  for (let i = 0; i < fadeN; i++) { const k = i / fadeN; d[len - fadeN + i] = d[len - fadeN + i] * (1 - k) + d[i] * k; }
  const src = ctx.createBufferSource(), low = ctx.createBiquadFilter(), g = ctx.createGain(), level = ctx.createGain();
  const swell = ctx.createOscillator(), depth = ctx.createGain();
  src.buffer = buf; src.loop = true; src.loopStart = .5; src.loopEnd = 8;
  low.type = 'lowpass'; low.frequency.value = 260;
  g.gain.value = .05; swell.frequency.value = .06; depth.gain.value = .012;
  swell.connect(depth).connect(g.gain);
  level.gain.value = 0;
  src.connect(low).connect(g).connect(level).connect(out);
  const t = ctx.currentTime;
  level.gain.setTargetAtTime(1, t, 1.5);
  src.start(t); swell.start(t);
  return {
    stop() { level.gain.setTargetAtTime(0, ctx.currentTime, .4); src.stop(ctx.currentTime + 2); swell.stop(ctx.currentTime + 2); },
    setLevel(v, at) { level.gain.setTargetAtTime(v, at, 2); },
  };
}
