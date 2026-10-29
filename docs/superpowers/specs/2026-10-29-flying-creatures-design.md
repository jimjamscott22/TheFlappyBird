# Flying creatures — approved design

The user requested flying obstacles such as bats, cats, and other creatures, explicitly invoking imagegen. On October 29, 2026 they approved adding bats, winged cats, and ghosts alongside the existing pipes.

- Generate three original transparent PNG sprites with the built-in imagegen tool. Match the bird's readable cartoon style; preserve transparency and save all three assets in this repository.
- Spawn a small number of creatures between pipe pairs. Keep a clear route and gentle motion; do not place hazards inside pipe gaps or chase the player.
- Contact with a creature ends the run, with forgiving, stable bounds. Existing pipe scoring remains unchanged; creatures award no points.
- Creature movement, collision, drawing, cleanup, pause, and restart integrate with the existing fixed-step game loop and logical playfield.
- Inspect actual gameplay screenshots and verify spacing, collisions, pause/replay, missing-image behavior, and responsive rendering.

## Approach

Considered adding creatures alongside pipes or replacing the pipe challenge with a creatures-only mode. The user selected the first approach. Keep the native ES module / Canvas architecture; use one small creature manager, with game state and scoring owned by Game.

Implementation choices are delegated to Codex: sprite colors, exact gentle bobbing parameters, conservative spawn frequency, and collision insets. Do not introduce a build tool, new runtime dependency, unrelated redesign, or new scoring system. Work sequentially, implement before checking, and do not commit or push without a fresh request.
