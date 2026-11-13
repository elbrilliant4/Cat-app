// Phase 17b, fun that lasts: friendship earned over days, the wish of the
// day, the later gifts one a day, and needs that ask after a night away.
import assert from 'node:assert/strict';
import {fresh, restore, advance, care, mood, today, dayKey, dayFull, DAY_FULL, DAY_EXTRA, WORTH} from './dist/pet-state.js';
import {WISHES, WISH_WORTH, todaysWish, grantWish, wishDone} from './dist/wish.js';
import {GIFTS, TOYS, RIBBONS, LATE, owns, toysAt, newGifts, waitingGifts} from './dist/rewards.js';
import {toCode, fromCode} from './dist/save.js';

const H = 3600000, at = (day, h = 12, m = 0) => new Date(2026, 10, day, h, m).getTime();
const give = (p, action, times, now, snack) => { for (let i = 0; i < times; i++) { if (action === 'feed') p.food = 20; if (action === 'drink') p.water = 20; p.energy = 90; care(p, action, snack, {now}); } };

// The day turns at 4 in the morning.
assert.equal(dayKey(at(13, 3, 59)), '2026-11-12');
assert.equal(dayKey(at(13, 4)), '2026-11-13');

// Each care counts in full a few times a day, then a tenth, and the tenths stop.
let p = fresh(at(13, 9));
give(p, 'pet', 10, at(13)); assert.equal(p.bond, 10, 'ten strokes count in full');
give(p, 'pet', 1, at(13)); assert.equal(p.bond, 10.1, 'the eleventh counts a tenth');
give(p, 'pet', 500, at(13)); assert.equal(p.bond, 10 + DAY_EXTRA, 'the tenths stop: 500 more strokes add 5 in all');
assert.equal(p.cuddles, 511, 'every stroke is still counted as a cuddle');
give(p, 'brush', 2, at(13)); assert.equal(p.bond, 21, 'two brushes in full, even after the tenths ran out');
give(p, 'brush', 40, at(13)); assert.equal(p.bond, 21);
assert.equal(dayFull(p, at(13)), false, 'play has not been used yet');
give(p, 'play', 3, at(13)); give(p, 'feed', 3, at(13)); give(p, 'drink', 3, at(13));
const best = Object.keys(DAY_FULL).reduce((s, a) => s + DAY_FULL[a] * WORTH[a], 0) + DAY_EXTRA;
assert.equal(best, 51); assert.equal(p.bond, best, 'the best day without the wish');
assert.equal(dayFull(p, at(13)), true);
give(p, 'play', 30, at(13)); give(p, 'feed', 30, at(13)); assert.equal(p.bond, best, 'nothing more today');
assert.equal(p.happiness, 100, 'her needs still answer every time');
// A new day.
give(p, 'pet', 1, at(14, 3)); assert.equal(p.bond, best, 'three in the morning is still yesterday');
give(p, 'pet', 1, at(14, 5)); assert.equal(p.bond, best + 1, 'a new day counts in full again');
assert.equal(dayFull(p, at(14, 5)), false);
give(p, 'pet', 9, at(13, 5)); assert.equal(p.bond, best + 10, 'a clock set back stays in the same day');
give(p, 'pet', 50, at(12, 5)); assert.equal(p.bond, best + 10 + DAY_EXTRA, 'and does not start a second one');
// She drinks by herself: no friendship.
p = fresh(at(13)); p.water = 20; care(p, 'drink', undefined, {now: at(13), auto: true}); assert.equal(p.bond, 0); assert.equal(p.water, 55);
// The old two minutes: 34 brushes no longer reach level 4 (100).
p = fresh(at(13)); give(p, 'brush', 34, at(13)); assert.ok(p.bond < 15, '34 brushes in one sitting: ' + p.bond);
// The best case takes about three weeks to level 9 (1100).
p = fresh(at(1)); let days = 0;
while (p.bond < 1100) { const now = at(1) + days * 24 * H; for (const a of Object.keys(DAY_FULL)) give(p, a, DAY_FULL[a] + 30, now, 'salmon'); const d = today(p, now); if (!d.wishDone) { d.wishDone = true; p.bond += WISH_WORTH; } days++; }
assert.ok(days >= 19 && days <= 21, 'best case to level 9: ' + days + ' days');
// A save with a broken `day` is mended, not thrown.
p = restore({...fresh(at(13)), day: 'nonsense'}, at(13)); give(p, 'pet', 1, at(13)); assert.equal(p.bond, 1);
p = restore({...fresh(at(13)), day: {key: '2026-11-13', n: null, extra: 'x'}}, at(13)); give(p, 'pet', 1, at(13)); assert.equal(p.bond, 1);
// An old save (no `day`) keeps its friendship and goes on.
p = restore({name: 'Juniper', bond: 240, cuddles: 9}, at(13)); assert.equal(p.bond, 240); give(p, 'play', 1, at(13)); assert.equal(p.bond, 246);
// The day survives a backup code.
p = fresh(at(13)); give(p, 'pet', 12, at(13)); const back = fromCode(toCode(p), at(13, 13)); give(back, 'pet', 1, at(13, 13)); assert.equal(back.bond, 10.3);

