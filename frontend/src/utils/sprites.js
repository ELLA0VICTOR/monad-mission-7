import { SPRITES } from './constants'

class SpriteManager {
  constructor() {
    this.loadedSprites = new Map()
    this.loadingPromises = new Map()
  }

  async loadSprite(key, src) {
    if (this.loadedSprites.has(key)) {
      return this.loadedSprites.get(key)
    }

    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key)
    }

    const promise = new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        this.loadedSprites.set(key, img)
        this.loadingPromises.delete(key)
        resolve(img)
      }
      img.onerror = (error) => {
        this.loadingPromises.delete(key)
        reject(error)
      }
      img.src = src
    })

    this.loadingPromises.set(key, promise)
    return promise
  }

  async loadAllSprites() {
    const loadPromises = Object.entries(SPRITES).map(([key, config]) =>
      this.loadSprite(key, config.src)
    )

    try {
      await Promise.all(loadPromises)
      console.log('All sprites loaded successfully')
    } catch (error) {
      console.error('Error loading sprites:', error)
    }
  }

  getSprite(key) {
    return this.loadedSprites.get(key)
  }

  hasSprite(key) {
    return this.loadedSprites.has(key)
  }
}

// Animation system
export class AnimatedSprite {
  constructor(spriteKey, frameCount = 1, animSpeed = 8) {
    this.spriteKey = spriteKey
    this.frameCount = frameCount
    this.animSpeed = animSpeed
    this.currentFrame = 0
    this.frameTimer = 0
  }

  update() {
    this.frameTimer++
    if (this.frameTimer >= this.animSpeed) {
      this.currentFrame = (this.currentFrame + 1) % this.frameCount
      this.frameTimer = 0
    }
  }

  draw(ctx, x, y, width, height, spriteManager) {
    const sprite = spriteManager.getSprite(this.spriteKey)
    if (!sprite) return

    const frameWidth = sprite.width / this.frameCount
    const sx = this.currentFrame * frameWidth
    
    ctx.drawImage(
      sprite,
      sx, 0, frameWidth, sprite.height,
      x, y, width, height
    )
  }
}

// Particle system for effects
export class ParticleSystem {
  constructor() {
    this.particles = []
  }

  addParticle(x, y, type = 'explosion') {
    const particle = {
      x,
      y,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      life: 30,
      maxLife: 30,
      type,
      size: Math.random() * 4 + 2,
      color: this.getParticleColor(type)
    }
    this.particles.push(particle)
  }

  getParticleColor(type) {
    const colors = {
      explosion: '#ff4444',
      speed: '#00ff88',
      shield: '#0088ff',
      collect: '#ffaa00',
      jump: '#ff8800'
    }
    return colors[type] || '#ffffff'
  }

  update() {
    this.particles = this.particles.filter(particle => {
      particle.x += particle.vx
      particle.y += particle.vy
      particle.vy += 0.3 // gravity
      particle.vx *= 0.99 // air resistance
      particle.life--
      return particle.life > 0
    })
  }

  draw(ctx) {
    this.particles.forEach(particle => {
      const alpha = particle.life / particle.maxLife
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = particle.color
      ctx.beginPath()
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })
  }

  clear() {
    this.particles = []
  }
}

// Background manager for parallax scrolling
export class BackgroundManager {
  constructor(canvasWidth, canvasHeight) {
    this.width = canvasWidth
    this.height = canvasHeight
    this.layers = [
      { x: 0, speed: 0.5, color: '#0f1419' }, // Far background
      { x: 0, speed: 1, color: '#1a2332' },   // Mid background
      { x: 0, speed: 2, color: '#2d4263' },   // Near background
    ]
  }

  update(gameSpeed) {
    this.layers.forEach(layer => {
      layer.x -= layer.speed * gameSpeed
      if (layer.x <= -this.width) {
        layer.x = 0
      }
    })
  }

  draw(ctx, spriteManager) {
    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height)
    gradient.addColorStop(0, '#1a1a2e')
    gradient.addColorStop(0.5, '#16213e')
    gradient.addColorStop(1, '#0f3460')
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, this.width, this.height)

    // Draw background sprite if available
    const bgSprite = spriteManager.getSprite('BACKGROUND')
    if (bgSprite) {
      ctx.drawImage(bgSprite, 0, 0, this.width, this.height)
    }

    // Draw parallax layers with patterns
    this.layers.forEach((layer, index) => {
      ctx.save()
      ctx.globalAlpha = 0.3
      ctx.fillStyle = layer.color
      
      // Draw moving patterns
      for (let i = 0; i < 5; i++) {
        const x = layer.x + (i * this.width / 3)
        const y = this.height - (index + 1) * 50
        ctx.fillRect(x, y, 20, 10)
        ctx.fillRect(x + this.width / 3, y, 20, 10)
      }
      
      ctx.restore()
    })

    // Draw grid pattern
    this.drawGrid(ctx)
  }

  drawGrid(ctx) {
    ctx.save()
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.1)'
    ctx.lineWidth = 1
    
    // Vertical lines
    for (let x = 0; x < this.width; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, this.height)
      ctx.stroke()
    }
    
    // Horizontal lines
    for (let y = 0; y < this.height; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(this.width, y)
      ctx.stroke()
    }
    
    ctx.restore()
  }
}

// UI drawing utilities
export const drawNeonText = (ctx, text, x, y, size = 20, color = '#00ff88') => {
  ctx.save()
  ctx.font = `${size}px 'Orbitron', monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  
  // Outer glow
  ctx.shadowColor = color
  ctx.shadowBlur = 10
  ctx.fillStyle = color
  ctx.fillText(text, x, y)
  
  // Inner text
  ctx.shadowBlur = 0
  ctx.fillStyle = '#ffffff'
  ctx.fillText(text, x, y)
  
  ctx.restore()
}

export const drawNeonRect = (ctx, x, y, width, height, color = '#00ff88') => {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.shadowColor = color
  ctx.shadowBlur = 10
  ctx.strokeRect(x, y, width, height)
  ctx.restore()
}

export const drawProgressBar = (ctx, x, y, width, height, progress, color = '#00ff88') => {
  ctx.save()
  
  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.fillRect(x, y, width, height)
  
  // Border
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.strokeRect(x, y, width, height)
  
  // Progress fill
  const fillWidth = width * Math.max(0, Math.min(1, progress))
  ctx.fillStyle = color
  ctx.fillRect(x, y, fillWidth, height)
  
  // Glow effect
  ctx.shadowColor = color
  ctx.shadowBlur = 5
  ctx.fillRect(x, y, fillWidth, height)
  
  ctx.restore()
}

// Create singleton sprite manager
export const spriteManager = new SpriteManager()