import { Colors } from './game.models';

export const emptyBouquets = {
  [Colors.Blue]: [],
  [Colors.Orange]: [],
  [Colors.Pink]: [],
  [Colors.Violet]: [],
};

// Festivals organized as objects.
// Only change as more players are added is the addition of second/third place.
export const twoPlayerFestivals = [
  { give: 3, keep: 0, first: 15 },
  { give: 2, keep: 0, first: 10 },
  { give: 1, keep: 1, first: 5 },
  { give: 0, keep: 2 },
];

export const threeOrFourPlayerFestivals = [
  { give: 3, keep: 0, first: 15, second: 10 },
  { give: 2, keep: 0, first: 10, second: 7 },
  { give: 1, keep: 1, first: 5, second: 3 },
  { give: 0, keep: 2 },
];

export const fiveOrSixPlayerFestivals = [
  { give: 3, keep: 0, first: 15, second: 10, third: 5 },
  { give: 2, keep: 0, first: 10, second: 7, third: 4 },
  { give: 1, keep: 1, first: 5, second: 3, third: 1 },
  { give: 0, keep: 2 },
];

// Game Values Indexed by Place
// Might be easier to use these and jus
export const give = [3, 2, 1, 0];
export const keep = [0, 0, 1, 2];
export const firstPrize = [15, 10, 5, 0];
export const secondPrize = [10, 7, 3, 0];
export const thirdPrize = [5, 4, 1, 0];

export const initialDiscardsByPlayerCount = [0, 0, 18, 4, 6, 14, 10];
