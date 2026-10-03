# Flappy Bird Game Improvement Guide

**Architecture and implementation recommendations**

HTML + CSS + Vanilla JavaScript + Canvas 2D · October 3 2026

Keep the existing browser stack and build a small, complete game around it. First make startup and the gameplay dependencies explicit, then improve timing, game states, input, and responsive presentation. Animation, sound, and scenery should follow a reliable playable loop.

## Current architecture

The 36-line `flappy-bird.js` defines a Canvas 2D game loop and input bindings. Its `update()` and `render()` functions are already separate, giving the refactor a useful starting point.

| Area | Evidence in flappy-bird.js | Implication |
| --- | --- | --- |
| Canvas | Lines 1-2 select a canvas and its 2D context. | HTML must provide the canvas before initialization. |
| Simulation | Lines 4-10 update velocity and position, then call obstacle and collision helpers. | Movement is measured per frame; helper definitions are external dependencies. |
| Rendering | Lines 12-19 clear the canvas, then draw background, player, obstacles, and score. | Preserve this clear drawing order and separation from simulation. |
| Loop | Lines 21-28 call update and render, then schedule the next frame. | No elapsed time, state gate, or startup readiness check is defined here. |
| Input | Lines 30-36 bind pointerdown and Space directly to flap. | Keyboard repeat and page scrolling need deliberate handling. |

### First requirement for a runnable game

`eagle`, `gravity`, `flap`, `updateObstacles`, `detectCollisions`, and the four draw helpers must be defined or imported. If `eagle` is unavailable, the immediate `gameLoop()` call fails in `update()` before the input handlers are registered. Validate the canvas and context, initialize all systems, and start the animation loop only after required assets are ready.

The script establishes the intended architecture; it does not yet define obstacle generation, collision behavior, score rules, player drawing, or a complete game lifecycle. These responsibilities should become explicit implementation work.

## Prioritized improvements

Deliver a dependable game in small stages. The earlier recommendations remain the foundation; completing the dependencies is the prerequisite revealed by reviewing the actual file.

| Priority | Improvement | Completion criterion |
| --- | --- | --- |
| P0 | Complete startup and dependencies | The page loads into a ready screen without uncaught errors. |
| P1 | Use elapsed time and bounded simulation steps | Physics and obstacle spacing remain consistent at different display refresh rates. |
| P1 | Add states and a complete reset | Ready, play, pause, and game over transitions work repeatedly. |
| P1 | Separate player and obstacle behavior | Movement, spawning, collision bounds, and cleanup have clear owners. |
| P1 | Unify input and scoring rules | One press or tap produces one action; each obstacle pair scores once. |
| P1 | Fix the logical playfield and responsive layout | Resizing changes display scale without changing the game world. |
| P2 | Load assets and persist the best score | Missing images show a useful error; unavailable storage does not stop play. |
| P3 | Add sprites, scenery, and audio | Visual and sound feedback enhance an already reliable game. |

### Target runtime architecture

```text
HTML and CSS: canvas, instructions, buttons, status
  main.js: validate -> load assets -> bind input -> start loop
    game.js: states, update, collision, scoring, reset
      player.js        obstacles.js        config.js
    render: background -> obstacles -> player -> HUD
  Browser APIs: animation frames, events, audio, localStorage
```

Keep gameplay in JavaScript and drawing in Canvas 2D. Use HTML for accessible controls and status text. Native ES modules are sufficient for these boundaries; no build system or gameplay backend is required for this scope.

## Game lifecycle and input

Use explicit ready, playing, game-over, and paused states. Loading and startup errors can be handled by the HTML status area before a game instance is made available. Update physics, spawning, collisions, and score only while playing; keep rendering the current screen in every state.

```javascript
const State = Object.freeze({
  READY: "ready", PLAYING: "playing",
  GAME_OVER: "game-over", PAUSED: "paused"
});
let state = State.READY;

function primaryAction() {
  if (state === State.READY) {
    state = State.PLAYING;
    player.flap();
  } else if (state === State.PLAYING) {
    player.flap();
  } else if (state === State.GAME_OVER) {
    resetGame(); // Returns to READY; next action starts.
  } else if (state === State.PAUSED) {
    state = State.PLAYING;
    resetTiming();
  }
}

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
```

This excerpt assumes initialized player and reset functions. Register handlers once, after successful startup. Keep Start, Restart, Pause, and Mute as real HTML buttons; route them through the same game actions. Provide visible keyboard focus and short instructions for Space, Arrow Up, and tap.

### Reset and pause rules

`resetGame()` should restore the player position and velocity, empty obstacle pairs, reset spawn and animation timers, clear the current score, and reset loop timing. Retain the best score and sound preference. On `visibilitychange`, pause an active run and reset timing. Resume only after a deliberate action so returning to a tab does not produce an unexpected fall. [2]

## Timing physics and collision

