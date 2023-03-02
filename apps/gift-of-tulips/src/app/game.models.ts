export enum Colors {
  Pink = 'pink',
  Blue = 'blue',
  Orange = 'orange',
  Violet = 'violet',
}

export enum Values {
  Two = 2,
  Three = 3,
  Four = 4,
}

export interface Tulip {
  color: Colors;
  value: Values;
  extra?: boolean; // is this one of the 5/6 player tulips
}

export type Bouquets = Record<Colors, Tulip[]>;

export interface Player {
  bouquets: Bouquets;
  score: number;
}

export type Players = Record<number, Player>;

export enum FestivalRanks {
  First = 1,
  Second = 2,
  Third = 3,
  Fourth = 4,
}

export interface Festival {
  give: number;
  keep: number;
  first?: number;
  second?: number;
  third?: number;
}

export enum Action {
  Festival = 'Festival',
  Secret = 'Secret',
  Give = 'Give',
  Keep = 'Keep',
}

export interface InitialDraw {
  player: number;
  firstTulip?: Tulip;
  secondTulip?: Tulip;
}

export interface Turn {
  player: number;
  firstTulip?: Tulip;
  firstAction?: Action;
  secondTulip?: Tulip;
  secondAction?: Action;
}
