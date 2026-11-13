// Phase 17, reasons to come back: the away story, the gifts of friendship,
// the longer Moments list and what the save keeps of them.
import assert from 'node:assert/strict';
import {AWAY_MIN, awayStory, bandsBetween, awayLabel} from './dist/away.js';
import {GIFTS, TOYS, giftsAt, nextGift, newGifts, owns, toysAt} from './dist/rewards.js';
import {fresh, restore, JOURNAL_MAX} from './dist/pet-state.js';
import {load, toCode, fromCode} from './dist/save.js';

const H = 3600000, at = (h, m = 0) => new Date(2026, 10, 13, h, m).getTime();

// The away story.
assert.equal(awayStory(at(10), at(10, 29)), null, 'under 30 minutes: no story');
assert.equal(awayStory(at(10), at(10) + AWAY_MIN).lines.length, 2, '30 minutes: two lines');
assert.equal(awayStory(at(9), at(18)).lines.length, 3, 'nine hours: three lines');
assert.deepEqual(awayStory(at(9), at(18)), awayStory(at(9), at(18)), 'the same absence tells the same story');
assert.notDeepEqual(awayStory(at(9), at(18)).lines, awayStory(at(9, 7), at(18)).lines, 'another absence tells another');
assert.deepEqual(bandsBetween(at(10), at(12)), ['day']);
assert.deepEqual(bandsBetween(at(17), at(23)), ['day', 'evening', 'night']);
assert.deepEqual(bandsBetween(at(23), at(23) + 3 * H), ['night']);
const NIGHT = /zoomies|moonbeam|moths|in the dark|sleeping vacuum|high shelf/;
for (let m = 0; m < 40; m++) {
  const day = awayStory(at(10, m), at(12, m)), night = awayStory(at(23, m), at(23, m) + 3 * H), slept = awayStory(at(10, m), at(16, m), {asleep: true});
  assert.ok(day.lines.every(l => !NIGHT.test(l.text)), 'a morning away has no night doings');
  assert.ok(night.lines.every(l => NIGHT.test(l.text)), 'a night away is all night doings');
  assert.ok(slept.lines.every(l => /Slept|Dreamed|sleep/.test(l.text)), 'put to bed: she slept');
  for (const s of [day, night, slept]) {
    assert.equal(new Set(s.lines.map(l => l.text)).size, s.lines.length, 'no line twice');
    assert.ok(s.lines.every(l => l.text && /^i-/.test(l.icon)));
  }
}
assert.ok(Array.from({length: 40}, (_, m) => awayStory(at(9, m), at(18, m), {decor: 'christmas'})).some(s => s.lines.some(l => /garland/.test(l.text))), 'the season shows up now and then');
assert.equal(awayLabel(45 * 60000), '45 minutes');
assert.equal(awayLabel(9 * H), '9 hours');
assert.equal(awayLabel(72 * H), '3 days');
assert.equal(awayStory(at(9), at(9) + 30 * 24 * H).lines.length, 3, 'a month away still tells a short story');

// Gifts.
assert.deepEqual(giftsAt(1), []);
assert.deepEqual(giftsAt(4).map(g => g.id), ['mouse', 'fish', 'bowl']);
assert.equal(nextGift(1).id, 'mouse');
assert.equal(nextGift(4), null, 'no promise past the last gift');
assert.deepEqual(toysAt(1).map(t => t.id), ['ball'], 'the ball is hers from the start');
assert.deepEqual(toysAt(3).map(t => t.id), ['ball', 'mouse', 'fish']);
assert.ok(owns(9, 'bowl') && !owns(3, 'bowl') && !owns(9, 'crown'));
assert.deepEqual(newGifts(5, undefined).map(g => g.id), ['mouse', 'fish', 'bowl'], 'a save from before gifts gets them all');
assert.deepEqual(newGifts(5, ['mouse']).map(g => g.id), ['fish', 'bowl']);
assert.deepEqual(newGifts(5, ['mouse', 'fish', 'bowl']), []);
assert.ok(TOYS.filter(t => t.file).every(t => GIFTS.some(g => g.id === t.id)), 'every toy but the ball is a gift');

// The save: when the player left, the longer Moments list, new fields kept.
const mem = init => { const m = new Map(Object.entries(init)); return {getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v))}; };
const keys = {main: 'k', backup: 'k-backup', unreadable: 'k-unreadable', seed: null};
const now = at(18), old = {...fresh(at(9)), bond: 120, updated: at(9), toy: 'mouse', gifts: ['mouse'], photos: 2, away: {from: 1, to: 2, asleep: false}};
old.journal = Array.from({length: 60}, (_, i) => ({text: 'm' + i, icon: 'i-heart', time: at(9) - i}));
const got = load(mem({k: JSON.stringify(old)}), keys, now);
assert.equal(got.left, at(9), 'load says when the player left');
assert.equal(got.pet.updated, now);
assert.equal(got.pet.journal.length, JOURNAL_MAX);
assert.equal(JOURNAL_MAX, 40);
assert.equal(got.pet.toy, 'mouse'); assert.deepEqual(got.pet.gifts, ['mouse']); assert.equal(got.pet.photos, 2); assert.deepEqual(got.pet.away, {from: 1, to: 2, asleep: false});
assert.equal(load(mem({}), keys, now).left, null, 'a new player has not been away');
assert.equal(load(mem({k: JSON.stringify({...old, updated: now + H})}), keys, now).left, null, 'a clock set back is not an absence');
const back = fromCode(toCode(got.pet), now);
assert.equal(back.toy, 'mouse'); assert.equal(back.journal.length, JOURNAL_MAX);
assert.equal(restore({...old, journal: old.journal.slice(0, 12)}, now).journal.length, 12, 'an older save keeps its 12');
console.log('PASS: away story (length, repeatable, fits the hours, asleep, season), gifts by level, toys, the save keeps when the player left and 40 moments.');
