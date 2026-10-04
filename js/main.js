import { WORLD_WIDTH, WORLD_HEIGHT, GROUND_Y, GROUND_HEIGHT, OBSTACLE_SPEED } from './config.js';
import { Game } from './game.js';
import { State, state } from './state.js';
import { bindInput } from './input.js';
import { loadImages, sprites } from './assets.js';
import { loadAudio, toggleMute, isMuted } from './audio.js';

let canvas;
let ctx;
let game;
const STEP = 1 / 120;
const MAX_ELAPSED = 0.1;
let lastTime = null;
let accumulator = 0;
let groundOffset = 0;
let manualTime = false;

function resetTiming(resetScene = false) {
  lastTime = null;
  accumulator = 0;
  if (resetScene) groundOffset = 0;
}

function resizeCanvas() {
  const shell = document.querySelector('.game-shell');
  const container = document.getElementById('game-container');
  const padding = getComputedStyle(document.body);
  const availableHeight = window.innerHeight - parseFloat(padding.paddingTop) - parseFloat(padding.paddingBottom)
    - shell.querySelector('header').getBoundingClientRect().height
    - shell.querySelector('footer').getBoundingClientRect().height;
  const maxWidth = Math.min(shell.clientWidth, WORLD_WIDTH);
  // Short landscape screens scroll; small portrait screens can fit more tightly.
  const minWidth = window.innerHeight <= 520 && window.innerWidth > window.innerHeight ? 240 : 180;
  const cssWidth = Math.min(maxWidth, Math.max(Math.min(minWidth, maxWidth), availableHeight * WORLD_WIDTH / WORLD_HEIGHT));
  container.style.setProperty('--playfield-width', `${cssWidth}px`);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(cssWidth * dpr));
  canvas.height = Math.max(1, Math.round(cssWidth * WORLD_HEIGHT / WORLD_WIDTH * dpr));
  ctx.setTransform(canvas.width / WORLD_WIDTH, 0, 0, canvas.height / WORLD_HEIGHT, 0, 0);
  ctx.imageSmoothingEnabled = false;
  render();
}

function simulate(elapsed) {
  if (state === State.READY) {
    game.player.animate(elapsed);
    accumulator = 0;
  } else if (state === State.PLAYING) {
    accumulator += elapsed;
    while (accumulator + 1e-10 >= STEP && state === State.PLAYING) {
      game.update(STEP);
      game.player.animate(STEP);
      groundOffset = (groundOffset + OBSTACLE_SPEED * STEP) % 40;
      accumulator = Math.max(0, accumulator - STEP);
    }
    if (state !== State.PLAYING) accumulator = 0;
  } else {
    accumulator = 0;
  }
}

function render() {
  if (sprites.background) {
    ctx.drawImage(sprites.background, 0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  } else {
    ctx.fillStyle = '#70c5ce';
    ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
  }

  // Ground is behind the bird, and its surface is also the collision floor.
  ctx.fillStyle = '#ded895';
  ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, GROUND_HEIGHT);
  ctx.fillStyle = '#73bf2e';
  ctx.fillRect(0, GROUND_Y, WORLD_WIDTH, 10);
  ctx.fillStyle = '#558c22';
  for (let i = 0; i < WORLD_WIDTH + 40; i += 40) {
    ctx.fillRect(i - groundOffset, GROUND_Y, 20, 10);
  }
  game.draw(ctx);
}

function frame(now) {
  if (lastTime === null) lastTime = now;
  const elapsed = Math.max(0, Math.min((now - lastTime) / 1000, MAX_ELAPSED));
  lastTime = now;
  if (!manualTime) simulate(elapsed);
  render();
  requestAnimationFrame(frame);
}

async function init() {
  const status = document.getElementById('status-area');
  const retry = document.getElementById('btn-retry');
  try {
    canvas = document.querySelector('canvas');
    if (!canvas) throw new Error('The game playfield is missing.');
    ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas 2D is unavailable in this browser.');
    const missingImages = await loadImages();
    game = new Game();
    bindInput(game, resetTiming, canvas);

    const resources = document.getElementById('resource-status');
    if (missingImages.length) {
      resources.hidden = false;
      resources.textContent = `Artwork unavailable (${missingImages.join(', ')}). Using built-in graphics.`;
    }

    const mute = document.getElementById('btn-mute');
    // Optional audio is independent of startup and cannot delay a playable game.
    loadAudio().then(result => {
      if (result.available) {
        mute.hidden = false;
        mute.addEventListener('click', () => {
          const muted = toggleMute();
          mute.textContent = muted ? 'Unmute' : 'Mute';
          mute.setAttribute('aria-pressed', String(muted));
        });
      }
      if (result.missing.length) {
        resources.hidden = false;
        resources.textContent += `${resources.textContent ? ' ' : ''}Some sounds are unavailable; play can continue.`;
      }
      resizeCanvas();
    }).catch(() => {
      resources.hidden = false;
      resources.textContent += `${resources.textContent ? ' ' : ''}Sound is unavailable; play can continue.`;
      resizeCanvas();
    });

    // Diagnostics use the same fixed-step simulation. Calling advanceTime switches
    // to manual stepping, avoiding competing real-time updates in browser checks.
    window.advanceTime = ms => {
      if (!Number.isFinite(ms) || ms < 0) return;
      manualTime = true;
      simulate(ms / 1000);
      render();
    };
    window.render_game_to_text = () => JSON.stringify({
      coordinates: 'Origin top-left; x increases right, y increases down; logical world units.',
      world: { width: WORLD_WIDTH, height: WORLD_HEIGHT, groundY: GROUND_Y },
      state,
      player: { x: game.player.x, y: game.player.y, velocity: game.player.velocity, bounds: game.player.getBounds(), animationTime: game.player.animTimer },
      obstacles: game.obstacles.pairs,
      spawnTimer: game.obstacles.spawnTimer,
      score: game.score,
      bestScore: game.bestScore,
      groundOffset,
      muted: isMuted
    });

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    requestAnimationFrame(frame);
  } catch (error) {
    if (status) status.textContent = `Unable to start: ${error.message}`;
    document.querySelectorAll('.controls button').forEach(button => { button.hidden = true; });
    if (retry) {
      retry.hidden = false;
      retry.addEventListener('click', () => window.location.reload(), { once: true });
    }
  }
}

init();
