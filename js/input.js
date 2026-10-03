import { State, state, setState } from './state.js';

export function bindInput(game, resetTiming) {
  function primaryAction() {
    if (state === State.READY) {
      setState(State.PLAYING);
      game.updateUI();
      game.player.flap();
    } else if (state === State.PLAYING) {
      game.player.flap();
    } else if (state === State.GAME_OVER) {
      game.reset();
      resetTiming();
    } else if (state === State.PAUSED) {
      setState(State.PLAYING);
      game.updateUI();
      resetTiming();
    }
  }

  const canvas = document.querySelector('canvas');
  canvas.tabIndex = 0;
  
  canvas.addEventListener("pointerdown", () => {
    canvas.focus();
    primaryAction();
  });

  canvas.addEventListener("keydown", event => {
    if (!["Space", "ArrowUp"].includes(event.code)) return;
    event.preventDefault();
    if (!event.repeat && !event.ctrlKey && !event.metaKey) {
      primaryAction();
    }
  });

  const startBtn = document.getElementById('btn-start');
  const restartBtn = document.getElementById('btn-restart');
  const pauseBtn = document.getElementById('btn-pause');

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      canvas.focus();
      primaryAction();
    });
  }

  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      canvas.focus();
      primaryAction();
    });
  }

  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      if (state === State.PLAYING) {
        setState(State.PAUSED);
        game.updateUI();
      }
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === State.PLAYING) {
      setState(State.PAUSED);
      game.updateUI();
    }
  });
}
