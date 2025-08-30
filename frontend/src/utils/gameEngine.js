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
    
    
    this.gameState = 'menu' 
    this.score = 0
    this.distance = 0
    this.gameSpeed = 1
    this.frameCount = 0
    this.isRunning = false
    this.isPaused = false 
    
    
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
    
    
    this.obstacles = []
    this.powerups = []
    this.activePowerups = []
    
    
    this.particleSystem = new ParticleSystem()
    this.backgroundManager = new BackgroundManager(GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT)
    
    
    this.keys = {}
    this.setupEventListeners()
    
    
    this.lastFrameTime = 0
    this.deltaTime = 0
    this.animationFrameId = null 
    
    
    this.speedMultiplier = 1
    this.scoreMultiplier = 1
    this.hasShield = false
    this.hasDoubleJump = false
    
    
    this.onScoreUpdate = null
    this.onGameOver = null
    this.onPowerupCollect = null

    // small safeguard to avoid too-frequent spawns (ms)
    this._lastObstacleSpawnAt = 0
  }

  setupEventListeners() {
    
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

    
    if (this.canvas) {
      this.canvas.addEventListener('click', (e) => {
        if (this.gameState === 'playing' && !this.isPaused) {
          this.jump()
        }
      })

      this.canvas.addEventListener('touchstart', (e) => {
        e.preventDefault()
        if (this.gameState === 'playing' && !this.isPaused) {
          this.jump()
        }
      })
    }
  }

  start() {
    console.log('GameEngine: Starting game')
    this.gameState = 'playing'
    this.isRunning = true
    this.isPaused = false
    this.reset()
    this.gameLoop() 
  }

  reset() {
    console.log('GameEngine: Resetting game state')
    
    this.score = 0
    this.distance = 0
    this.gameSpeed = 1
    this.frameCount = 0
    
    
    const groundBase = GAME_CONFIG.CANVAS_HEIGHT - 100
    this.player.x = 100
    this.player.y = groundBase - this.player.height
    this.player.velocityY = 0
    this.player.onGround = true
    this.player.state = PLAYER_STATES.RUNNING
    this.player.jumpCount = 0
    this.player.health = 3
    
    
    this.obstacles = []
    this.powerups = []
    this.activePowerups = []
    
    
    this.speedMultiplier = 1
    this.scoreMultiplier = 1
    this.hasShield = false
    this.hasDoubleJump = false
    
    
    this.particleSystem.clear()

    this._lastObstacleSpawnAt = 0
  }

  gameLoop(currentTime = 0) {
    
    if (!this.isRunning || this.gameState === 'gameOver') {
      return
    }

    this.deltaTime = currentTime - this.lastFrameTime
    this.lastFrameTime = currentTime

    
    if (this.gameState === 'playing' && !this.isPaused) {
      this.update()
    }
    
    
    this.draw()

    
    this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time))
  }

  update() {
    this.frameCount++
    
    
    this.gameSpeed = 1 + (this.score / 1000) * 0.5
    
   
    this.distance += this.gameSpeed
   
   
    this.score += SCORING.BASE_SCORE_PER_SECOND * this.scoreMultiplier * (this.gameSpeed / 60)
    
  
    this.updatePlayer()
    
   
    this.updateObstacles()
    this.updatePowerups()
    this.updateActivePowerups()
    
    
    this.spawnObstacles()
    this.spawnPowerups()
    
    
    this.particleSystem.update()
    this.backgroundManager.update(this.gameSpeed)
    
    
    this.checkCollisions()
    
    
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
    
    try {
      this.player.sprite.update()
    } catch (err) {
      
    }
    
   
    if (!this.player.onGround) {
      this.player.velocityY += GAME_CONFIG.GRAVITY
    }
    
    
    this.player.y += this.player.velocityY
    
   
    const groundBase = GAME_CONFIG.CANVAS_HEIGHT - 100
    const playerBottom = this.player.y + this.player.height
    if (playerBottom >= groundBase) {
      this.player.y = groundBase - this.player.height
      this.player.velocityY = 0
      this.player.onGround = true
      this.player.jumpCount = 0
      this.player.state = PLAYER_STATES.RUNNING
    } else {
      this.player.onGround = false
      this.player.state = this.player.velocityY < 0 ? PLAYER_STATES.JUMPING : PLAYER_STATES.FALLING
    }
    
    
    this.player.maxJumps = this.hasDoubleJump ? 2 : 1
  }

  jump() {
    if (this.gameState !== 'playing' || this.isPaused) return
    
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
    
    // Always spawn a single obstacle (no clusters)
    const clusterSize = 1

    // Minimum pixel gap from any recently-spawned obstacle to the spawn edge to avoid back-to-back spawns
    const minGapFromSpawn = 220

    // throttle via time too (avoid spamming spawns multiple times in one second)
    const now = performance.now ? performance.now() : Date.now()
    const minSpawnIntervalMs = 400 // do not spawn more often than this

    // If an obstacle is still within minGapFromSpawn of the right edge, skip spawn
    const nearSpawn = this.obstacles.some(o => o.x > GAME_CONFIG.CANVAS_WIDTH - minGapFromSpawn)
    if (nearSpawn) {
      return
    }

    if (now - this._lastObstacleSpawnAt < minSpawnIntervalMs) {
      return
    }

    // Use phase frequency for spawn chance
    if (Math.random() < phase.obstacleFreq) {
      const obstacleTypes = Object.keys(OBSTACLE_TYPES)
      const type = obstacleTypes.length ? obstacleTypes[0] : null
      if (!type) return
      const config = OBSTACLE_TYPES[type]

      // Spawn single obstacle with a small vertical variance
      for (let i = 0; i < clusterSize; i++) {
        const yVariance = (Math.random() - 0.5) * 10
        const obstacle = {
          x: GAME_CONFIG.CANVAS_WIDTH + i * (config.width + 60),
          y: GAME_CONFIG.CANVAS_HEIGHT - 100 - config.height + yVariance,
          width: config.width,
          height: config.height,
          type,
          damage: config.damage,
          sprite: config.sprite
        }
        
        this.obstacles.push(obstacle)
      }

      this._lastObstacleSpawnAt = now
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
    
    // Check obstacle collisions - break after first collision to avoid multiple processing in same frame
    for (let i = 0; i < this.obstacles.length; i++) {
      const obstacle = this.obstacles[i]
      if (this.isColliding(playerRect, obstacle)) {
        this.handleObstacleCollision(obstacle, i)
        // stop after first handled collision to avoid double-damage in same frame
        break
      }
    }
    
    // Check powerup collisions (allow multiple)
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const powerup = this.powerups[i]
      if (this.isColliding(playerRect, powerup)) {
        this.handlePowerupCollision(powerup, i)
      }
    }
  }

  isColliding(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y
  }

  handleObstacleCollision(obstacle, index) {
    if (this.hasShield) {
      // Shield blocks damage: consume shield and remove effect (use uppercase key to match POWERUP_TYPES)
      this.hasShield = false
      this.removePowerupEffect('SHIELD') // ensure key matches POWERUP_TYPES
      // Remove obstacle and create explosion effect (no health deduction)
      this.obstacles.splice(index, 1)
      this.particleSystem.addParticle(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, 'explosion')
      return
    }

    // No shield: take damage
    this.player.health -= obstacle.damage
    if (this.player.health <= 0) {
      // Remove obstacle and trigger game over
      this.obstacles.splice(index, 1)
      this.particleSystem.addParticle(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2, 'explosion')
      this.gameOver()
      return
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
    
    this.activePowerups = this.activePowerups.filter(p => p.type !== type)

    // Add new powerup (ensure timeLeft is in ms)
    const durationMs = (config.duration && config.duration > 1000) ? config.duration : (config.duration * 1000)

    this.activePowerups.push({
      type,
      timeLeft: durationMs,
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
    if (!config) {
      
      switch (type) {
        case 'speed':
          this.speedMultiplier = 1
          return
        case 'shield':
        case 'SHIELD':
          this.hasShield = false
          return
        case 'double_jump':
        case 'DOUBLE_JUMP':
          this.hasDoubleJump = false
          return
        case 'multiplier':
        case 'MULTIPLIER':
          this.scoreMultiplier = 1
          return
        default:
          console.warn('removePowerupEffect: unknown powerup type', type)
          return
      }
    }
    
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
    
    this.ctx.clearRect(0, 0, GAME_CONFIG.CANVAS_WIDTH, GAME_CONFIG.CANVAS_HEIGHT)
    
   
    this.backgroundManager.draw(this.ctx, this.spriteManager)
    
    
    this.drawObstacles()
    this.drawPowerups()
    this.drawPlayer()
    
   
    this.particleSystem.draw(this.ctx)
    
    
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
    
    // Draw player sprite (fallback to colored rectangle if sprite not available)
    const playerSprite = this.spriteManager.getSprite && this.spriteManager.getSprite('RUNNER')
    if (playerSprite && typeof this.player.sprite?.draw === 'function') {
      try {
        this.player.sprite.draw(
          this.ctx,
          this.player.x,
          this.player.y,
          this.player.width,
          this.player.height,
          this.spriteManager
        )
      } catch (err) {
        // fallback if sprite drawing fails
        this.ctx.fillStyle = '#00ff88'
        this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height)
      }
    } else {
      // Fallback: draw a colored rectangle
      this.ctx.fillStyle = '#00ff88'
      this.ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height)
    }
    
    this.ctx.restore()
  }

  drawObstacles() {
    this.obstacles.forEach(obstacle => {
      this.ctx.save()
      
      // Try to draw a sprite if available for this obstacle
      let drawnBySprite = false
      try {
        const spriteKey = obstacle.sprite || obstacle.type
        const obsSprite = this.spriteManager.getSprite && this.spriteManager.getSprite(spriteKey)

        if (obsSprite) {
          // If the sprite is an AnimatedSprite-style object with a draw method:
          if (typeof obsSprite.draw === 'function') {
            obsSprite.draw(this.ctx, obstacle.x, obstacle.y, obstacle.width, obstacle.height, this.spriteManager)
            drawnBySprite = true
          } else {
            // If it's a plain HTMLImageElement, handle spritesheet vs single image
            if (obsSprite.width > obsSprite.height) {
              // Treat as horizontal spritesheet: draw a single frame and animate it
              const frameCount = Math.max(1, Math.round(obsSprite.width / obsSprite.height))
              const frameWidth = obsSprite.width / frameCount
              const animFrame = Math.floor(this.frameCount / 8) % frameCount
              const sx = animFrame * frameWidth

              this.ctx.drawImage(
                obsSprite,
                sx, 0, frameWidth, obsSprite.height,
                obstacle.x, obstacle.y, obstacle.width, obstacle.height
              )
              drawnBySprite = true
            } else {
              // Single-image obstacle; draw scaled
              this.ctx.drawImage(
                obsSprite,
                0, 0, obsSprite.width, obsSprite.height,
                obstacle.x, obstacle.y, obstacle.width, obstacle.height
              )
              drawnBySprite = true
            }
          }
        }
      } catch (err) {
        // ignore sprite-draw errors and fallback to rectangle
        console.warn('Obstacle sprite draw failed:', err)
      }

      if (!drawnBySprite) {
        // Draw obstacle with neon glow (fallback)
        this.ctx.shadowColor = '#ff4444'
        this.ctx.shadowBlur = 10
        this.ctx.fillStyle = '#ff4444'
        this.ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height)
        
        // Draw obstacle border
        this.ctx.strokeStyle = '#ff8888'
        this.ctx.lineWidth = 2
        this.ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height)
      }
      
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
    this.isPaused = !this.isPaused
    if (this.isPaused) {
      this.gameState = 'paused'
      console.log('GameEngine: Game paused')
    } else {
      this.gameState = 'playing'
      console.log('GameEngine: Game resumed')
    }
  }

  gameOver() {
    console.log('GameEngine: Game over')
    this.gameState = 'gameOver'
    this.isRunning = false
    
    // Cancel animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    
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

  // Cleanup method
  destroy() {
    this.isRunning = false
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }
  }
}
