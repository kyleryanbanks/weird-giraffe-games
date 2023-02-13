import { Component } from '@angular/core';
import { GameStore } from './game.store';

@Component({
  selector: 'got-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [GameStore],
})
export class AppComponent {}