// The wish of the day.
const none = () => false, all = () => true;
p = fresh(at(13));
const w = todaysWish(p, none, at(13));
assert.ok(w && WISHES.includes(w)); assert.equal(todaysWish(p, none, at(13, 23)).id, w.id, 'the same all day');
assert.equal(todaysWish(fromCode(toCode(p), at(13)), none, at(13, 20)).id, w.id, 'also after a reload');
assert.equal(new Set(WISHES.map(x => x.id)).size, WISHES.length);
assert.ok(WISHES.length >= 14 && WISHES.every(x => x.label && x.want && x.how && x.thanks && x.moment && /^i-/.test(x.icon) && typeof x.on === 'function'));
assert.ok(WISHES.filter(x => x.needs).every(x => TOYS.some(t => t.id === x.needs && t.file)), 'a wish for a toy names a gift toy');
{ // A year of days: never the same twice running, never a toy she does not have, every wish comes up.
  const q = fresh(at(1)), seen = new Set(); let last = null;
  for (let d = 0; d < 365; d++) { const x = todaysWish(q, none, at(1) + d * 24 * H); assert.notEqual(x.id, last, 'day ' + d); assert.ok(!x.needs); last = x.id; seen.add(x.id); }
  assert.equal(seen.size, WISHES.filter(x => !x.needs).length);
  const r = fresh(at(1)), seen2 = new Set();
  for (let d = 0; d < 365; d++) seen2.add(todaysWish(r, all, at(1) + d * 24 * H).id);
  assert.equal(seen2.size, WISHES.length);
}
// Granting it: once, 5 friendship, and only the right care.
p = fresh(at(13)); today(p, at(13)).wish = 'salmon';
p.food = 20; care(p, 'feed', 'kibble', {now: at(13)}); assert.equal(grantWish(p, {action: 'feed', snack: 'kibble'}, none, at(13)), null);
p.food = 20; care(p, 'feed', 'salmon', {now: at(13)}); assert.equal(grantWish(p, {action: 'feed', snack: 'salmon'}, none, at(13)).id, 'salmon');
assert.equal(p.bond, 6 + WISH_WORTH); assert.equal(wishDone(p, at(13)), true);
assert.equal(grantWish(p, {action: 'feed', snack: 'salmon'}, none, at(13)), null, 'once a day');
assert.equal(wishDone(p, at(14)), false, 'a new wish tomorrow'); assert.notEqual(todaysWish(p, none, at(14)).id, 'salmon');
p = fresh(at(13)); today(p, at(13)).wish = 'fuss';
for (let i = 1; i <= 5; i++) { care(p, 'pet', undefined, {now: at(13)}); assert.equal(!!grantWish(p, {action: 'pet', zone: 'head'}, none, at(13)), i === 5, 'the fuss is five strokes'); }
p = fresh(at(13)); today(p, at(13)).wish = 'dark';
assert.equal(grantWish(p, {action: 'play', toy: 'ball', night: false}, none, at(13)), null); assert.ok(grantWish(p, {action: 'play', toy: 'ball', night: true}, none, at(13)));
// A wish for a toy that is no longer hers (a restored older save) is swapped for one she can have.
p = fresh(at(13)); today(p, at(13)).wish = 'not-a-wish'; assert.ok(WISHES.includes(todaysWish(p, none, at(13))));

