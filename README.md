# TheFlappyBird

A small Flappy Bird-inspired browser game built with **HTML, CSS, Vanilla JavaScript, and Canvas 2D**. Guide the bird through moving obstacle pairs, dodge flying creatures, and try to beat your personal best.

The game uses native JavaScript modules and browser APIs. There is no package installation, build step, database, or application server; a static HTTP server is enough to run it.

## Features

- **A complete gameplay loop:** ready, playing, paused, and game-over states, with restart controls.
- **Keyboard and pointer input:** flap with Space, Arrow Up, a click, or a tap.
- **Time-based physics:** a fixed simulation step of 1/120 second, with bounded catch-up after a slow frame.
- **Randomized obstacle gaps:** moving pairs, collision detection, and one point for each passed pair.
- **Flying creatures:** purple bats, winged cats, and ghosts with generated transparent artwork, gentle bobbing, and forgiving collision bounds.
- **Responsive rendering:** a 480 × 720 logical playfield, CSS scaling, and a display-density-aware canvas bitmap.
- **Local best scores:** records saved in the browser when storage is available.
- **An animated bird:** built-in Canvas artwork with a body, beak, eye, tail, three wing poses, and velocity-based tilt. No asset pack is required.
- **Optional artwork and sound:** configurable sprite sheets and Web Audio sound effects, with safe fallbacks.
- **Accessible controls:** visible instructions and keyboard focus, HTML buttons, and a status region announcing the final result.
- **Automatic pause:** switching away from the page pauses an active run; resuming requires an action.

## Quick start

### Requirements

- A modern browser with Canvas 2D and JavaScript modules. Web Audio support is needed only for optional sound effects.
- Git to clone the repository, or a downloaded copy of its files.
- A static HTTP server. The examples below use Python 3; Python is only a development convenience, not a gameplay dependency.

### Get the project

```sh
git clone https://github.com/jimjamscott22/TheFlappyBird.git
cd TheFlappyBird
```

### Serve it locally

On Windows, run this from the project directory:

```powershell
py -3 -m http.server 8000 --bind 127.0.0.1
```

On macOS or Linux:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000) in your browser. Press **Ctrl+C** in the terminal to stop the server.

Serve the files over HTTP rather than opening `index.html` through a `file://` URL, because native JavaScript modules are subject to browser security restrictions.

## How to play

Use a primary action to start, then keep flapping to pass through the gaps. Touching an obstacle, the ceiling, or the visible ground ends the run. Collision bounds are inset slightly from the bird's artwork and remain stable while it tilts or flaps.

Bats, winged cats, and ghosts drift between pipe pairs. Contact with a creature also ends the run; passing creatures does not award points. Pipes and creatures share the same horizontal speed, and spawning leaves the corridor between neighboring pipe openings clear. Extreme gap changes skip a creature rather than block passage. The pipe stream starts a little beyond the right edge so everything enters from offscreen.

| Control | Action |
| --- | --- |
| Space or Arrow Up | Start, flap, return to ready after game over, or resume a paused run. The canvas must have keyboard focus. |
| Click or tap the canvas | Focus the canvas and perform the same primary action. |
| Start | Begin a run with an initial flap. |
| Pause | Pause the current run. |
| Resume | Continue a paused run without an automatic flap. |
| Restart | Reset to the ready screen. Use another primary action to begin the next run. |
| Mute / Unmute | Toggle optional sound effects. Appears when at least one sound has loaded. |
| Retry | Reload after a startup failure. |

Clicking Start or tapping the canvas gives it keyboard focus. Holding Space or Arrow Up does not repeatedly flap; each key press produces a separate action.

Your best score appears on the game-over screen. It is stored locally under `flappy.bestScore.v1`; it is specific to the browser and site origin, and clearing site data removes it. If storage access is blocked, the game retains the record for the current page session.

## Artwork and audio

**The game includes three generated creature sprites** in [`assets/sprites/creatures/`](assets/sprites/creatures/README.md). The bird, pipes, sky, and ground are drawn directly in Canvas. Missing creature PNGs use visible Canvas fallbacks, so they never become invisible hazards. Optional player/background/pipe artwork and audio default to `null`, avoiding requests for files that are not supplied. The game is silent until sounds are configured.

