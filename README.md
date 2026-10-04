# TheFlappyBird

A small Flappy Bird-inspired browser game built with **HTML, CSS, Vanilla JavaScript, and Canvas 2D**. Guide the bird through moving obstacle pairs, keep it airborne, and try to beat your personal best.

The game uses native JavaScript modules and browser APIs. There is no package installation, build step, database, or application server; a static HTTP server is enough to run it.

## Features

- **A complete gameplay loop:** ready, playing, paused, and game-over states, with restart controls.
- **Keyboard and pointer input:** flap with Space, Arrow Up, a click, or a tap.
- **Time-based physics:** a fixed simulation step of 1/120 second, with bounded catch-up after a slow frame.
- **Randomized obstacle gaps:** moving pairs, collision detection, and one point for each passed pair.
- **Responsive rendering:** a 480 × 720 logical playfield, CSS scaling, and a display-density-aware canvas bitmap.
- **Local best scores:** records saved in the browser when storage is available.
- **Optional artwork and sound:** sprite loading, a three-frame bird animation, velocity-based tilt, and Web Audio sound effects.
- **Automatic pause:** switching away from the page pauses an active run; resuming requires an action.

## Quick start

### Requirements

- A modern browser with Canvas 2D, JavaScript modules, and Web Audio support.
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

Use a primary action to start, then keep flapping to pass through the gaps. Touching an obstacle, the ceiling, or the bottom of the logical playfield ends the run.

| Control | Action |
| --- | --- |
| Space or Arrow Up | Start, flap, return to ready after game over, or resume a paused run. The canvas must have keyboard focus. |
| Click or tap the canvas | Focus the canvas and perform the same primary action. |
| Start | Begin a run with an initial flap. |
| Pause | Pause the current run. |
| Resume | Continue a paused run without an automatic flap. |
| Restart | Reset to the ready screen. Use another primary action to begin the next run. |
| Mute / Unmute | Toggle optional sound effects. |

Clicking Start or tapping the canvas gives it keyboard focus. Holding Space or Arrow Up does not repeatedly flap; each key press produces a separate action.

Your best score appears on the game-over screen. It is stored locally under `flappy.bestScore.v1`; it is specific to the browser and site origin, and clearing site data removes it. If storage access is blocked, the game retains the record for the current page session.

## Artwork and audio

**The repository currently does not include an asset pack.** Missing images use fallback graphics: a yellow bird, green obstacles, and a sky-colored background. Missing audio files are skipped, so the game remains silent until sounds are added. Missing-file messages in the console or local server log are expected in this configuration.

To add assets, create these paths in the project root:

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
| `flap.wav`, `score.wav`, `hit.wav` | Short sound effects for flapping, passing an obstacle pair, and collision. |

Image paths are defined in [`js/assets.js`](js/assets.js), and audio paths in [`js/audio.js`](js/audio.js). Both resolve paths relative to their modules. The ground strip is drawn directly in Canvas and does not need an image.

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
│   ├── input.js
│   ├── assets.js
│   ├── audio.js
│   └── config.js
├── docs/
│   └── flappy-bird-improvement-guide.md
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
| [`input.js`](js/input.js) | Map keyboard, pointer, and button events to game actions; pause on page visibility changes. |
| [`assets.js`](js/assets.js) | Load optional images and record missing-image fallbacks. |
| [`audio.js`](js/audio.js) | Load and decode optional sounds, play effects through Web Audio, and manage mute state. |
| [`config.js`](js/config.js) | Collect playfield dimensions and gameplay tuning constants. |

The animation loop updates gameplay only while playing and renders the current scene every frame. Physics uses logical world coordinates; the canvas backing bitmap changes with display size and pixel density. HTML supplies the score, status, and buttons above the Canvas scene.

## Tune the gameplay

Edit [`js/config.js`](js/config.js) to change the current defaults:

| Setting | Default | Meaning |
| --- | --- | --- |
| `WORLD_WIDTH` | `480` | Logical playfield width. |
| `WORLD_HEIGHT` | `720` | Logical playfield height. |
| `GRAVITY` | `1800` | Downward acceleration in logical units per second squared. |
| `FLAP_VELOCITY` | `-600` | Upward velocity applied by a flap, in logical units per second. |
| `OBSTACLE_SPEED` | `240` | Horizontal obstacle speed in logical units per second. |
| `SPAWN_INTERVAL` | `1.5` | Seconds between new obstacle pairs. |
| `OBSTACLE_WIDTH` | `80` | Logical width of each obstacle. |
| `GAP_SIZE` | `200` | Vertical opening between the upper and lower obstacles. |

A wider gap or slower obstacles generally makes the game easier. Change values in small increments and play several runs before adjusting them again. If you change the playfield proportions, update the canvas `aspect-ratio` in [`css/game.css`](css/game.css) to match.

## Development and deployment

Edit the HTML, CSS, or JavaScript files and refresh the browser to see changes. There is no generated bundle to rebuild. The project currently has no automated test suite; useful manual checks include:

- Start, flap, score, collide, reset, and start another run.
- Pause through the button and by switching browser tabs, then resume deliberately.
- Check keyboard focus, pointer input, and canvas sizing on the devices you intend to support.
- Reload after setting a record and confirm that the best score persists when storage is available.
- Run with and without optional images and sounds.

Deploy the project files to a static host that serves JavaScript modules correctly. Keep `index.html`, `css/`, and `js/` together, along with `assets/` if you add it. No server-side game logic is needed.

## Further improvements

The [improvement guide](docs/flappy-bird-improvement-guide.md) records the architecture recommendations from the earlier game-loop skeleton. Several of those recommendations are now implemented in the modules above.

Useful next steps include an original asset pack, better fitting on short landscape screens, clearer loading and failure feedback, and further tuning of collision bounds and scoring at the end of a run.

## License

This project includes the **GNU General Public License, version 3**. See [`LICENSE`](LICENSE) for the full text. Any third-party artwork or audio you add should retain its own required credits and license notices.
