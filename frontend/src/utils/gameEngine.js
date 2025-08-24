import { 
  GAME_CONFIG, 
  PLAYER_STATES, 
  OBSTACLE_TYPES, 
  POWERUP_TYPES, 
  SCORING, 
  GAME_PHASES 
} from './constants'
import { AnimatedSprite, ParticleSystem, BackgroundManager } from './sprites'

export class GameEngine {
  constructor(canvas, spriteManager) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.spriteManager = spriteManager
    
    // Game state
    this.gameState = 'menu' // menu, playing, paused, gameOver
    this.score = 0
    this.distance = 0
    this.gameSpeed = 1
    this.frameCount = 0
    
    // Player
    this.player = {
      x: 100,
      y: GAME_CONFIG.CANVAS_HEIGHT - 100,
      width: 32,
      height: 48,
      velocityY: 0,
      onGround: true,
      state: PLAYER_STATES.RUNNING,
      sprite: new AnimatedSprite('RUNNER', 6, 8),
      jumpCount: 0,
      maxJumps: 1,
      health: 3,
      maxHealth: 3,
    }
    
    // Game objects
    this.obstacles = []
    this.powerups = []
    this.activePowerups = []
    
    // Systems
    this.particleSystem = new ParticleSystem()
    this.backgroundManager = new BackgroundManager(GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT)
    
    // Input handling
    this.keys = {}
    this.setupEventListeners()
    
    // Game timing
    this.lastFrameTime = 0
    this.deltaTime = 0
    
    // Powerup effects
    this.speedMultiplier = 1
    this.scoreMultiplier = 1
    this.hasShield = false
    this.hasDoubleJump = false
    
