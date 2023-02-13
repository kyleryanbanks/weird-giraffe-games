import { AsyncPipe, JsonPipe, NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { Action } from './game.models';
import { GameStore } from './game.store';
import { SeederComponent } from './seeder.component';

@Component({
  standalone: true,
  selector: 'got-root',
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      section {
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .flex-row {
        display: flex;
        flex-direction: row;
      }

      button {
        margin: 1rem;
      }

      pre {
        margin: 1.5rem;
        padding: 1rem;
        border: 5px solid black;
        max-height: 500px;
        overflow: auto;
      }
    `,
  ],
  template: `
    <section *ngIf="game.hasNotStarted$ | async">
      <h1>Gift of Tulips</h1>
      <h2>Select number of players</h2>
      <div class="flex-row">
        <button (click)="game.initializeGameForNumberOfPlayers(2)">2</button>
        <button (click)="game.initializeGameForNumberOfPlayers(3)">3</button>
        <button (click)="game.initializeGameForNumberOfPlayers(4)">4</button>
        <button (click)="game.initializeGameForNumberOfPlayers(5)">5</button>
        <button (click)="game.initializeGameForNumberOfPlayers(6)">6</button>
      </div>
    </section>

    <got-seeder *ngIf="game.readyToSeed$ | async"></got-seeder>

    <ng-container *ngIf="game.readyToSelectFirstPlayer$ | async">
      <h1>Which player has gifted someone a flower most recently?</h1>

      <div class="flex-row">
        <button
          *ngFor="let player of game.playerKeys$ | async"
          (click)="game.decideFirstPlayer(player)"
        >
          Player {{ player }}
        </button>
      </div>
    </ng-container>

    <ng-container *ngIf="game.playerTakingTurn$ | async as activePlayer">
      <code>Current Turn: {{ game.activeTurn$ | async | json }}</code>

      <ng-container *ngIf="game.waitingForFirstTulip$ | async">
        <button (click)="game.drawFirstTulip()">Draw your first tulip</button>
      </ng-container>

      <ng-container *ngIf="game.waitingForFirstAction$ | async as firstTulip">
        <h1>{{ firstTulip | json }}</h1>
        <button (click)="game.takeFirstAction({ firstAction: Action.Keep })">
          Keep
        </button>

        <div class="flex-row">
          <ng-container *ngFor="let player of game.playerKeys$ | async">
            <button
              *ngIf="player !== activePlayer"
              (click)="
                game.takeFirstAction({ firstAction: Action.Give, player })
              "
            >
              Give to {{ player }}
            </button>
          </ng-container>
        </div>

        <button
          (click)="game.takeFirstAction({ firstAction: Action.Festival })"
        >
          Add To Festival
        </button>
        <button (click)="game.takeFirstAction({ firstAction: Action.Secret })">
          Add To Secret Festival
        </button>
      </ng-container>

      <ng-container *ngIf="game.waitingForSecondTulip$ | async">
        <button (click)="game.drawSecondTulip()">Draw your second tulip</button>
      </ng-container>

      <ng-container *ngIf="game.waitingForSecondAction$ | async as secondTulip">
        <h1>{{ secondTulip | json }}</h1>
        <button
          [disabled]="game.matchesFirstAction$(Action.Keep) | async"
          (click)="game.takeSecondAction({ secondAction: Action.Keep })"
        >
          Keep
        </button>
        <div class="flex-row">
          <ng-container *ngFor="let player of game.playerKeys$ | async">
            <button
              *ngIf="player !== activePlayer"
              [disabled]="game.matchesFirstAction$(Action.Give) | async"
              (click)="
                game.takeSecondAction({ secondAction: Action.Give, player })
              "
            >
              Give to {{ player }}
            </button>
          </ng-container>
        </div>
        <button
          [disabled]="game.matchesFirstAction$(Action.Festival) | async"
          (click)="game.takeSecondAction({ secondAction: Action.Festival })"
        >
          Add To Festival
        </button>
        <button
          [disabled]="game.matchesFirstAction$(Action.Secret) | async"
          (click)="game.takeSecondAction({ secondAction: Action.Secret })"
        >
          Add To Secret Festival
        </button>
      </ng-container>

      <ng-container *ngIf="game.waitingForNextTurn$ | async">
        <button (click)="game.startNextPlayersTurn()">Start Next Turn</button>
      </ng-container>
    </ng-container>

    <ng-container *ngIf="game.isOver$ | async">
      <h1>GGs</h1>
    </ng-container>

    <hr />

    <div *ngIf="game.state$ | async as state" class="flex-row">
      <pre>Deck: {{ state.deck | json }}</pre>
      <pre>Players: {{ state.players | json }}</pre>
      <pre>Festival: {{ state.festival | json }}</pre>
      <pre>Secret: {{ state.secret | json }}</pre>
    </div>
  `,
  imports: [NgIf, NgFor, AsyncPipe, JsonPipe, SeederComponent],
  providers: [GameStore],
})
export class AppComponent {
  Action = Action;
  constructor(public game: GameStore) {}
}