The current `velocity += gravity` and `y += velocity` run once per frame. Use seconds and world units instead. The prior delta-time recommendation fixes the unit model; a small fixed-step accumulator also makes physics and collisions more consistent across refresh rates. Use the animation callback timestamp and limit catch-up work. [1]

```javascript
const STEP = 1 / 120;
const MAX_ELAPSED = 0.1;
let lastTime = null;
let accumulator = 0;

function resetTiming() {
  lastTime = null;
  accumulator = 0;
}

function frame(now) {
  if (lastTime === null) lastTime = now;
  const elapsed = Math.min((now - lastTime) / 1000,
    MAX_ELAPSED);
  lastTime = now;
  if (state === State.PLAYING) {
    accumulator += elapsed;
    while (accumulator >= STEP &&
           state === State.PLAYING) {
      update(STEP);
      accumulator -= STEP;
    }
  } else {
    accumulator = 0;
  }
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

Schedule this loop once; restarting a run must not create another animation loop. Capping elapsed time intentionally discards long stalls rather than simulating a large jump. The visibility pause rule handles normal background-tab returns. Render interpolation is optional if fixed steps produce visible judder.

### Use clear units and explicit game rules

Define gravity in world units per second squared, flap velocity in units per second, obstacle speed in units per second, and spawn intervals in seconds. Apply `velocity += gravity * dt` and `y += velocity * dt`. Values such as gravity 1200, flap velocity -420, obstacle speed 180, and a 1.5-second spawn interval are starting points for play tuning, not measurements from the file.

Check floor, ceiling, and both halves of each obstacle pair using logical coordinates. Start with axis-aligned bounds inset slightly from transparent sprite edges. Resolve collisions before awarding score; mark a pair as passed once its trailing edge clears the player. Clamp gap generation within safe margins, preserve spawn-timer remainder, and remove pairs after their right edge leaves the playfield.

## Responsive Canvas design

Choose a logical playfield such as 480 by 720 units and keep it stable. Player positions, obstacle gaps, and collision bounds must use those units, not `canvas.width` or browser-window dimensions. Start with a fixed backing bitmap and CSS scaling; this is simple and suitable for pixel art.

```javascript
// Example internal resolution; tune for the intended art.
const WORLD_WIDTH = 480;
const WORLD_HEIGHT = 720;
canvas.width = WORLD_WIDTH;
canvas.height = WORLD_HEIGHT;
ctx.imageSmoothingEnabled = false;
```

Include `<meta name="viewport" content="width=device-width, initial-scale=1">` in the HTML head.

```css
.game-shell {
  width: min(100%, 480px);
  margin-inline: auto;
}
canvas {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 2 / 3;
  image-rendering: pixelated;
  touch-action: manipulation;
}
```

### Fit the available space without changing gameplay

Allow room for instructions, controls, page padding, and phone safe areas. For a viewport-fitting layout, calculate `scale = Math.min(availableWidth / 480, availableHeight / 720)` and display the canvas at `480 * scale` by `720 * scale`. Use dynamic viewport height where supported and measure again on resize or orientation change. Center unused space; preserve the aspect ratio and avoid stretching or cropping the playfield.

On a short landscape screen, prioritize readable controls and permit page scrolling if fitting everything would make the game too small. Keep touch restrictions scoped to the game surface. The primary action needs no coordinates; if future controls do, convert pointer coordinates using the canvas bounding rectangle and logical width and height.

### Optional sharpness on high density displays

If CSS scaling looks blurry, resize the backing bitmap to its displayed CSS size times devicePixelRatio, optionally capped at 2 to bound memory. Keep logical dimensions separate and map the context back to the world. Resizing resets context state, so restore transforms and image smoothing each time. [3]

```javascript
const dpr = Math.min(window.devicePixelRatio || 1, 2);
canvas.width = Math.round(cssWidth * dpr);
canvas.height = Math.round(cssHeight * dpr);
ctx.setTransform(canvas.width / WORLD_WIDTH, 0, 0,
  canvas.height / WORLD_HEIGHT, 0, 0);
ctx.imageSmoothingEnabled = false;
```

## Assets presentation and persistence

### Make loading part of startup

Load required images before entering the ready state. Keep paths in one manifest and use a visible loading status with a retry action for failures. Derive relative URLs from the module location when needed so the game also works under a site subdirectory. A small loader is sufficient; audio can fail independently without blocking gameplay.

```javascript
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(
      new Error(`Could not load image: ${url}`));
    image.src = url;
  });
}
// Example path from js/assets.js to assets/sprites/bird.png:
const bird = await loadImage(new URL(
  "../assets/sprites/bird.png", import.meta.url));
