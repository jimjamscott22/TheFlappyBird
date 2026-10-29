import test from 'node:test';
import assert from 'node:assert/strict';
import { CreatureManager, CREATURE_TYPES } from '../js/creatures.js';
import { Game } from '../js/game.js';
import { State, state, setState } from '../js/state.js';
import {
  WORLD_WIDTH, GROUND_Y, OBSTACLE_SPEED, OBSTACLE_WIDTH,
  CREATURE_PIPE_CLEARANCE, CREATURE_ROUTE_CLEARANCE, CREATURE_BOB_AMPLITUDE
} from '../js/config.js';

const previous = { x: 340, gapTop: 235, gapBottom: 435 };
const next = { x: 700, gapTop: 235, gapBottom: 435 };

function seededRandom(seed = 12345) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

function withRandom(callback) {
  const original = Math.random;
  Math.random = seededRandom();
  try { callback(); } finally { Math.random = original; }
}

function withGame(callback) {
  const documentBefore = globalThis.document;
  const storageBefore = globalThis.localStorage;
  globalThis.document = { getElementById: () => null };
  const saved = new Map();
  globalThis.localStorage = { getItem: key => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value) };
  try { callback(new Game()); } finally {
    if (documentBefore === undefined) delete globalThis.document;
    else globalThis.document = documentBefore;
    if (storageBefore === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = storageBefore;
    setState(State.READY);
  }
}

test('all three species rotate through spaced spawns that begin offscreen', () => withRandom(() => {
  const creatures = new CreatureManager();
  for (let i = 0; i < 6; i++) creatures.spawnBetween(previous, next);
  assert.equal(creatures.items.length, 3);
  assert.deepEqual(new Set(creatures.items.map(item => item.type)), new Set(CREATURE_TYPES.map(item => item.type)));
  for (const item of creatures.items) assert.ok(item.x - item.width / 2 > WORLD_WIDTH);
}));

test('a thousand randomized neighbors leave the full flight corridor and pipes clear', () => withRandom(() => {
  const creatures = new CreatureManager();
  let spawned = 0;
  for (let i = 0; i < 1000; i++) {
    const a = 50 + Math.random() * 370;
    const b = 50 + Math.random() * 370;
    creatures.items = [];
    creatures.gapsSeen = 0;
    const first = { ...previous, gapTop: a, gapBottom: a + 200 };
    const second = { ...next, gapTop: b, gapBottom: b + 200 };
    creatures.spawnBetween(first, second);
    for (const item of creatures.items) {
      spawned++;
      assert.ok(item.x - item.width / 2 - first.x - OBSTACLE_WIDTH >= CREATURE_PIPE_CLEARANCE);
      assert.ok(second.x - item.x - item.width / 2 >= CREATURE_PIPE_CLEARANCE);
      const highest = item.baseY - CREATURE_BOB_AMPLITUDE - item.height / 2;
      const lowest = item.baseY + CREATURE_BOB_AMPLITUDE + item.height / 2;
      assert.ok(highest > 0 && lowest < GROUND_Y);
      assert.ok(lowest <= Math.min(a, b) - CREATURE_ROUTE_CLEARANCE ||
        highest >= Math.max(a + 200, b + 200) + CREATURE_ROUTE_CLEARANCE);
    }
  }
  assert.ok(spawned > 200, 'safe spawns should remain common');
}));

test('extreme gap changes and narrow spaces skip a creature instead of blocking passage', () => {
  const creatures = new CreatureManager();
  creatures.spawnBetween({ ...previous, gapTop: 50, gapBottom: 250 }, { ...next, gapTop: 420, gapBottom: 620 });
  assert.equal(creatures.items.length, 0);
  creatures.reset();
  creatures.spawnBetween({ ...previous, x: 580 }, next);
  assert.equal(creatures.items.length, 0);
});

test('creatures preserve their pipe offset, bob gently, and clean up completely offscreen', () => withRandom(() => {
  const creatures = new CreatureManager();
  creatures.spawnBetween(previous, next);
  const item = creatures.items[0];
  const x = item.x;
  creatures.update(0.5);
  assert.equal(item.x, x - OBSTACLE_SPEED * 0.5);
  assert.ok(Math.abs(item.y - item.baseY) <= CREATURE_BOB_AMPLITUDE);
  const bounds = creatures.getBounds(item);
  assert.ok(bounds.left > item.x - item.width / 2);
  assert.ok(bounds.right < item.x + item.width / 2);
  item.x = -item.width / 2 - 1;
  creatures.update(0);
  assert.equal(creatures.items.length, 0);
}));

test('creature motion is identical across 30, 60, and 144 Hz updates', () => {
  const results = [];
  for (const hz of [30, 60, 144]) {
    withRandom(() => {
      const creatures = new CreatureManager();
      creatures.spawnBetween(previous, next);
      for (let i = 0; i < hz; i++) creatures.update(1 / hz);
      results.push(creatures.items[0]);
    });
  }
  for (const item of results) {
    assert.ok(Math.abs(item.x - results[0].x) < 1e-7);
    assert.ok(Math.abs(item.y - results[0].y) < 1e-7);
  }
});

test('each creature type ends play before a simultaneously passed pipe can score', () => {
  for (let type = 0; type < CREATURE_TYPES.length; type++) {
    withGame(game => {
      game.creatures.nextType = type;
      game.creatures.spawnBetween(previous, next);
      const creature = game.creatures.items[0];
      creature.x = game.player.x;
      creature.y = creature.baseY = game.player.y;
      creature.phase = 0;
      game.obstacles.pairs = [{ x: 50, gapTop: 235, gapBottom: 435, passed: false }];
      setState(State.PLAYING);
      game.update(1 / 120);
      assert.equal(state, State.GAME_OVER, CREATURE_TYPES[type].type);
      assert.equal(game.score, 0);
      assert.equal(game.obstacles.pairs[0].passed, false);
    });
  }
});

test('grazing a sprite edge is forgiven, but touching its inset body ends play', () => withGame(game => {
  game.creatures.spawnBetween(previous, next);
  const creature = game.creatures.items[0];
  creature.x = game.player.getBounds().right + creature.width * 0.3 + 1;
  creature.y = game.player.y;
  assert.ok(creature.x - creature.width / 2 < game.player.getBounds().right);
  setState(State.PLAYING);
  game.checkCollisions();
  assert.equal(state, State.PLAYING);
  creature.x -= 2;
  game.checkCollisions();
  assert.equal(state, State.GAME_OVER);
}));

test('passing a creature awards no points, while a passed pipe scores once', () => withGame(game => {
  game.creatures.spawnBetween(previous, next);
  game.creatures.items[0].x = 0;
  game.obstacles.pairs = [{ x: 50, gapTop: 235, gapBottom: 435, passed: false }];
  setState(State.PLAYING);
  game.update(1 / 120);
  game.update(1 / 120);
  assert.equal(state, State.PLAYING);
  assert.equal(game.score, 1);
}));

test('pause freezes creatures and reset clears their motion and spawn progression', () => withGame(game => {
  game.creatures.spawnBetween(previous, next);
  setState(State.PLAYING);
  game.pause();
  const paused = JSON.stringify(game.creatures);
  game.update(5);
  assert.equal(JSON.stringify(game.creatures), paused);
  game.primaryAction();
  game.update(1 / 120);
  assert.notEqual(JSON.stringify(game.creatures), paused);
  game.reset();
  assert.equal(state, State.READY);
  assert.equal(game.creatures.items.length, 0);
  assert.equal(game.creatures.gapsSeen, 0);
}));
