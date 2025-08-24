import { defineChain } from 'viem'

// Monad Testnet configuration
export const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'MON',
    symbol: 'MON',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
    public: {
      http: ['https://testnet-rpc.monad.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://testnet.monadexplorer.com',
    },
  },
})

// Game constants
export const GAME_CONFIG = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 400,
  PLAYER_SPEED: 5,
  OBSTACLE_SPEED: 3,
  POWERUP_SPEED: 2,
  GRAVITY: 0.8,
  JUMP_FORCE: -15,
  FPS: 60,
}

// Player states
export const PLAYER_STATES = {
  RUNNING: 'running',
  JUMPING: 'jumping',
  FALLING: 'falling',
  DEAD: 'dead',
}

// Game objects
export const OBSTACLE_TYPES = {
  SPIKE: { width: 30, height: 40, damage: 1, sprite: 'spike' },
  WALL: { width: 20, height: 60, damage: 1, sprite: 'wall' },
  LASER: { width: 50, height: 10, damage: 2, sprite: 'laser' },
  DRONE: { width: 40, height: 30, damage: 1, sprite: 'drone' },
}

export const POWERUP_TYPES = {
  SPEED_BOOST: { 
    width: 25, 
    height: 25, 
    duration: 5000, 
    effect: 'speed', 
    sprite: 'speed_boost',
    color: '#00ff88',
  },
  SHIELD: { 
    width: 25, 
    height: 25, 
    duration: 10000, 
    effect: 'shield', 
    sprite: 'shield',
    color: '#0088ff',
  },
  DOUBLE_JUMP: { 
    width: 25, 
    height: 25, 
    duration: 15000, 
    effect: 'double_jump', 
    sprite: 'double_jump',
    color: '#ff8800',
  },
  SCORE_MULTIPLIER: { 
    width: 25, 
    height: 25, 
    duration: 8000, 
    effect: 'multiplier', 
    sprite: 'multiplier',
    color: '#ff0088',
  },
}

// Scoring system
export const SCORING = {
  BASE_SCORE_PER_SECOND: 10,
  OBSTACLE_DODGE: 25,
  POWERUP_COLLECT: 50,
  DISTANCE_MULTIPLIER: 1.5,
  SURVIVAL_BONUS: 100,
}

// Leaderboard
export const LEADERBOARD_SIZE = 50

// Contract addresses (will be updated after deployment)
export const CONTRACT_ADDRESSES = {
  NEON_RUNNER_GAME: '0x0000000000000000000000000000000000000000',
  POWERUP_NFT: '0x0000000000000000000000000000000000000000',
  LEADERBOARD: '0x0000000000000000000000000000000000000000',
}

// Game phases
export const GAME_PHASES = {
  PHASE_1: { minScore: 0, obstacleFreq: 0.02, powerupFreq: 0.008 },
  PHASE_2: { minScore: 500, obstacleFreq: 0.025, powerupFreq: 0.01 },
  PHASE_3: { minScore: 1500, obstacleFreq: 0.03, powerupFreq: 0.012 },
  PHASE_4: { minScore: 3000, obstacleFreq: 0.035, powerupFreq: 0.015 },
  PHASE_5: { minScore: 5000, obstacleFreq: 0.04, powerupFreq: 0.018 },
}

// Sprite configurations
export const SPRITES = {
  RUNNER: {
    width: 32,
    height: 48,
    frames: 6,
    animSpeed: 8,
    src: '/sprites/runner.png'
  },
  OBSTACLES: {
    width: 400,
    height: 200,
    src: '/sprites/obstacles.png'
  },
  POWERUPS: {
    width: 300,
    height: 100,
    src: '/sprites/powerups.png'
  },
  BACKGROUND: {
    width: 800,
    height: 400,
    src: '/sprites/background.png'
  }
}

// Colors
export const COLORS = {
  PRIMARY: '#00ff88',
  SECONDARY: '#0088ff',
  DANGER: '#ff4444',
  WARNING: '#ffaa00',
  SUCCESS: '#00ff88',
  BACKGROUND: '#1a1a2e',
  SURFACE: '#16213e',
  ACCENT: '#0f3460',
}