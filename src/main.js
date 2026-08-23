import './style.css';
import { Game } from './game.js';

const canvas = document.getElementById('viewport');
const game = new Game(canvas);

game.init().catch((err) => {
  console.error(err);
  const overlay = document.getElementById('overlay');
  if (overlay) {
    overlay.querySelector('.prompt').textContent = 'Failed to load physics — check console';
  }
});
