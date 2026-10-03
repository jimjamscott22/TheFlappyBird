import { WORLD_WIDTH, WORLD_HEIGHT, GRAVITY, FLAP_VELOCITY } from './config.js';

import { sprites } from './assets.js';
import { playSound } from './audio.js';

export class Player {
  constructor() {
    this.width = 40;
    this.height = 30;
    this.reset();
  }

  reset() {
    this.x = WORLD_WIDTH / 3;
    this.y = WORLD_HEIGHT / 2;
    this.velocity = 0;
    this.animTimer = 0;
  }

  flap() {
    this.velocity = FLAP_VELOCITY;
    playSound('flap');
  }

  update(dt) {
    this.velocity += GRAVITY * dt;
    this.y += this.velocity * dt;
    this.animTimer += dt;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    
    // Tilt based on velocity
    const tilt = Math.max(-0.5, Math.min(this.velocity / 800, Math.PI / 4));
    ctx.rotate(tilt);

    if (sprites.bird) {
      // Assuming a sprite sheet with 3 frames side-by-side
      const frames = 3;
      const frameWidth = sprites.bird.width / frames;
      const frameHeight = sprites.bird.height;
      
      const frameIndex = Math.floor(this.animTimer * 10) % frames;
      
      ctx.drawImage(
        sprites.bird, 
        frameIndex * frameWidth, 0, frameWidth, frameHeight,
        -this.width/2, -this.height/2, this.width, this.height
      );
    } else {
      ctx.fillStyle = "yellow";
      ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
    }
    
    ctx.restore();
  }

  getBounds() {
    return {
      left: this.x - this.width / 2,
      right: this.x + this.width / 2,
      top: this.y - this.height / 2,
      bottom: this.y + this.height / 2
    };
  }
}
