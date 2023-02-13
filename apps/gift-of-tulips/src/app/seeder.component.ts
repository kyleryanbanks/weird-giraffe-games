import { Component, Input, OnInit } from '@angular/core';
import { GameStore } from './game.store';

@Component({
  standalone: true,
  selector: 'got-seeder',
  template: ` <h1>Seeding Festival...</h1> `,
})
export class SeederComponent implements OnInit {
  @Input() delay = 500;

  constructor(public game: GameStore) {}

  ngOnInit(): void {
    setTimeout(() => this.game.seedFestival(), this.delay);
  }
}
