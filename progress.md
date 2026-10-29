Original prompt: Can you work on the next round of improvement refactors laid out in docs/flappy-bird-improvement-guide.md? Also, make the flying object into a bird or something like a bird.

## Approved scope — October 3, 2026

- Draw an animated Canvas bird that needs no image pack.
- Fix scoring after collision, visible-ground bounds, and complete timing/reset behavior.
- Fit desktop and portrait screens; keep short landscape screens scrollable. Add instructions and visible focus; correct Start/Resume labels.
- Validate startup, handle optional asset/audio failures, and validate stored records.
- Verify gameplay and screenshots, then update README.

## Baseline

- Clean working tree before work. Existing native ES modules already cover the earlier guide stages.
- Inspected output/before.png: yellow rectangular player and an unnecessarily narrow 300 by 450 desktop canvas.
- Found post-collision scoring, world-bottom floor collision, malformed best-score parsing, unconditional requests for absent assets, and eager AudioContext creation.
- Browser verification uses installed Chrome through bundled Playwright because Playwright's default browser revision is absent.
- Work is sequential; no agents, tests-first workflow, or commits requested.

## Implementation

- Added a Canvas bird with three wing poses and inset collision bounds.
- Shared ground surface and gap margins between obstacle spawning, rendering, and collisions. Fatal collisions now stop scoring.
- Game owns primary/pause transitions; input resets loop timing for each transition and resets scenery on restart.
- HTML instructions, status, controls, and best score are outside the playfield; keyboard focus is visible. Sizing accounts for their space and device density.
- Optional image/audio manifests default to null, avoiding absent-file requests. Image failures fall back visibly; audio is independent of gameplay startup, and resume/play failures are caught.
- Added state and deterministic stepping diagnostics, with one animation loop.
- Ran the develop-web-game client with local runtime/browser path adaptations. Inspected its gameplay screenshot: a recognizable bird; no browser errors reported.

## Verification

- Inspected before/after screenshots, live-play capture with pipes and score, 320 by 568 portrait, and 844 by 390 landscape.
- Sequential Chrome browser checks passed: five replay cycles with one RAF loop, keyboard-repeat suppression, touch input, pause/resume, visibility pause fixture, complete reset, floor/ceiling/pipe collisions, score-once and no post-fatal score, safe gaps, and cleanup.
- Real-input deterministic run passed five obstacle pairs and persisted its record. Malformed records were rejected; denied storage preserved a session record.
- Simulated 30, 60, and 144 Hz updates produced identical position, velocity, spawn timer, and ground offset after half a second.
- Emulated portrait layouts fit without overflow; landscape scrolls intentionally. Resize/orientation preserved logical player coordinates, including at device pixel ratio 2.
- Missing artwork visibly fell back to the Canvas bird; rejected audio resume was caught; sound mute state toggled; unavailable Web Audio did not stop play; Retry recovered after a failed Canvas context.
- Default game checks reported no browser console errors or uncaught exceptions. Deliberate missing-file verification naturally produces its expected resource error.
- Updated README for optional manifest configuration, diagnostics, controls, and the verification limits.

## Remaining optional work

- Richer scenery, original sound effects, and difficulty playtesting on physical devices. This round keeps gravity, flap strength, obstacle speed, spawn interval, and gap size unchanged.
- User requested a local commit after verification. No push requested. Temporary browser scripts and screenshots are in ignored output/.

## Flying creatures — October 29, 2026

- User requested bats, cats, and other flying obstacles using imagegen, and approved bats, winged cats, and ghosts alongside pipes.
- Approved scope: generated transparent sprites, fair spacing/gentle movement, forgiving collision, existing pipe scoring, pause/reset/cleanup, actual screenshots and gameplay checks.
- Worktree was clean at the start of this round. Planning notes are in docs/superpowers/; implementation and checks will run sequentially without agents or tests-first work.
- Captured and inspected output/creatures/before.png before changes. The existing game renders correctly and currently has pipe pairs only.

### Implemented

- Generated bat.png, winged-cat.png, and ghost.png using the built-in imagegen tool, one call per asset. Copied all original RGBA PNGs into assets/sprites/creatures/; verified transparent pixels and recorded full prompts/source rectangles in that folder's README.
- Added CreatureManager with conservative spawning in alternate spaces between pipe pairs, a rotating species order, gentle bobbing/tilt, visible missing-image fallbacks, stable inset bounds, and offscreen cleanup.
- Pipe spawning now starts 220 logical units beyond the viewport so both neighboring gaps are known before a creature enters view. Speed, spacing, gravity, flap strength, gap size, and pipe scoring remain unchanged.
- Creature lanes leave the complete corridor between adjacent openings clear, including bobbing/tilt and approach clearance. Unsafe placements are skipped.
- Game coordinates creature updates, collisions before scoring, reset, and rendering. Pause naturally freezes the creature manager. Text diagnostics include creature positions and bounds.
- Kept optional artwork/audio behavior and updated the instructions and README. Enabled image smoothing only for the generated creature sprites after screenshot inspection caught jagged downscaling.

### Verification

- Node checks in tests/creatures.test.mjs cover all species, 1,000 randomized gap pairs, unsafe-spawn rejection, motion/cleanup, forgiving bounds, 30/60/144 Hz consistency, collision-before-score, pipe-only scoring, pause, and reset.
- Ran the develop-web-game client after implementation and after smoothing; inspected its screenshots and text state, with no error log produced.
- Sequential Chrome verification showed all three creatures in actual gameplay, an eight-point surviving run, a later nine-point record retained on reload, three replay cycles, and one animation loop.
- Pause froze the exact creature coordinates; resume preserved player velocity. Touch and orientation checks preserved logical coordinates on 390x844, 320x568, and 844x390 emulated screens. Portrait fit without overflow; landscape scrolls intentionally.
- Deliberately missing all three PNGs produced a visible creature fallback and status message while play continued. Only the three expected missing-resource errors were logged for that scenario; normal runs had no console errors or uncaught exceptions.
- Inspected final screenshots for the bat, winged cat, ghost, small phone layout, and fallback creature. Captures and browser harness are in ignored output/creatures/.
- Tests were written after implementation. No agents used. The user requested committing this round to main after verification; no push requested. Physical-device testing and subjective difficulty playtesting remain unperformed.
