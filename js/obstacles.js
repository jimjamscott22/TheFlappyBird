import { WORLD_WIDTH, GROUND_Y, GAP_MARGIN, OBSTACLE_SPEED, SPAWN_INTERVAL, OBSTACLE_WIDTH, GAP_SIZE } from './config.js';

import { sprites } from './assets.js';

export class ObstacleManager {
  constructor() {
    this.reset();
  }

  reset() {
    this.pairs = [];
    this.spawnTimer = SPAWN_INTERVAL;
  }

  update(dt) {
    this.spawnTimer -= dt;
    while (this.spawnTimer <= 0) {
      this.spawn();
      this.spawnTimer += SPAWN_INTERVAL;
    }

    for (let i = 0; i < this.pairs.length; i++) {
      this.pairs[i].x -= OBSTACLE_SPEED * dt;
    }

    // Remove off-screen
    while (this.pairs.length > 0 && this.pairs[0].x + OBSTACLE_WIDTH < 0) {
      this.pairs.shift();
    }
  }

  spawn() {
    const minHeight = GAP_MARGIN;
    const maxGapY = GROUND_Y - GAP_MARGIN - GAP_SIZE;
    const gapY = Math.random() * (maxGapY - minHeight) + minHeight;

    this.pairs.push({
      x: WORLD_WIDTH,
      gapTop: gapY,
      gapBottom: gapY + GAP_SIZE,
      passed: false
    });
  }

  draw(ctx) {
    for (const pair of this.pairs) {
      if (sprites.obstacles) {
        // Just stretch it for now or draw pattern if we knew the layout
        ctx.drawImage(sprites.obstacles, pair.x, 0, OBSTACLE_WIDTH, pair.gapTop);
        ctx.drawImage(sprites.obstacles, pair.x, pair.gapBottom, OBSTACLE_WIDTH, GROUND_Y - pair.gapBottom);
      } else {
        ctx.fillStyle = "green";
        // Top pipe
        ctx.fillRect(pair.x, 0, OBSTACLE_WIDTH, pair.gapTop);
        // Bottom pipe
        ctx.fillRect(pair.x, pair.gapBottom, OBSTACLE_WIDTH, GROUND_Y - pair.gapBottom);
      }
    }
  }
}
