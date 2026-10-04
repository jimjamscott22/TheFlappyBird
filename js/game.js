import { GROUND_Y, OBSTACLE_WIDTH } from './config.js';
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
      if (best !== null && /^(0|[1-9]\d*)$/.test(best)) {
        const value = Number(best);
        if (Number.isSafeInteger(value)) return value;
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

  primaryAction() {
    if (state === State.READY) {
      setState(State.PLAYING);
      this.player.flap();
      this.updateUI();
    } else if (state === State.PLAYING) {
      this.player.flap();
    } else if (state === State.GAME_OVER) {
      this.reset();
    } else if (state === State.PAUSED) {
      setState(State.PLAYING);
      this.updateUI();
    }
  }

  pause() {
    if (state !== State.PLAYING) return;
    setState(State.PAUSED);
    this.updateUI();
  }

  update(dt) {
    if (state !== State.PLAYING) return;

    this.player.update(dt);
    this.obstacles.update(dt);

    this.checkCollisions();
    if (state === State.PLAYING) this.checkScore();
  }

  checkCollisions() {
    const pBounds = this.player.getBounds();

    // Floor / Ceiling
    if (pBounds.bottom >= GROUND_Y || pBounds.top <= 0) {
      this.player.y += pBounds.bottom >= GROUND_Y ? GROUND_Y - pBounds.bottom : -pBounds.top;
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
    if (state !== State.PLAYING) return;
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
    if (state !== State.PLAYING) return;
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
    const bestEl = document.getElementById('best-display');

    if (scoreEl) scoreEl.textContent = this.score;
    if (bestEl) bestEl.textContent = this.bestScore;

    if (startBtn) {
      startBtn.hidden = ![State.READY, State.PAUSED].includes(state);
      startBtn.textContent = state === State.PAUSED ? 'Resume' : 'Start';
    }
    if (restartBtn) restartBtn.hidden = state !== State.GAME_OVER;
    if (pauseBtn) pauseBtn.hidden = state !== State.PLAYING;

    let status = '';
    if (state === State.READY) {
      status = 'Get ready!';
    } else if (state === State.PLAYING) {
      status = 'Keep flapping!';
    } else if (state === State.GAME_OVER) {
      status = `Game over! Score: ${this.score}. Best: ${this.bestScore}. Restart to try again.`;
    } else if (state === State.PAUSED) {
      status = 'Paused. Resume when you’re ready.';
    }
    // Updating the score must not repeat live-region announcements.
    if (statusEl && statusEl.textContent !== status) statusEl.textContent = status;
  }
}
