import { WORLD_WIDTH, WORLD_HEIGHT, OBSTACLE_SPEED } from './config.js';
import { Game } from './game.js';
import { State, state } from './state.js';
import { bindInput } from './input.js';
import { loadImages, sprites } from './assets.js';
import { loadAudio, toggleMute } from './audio.js';

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d', { alpha: false });

let game;
const STEP = 1 / 120;
const MAX_ELAPSED = 0.1;
let lastTime = null;
let accumulator = 0;
let groundOffset = 0;

function resetTiming() {
  lastTime = null;
  accumulator = 0;
}

function resizeCanvas() {
  const container = document.getElementById('game-container');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  
  // Use container width/height or fallback to CSS rules
  const cssWidth = container.clientWidth || WORLD_WIDTH;
  const cssHeight = container.clientHeight || (cssWidth * (WORLD_HEIGHT/WORLD_WIDTH));

  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);
  
  ctx.setTransform(canvas.width / WORLD_WIDTH, 0, 0, canvas.height / WORLD_HEIGHT, 0, 0);
  ctx.imageSmoothingEnabled = false;
}

function frame(now) {
  if (lastTime === null) lastTime = now;
  const elapsed = Math.min((now - lastTime) / 1000, MAX_ELAPSED);
  lastTime = now;

  if (state === State.PLAYING) {
    accumulator += elapsed;
    while (accumulator >= STEP && state === State.PLAYING) {
      game.update(STEP);
      accumulator -= STEP;
    }
    groundOffset = (groundOffset + OBSTACLE_SPEED * elapsed) % 40;
  } else {
    accumulator = 0;
  }

  // Clear canvas
  if (sprites.background) {
    ctx.drawImage(sprites.background, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  } else {
    ctx.fillStyle = '#70c5ce';
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  }
  
  game.draw(ctx);
  
  // Draw scrolling ground
  const groundY = WORLD_HEIGHT - 50;
  ctx.fillStyle = '#ded895';
  ctx.fillRect(0, groundY, WORLD_WIDTH, 50);
  
  ctx.fillStyle = '#73bf2e';
  ctx.fillRect(0, groundY, WORLD_WIDTH, 10);
  
  // Optional: add some moving stripes to the ground to show speed
  ctx.fillStyle = '#558c22';
  for (let i = 0; i < WORLD_WIDTH + 50; i += 40) {
    ctx.fillRect(i - groundOffset, groundY, 20, 10);
  }
  
  requestAnimationFrame(frame);
}

function init() {
  const statusEl = document.getElementById('status-area');
  
  Promise.all([loadImages(), loadAudio()]).then(() => {
    game = new Game();
    bindInput(game, resetTiming);
    
    // Bind mute button
    const muteBtn = document.getElementById('btn-mute');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        const isMuted = toggleMute();
        muteBtn.textContent = isMuted ? 'Unmute' : 'Mute';
      });
      muteBtn.style.display = 'inline-block';
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    requestAnimationFrame(frame);
  });
}

// Start
init();