    // Callbacks
    this.onScoreUpdate = null
    this.onGameOver = null
    this.onPowerupCollect = null
  }

  setupEventListeners() {
    // Keyboard events
    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault()
        this.jump()
      }
      if (e.code === 'KeyP') {
        this.togglePause()
      }
    })

    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false
    })

    // Touch/click events for mobile
    this.canvas.addEventListener('click', (e) => {
      if (this.gameState === 'playing') {
        this.jump()
      }
    })

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault()
      if (this.gameState === 'playing') {
        this.jump()
      }
    })
  }

  start() {
    this.gameState = 'playing'
    this.reset()
    this.gameLoop()
  }

  reset() {
    // Reset game state
    this.score = 0
    this.distance = 0
    this.gameSpeed = 1
    this.frameCount = 0
    
    // Reset player
    this.player.x = 100
    this.player.y = GAME_CONFIG.CANVAS_HEIGHT - 100
    this.player.velocityY = 0
    this.player.onGround = true
    this.player.state = PLAYER_STATES.RUNNING
    this.player.jumpCount = 0
    this.player.health = 3
    
    // Clear game objects
    this.obstacles = []
    this.powerups = []
    this.activePowerups = []
    
    // Reset effects
    this.speedMultiplier = 1
    this.scoreMultiplier = 1
    this.hasShield = false
    this.hasDoubleJump = false
    
    // Clear particles
    this.particleSystem.clear()
  }

  gameLoop(currentTime = 0) {
    if (this.gameState !== 'playing') return

    this.deltaTime = currentTime - this.lastFrameTime
    this.lastFrameTime = currentTime

    this.update()
    this.draw()

    requestAnimationFrame((time) => this.gameLoop(time))
  }

  update() {
    this.frameCount++
    
    // Update game speed based on score
    this.gameSpeed = 1 + (this.score / 1000) * 0.5
    
    // Update distance
    this.distance += this.gameSpeed
    
    // Update score
    this.score += SCORING.BASE_SCORE_PER_SECOND * this.scoreMultiplier * (this.gameSpeed / 60)
    
    // Update player
    this.updatePlayer()
    
    // Update game objects
    this.updateObstacles()
    this.updatePowerups()
    this.updateActivePowerups()
    
    // Spawn new objects
    this.spawnObstacles()
    this.spawnPowerups()
    
    // Update systems
    this.particleSystem.update()
    this.backgroundManager.update(this.gameSpeed)
    
    // Check collisions
    this.checkCollisions()
    
    // Update UI
    if (this.onScoreUpdate) {
      this.onScoreUpdate({
        score: Math.floor(this.score),
        distance: Math.floor(this.distance),
        health: this.player.health,
        speed: this.gameSpeed.toFixed(1)
      })
    }
  }

  updatePlayer() {
    // Update sprite animation
    this.player.sprite.update()
    
    // Apply gravity
    if (!this.player.onGround) {
      this.player.velocityY += GAME_CONFIG.GRAVITY
    }
    
    // Update position
    this.player.y += this.player.velocityY
    
    // Ground collision
    const groundY = GAME_CONFIG.CANVAS_HEIGHT - 100
    if (this.player.y >= groundY) {
      this.player.y = groundY
      this.player.velocityY = 0
      this.player.onGround = true
      this.player.jumpCount = 0
      this.player.state = PLAYER_STATES.RUNNING
    } else {
      this.player.onGround = false
      this.player.state = this.player.velocityY < 0 ? PLAYER_STATES.JUMPING : PLAYER_STATES.FALLING
    }
    
    // Update max jumps based on powerups
    this.player.maxJumps = this.hasDoubleJump ? 2 : 1
  }

  jump() {
    if (this.gameState !== 'playing') return
    
    if (this.player.jumpCount < this.player.maxJumps) {
      this.player.velocityY = GAME_CONFIG.JUMP_FORCE
      this.player.jumpCount++
      this.player.onGround = false
      this.particleSystem.addParticle(this.player.x, this.player.y + this.player.height, 'jump')
    }
  }

  updateObstacles() {
    this.obstacles = this.obstacles.filter(obstacle => {
      obstacle.x -= GAME_CONFIG.OBSTACLE_SPEED * this.gameSpeed * this.speedMultiplier
      
      // Remove off-screen obstacles and award points
      if (obstacle.x + obstacle.width < 0) {
        this.score += SCORING.OBSTACLE_DODGE * this.scoreMultiplier
        return false
      }
      
      return true
    })
  }

  updatePowerups() {
    this.powerups = this.powerups.filter(powerup => {
      powerup.x -= GAME_CONFIG.POWERUP_SPEED * this.gameSpeed
      
      // Floating animation
      powerup.floatOffset += 0.1
      powerup.y += Math.sin(powerup.floatOffset) * 0.5
      
      return powerup.x + powerup.width > 0
    })
  }

  updateActivePowerups() {
    this.activePowerups = this.activePowerups.filter(powerup => {
      powerup.timeLeft -= 1000 / 60 // Assuming 60 FPS
      
      if (powerup.timeLeft <= 0) {
        this.removePowerupEffect(powerup.type)
        return false
      }
      
      return true
    })
  }

  spawnObstacles() {
    const phase = this.getCurrentPhase()
    
    if (Math.random() < phase.obstacleFreq) {
      const obstacleTypes = Object.keys(OBSTACLE_TYPES)
      const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)]
      const config = OBSTACLE_TYPES[type]
      
      const obstacle = {
        x: GAME_CONFIG.CANVAS_WIDTH,
        y: GAME_CONFIG.CANVAS_HEIGHT - 100 - config.height,
        width: config.width,
        height: config.height,
        type,
        damage: config.damage,
        sprite: config.sprite
      }
      
      this.obstacles.push(obstacle)
    }
  }

  spawnPowerups() {
    const phase = this.getCurrentPhase()
    
    if (Math.random() < phase.powerupFreq) {
      const powerupTypes = Object.keys(POWERUP_TYPES)
      const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)]
      const config = POWERUP_TYPES[type]
      
      const powerup = {
        x: GAME_CONFIG.CANVAS_WIDTH,
        y: GAME_CONFIG.CANVAS_HEIGHT - 150 - Math.random() * 100,
        width: config.width,
        height: config.height,
        type,
        config,
        floatOffset: Math.random() * Math.PI * 2
      }
      
      this.powerups.push(powerup)
    }
  }

  getCurrentPhase() {
    const phases = Object.values(GAME_PHASES)
    for (let i = phases.length - 1; i >= 0; i--) {
      if (this.score >= phases[i].minScore) {
        return phases[i]
      }
    }
    return phases[0]
  }

  checkCollisions() {
    const playerRect = {
      x: this.player.x,
      y: this.player.y,
      width: this.player.width,
      height: this.player.height
    }
    
    // Check obstacle collisions
    this.obstacles.forEach((obstacle, index) => {
      if (this.isColliding(playerRect, obstacle)) {
        this.handleObstacleCollision(obstacle, index)
      }
    })
    
    // Check powerup collisions
    this.powerups.forEach((powerup, index) => {
      if (this.isColliding(playerRect, powerup)) {
        this.handlePowerupCollision(powerup, index)
      }
    })
  }

  isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y
  }

  handleObstacleCollision(obstacle, index) {
    if (this.hasShield) {
      // Shield blocks damage
      this.hasShield = false
      this.removePowerupEffect('shield')
    } else {
      this.player.health -= obstacle.damage
      if (this.player.health <= 0) {
        this.gameOver()
        return
      }
    }
    
    // Remove obstacle and create explosion effect
    this.obstacles.splice(index, 1)
    this.particleSystem.addParticle(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, 'explosion')
  }

  handlePowerupCollision(powerup, index) {
    // Remove powerup and create collection effect
    this.powerups.splice(index, 1)
    this.particleSystem.addParticle(powerup.x + powerup.width / 2, powerup.y + powerup.height / 2, 'collect')
    
    // Apply powerup effect
    this.applyPowerupEffect(powerup.type, powerup.config)
    
    // Award points
    this.score += SCORING.POWERUP_COLLECT * this.scoreMultiplier
    
    if (this.onPowerupCollect) {
      this.onPowerupCollect(powerup.type)
    }
  }

  applyPowerupEffect(type, config) {
    // Remove existing powerup of same type
    this.activePowerups = this.activePowerups.filter(p => p.type !== type)
    
    // Add new powerup
    this.activePowerups.push({
      type,
      timeLeft: config.duration,
      config
    })
    
    switch (config.effect) {
      case 'speed':
        this.speedMultiplier = 1.5
        break
      case 'shield':
        this.hasShield = true
        break
      case 'double_jump':
        this.hasDoubleJump = true
        break
      case 'multiplier':
        this.scoreMultiplier = 2
        break
    }
  }

  removePowerupEffect(type) {
    const config = POWERUP_TYPES[type]
    
    switch (config.effect) {
      case 'speed':
        this.speedMultiplier = 1
        break
      case 'shield':
        this.hasShield = false
        break
      case 'double_jump':
        this.hasDoubleJump = false
        break
      case 'multiplier':
        this.scoreMultiplier = 1
        break
    }
  }

  draw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT)
    
    // Draw background
    this.backgroundManager.draw(this.ctx, this.spriteManager)
    
    // Draw game objects
    this.drawObstacles()
    this.drawPowerups()
    this.drawPlayer()
    
    // Draw effects
    this.particleSystem.draw(this.ctx)
    
    // Draw UI overlay
    this.drawHUD()
  }

  drawPlayer() {
    this.ctx.save()
    
    // Shield effect
    if (this.hasShield) {
      this.ctx.shadowColor = '#0088ff'
      this.ctx.shadowBlur = 20
      this.ctx.strokeStyle = '#0088ff'
      this.ctx.lineWidth = 3
      this.ctx.strokeRect(this.player.x - 5, this.player.y - 5, this.player.width + 10, this.player.height + 10)
    }
    
    // Speed effect
    if (this.speedMultiplier > 1) {
      this.ctx.shadowColor = '#00ff88'
      this.ctx.shadowBlur = 15
    }
    
    // Draw player sprite
    this.player.sprite.draw(
      this.ctx,
      this.player.x,
      this.player.y,
      this.player.width,
      this.player.height,
      this.spriteManager
    )
    
    this.ctx.restore()
  }

  drawObstacles() {
    this.obstacles.forEach(obstacle => {
      this.ctx.save()
      
      // Draw obstacle with neon glow
      this.ctx.shadowColor = '#ff4444'
      this.ctx.shadowBlur = 10
      this.ctx.fillStyle = '#ff4444'
      this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height)
      
      // Draw obstacle border
      this.ctx.strokeStyle = '#ff8888'
      this.ctx.lineWidth = 2
      this.ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height)
      
      this.ctx.restore()
    })
  }

  drawPowerups() {
    this.powerups.forEach(powerup => {
      this.ctx.save()
      
      // Pulsing glow effect
      const pulse = Math.sin(this.frameCount * 0.1) * 0.5 + 0.5
      this.ctx.shadowColor = powerup.config.color
      this.ctx.shadowBlur = 15 + pulse * 10
      
      this.ctx.fillStyle = powerup.config.color
      this.ctx.fillRect(powerup.x, powerup.y, powerup.width, powerup.height)
      
      // Draw inner highlight
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      this.ctx.fillRect(powerup.x + 2, powerup.y + 2, powerup.width - 4, powerup.height - 4)
      
      this.ctx.restore()
    })
  }

  drawHUD() {
    // Health bar
    const healthBarWidth = 200
    const healthBarHeight = 20
    const healthBarX = 20
    const healthBarY = 20
    
    this.ctx.save()
    
    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    this.ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight)
    
    // Health fill
    const healthPercent = this.player.health / this.player.maxHealth
    this.ctx.fillStyle = healthPercent > 0.5 ? '#00ff88' : healthPercent > 0.25 ? '#ffaa00' : '#ff4444'
    this.ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercent, healthBarHeight)
    
    // Border
    this.ctx.strokeStyle = '#ffffff'
    this.ctx.lineWidth = 2
    this.ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight)
    
    // Active powerups
    let powerupY = 50
    this.activePowerups.forEach(powerup => {
      const timePercent = powerup.timeLeft / powerup.config.duration
      
      this.ctx.fillStyle = powerup.config.color
      this.ctx.fillRect(20, powerupY, 150 * timePercent, 15)
      
      this.ctx.fillStyle = '#ffffff'
      this.ctx.font = '12px Orbitron'
      this.ctx.fillText(powerup.type.replace('_', ' '), 25, powerupY + 12)
      
      powerupY += 25
    })
    
    this.ctx.restore()
  }

  togglePause() {
    if (this.gameState === 'playing') {
      this.gameState = 'paused'
    } else if (this.gameState === 'paused') {
      this.gameState = 'playing'
      this.gameLoop()
    }
  }

  gameOver() {
    this.gameState = 'gameOver'
    
    if (this.onGameOver) {
      this.onGameOver({
        score: Math.floor(this.score),
        distance: Math.floor(this.distance),
        powerupsCollected: this.activePowerups.length
      })
    }
  }

  getGameStats() {
    return {
      score: Math.floor(this.score),
      distance: Math.floor(this.distance),
      gameSpeed: this.gameSpeed,
      health: this.player.health,
      activePowerups: this.activePowerups.length
    }
  }
}