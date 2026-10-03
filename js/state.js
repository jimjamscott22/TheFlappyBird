export const State = Object.freeze({
  READY: "ready", 
  PLAYING: "playing",
  GAME_OVER: "game-over", 
  PAUSED: "paused"
});

export let state = State.READY;

export function setState(newState) {
  state = newState;
}