```

### Keep player and obstacle responsibilities small

A player object owns position, size, velocity, flap(), update(dt), reset(), bounds, and draw(ctx). The obstacle system owns a list of pairs, the spawn timer, randomized gap positions, horizontal movement, cleanup, and drawing. A plain object per pair is enough. Let the game controller decide when collisions end a run and when passing a pair increases the score.

### Add polish after the game rules are stable

Sprite animation: use a short wing-flap sheet and advance animation frames by elapsed time. Keep animation timing separate from physics and retain stable collision bounds when the visual frame changes. Add a restrained tilt based on vertical velocity if it improves feedback.

Scenery: begin with a static sky, slowly moving clouds, and a ground strip moving at obstacle speed. Wrap layer offsets by the tile width and draw enough tiles to fill the playfield. Cache static artwork when useful; profile before adding rendering abstractions.

Audio: add flap, score, and collision cues with HTMLAudioElement. Initiate or enable sound during user interaction, catch rejected play() promises, and offer a visible mute control. A small pool of sound instances can support overlapping cues. A blocked or missing sound must not interrupt the game. [4]

Best score: use a namespaced key such as flappy.bestScore.v1. Validate loaded data as a finite nonnegative integer and wrap reads and writes in try/catch. Save when a run ends with a new record and fall back to an in-memory record when storage is unavailable. [5]

Feedback: show current score, best score, clear ready and game-over screens, and a restart hint. Announce the final result through an HTML status region rather than announcing every score increment. Keep sound optional and make instructions visible outside the canvas.

## Suggested project structure

Use consistent lowercase filenames and native ES module imports. Extract responsibilities as they become useful; small objects and functions are sufficient. The tree below is a destination for a complete small game, not a requirement to create empty modules immediately.

```text
flappy/
  index.html
  css/
    game.css
  js/
    main.js
    game.js
    player.js
    obstacles.js
    input.js
    assets.js
    audio.js
    storage.js
    config.js
  assets/
    sprites/
      bird.png
      obstacles.png
      background.png
    audio/
      flap.wav
      score.wav
      hit.wav
```

| Module | Responsibility |
| --- | --- |
| main.js | Validate DOM and context, load assets, create the game, bind input once, and own the single animation loop. |
| game.js | Own state transitions, reset, update/render orchestration, collision decisions, and score. |
| player.js and obstacles.js | Keep player movement and obstacle generation, movement, bounds, and drawing local. |
| input.js | Translate pointer, keyboard, and HTML button events into game actions. |
| assets.js and audio.js | Load images and handle optional sound playback and mute state. |
| storage.js and config.js | Persist records defensively and collect logical dimensions and tuning constants. |

### Entry point and hosting

```html
<script type="module" src="./js/main.js"></script>
```

Serve the project through a local HTTP server during development; loading ES modules directly through `file://` can trigger security restrictions. Deploy the same static files to an ordinary static host. Use relative asset paths and check the game from its real deployment subdirectory. [6]

## Implementation roadmap

| Stage | Scope | Exit condition |
| --- | --- | --- |
| 1  Playable core | Validate startup; define player, obstacles, drawing, collision, and scoring. Add states, reset, unified input, and stable timing. | Start, flap, score, collide, and replay without errors or duplicated loops. |
| 2  Device support | Keep fixed logical coordinates; add responsive sizing, focus behavior, HTML controls, and tab visibility pause. | Phone, desktop, orientation changes, and keyboard use preserve fair gameplay. |
| 3  Organization and assets | Extract modules, preload sprites, add loading/error handling and best-score persistence. | Assets load reliably; missing images and blocked storage have useful behavior. |
| 4  Arcade finish | Tune difficulty and collision bounds; add sprite animation, scenery, optional audio, and final result feedback. | The game feels consistent and remains usable with sound disabled. |

Keep each stage reviewable and playable before starting the next. Record tuning values centrally; use a narrow implementation rather than building a general-purpose game engine.

### Practical acceptance checks

- Complete repeated start and restart cycles; confirm input listeners and animation loops do not multiply.
- Compare movement and obstacle spacing at different refresh rates. Return from a background tab and confirm deliberate resume.
- Confirm one score per passed pair, no score after a fatal collision, safe obstacle gaps, and full cleanup on reset.
- Check narrow portrait and short landscape screens, touch input, keyboard focus, and visible instructions.
- Try a missing image, denied audio playback, and unavailable storage. Inspect the browser console for uncaught errors.

### Source and technical references

Code reference: flappy-bird.js, 36 lines, reviewed October 3 2026. Recommendations build on the Game Stack Analysis conversation and its proposed states, timing, objects, responsive Canvas, asset loading, animation, scenery, audio, and best score. Code excerpts in this guide illustrate the proposed design; they are not a complete replacement script.

- [MDN — requestAnimationFrame][1]
- [MDN — Page Visibility API][2]
- [MDN — devicePixelRatio][3]
- [MDN — Autoplay guide][4]
- [MDN — localStorage][5]
- [MDN — JavaScript modules][6]

[1]: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
[2]: https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
[3]: https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio
[4]: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay
[5]: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
[6]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules
