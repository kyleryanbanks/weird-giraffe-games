import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { emptyBouquets, initialDiscardsByPlayerCount } from './game.constants';
import {
  Action,
  Bouquets,
  Colors,
  Players,
  Tulip,
  Turn,
  Values,
} from './game.models';

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

  readonly gameState$ = this.select((state) => state);

  readonly activeTurn$ = this.select((state) => state.turn);

  readonly playerKeys$ = this.select((state) =>
    Object.keys(state.players).map((key) => Number(key))
  );

  readonly hasNotStarted$ = this.select((state) => state.numberOfPlayers === 0);

  readonly readyToSeed$ = this.select(
    (state) => state.numberOfPlayers && state.festival === emptyBouquets
  );

  readonly readyToSelectFirstPlayer$ = this.select(
    (state) => state.festival !== emptyBouquets && !state.turn
  );

  readonly playerTakingTurn$ = this.select((state) => state.turn?.player);

  readonly waitingForFirstTulip$ = this.select(
    (state) => !state.turn?.firstTulip
  );

  readonly waitingForFirstAction$ = this.select((state) =>
    state.turn?.firstTulip && !state.turn?.firstAction
      ? state.turn.firstTulip
      : false
  );

  readonly waitingForSecondTulip$ = this.select(
    (state) => state.turn?.firstAction && !state.turn?.secondTulip
  );

  readonly waitingForSecondAction$ = this.select((state) =>
    state.turn?.secondTulip && !state.turn?.secondAction
      ? state.turn.secondTulip
      : false
  );

  readonly waitingForNextTurn$ = this.select(
    (state) =>
      state.deck.length !== 0 &&
      state.turn?.player &&
      state.turn.firstTulip &&
      state.turn.firstAction &&
      state.turn.secondTulip &&
      state.turn.secondAction
  );

  readonly isOver$ = this.select(
    (state) => state.festival !== emptyBouquets && state.deck.length === 0
  );

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
    (
      state,
      { firstAction, player }: { firstAction: Action; player?: number }
    ) => {
      if (!state.turn?.firstTulip) {
        return {
          ...state,
          error: 'Taking first action before drawing first tulip',
        };
      }

      switch (firstAction) {
        case Action.Give: {
          return player
            ? {
                ...state,
                turn: {
                  ...state.turn,
                  firstAction,
                },
                players: {
                  ...state.players,
                  [player]: {
                    ...state.players[player],
                    bouquets: this.addTulipToBouquets(
                      state.players[player].bouquets,
                      state.turn.firstTulip
                    ),
                  },
                },
              }
            : {
                ...state,
                error: 'Give action but no player provided',
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
    (
      state,
      { secondAction, player }: { secondAction: Action; player?: number }
    ) => {
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
          return player
            ? {
                ...state,
                turn: {
                  ...state.turn,
                  secondAction,
                },
                players: {
                  ...state.players,
                  [player]: {
                    ...state.players[player],
                    bouquets: this.addTulipToBouquets(
                      state.players[player].bouquets,
                      state.turn.secondTulip
                    ),
                  },
                },
              }
            : {
                ...state,
                error: 'Give action but no player provided',
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
        player:
          state.turn.player % state.numberOfPlayers === 0
            ? 1
            : state.turn.player + 1,
      },
    };
  });

  readonly matchesFirstAction$ = (action: Action) =>
    this.select((state) => state.turn?.firstAction === action);

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
