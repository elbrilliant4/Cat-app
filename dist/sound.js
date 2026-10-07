// Mochi's sounds: her voice only (recorded meows and purr listed in
// assets/sounds/sounds.json, or the synthesized purr), on one volume.
// There is deliberately no background ambience: both the old fountain
// trickle and the later room tone came across as white noise. The fountain
// is visual only.
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
    this.volume = {cat: .8};
    this.clips = [];
    this.credits = [];
    // Call timing runs on the page clock (seconds), which keeps going even
    // while audio is still locked or muted.
    this.busyUntil = -Infinity; // no new call starts before this
    this.purrUntil = -Infinity; // she doesn't meow while purring
    this.lastClip = null;
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
      this.bus = {cat: this.ctx.createGain()};
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
      // Clips marked "candidate" are still being reviewed: they play in the
      // preview build only, not in the live app. "reference" clips are only
      // for comparison in the review pack and are never played.
      const channel = await fetch('./version.json', {cache: 'no-store'}).then(r => r.ok ? r.json() : {}).then(v => v.channel).catch(() => null);
      const clips = (list.clips || []).filter(c => c.status !== 'reference' && (c.status !== 'candidate' || channel !== 'live'));
      this.credits = clips.length ? list.credits || [] : [];
      await Promise.all(clips.map(async c => {
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
    const now = clock();
    const gap = priority === 'idle' ? 6 + Math.random() * 6 : 2.5;
    if (now < this.busyUntil + gap || now < this.purrUntil) return null;
    // The right kind of call, not the same recording twice in a row when
    // there's a choice.
    let pool = this.clips.filter(c => c.kind === kind);
    if (!pool.length) pool = this.clips.filter(c => c.kind === 'mew' || c.kind === 'meow');
    if (pool.length > 1) pool = pool.filter(c => c !== this.lastClip);
    const clip = pick(pool);
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
      // A little natural variation in pitch and loudness each time.
      src.playbackRate.value = 1 + (Math.random() - .5) * .07;
      g.gain.value = (clip.gain ?? 1) * (.85 + Math.random() * .15);
      src.connect(g).connect(this.bus.cat);
      src.start();
    }
    return {dur: clip.buffer.duration, env: clip.env, rate: ENV_RATE};
  }

  purr(seconds = 2.2) {
    if (!this.enabled || !this.start()) return;
    // Never over a meow: start once she's finished, and keep calls away
    // while she purrs.
    const now = clock(), start = Math.max(now, this.busyUntil + .25);
    if (start < this.purrUntil) return;
    this.purrUntil = start + seconds;
    const t = this.ctx.currentTime + (start - now);
    const recorded = this.clips.filter(c => c.kind === 'purr');
    if (recorded.length) {
      const clip = pick(recorded), src = this.ctx.createBufferSource(), g = this.ctx.createGain();
      src.buffer = clip.buffer; src.loop = true;
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(clip.gain ?? 1, t + .4);
      g.gain.setValueAtTime(clip.gain ?? 1, t + seconds - .5);
      g.gain.exponentialRampToValueAtTime(.0001, t + seconds);
      src.connect(g).connect(this.bus.cat);
      src.start(t); src.stop(t + seconds);
      return;
    }
    synthPurr(this.ctx, this.bus.cat, t, seconds);
  }

}

const clock = () => performance.now() / 1000;
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

// Synthesized purr, used only when no purr recording is bundled: a ~26 Hz flutter of low, breathy noise, louder on the out-breath
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