// The later gifts.
assert.deepEqual(GIFTS.map(g => g.level), [2, 3, 4, 5, 6, 7, 8, 9]);
assert.deepEqual(GIFTS.filter(g => g.level >= LATE).map(g => g.id), ['yarn', 'lights', 'collar', 'frame', 'tag']);
assert.ok(RIBBONS.length === 6 && RIBBONS.every(r => /^#[0-9a-f]{6}$/.test(r.color)));
// A save already at level 9: the early ones at once, then one a day.
let shown = [], giftDay, day = '2026-11-13';
let got = newGifts(9, shown, giftDay, day); assert.deepEqual(got.map(g => g.id), ['mouse', 'fish', 'bowl', 'yarn']);
assert.ok(!owns(9, 'yarn', shown) && !owns(9, 'collar', shown), 'a later gift is hers once it has been given');
assert.ok(owns(9, 'bowl', shown), 'the early ones come with the level');
shown = got.map(g => g.id); giftDay = day;
assert.deepEqual(newGifts(9, shown, giftDay, day), [], 'no second later gift the same day');
assert.deepEqual(waitingGifts(9, shown).map(g => g.id), ['lights', 'collar', 'frame', 'tag']);
assert.deepEqual(toysAt(9, shown).map(t => t.id), ['ball', 'mouse', 'fish', 'yarn']);
for (const id of ['lights', 'collar', 'frame', 'tag']) { day = day.replace(/\d+$/, n => +n + 1); got = newGifts(9, shown, giftDay, day); assert.deepEqual(got.map(g => g.id), [id]); shown.push(id); giftDay = day; }
assert.deepEqual(newGifts(9, shown, giftDay, '2026-12-01'), []);
assert.ok(owns(9, 'tag', shown) && !owns(8, 'tag', shown));
// Reached in the ordinary way: the gift comes the day the level does.
assert.deepEqual(newGifts(5, ['mouse', 'fish', 'bowl'], undefined, '2026-11-20').map(g => g.id), ['yarn']);

// Needs that ask (never under 30).
const left = hours => { const q = fresh(0); Object.assign(q, {food: 90, water: 90, happiness: 90, cleanliness: 90, energy: 80}); advance(q, hours * H); return q; };
assert.equal(mood(left(6)), 'Feeling lovely', 'six hours: all good');
assert.ok(left(10).food < 40 && left(10).water < 40, 'overnight: a little hungry and thirsty');
assert.ok(left(10).happiness >= 45, 'but not yet missing you');
assert.ok(left(24).happiness < 45, 'a whole day: missing you');
for (const hours of [24, 24 * 30]) { const q = left(hours); assert.ok(['food', 'water', 'happiness', 'cleanliness', 'energy'].every(k => q[k] >= 30), 'never under 30'); }
assert.deepEqual(left(24), {...left(24 * 30), updated: left(24).updated}, 'time away counts for a day at most');
{ const q = fresh(0); q.bond = 77; advance(q, 24 * 30 * H); assert.equal(q.bond, 77, 'friendship never drops'); }
console.log('PASS: friendship over days (full counts, tenths, the day turning, clock set back), the wish of the day, later gifts one a day, needs after a night and a day.');
