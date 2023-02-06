import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Bouquets, Colors, Players, Tulip, Values } from './game.models';
import { emptyBouquets, initialDiscardsByPlayerCount } from './game.constants';

export interface State {
  numberOfPlayers: number;
  players: Players;
  deck: Tulip[];
  festival: Bouquets;
  secret: Tulip[];
}

const initialState: State = {
  numberOfPlayers: 0,
  players: {},
  deck: [],
  secret: [],
  festival: emptyBouquets,
};

@Injectable()
export class GameStore extends ComponentStore<State> {
  constructor() {
    super(initialState);
  }

  readonly initializeGameForNumberOfPlayers = this.updater(
    (state, numberOfPlayers: number) => {
      const generatePlayers = (numberOfPlayers: number): Players =>
        Array.from(
          { length: numberOfPlayers },
          (_, i) => i + 1
        ).reduce<Players>(
          (players, i) => ({
            ...players,
            [i]: { score: 0, bouquets: emptyBouquets },
          }),
          {}
        );

      const generateDeck = (numberOfPlayers: number): Tulip[] => {
        const deck: Tulip[] = [];

        // Fill the deck with tulips
        for (const color of Object.values(Colors)) {
          for (const value of Object.values(Values)) {
            deck.push(...Array(2).fill({ color, value }));

            if (numberOfPlayers > 5) {
              // There are extra cards for 5/6 players.
              // The game cards include an indicator in the corner for some of the cards
              // Might not matter if the games sets it up for you
              // Adding 'extra' flag here just in case.
              deck.push(...Array(2).fill({ color, value, extra: true }));
            }
          }
        }

        // Shuffle deck with Fisher-Yates Algoritm
        for (let i = deck.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        // Remove tulips based on player count
        deck.splice(0, initialDiscardsByPlayerCount[numberOfPlayers]);

        return deck;
      };

      return {
        ...state,
        numberOfPlayers,
        players: generatePlayers(numberOfPlayers),
        deck: generateDeck(numberOfPlayers),
      };
    }
  );
}
