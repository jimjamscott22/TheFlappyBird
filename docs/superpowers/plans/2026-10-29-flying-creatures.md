# Flying Creatures Implementation Plan

> Execution: implement sequentially in the current session, per the user's instructions. No subagents or tests-first workflow. This records the in-chat plan the user has approved.

**Goal:** Add readable flying bats, winged cats, and ghosts alongside pipes without blocking the safe route.

**Architecture:** A small CreatureManager owns creatures and their drawing. Obstacles expose their spawn progression; Game coordinates spawning, fixed-step updates, collisions, reset, and rendering. Generated PNGs use the existing image loader.

**Tech Stack:** Native JavaScript modules, Canvas 2D, built-in imagegen, Playwright verification.

**Spec:** ../specs/2026-10-29-flying-creatures-design.md

## Constraints and review focus

- Keep the 480 by 720 world, 670 ground surface, player controls, pipe speed and one-point-per-pair scoring.
- Creatures stay horizontally between pipe pairs, with gentle bounded vertical bobbing and ample clearance around the corridor joining neighboring pipe gaps.
- Collision bounds ignore transparent sprite padding and inset the visible character. A fatal hit cannot award a score.
- Pause freezes all creature state; reset empties them and resets spawning/animation. Remove creatures after they leave the screen.
- A missing creature image must not create an invisible hazard or stop play.

## Steps

- [x] Capture and inspect the baseline, generate each transparent sprite sequentially, inspect the images, and copy the originals into assets/sprites/creatures/.
- [x] Add creature tuning constants and js/creatures.js (reset, update, spawnBetween, getBounds, draw). Spawn infrequently between completed neighboring pipe pairs; cycle types with a randomized starting type so all three appear.
- [x] Integrate CreatureManager with Game, collisions before scoring, image loading, text diagnostics, and the visible instructions. Preserve existing input and scoring.
- [x] Run the develop-web-game client, inspect gameplay captures, and perform focused post-implementation checks for spawn safety/clearance, cleanup, collisions, pause/reset, image fallbacks, time-step consistency, and mobile layouts.
- [x] Update README, image prompt provenance, and progress.md; inspect the final diff and report verification limits. Leave changes uncommitted.
