import { WORLD_WIDTH, WORLD_HEIGHT, OBSTACLE_WIDTH } from './config.js';
import { Player } from './player.js';
import { ObstacleManager } from './obstacles.js';
import { State, state, setState } from './state.js';
import { playSound } from './audio.js';

export class Game {
  constructor() {
    this.player = new Player();
    this.obstacles = new ObstacleManager();
    this.score = 0;
    this.bestScore = this.loadBestScore();
    this.updateUI();
  }

  loadBestScore() {
    try {
      const best = localStorage.getItem('flappy.bestScore.v1');
      if (best !== null) {
        return parseInt(best, 10);
      }
    } catch (e) {
      console.warn("Could not load best score from local storage", e);
    }
    return 0;
  }

  saveBestScore() {
    try {
      localStorage.setItem('flappy.bestScore.v1', this.bestScore.toString());
    } catch (e) {
      console.warn("Could not save best score to local storage", e);
    }
  }

  reset() {
    this.player.reset();
    this.obstacles.reset();
    this.score = 0;
    setState(State.READY);
    this.updateUI();
  }

  update(dt) {
    if (state !== State.PLAYING) return;

    this.player.update(dt);
    this.obstacles.update(dt);

    this.checkCollisions();
    this.checkScore();
  }

  checkCollisions() {
    const pBounds = this.player.getBounds();

    // Floor / Ceiling
    if (pBounds.bottom >= WORLD_HEIGHT || pBounds.top <= 0) {
      this.gameOver();
      return;
    }

    // Pipes
    for (const pair of this.obstacles.pairs) {
      const oLeft = pair.x;
      const oRight = pair.x + OBSTACLE_WIDTH;

      if (pBounds.right > oLeft && pBounds.left < oRight) {
        if (pBounds.top < pair.gapTop || pBounds.bottom > pair.gapBottom) {
          this.gameOver();
          return;
        }
      }
    }
  }

  checkScore() {
    const pLeft = this.player.getBounds().left;
    for (const pair of this.obstacles.pairs) {
      if (!pair.passed && pLeft > pair.x + OBSTACLE_WIDTH) {
        pair.passed = true;
        this.score++;
        playSound('score');
        this.updateUI();
      }
    }
  }

  gameOver() {
    playSound('hit');
    setState(State.GAME_OVER);
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      this.saveBestScore();
    }
    this.updateUI();
  }

  draw(ctx) {
    this.obstacles.draw(ctx);
    this.player.draw(ctx);
  }

  updateUI() {
    const scoreEl = document.getElementById('score-display');
    const statusEl = document.getElementById('status-area');
    const startBtn = document.getElementById('btn-start');
    const restartBtn = document.getElementById('btn-restart');
    const pauseBtn = document.getElementById('btn-pause');

    if (scoreEl) scoreEl.textContent = this.score;

    if (!statusEl) return;

    startBtn.style.display = 'none';
    restartBtn.style.display = 'none';
    pauseBtn.style.display = 'none';

    if (state === State.READY) {
      statusEl.textContent = 'Get Ready!';
      startBtn.style.display = 'inline-block';
    } else if (state === State.PLAYING) {
      statusEl.textContent = '';
      pauseBtn.style.display = 'inline-block';
    } else if (state === State.GAME_OVER) {
      statusEl.textContent = `Game Over! Best: ${this.bestScore}`;
      restartBtn.style.display = 'inline-block';
    } else if (state === State.PAUSED) {
      statusEl.textContent = 'Paused';
      startBtn.style.display = 'inline-block';
      startBtn.textContent = 'Resume';
    }
  }
}
