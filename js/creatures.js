import {
  GROUND_Y, OBSTACLE_SPEED, OBSTACLE_WIDTH,
  CREATURE_GAP_INTERVAL, CREATURE_ROUTE_CLEARANCE, CREATURE_PIPE_CLEARANCE,
  CREATURE_EDGE_MARGIN, CREATURE_BOB_AMPLITUDE, CREATURE_BOB_RATE, CREATURE_TILT,
  CREATURE_BOUNDS_INSET
} from './config.js';
import { sprites } from './assets.js';

// Source rectangles exclude transparent margins in the original PNGs.
export const CREATURE_TYPES = Object.freeze([
  { type: 'bat', width: 72, source: [35, 145, 1467, 697], color: '#9561c4' },
  { type: 'wingedCat', width: 68, source: [55, 76, 1443, 839], color: '#f5ac48' },
  { type: 'ghost', width: 56, source: [166, 218, 1067, 707], color: '#fff6ec' }
]);

export class CreatureManager {
  constructor() {
    this.reset();
  }

  reset() {
    this.items = [];
    this.gapsSeen = 0;
    this.nextType = Math.floor(Math.random() * CREATURE_TYPES.length);
  }

  spawnBetween(previous, next) {
    if (!previous) return;
    const gapNumber = this.gapsSeen++;
    if (gapNumber % CREATURE_GAP_INTERVAL !== 0) return;

    const definition = CREATURE_TYPES[this.nextType];
    const width = definition.width;
    const height = width * definition.source[3] / definition.source[2];
    const freeLeft = previous.x + OBSTACLE_WIDTH;
    const freeRight = next.x;
    if (freeRight - freeLeft < width + CREATURE_PIPE_CLEARANCE * 2) return;

    // Keep the entire corridor connecting both pipe openings clear, including
    // bobbing and the bird's approach space. Extreme gap changes skip a spawn.
    const routeTop = Math.min(previous.gapTop, next.gapTop);
    const routeBottom = Math.max(previous.gapBottom, next.gapBottom);
    const reach = height / 2 + width / 2 * CREATURE_TILT + CREATURE_BOB_AMPLITUDE;
    const minY = CREATURE_EDGE_MARGIN + reach;
    const maxY = GROUND_Y - CREATURE_EDGE_MARGIN - reach;
    const lanes = [];
    const upperMax = routeTop - CREATURE_ROUTE_CLEARANCE - reach;
    const lowerMin = routeBottom + CREATURE_ROUTE_CLEARANCE + reach;
    if (upperMax >= minY) lanes.push([minY, upperMax]);
    if (lowerMin <= maxY) lanes.push([lowerMin, maxY]);
    if (!lanes.length) return;

    const lane = lanes[Math.floor(Math.random() * lanes.length)];
    const baseY = lane[0] + (lane[1] - lane[0]) * (0.25 + Math.random() * 0.5);
    const phase = Math.random() * Math.PI * 2;
    this.items.push({
      type: definition.type,
      x: (freeLeft + freeRight) / 2,
      y: baseY + Math.sin(phase) * CREATURE_BOB_AMPLITUDE,
      baseY, width, height, phase, age: 0
    });
    this.nextType = (this.nextType + 1) % CREATURE_TYPES.length;
  }

  update(dt) {
    for (const creature of this.items) {
      creature.x -= OBSTACLE_SPEED * dt;
      creature.age += dt;
      creature.y = creature.baseY + Math.sin(creature.phase + creature.age * CREATURE_BOB_RATE) * CREATURE_BOB_AMPLITUDE;
    }
    this.items = this.items.filter(creature => creature.x + creature.width / 2 >= 0);
  }

  getBounds(creature) {
    const halfWidth = creature.width * (0.5 - CREATURE_BOUNDS_INSET);
    const halfHeight = creature.height * (0.5 - CREATURE_BOUNDS_INSET);
    return {
      left: creature.x - halfWidth, right: creature.x + halfWidth,
      top: creature.y - halfHeight, bottom: creature.y + halfHeight
    };
  }

  draw(ctx) {
    for (const creature of this.items) {
      const definition = CREATURE_TYPES.find(item => item.type === creature.type);
      ctx.save();
      ctx.translate(creature.x, creature.y);
      ctx.rotate(Math.sin(creature.phase + creature.age * CREATURE_BOB_RATE) * CREATURE_TILT);
      const image = sprites[creature.type];
      if (image) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        const source = (image.width === 1536 && image.height === 1024) ||
          (creature.type === 'ghost' && image.width === 1374 && image.height === 1145)
          ? definition.source : [0, 0, image.width, image.height];
        ctx.drawImage(image, ...source, -creature.width / 2, -creature.height / 2, creature.width, creature.height);
      } else {
        this.drawFallback(ctx, creature, definition.color);
      }
      ctx.restore();
    }
  }

  drawFallback(ctx, creature, color) {
    // Missing PNGs still produce a visible creature with the same bounds.
    const w = creature.width;
    const h = creature.height;
    ctx.fillStyle = color;
    ctx.strokeStyle = '#50354b';
    ctx.lineWidth = 2;
    if (creature.type !== 'ghost') {
      ctx.beginPath();
      ctx.moveTo(-w * 0.1, 0);
      ctx.lineTo(-w * 0.47, -h * 0.4);
      ctx.lineTo(-w * 0.36, h * 0.25);
      ctx.lineTo(0, h * 0.1);
      ctx.lineTo(w * 0.46, -h * 0.4);
      ctx.lineTo(w * 0.35, h * 0.3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.29, h * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (creature.type !== 'ghost') {
      for (const x of [-w * 0.2, w * 0.08]) {
        ctx.beginPath();
        ctx.moveTo(x - 5, -h * 0.25);
        ctx.lineTo(x, -h * 0.49);
        ctx.lineTo(x + 5, -h * 0.25);
        ctx.fill();
        ctx.stroke();
      }
    }
    for (const x of [-w * 0.13, w * 0.06]) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(x, -2, 4, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#50354b';
      ctx.beginPath();
      ctx.arc(x - 1, -2, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
