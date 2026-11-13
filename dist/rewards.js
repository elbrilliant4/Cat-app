// Gifts of friendship: something new at a friendship level. A gift is only
// ever added (nothing a player has is locked), and what a player owns is
// worked out from the level each time, so it can't be lost. The save keeps
// only which gifts have been shown (`pet.gifts`) and the toy picked
// (`pet.toy`).
export const GIFTS = [
  {level: 2, id: 'mouse', name: 'A felt mouse', short: 'a felt mouse', text: 'A new toy. Choose it when you tap Play.', icon: 'i-yarn'},
  {level: 3, id: 'fish', name: 'A fabric fish', short: 'a fabric fish', text: 'Another toy for the basket.', icon: 'i-yarn'},
  {level: 4, id: 'bowl', name: 'Her name on her bowl', short: 'her name on her bowl', text: 'Look closely at her food bowl.', icon: 'i-bowl'},
];
// Toys to play with: the ball is hers from the start. `file` is a model in
// assets/models; `size` its longest side in the room.
export const TOYS = [
  {id: 'ball', name: 'Pink ball', note: 'The one she started with', tint: '--love'},
  {id: 'mouse', name: 'Felt mouse', note: 'She stalks it first', file: 'felt-mouse', size: .27, tint: '--happy'},
  {id: 'fish', name: 'Fabric fish', note: 'Soft, and a little silly', file: 'fabric-fish', size: .33, tint: '--water'},
];
export const giftsAt = level => GIFTS.filter(g => g.level <= level);
export const nextGift = level => GIFTS.find(g => g.level > level) || null;
export const owns = (level, id) => id === 'ball' || GIFTS.some(g => g.id === id && g.level <= level);
export const toysAt = level => TOYS.filter(t => owns(level, t.id));
// Gifts earned but not yet shown to the player (a save from before gifts
// existed gets them all at once).
export const newGifts = (level, shown) => giftsAt(level).filter(g => !(Array.isArray(shown) ? shown : []).includes(g.id));
