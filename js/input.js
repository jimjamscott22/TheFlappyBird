import { State, state } from './state.js';

export function bindInput(game, resetTiming, canvas) {
  function primaryAction() {
    const previousState = state;
    game.primaryAction();
    if (state !== previousState) resetTiming(state === State.READY);
  }

  canvas.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0) return;
    canvas.focus({ preventScroll: true });
    primaryAction();
  });

  canvas.addEventListener('keydown', event => {
    if (!['Space', 'ArrowUp'].includes(event.code)) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault();
    if (!event.repeat) primaryAction();
  });

  document.getElementById('btn-start').addEventListener('click', () => {
    canvas.focus({ preventScroll: true });
    primaryAction();
  });

  document.getElementById('btn-restart').addEventListener('click', () => {
    game.reset();
    resetTiming(true);
    canvas.focus({ preventScroll: true });
  });

  document.getElementById('btn-pause').addEventListener('click', () => {
    game.pause();
    resetTiming();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      game.pause();
      resetTiming();
    }
  });
}
