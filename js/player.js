import { WORLD_WIDTH, WORLD_HEIGHT, GRAVITY, FLAP_VELOCITY, PLAYER_BOUNDS_INSET } from './config.js';

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
  }

  animate(dt) {
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
      this.drawBird(ctx);
    }
    
    ctx.restore();
  }

  drawBird(ctx) {
    ctx.strokeStyle = '#684624';
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';

    // Tail, body, and beak stay within the same 40 by 30 drawing area.
    ctx.fillStyle = '#edaa32';
    ctx.beginPath();
    ctx.moveTo(-11, 2);
    ctx.lineTo(-20, -5);
    ctx.lineTo(-18, 7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffd44a';
    ctx.beginPath();
    ctx.ellipse(-1, 0, 15, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff0aa';
    ctx.beginPath();
    ctx.ellipse(3, 5, 9, 6, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f18336';
    ctx.beginPath();
    ctx.moveTo(12, -2);
    ctx.lineTo(20, 1);
    ctx.lineTo(12, 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(8, -5, 4.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#29251e';
    ctx.beginPath();
    ctx.arc(10, -5, 2, 0, Math.PI * 2);
    ctx.fill();

    // Three wing poses use elapsed animation time, separate from physics.
    const wingPose = [-0.65, 0.1, 0.65][Math.floor(this.animTimer * 10) % 3];
    ctx.save();
    ctx.translate(-6, 1);
    ctx.rotate(wingPose);
    ctx.fillStyle = '#e9a632';
    ctx.beginPath();
    ctx.ellipse(-3, 0, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  getBounds() {
    return {
      left: this.x - this.width / 2 + PLAYER_BOUNDS_INSET,
      right: this.x + this.width / 2 - PLAYER_BOUNDS_INSET,
      top: this.y - this.height / 2 + PLAYER_BOUNDS_INSET,
      bottom: this.y + this.height / 2 - PLAYER_BOUNDS_INSET
    };
  }
}
