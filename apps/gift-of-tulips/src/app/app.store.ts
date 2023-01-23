import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';

export enum Variety {
  blue,
  red,
  pink,
  orange,
}

export interface Tulip {
  variety: Variety;
  value: number;
}

export interface Bouquet {
  variety: Variety;
  tulips: Tulip[];
}

export interface Player {
  bouquets: Bouquet[];
}

export interface GameState {
  players: Player[];
  deck: Tulip[];
  festival: Bouquet[];
  secretFestival: Tulip[];
}

const defaultState: GameState = {};

@Injectable()
export class PersonStore extends ComponentStore<GameState> {
  constructor() {
    super(defaultState);
  }

  readonly people$ = this.select(({ people }) => people);

  readonly loadPeople = this.updater((state, people: Person[] | null) => ({
    ...state,
    people: people || [],
  }));
}
