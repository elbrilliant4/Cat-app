// Gifts of friendship: something new at a friendship level. A gift is only
// ever added (nothing a player has is locked), and what a player owns is
// worked out from the level each time, so it can't be lost. The save keeps
// only which gifts have been shown (`pet.gifts`) and the toy picked
// (`pet.toy`). The later gifts (level LATE and up, phase 17b) are hers once
// their card has been shown, and at most one of them is given a day, so a
// save already far along gets them one a day (`pet.giftDay`: the day of the
// last one), not all on one card.
export const GIFTS = [
  {level: 2, id: 'mouse', name: 'A felt mouse', short: 'a felt mouse', text: 'A new toy. Choose it when you tap Play.', icon: 'i-yarn'},
  {level: 3, id: 'fish', name: 'A fabric fish', short: 'a fabric fish', text: 'Another toy for the basket.', icon: 'i-yarn'},
  {level: 4, id: 'bowl', name: 'Her name on her bowl', short: 'her name on her bowl', text: 'Look closely at her food bowl.', icon: 'i-bowl'},
  {level: 5, id: 'yarn', name: 'A ball of yarn', short: 'a ball of yarn', text: 'A fourth toy for the basket.', icon: 'i-yarn'},
  {level: 6, id: 'lights', name: 'Fairy lights for the study', short: 'fairy lights for the study', text: 'They come on in the evening, along the mantel.', icon: 'i-sparkle'},
  {level: 7, id: 'collar', name: 'A ribbon collar', short: 'a ribbon collar', text: 'Tap the pencil by her name to pick its colour.', icon: 'i-heart'},
  {level: 8, id: 'frame', name: 'A picture frame for the study', short: 'a picture frame for the study', text: 'Take a photo, then hang it on the wall.', icon: 'i-sparkle'},
  {level: 9, id: 'tag', name: 'A gold tag with her name', short: 'a gold tag with her name', text: 'It hangs from her collar.', icon: 'i-sparkle'},
];
export const LATE = 5;
// Ribbon colours for the collar (the first is the one she starts with).
export const RIBBONS = [
  {id: 'rose', name: 'Rose', color: '#d9728a'},
  {id: 'red', name: 'Berry red', color: '#b5303c'},
  {id: 'teal', name: 'Sea teal', color: '#2f8f8c'},
  {id: 'blue', name: 'Cornflower', color: '#5b7fd1'},
  {id: 'olive', name: 'Olive', color: '#6f7a34'},
  {id: 'butter', name: 'Butter', color: '#e3b94f'},
];
// Toys to play with: the ball is hers from the start. `file` is a model in
// assets/models; `size` its longest side in the room.
export const TOYS = [
  {id: 'ball', name: 'Pink ball', note: 'The one she started with', tint: '--love'},
  {id: 'mouse', name: 'Felt mouse', note: 'She stalks it first', file: 'felt-mouse', size: .27, tint: '--happy'},
  {id: 'fish', name: 'Fabric fish', note: 'Soft, and a little silly', file: 'fabric-fish', size: .33, tint: '--water'},
  {id: 'yarn', name: 'Ball of yarn', note: 'For unravelling', file: 'yarn-ball', size: .3, tint: '--energy'},
];
const list = shown => Array.isArray(shown) ? shown : [];
export const giftsAt = level => GIFTS.filter(g => g.level <= level);
export const nextGift = level => GIFTS.find(g => g.level > level) || null;
// Does she have it? The early gifts come with the level; the later ones once
// their card has been shown.
export const owns = (level, id, shown) => id === 'ball' || GIFTS.some(g => g.id === id && g.level <= level && (g.level < LATE || list(shown).includes(g.id)));
export const toysAt = (level, shown) => TOYS.filter(t => owns(level, t.id, shown));
// Gifts earned but not yet shown.
export const waitingGifts = (level, shown) => giftsAt(level).filter(g => !list(shown).includes(g.id));
// The gifts to show now: every early one (a save from before gifts existed
// gets those on one card), and the next later one unless one was already
// given today (`giftDay` = the day key of the last, `day` = today's).
export function newGifts(level, shown, giftDay, day) {
  const wait = waitingGifts(level, shown), late = wait.find(g => g.level >= LATE);
  return [...wait.filter(g => g.level < LATE), ...(late && !(day && giftDay === day) ? [late] : [])];
}