The creature artwork was generated with the built-in imagegen tool in transparent-background mode. The original PNGs retain their alpha channel; source rectangles trim unused margins during rendering. The [artwork notes](assets/sprites/creatures/README.md) record the final prompts, source rectangles, and dimensions.

To add assets, create these paths in the project root and enable the corresponding entries in `IMAGE_MANIFEST` in [`js/assets.js`](js/assets.js) and `AUDIO_MANIFEST` in [`js/audio.js`](js/audio.js):

```text
assets/
├── sprites/
│   ├── bird.png
│   ├── obstacles.png
│   └── background.png
└── audio/
    ├── flap.wav
    ├── score.wav
    └── hit.wav
```

| File | Expected content |
| --- | --- |
| `bird.png` | Three equally sized animation frames arranged horizontally. Each frame is drawn at 40 × 30 logical units. |
| `obstacles.png` | One obstacle image. The current renderer stretches it to fit each upper and lower obstacle. |
| `background.png` | A background image drawn across the 480 × 720 playfield. |
| `creatures/bat.png`, `creatures/winged-cat.png`, `creatures/ghost.png` | Included transparent creature artwork; source rectangles and display sizes are defined in `js/creatures.js`. |
| `flap.wav`, `score.wav`, `hit.wav` | Short sound effects for flapping, passing an obstacle pair, and collision. |

For example, set the bird entry to `bird: '../assets/sprites/bird.png'` and a sound entry to `flap: '../assets/audio/flap.wav'`. Both manifests resolve paths relative to their modules. The ground strip is drawn directly in Canvas and does not need an image.

Images load before the game becomes ready, with a bounded wait per image. A missing or malformed bird sheet uses the built-in bird and shows a status message. Optional audio loads independently of game startup; missing sounds, unsupported audio, and rejected playback do not interrupt play. A missing Canvas context shows an error and Retry button.

Sound playback depends on the browser's audio policy and user interaction. Use your own artwork and audio, or assets whose licenses permit their use and distribution.

## Project structure

```text
TheFlappyBird/
├── index.html
├── css/
│   └── game.css
├── js/
│   ├── main.js
│   ├── game.js
│   ├── state.js
│   ├── player.js
│   ├── obstacles.js
│   ├── creatures.js
│   ├── input.js
│   ├── assets.js
│   ├── audio.js
│   └── config.js
├── docs/
│   └── flappy-bird-improvement-guide.md
├── assets/sprites/creatures/
│   ├── bat.png
│   ├── winged-cat.png
│   ├── ghost.png
│   └── README.md
├── tests/
│   └── creatures.test.mjs
├── LICENSE
└── README.md
```

| Module | Responsibility |
| --- | --- |
| [`main.js`](js/main.js) | Load resources, initialize the game, resize the canvas, and run the animation loop. Draw the background and scrolling ground. |
| [`game.js`](js/game.js) | Coordinate simulation, collisions, scoring, resets, best-score storage, and HTML status and controls. |
| [`state.js`](js/state.js) | Define and share the ready, playing, game-over, and paused states. |
| [`player.js`](js/player.js) | Handle flapping, gravity, position, collision bounds, sprite animation, and tilt. |
| [`obstacles.js`](js/obstacles.js) | Spawn randomized obstacle pairs, move them, draw them, and remove off-screen pairs. |
| [`creatures.js`](js/creatures.js) | Place creatures between pipe pairs, keep the flight corridor clear, advance bobbing, draw sprites/fallbacks, expose collision bounds, and clean up offscreen creatures. |
| [`input.js`](js/input.js) | Map keyboard, pointer, and button events to controller actions; reset loop timing on state changes and pause on page visibility changes. |
| [`assets.js`](js/assets.js) | Load optional images and record missing-image fallbacks. |
| [`audio.js`](js/audio.js) | Load and decode optional sounds, play effects through Web Audio, and manage mute state. |
| [`config.js`](js/config.js) | Collect playfield dimensions and gameplay tuning constants. |

The animation loop updates gameplay only while playing and renders the current scene every frame. Physics uses logical world coordinates; the canvas backing bitmap changes with display size and pixel density. The score overlays the Canvas; instructions, status, controls, and best score use HTML outside the playfield. Sizing reserves room for these controls. Short landscape screens retain a playable minimum size and allow vertical scrolling.

## Tune the gameplay

Edit [`js/config.js`](js/config.js) to change the current defaults:

