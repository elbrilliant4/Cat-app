// Every player's cat must survive every update. These checks load saves
// written by earlier builds (fixtures/saves, made with each build's own
// pet-state.js) and exercise the safety nets in dist/save.js. Add a fixture
// whenever what a save holds changes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {KEY, SAVE_VERSION, restore, fresh} from './dist/pet-state.js';
import {keys, load, store, toCode, fromCode} from './dist/save.js';

const now = 1800000000000;
const memory = (init = {}) => {
  const m = new Map(Object.entries(init));
  return {getItem: k => m.has(k) ? m.get(k) : null, setItem: (k, v) => m.set(k, String(v)), map: m};
};
const live = keys('/Cat-app/'), preview = keys('/Cat-app/preview/');
assert.equal(live.main, KEY, 'the live storage key must never change');
assert.notEqual(preview.main, KEY);

// Saves from every past build load with the name, bond, cuddles, birthday
// and memories intact.
const fixtures = fs.readdirSync('fixtures/saves').filter(f => f.endsWith('.json'));
assert.ok(fixtures.length >= 4);
for (const f of fixtures) {
  const {key, save} = JSON.parse(fs.readFileSync('fixtures/saves/' + f, 'utf8'));
  assert.equal(key, KEY, f);
  const s = memory({[KEY]: JSON.stringify(save)});
  const {pet, source} = load(s, live, now);
  assert.equal(source, 'save', f);
  assert.equal(pet.name, save.name, f);
  assert.equal(pet.bond, save.bond, f);
  assert.equal(pet.cuddles, save.cuddles, f);
  assert.equal(pet.born, save.born, f);
  assert.deepEqual(pet.journal.map(j => j.text), save.journal.map(j => j.text), f);
  assert.equal(pet.v, SAVE_VERSION, f);
  // Saving it again and loading once more changes nothing that matters.
  store(s, pet, live);
  const again = load(s, live, now).pet;
  assert.equal(again.name, save.name, f);
  assert.equal(again.bond, save.bond, f);
  // The backup holds the save as it was before this build touched it.
  assert.equal(JSON.parse(s.getItem(live.backup)).name, save.name, f);
}

// Fields from a newer build are kept, not dropped; unsafe keys are ignored.
const future = {...fresh(now), name: 'Pip', v: SAVE_VERSION + 3, outfits: ['scarf'], rooms: {winter: true}};
const kept = restore(JSON.parse(JSON.stringify(future).replace('{', '{"__proto__":{"polluted":1},')), now);
assert.deepEqual(kept.outfits, ['scarf']);
assert.deepEqual(kept.rooms, {winter: true});
assert.equal(kept.v, SAVE_VERSION + 3);
assert.equal({}.polluted, undefined);
assert.equal(kept.polluted, undefined);

// An unreadable save is set aside (never written over) and the backup used.
{
  const good = JSON.stringify({...fresh(now), name: 'Juniper', bond: 80});
  const s = memory({[KEY]: '{"name":"Juni', [live.backup]: good});
  const r = load(s, live, now);
  assert.equal(r.source, 'backup');
  assert.equal(r.pet.name, 'Juniper');
  assert.equal(s.getItem(live.unreadable), '{"name":"Juni');
}

// The preview starts as a copy of the live cat and never writes to it.
{
  const liveSave = JSON.stringify({...fresh(now), name: 'Saffron', bond: 55});
  const s = memory({[KEY]: liveSave});
  const r = load(s, preview, now);
  assert.equal(r.source, 'live');
  assert.equal(r.pet.name, 'Saffron');
  r.pet.name = 'Test cat';
  store(s, r.pet, preview);
  assert.equal(s.getItem(KEY), liveSave);
  assert.equal(load(s, preview, now).pet.name, 'Test cat');
}

// No save at all: a new kitten.
assert.equal(load(memory(), live, now).source, 'new');

// Backup codes round-trip, survive spaces and line breaks from pasting, and
// reject anything else.
{
  const pet = restore(JSON.parse(fs.readFileSync('fixtures/saves/build-37-live.json', 'utf8')).save, now);
  const code = toCode(pet);
  assert.match(code, /^MOCHI1\.[A-Za-z0-9_-]+$/);
  const back = fromCode('  Here you go:\n' + code.replace(/(.{40})/g, '$1\n') + '  ', now);
  assert.equal(back.name, pet.name);
  assert.equal(back.bond, pet.bond);
  assert.equal(back.journal.length, pet.journal.length);
  for (const bad of ['', 'hello', 'MOCHI1.', 'MOCHI1.!!!!', 'MOCHI1.' + btoa('[1,2]'), 'MOCHI1.' + btoa('{"food":5}')]) assert.equal(fromCode(bad, now), null, bad);
}
console.log(`PASS: saves from ${fixtures.length} earlier builds survive, newer fields kept, unreadable save falls back to backup, preview never touches the live cat, backup codes.`);
