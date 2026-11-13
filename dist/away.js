// "While you were away": a short story of what she got up to, told when the
// player comes back. It is made from things she really does in her rooms
// (the vacuum ride, the salmon raid, the shelf nap), picked to fit the hours
// that passed. It is a story, not a recording (a closed app does nothing),
// and it never changes her needs. The same absence always tells the same
// story: the choices are seeded by the moment the player left.
export const AWAY_MIN = 30 * 60000;

// Each line: what she did (said of her, no subject) and its Moments icon.
const LINES = {
  day: [
    ['Watched the bird at the window, tail twitching.', 'i-sparkle'],
    ['Rode the robot vacuum round the kitchen island.', 'i-bolt'],
    ['Followed the sunbeam across the rug and napped in it.', 'i-moon'],
    ['Stole a salmon bite off the counter. No regrets.', 'i-bowl'],
    ['Drank from the kitchen faucet, not her fountain.', 'i-drop'],
    ['Patted a cup along the shelf, just to see.', 'i-paw'],
    ['Loafed on the armchair and watched the door for you.', 'i-heart'],
    ['Batted her toy round the rug by herself.', 'i-yarn'],
    ['Had a long nap in her tent.', 'i-moon'],
  ],
  evening: [
    ['Curled up by the fire.', 'i-moon'],
    ['Sat at the window and watched the light go.', 'i-sparkle'],
    ['Had a good long groom on the rug.', 'i-brush'],
    ['Swung on the kitchen lamp. Briefly.', 'i-bolt'],
    ['Checked her bowl. Twice. Just in case.', 'i-bowl'],
  ],
  night: [
    ['Had the zoomies in the small hours. Twice.', 'i-bolt'],
    ['Chased a moonbeam across the floor.', 'i-sparkle'],
    ['Watched the moths at the window.', 'i-sparkle'],
    ['Raided the kitchen in the dark.', 'i-bowl'],
    ['Stalked the sleeping vacuum on its dock.', 'i-paw'],
    ['Fell asleep on the high shelf.', 'i-moon'],
  ],
  asleep: [
    ['Slept the whole time, paws twitching.', 'i-moon'],
    ['Dreamed of salmon, by the look of her whiskers.', 'i-bowl'],
    ['Turned over once and went straight back to sleep.', 'i-moon'],
  ],
  christmas: [['Napped in the garland on the top shelf.', 'i-sparkle']],
  halloween: [['Wrestled her felt bat into submission.', 'i-yarn']],
};

const band = hour => hour >= 22 || hour < 7 ? 'night' : hour >= 18 ? 'evening' : 'day';

// The parts of the day an absence covered, in order, each once.
export function bandsBetween(from, to) {
  const out = [];
  // (Half-hour steps; more than a day away covers them all.)
  const end = Math.min(to, from + 86400000);
  for (let t = from; t <= end; t += 1800000) { const b = band(new Date(t).getHours()); if (!out.includes(b)) out.push(b); }
  const last = band(new Date(end).getHours());
  if (!out.includes(last)) out.push(last);
  return out;
}

export function awayLabel(ms) {
  const m = Math.round(ms / 60000);
  if (m < 90) return `${m} minutes`;
  const h = Math.round(m / 60);
  if (h < 36) return `${h} hours`;
  return `${Math.round(h / 24)} days`;
}

// {label, lines: [{text, icon}]} or null when she was not away long enough.
export function awayStory(from, to, {asleep = false, decor = 'classic'} = {}) {
  const ms = to - from;
  if (!Number.isFinite(ms) || ms < AWAY_MIN) return null;
  let x = (Math.floor(from / 60000) % 2147483646) + 1;
  const rnd = () => (x = (x * 16807) % 2147483647) / 2147483647;
  const take = pool => pool.splice(Math.floor(rnd() * pool.length), 1)[0];
  const want = asleep ? (ms < 3 * 3600000 ? 1 : 2) : ms < 3 * 3600000 ? 2 : 3;
  const lines = [];
  if (asleep) {
    const pool = [...LINES.asleep];
    while (lines.length < want) lines.push(take(pool));
  } else {
    const bands = bandsBetween(from, to), pools = Object.fromEntries(bands.map(b => [b, [...LINES[b]]]));
    // One thing from the season's look, now and then.
    if (LINES[decor] && rnd() < .5) lines.push(LINES[decor][0]);
    // Turn about through the parts of the day she was alone for.
    for (let i = 0; lines.length < want; i++) lines.push(take(pools[bands[i % bands.length]]));
  }
  return {label: awayLabel(ms), lines: lines.map(([text, icon]) => ({text, icon}))};
}
