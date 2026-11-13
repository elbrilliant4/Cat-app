// Her wish of the day (phase 17b): each day she fancies one small thing, out
// of things the app already has. Granting it is thanked, written in Moments
// and worth WISH_WORTH friendship; skipping it loses nothing (no streaks).
// The wish is picked from the date and kept in the save for the day
// (`pet.day.wish`, pet-state.js `today()`), so it is the same all day, also
// after a reload, and never the same two days running.
import {today} from './pet-state.js';

export const WISH_WORTH = 5;
// label: on the wish button ("Wish: salmon"). want: her own words. how: what
// to do, plainly. thanks: what she says. moment: the Moments line (after her
// name). on(e, day): does this care grant it? e = {action, snack, zone, toy,
// night}. needs: a gift toy she must have.
export const WISHES = [
  {id: 'salmon', label: 'salmon', icon: 'i-bowl', want: 'I keep thinking about salmon.', how: 'Feed her salmon bites', thanks: 'Salmon! You read my mind.', moment: 'wished for salmon, and got it', on: e => e.action === 'feed' && e.snack === 'salmon'},
  {id: 'chicken', label: 'chicken', icon: 'i-bowl', want: 'Something smells of chicken. Is it for me?', how: 'Feed her chicken morsels', thanks: 'Chicken. Worth the wait.', moment: 'wished for chicken, and got it', on: e => e.action === 'feed' && e.snack === 'chicken'},
  {id: 'kibble', label: 'a good crunch', icon: 'i-bowl', want: 'Plain kibble today. I am a simple cat.', how: 'Feed her crunchy kibble', thanks: 'Crunch, crunch. Perfect.', moment: 'wanted plain kibble, of all things', on: e => e.action === 'feed' && e.snack === 'kibble'},
  {id: 'chin', label: 'a chin scratch', icon: 'i-heart', want: 'My chin has been itching all day.', how: 'Stroke her under the chin', thanks: 'That was the spot. All day I waited.', moment: 'got the chin scratch she was waiting for', on: e => e.action === 'pet' && e.zone === 'chin'},
  {id: 'back', label: 'a long stroke', icon: 'i-heart', want: 'A long stroke down my back, please.', how: 'Stroke her along her back', thanks: 'All the way to the tail. Lovely.', moment: 'asked for a long stroke down her back', on: e => e.action === 'pet' && e.zone === 'back'},
  {id: 'fuss', label: 'a proper fuss', icon: 'i-heart', want: 'I would like a proper fuss made of me.', how: 'Stroke her five times', thanks: 'Now that was a proper fuss.', moment: 'wanted a proper fuss made of her', on: (e, d) => e.action === 'pet' && (d.n.pet || 0) >= 5},
  {id: 'brush', label: 'a brush', icon: 'i-brush', want: 'My fluff is not at its fluffiest.', how: 'Give her a brush', thanks: 'Fluffy again. Admire me.', moment: 'wished for a brush and came out fluffy', on: e => e.action === 'brush'},
  {id: 'ball', label: 'the pink ball', icon: 'i-yarn', want: 'Where is my pink ball? I have plans for it.', how: 'Play with the pink ball', thanks: 'The ball never stood a chance.', moment: 'had plans for her pink ball', on: e => e.action === 'play' && e.toy === 'ball'},
  {id: 'mouse', label: 'the felt mouse', icon: 'i-yarn', needs: 'mouse', want: 'The felt mouse looked at me funny.', how: 'Play with the felt mouse', thanks: 'The mouse has been dealt with.', moment: 'settled things with the felt mouse', on: e => e.action === 'play' && e.toy === 'mouse'},
  {id: 'fish', label: 'the fabric fish', icon: 'i-yarn', needs: 'fish', want: 'I dreamed about the fabric fish.', how: 'Play with the fabric fish', thanks: 'Better than in the dream.', moment: 'dreamed of the fabric fish, then caught it', on: e => e.action === 'play' && e.toy === 'fish'},
  {id: 'yarn', label: 'the yarn ball', icon: 'i-yarn', needs: 'yarn', want: 'The yarn ball needs unravelling. By me.', how: 'Play with the yarn ball', thanks: 'Unravelled. My work here is done.', moment: 'took the yarn ball apart, as planned', on: e => e.action === 'play' && e.toy === 'yarn'},
  {id: 'dark', label: 'a game after dark', icon: 'i-moon', want: 'Everything is more fun to chase in the dark.', how: 'Play with her in the evening (or tap the moon)', thanks: 'Night hunting. The best kind.', moment: 'wanted a game after dark', on: e => e.action === 'play' && e.night === true},
  {id: 'fountain', label: 'a drink together', icon: 'i-drop', want: 'Water tastes better when you watch.', how: 'Tap her fountain to invite a drink', thanks: 'See? Better with company.', moment: 'wanted company at her fountain', on: e => e.action === 'drink'},
  {id: 'photo', label: 'a photo', icon: 'i-sparkle', want: 'I look especially good today. Someone should take a photo.', how: 'Take a photo of her', thanks: 'My good side. They are all my good side.', moment: 'knew she looked good and wanted a photo', on: e => e.action === 'photo'},
];
const byId = id => WISHES.find(w => w.id === id) || null;
function hash(text) { let h = 2166136261; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

// Today's wish. `has(id)`: does she have that gift toy?
export function todaysWish(p, has = () => false, now = Date.now()) {
  const d = today(p, now);
  if (!byId(d.wish)) {
    const pool = WISHES.filter(w => w.id !== d.last && (!w.needs || has(w.needs)));
    d.wish = pool[hash(d.key + ':' + (Number.isFinite(p.born) ? p.born : 0)) % pool.length].id;
    delete d.wishDone;
  }
  return byId(d.wish);
}
export const wishDone = (p, now = Date.now()) => today(p, now).wishDone === true;
// A care that has just been given (after pet-state `care`, so today's counts
// include it): returns the wish when this granted it, else null.
export function grantWish(p, e, has = () => false, now = Date.now()) {
  const d = today(p, now);
  if (d.wishDone === true) return null;
  const w = todaysWish(p, has, now);
  if (!w.on(e, d)) return null;
  d.wishDone = true;
  p.bond = Math.round(((Number.isFinite(p.bond) ? p.bond : 0) + WISH_WORTH) * 10) / 10;
  return w;
}
