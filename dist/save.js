// Keeps each player's cat safe on their device, through every update.
//
// - One storage key for good (pet-state.js KEY); restore() upgrades old saves
//   and keeps fields it doesn't know.
// - A backup copy, taken when the app opens, before this build has touched
//   the save. If the main save is ever unreadable, the backup is used and the
//   unreadable one is set aside rather than overwritten.
// - The preview build (/preview/) keeps its own save, started as a copy of
//   the live one, so testing never changes anyone's real cat.
// - Backup codes: the whole save as text, to copy somewhere safe and restore
//   on another phone, in another browser or after reinstalling. (On iPhone,
//   Safari and a home-screen app each keep separate storage, and removing the
//   home-screen app removes its storage.)
import {KEY, restore, fresh} from './pet-state.js';

const CODE_PREFIX = 'MOCHI1.';

export function keys(path = location.pathname) {
  const main = /\/preview\//.test(path) ? KEY + '-preview' : KEY;
  return {main, backup: main + '-backup', unreadable: main + '-unreadable', seed: main === KEY ? null : KEY};
}

const parse = text => {
  if (typeof text !== 'string' || !text) return null;
  try { const v = JSON.parse(text); return v && typeof v === 'object' && !Array.isArray(v) ? v : null; } catch { return null; }
};

// Returns {pet, source}: source is 'save', 'backup', 'live' (a preview's
// first copy) or 'new'.
export function load(store, k = keys(), now = Date.now()) {
  const get = key => { try { return key ? store.getItem(key) : null; } catch { return null; } };
  const set = (key, value) => { try { store.setItem(key, value); } catch {} };
  const text = get(k.main), raw = parse(text);
  if (raw) {
    set(k.backup, text);
    return {pet: restore(raw, now), source: 'save'};
  }
  // Something is there but can't be read: keep it, never write over it.
  if (text) set(k.unreadable, text);
  const backup = parse(get(k.backup));
  if (backup) return {pet: restore(backup, now), source: 'backup'};
  const seed = parse(get(k.seed));
  if (seed) return {pet: restore(seed, now), source: 'live'};
  return {pet: fresh(now), source: 'new'};
}

export function store(storage, pet, k = keys()) {
  storage.setItem(k.main, JSON.stringify(pet));
}

// Ask the browser to keep this site's storage even when space runs low.
export function keepStorage() {
  try { navigator.storage?.persist?.().catch(() => {}); } catch {}
}

// A backup code: the save as URL-safe base64 text.
export function toCode(pet) {
  const bytes = new TextEncoder().encode(JSON.stringify(pet));
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return CODE_PREFIX + btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// The pet in a backup code (or a pasted save), or null if it isn't one.
export function fromCode(text, now = Date.now()) {
  const t = String(text || '').replace(/\s+/g, '');
  const at = t.indexOf(CODE_PREFIX);
  if (at < 0) return null;
  try {
    const b64 = t.slice(at + CODE_PREFIX.length).replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64 + '='.repeat((4 - b64.length % 4) % 4));
    const raw = parse(new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))));
    if (!raw || typeof raw.name !== 'string') return null;
    return restore(raw, now);
  } catch { return null; }
}
