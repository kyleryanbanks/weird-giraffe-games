import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Bouquets, Colors, Players, Tulip, Values } from './game.models';
import { emptyBouquets, initialDiscardsByPlayerCount } from './game.constants';

export enum Action {
  Festival,
  Secret,
  Give,
  Keep,
}

export interface Turn {
  player: number;
  firstTulip?: Tulip;
  firstAction?: Action;
  secondTulip?: Tulip;
  secondAction?: Action;
}

export interface Log {
  turn: Turn;
}

export interface State {
  numberOfPlayers: number;
  players: Players;
  deck: Tulip[];
  festival: Bouquets;
  secret: Tulip[];
  history: Turn[];
  turn?: Turn;
  error?: string;
}

const initialState: State = {
  numberOfPlayers: 0,
  players: {},
  deck: [],
  secret: [],
  festival: emptyBouquets,
  history: [],
  turn: undefined,
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
        let deck: Tulip[] = [];

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

        deck = this.shuffleDeckWithFisherYatesAlgorithm(deck);

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

  readonly seedFestival = this.updater((state) => {
    if (state.deck.length === 0) {
      return {
        ...state,
        error: 'Deck is currently empty.',
      };
    }

    if (state.festival !== emptyBouquets) {
      return {
        ...state,
        error: 'Festival already has tulips added',
      };
    }

    let deck = [...state.deck];

    const firstTulip = deck.shift() as Tulip;
    const nextDifferentTulipIndex = deck.findIndex(
      (tulip) => tulip.color !== firstTulip.color
    );
    const secondTulip = deck.splice(nextDifferentTulipIndex, 1)[0];

    if (nextDifferentTulipIndex !== 0) {
      deck = this.shuffleDeckWithFisherYatesAlgorithm(deck);
    }

    return {
      ...state,
      deck,
      festival: {
        ...state.festival,
        [firstTulip.color]: [firstTulip],
        [secondTulip.color]: [secondTulip],
      },
    };
  });

  readonly decideFirstPlayer = this.updater((state, player: number) => ({
    ...state,
    turn: {
      player,
    },
  }));

  readonly drawFirstTulip = this.updater((state) => {
    if (!state.turn?.player) {
      return {
        ...state,
        error: 'Drawing first tulip with no player set',
      };
    }

    if (state.deck.length === 0) {
      return {
        ...state,
        error: 'No Tulips left in deck. Game should have ended.',
      };
    }

    const deck = [...state.deck];

    return {
      ...state,
      turn: {
        ...state.turn,
        firstTulip: deck.shift() as Tulip,
      },
      deck,
    };
  });

  readonly takeFirstAction = this.updater(
    (state, firstAction: Action, target?: number) => {
      if (!state.turn?.firstTulip) {
        return {
          ...state,
          error: 'Taking first action before drawing first tulip',
        };
      }

      switch (firstAction) {
        case Action.Give: {
          return target
            ? {
                ...state,
                turn: {
                  ...state.turn,
                  firstAction,
                },
                players: {
                  ...state.players,
                  [target]: {
                    ...state.players[target],
                    bouquets: this.addTulipToBouquets(
                      state.players[target].bouquets,
                      state.turn.firstTulip
                    ),
                  },
                },
              }
            : {
                ...state,
                error: 'Give action but no target provided',
              };
        }

        case Action.Keep: {
          return {
            ...state,
            turn: {
              ...state.turn,
              firstAction,
            },
            players: {
              ...state.players,
              [state.turn.player]: {
                ...state.players[state.turn.player],
                bouquets: this.addTulipToBouquets(
                  state.players[state.turn.player].bouquets,
                  state.turn.firstTulip
                ),
              },
            },
          };
        }

        case Action.Festival: {
          return {
            ...state,
            turn: {
              ...state.turn,
              firstAction,
            },
            festival: this.addTulipToBouquets(
              state.festival,
              state.turn.firstTulip
            ),
          };
        }

        case Action.Secret: {
          return {
            ...state,
            secret: [...state.secret, state.turn.firstTulip],
          };
        }
      }
    }
  );

  readonly drawSecondTulip = this.updater((state) => {
    if (!state.turn?.player) {
      return {
        ...state,
        error: 'Drawing second tulip with no player set',
      };
    }

    if (state.deck.length === 0) {
      return {
        ...state,
        error: 'No Tulips left in deck. Game should have ended.',
      };
    }

    const deck = [...state.deck];

    return {
      ...state,
      deck,
      turn: {
        ...state.turn,
        secondTulip: deck.shift() as Tulip,
      },
    };
  });

  readonly takeSecondAction = this.updater(
    (state, secondAction: Action, target?: number) => {
      if (!state.turn?.secondTulip) {
        return {
          ...state,
          error: 'Taking first action before drawing first tulip',
        };
      }

      if (secondAction === state.turn.firstAction) {
        return {
          ...state,
          error: 'Not allowed to take the same action twice in one turn',
        };
      }

      switch (secondAction) {
        case Action.Give: {
          return target
            ? {
                ...state,
                turn: {
                  ...state.turn,
                  secondAction,
                },
                players: {
                  ...state.players,
                  [target]: {
                    ...state.players[target],
                    bouquets: this.addTulipToBouquets(
                      state.players[target].bouquets,
                      state.turn.secondTulip
                    ),
                  },
                },
              }
            : {
                ...state,
                error: 'Give action but no target provided',
              };
        }

        case Action.Keep: {
          return {
            ...state,
            turn: {
              ...state.turn,
              secondAction,
            },
            players: {
              ...state.players,
              [state.turn.player]: {
                ...state.players[state.turn.player],
                bouquets: this.addTulipToBouquets(
                  state.players[state.turn.player].bouquets,
                  state.turn.secondTulip
                ),
              },
            },
          };
        }

        case Action.Festival: {
          return {
            ...state,
            turn: {
              ...state.turn,
              secondAction,
            },
            festival: this.addTulipToBouquets(
              state.festival,
              state.turn.secondTulip
            ),
          };
        }

        case Action.Secret: {
          return {
            ...state,
            secret: [...state.secret, state.turn.secondTulip],
          };
        }
      }
    }
  );

  readonly startNextPlayersTurn = this.updater((state) => {
    if (!state.numberOfPlayers) {
      return {
        ...state,
        error: 'No game started. Provide number of players',
      };
    }

    if (!state.turn) {
      return {
        ...state,
        error: 'Decide first player to start first turn',
      };
    }

    return {
      ...state,
      history: [...state.history, state.turn],
      turn: {
        player: (state.turn.player + 1) % state.numberOfPlayers,
      },
    };
  });

  shuffleDeckWithFisherYatesAlgorithm = (deck: Tulip[]): Tulip[] => {
    const shuffledDeck = [...deck];

    // Shuffle deck with Fisher-Yates Algoritm
    for (let i = shuffledDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
    }

    return shuffledDeck;
  };

  addTulipToBouquets = (currentBouquets: Bouquets, tulip: Tulip): Bouquets => {
    const bouquets = { ...currentBouquets };
    bouquets[tulip.color].push(tulip);

    return {
      ...bouquets,
    };
  };
}