| Setting | Default | Meaning |
| --- | --- | --- |
| `WORLD_WIDTH` | `480` | Logical playfield width. |
| `WORLD_HEIGHT` | `720` | Logical playfield height. |
| `GROUND_HEIGHT` | `50` | Ground strip height; its top is the collision floor. |
| `PLAYER_BOUNDS_INSET` | `3` | Collision inset from each edge of the bird's drawing area. |
| `GAP_MARGIN` | `50` | Minimum obstacle height above the gap and below it to the ground. |
| `GRAVITY` | `1800` | Downward acceleration in logical units per second squared. |
| `FLAP_VELOCITY` | `-600` | Upward velocity applied by a flap, in logical units per second. |
| `OBSTACLE_SPEED` | `240` | Horizontal obstacle speed in logical units per second. |
| `SPAWN_INTERVAL` | `1.5` | Seconds between new obstacle pairs. |
| `OBSTACLE_WIDTH` | `80` | Logical width of each obstacle. |
| `GAP_SIZE` | `200` | Vertical opening between the upper and lower obstacles. |
| `PIPE_SPAWN_PADDING` | `220` | Extra distance beyond the right edge for planning neighboring pipe gaps before they enter view. |
| `CREATURE_GAP_INTERVAL` | `2` | Try a creature in every second space between pipe pairs; skip when no safe lane exists. |
| `CREATURE_ROUTE_CLEARANCE` | `56` | Extra clearance above/below the corridor joining neighboring pipe openings. |
| `CREATURE_BOB_AMPLITUDE` | `10` | Maximum vertical bobbing displacement in logical units. |
| `CREATURE_BOUNDS_INSET` | `0.2` | Fraction of each drawn dimension removed on each side of creature collision bounds. |

A wider gap or slower obstacles generally makes the game easier. Change values in small increments and play several runs before adjusting them again. If you change the playfield proportions, update the canvas `aspect-ratio` in [`css/game.css`](css/game.css) to match.

## Development and deployment

Edit the HTML, CSS, or JavaScript files and refresh the browser to see changes. There is no generated bundle to rebuild. Focused creature checks use Node.js's built-in test runner (verified with Node.js 22):

```sh
node --test tests/creatures.test.mjs
```

These cover species rotation, randomized spawn clearance, unsafe-spawn rejection, movement/cleanup, refresh-rate consistency, collision-before-score, unchanged pipe scoring, pause, and reset. Useful manual checks include:

- Start, flap, score, collide, reset, and start another run.
- Pause through the button and by switching browser tabs, then resume deliberately.
- Check keyboard focus, pointer input, and canvas sizing on the devices you intend to support.
- Reload after setting a record and confirm that the best score persists when storage is available.
- Configure optional images and sounds, then check missing-file fallbacks.
- Survive long enough to see all three flying creature types; confirm that their artwork stays visible on mobile and that a hit ends the run.

For browser inspection, `window.render_game_to_text()` returns JSON describing the logical world, state, bird, pipes, creatures (including current bounds), score, and timers. `window.advanceTime(ms)` switches the current page to deterministic manual stepping through the same fixed-step simulation; reload to return to normal animation timing.

This refactor was checked in Chrome with desktop, 390 × 844 and 320 × 568 portrait, and 844 × 390 landscape viewports. Browser checks covered touch and keyboard input, repeated replay, pause/resume, orientation changes, collisions and scoring, saved records, asset failures, unavailable storage/audio, and matching simulation results at 30, 60, and 144 Hz. These are emulated device checks rather than physical-device tests.

Deploy the project files to a static host that serves JavaScript modules correctly. Keep `index.html`, `css/`, `js/`, and the included `assets/` together. No server-side game logic is needed.

## Further improvements

The [improvement guide](docs/flappy-bird-improvement-guide.md) records the architecture recommendations from the earlier game-loop skeleton. Several of those recommendations are now implemented in the modules above.

The next round now includes a recognizable animated bird, viewport fitting, startup/fallback feedback, stable inset collision bounds, ground-aligned gaps, and collision-before-score handling. Remaining optional polish includes richer scenery, original sound effects, and playtesting difficulty on physical devices.

## License

This project includes the **GNU General Public License, version 3**. See [`LICENSE`](LICENSE) for the full text. Any third-party artwork or audio you add should retain its own required credits and license notices.
