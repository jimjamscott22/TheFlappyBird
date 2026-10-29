export const WORLD_WIDTH = 480;
export const WORLD_HEIGHT = 720;
export const GROUND_HEIGHT = 50;
export const GROUND_Y = WORLD_HEIGHT - GROUND_HEIGHT;
export const PLAYER_BOUNDS_INSET = 3;
export const GAP_MARGIN = 50;

export const GRAVITY = 1800; // units per second squared
export const FLAP_VELOCITY = -600; // units per second
export const OBSTACLE_SPEED = 240; // units per second
export const SPAWN_INTERVAL = 1.5; // seconds

export const OBSTACLE_WIDTH = 80;
export const GAP_SIZE = 200;

// Plan neighboring gaps before they enter view, so creatures never pop in.
export const PIPE_SPAWN_PADDING = 220;
export const CREATURE_GAP_INTERVAL = 2;
export const CREATURE_ROUTE_CLEARANCE = 56;
export const CREATURE_PIPE_CLEARANCE = 64;
export const CREATURE_EDGE_MARGIN = 24;
export const CREATURE_BOB_AMPLITUDE = 10;
export const CREATURE_BOB_RATE = 2.8; // radians per second
export const CREATURE_TILT = 0.05; // radians, included in spawn clearance
export const CREATURE_BOUNDS_INSET = 0.2; // fraction of each drawn dimension
