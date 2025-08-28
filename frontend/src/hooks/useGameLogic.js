import { useState, useEffect, useRef, useCallback } from 'react'
import { GameEngine } from '../utils/gameEngine'
import { spriteManager } from '../utils/sprites'
import toast from 'react-hot-toast'

export const useGameLogic = () => {
  const [gameState, setGameState] = useState('menu') // menu, playing, paused, gameOver
  const [gameStats, setGameStats] = useState({
    score: 0,
    distance: 0,
    health: 3,
    speed: '1.0'
  })
  const [finalStats, setFinalStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [spritesLoaded, setSpritesLoaded] = useState(false) // NEW: track sprite load completion

  const gameEngineRef = useRef(null)
  const canvasRef = useRef(null)

  // Load sprites once on mount
  useEffect(() => {
    let cancelled = false

    const loadSprites = async () => {
      try {
        setIsLoading(true)
        console.log('useGameLogic: Starting sprite load...')
        await spriteManager.loadAllSprites()
        if (cancelled) return
        console.log('useGameLogic: Sprites loaded')
        setSpritesLoaded(true)
      } catch (error) {
        console.error('Failed to load sprites:', error)
        toast.error('Failed to load game assets')
      } finally {
        // We'll keep isLoading true until engine is constructed (see next effect)
        setIsLoading(false)
      }
    }

    loadSprites()
    return () => {
      cancelled = true
    }
  }, [])

  
   // Create the GameEngine as soon as both sprites are loaded and the canvas is available.
   useEffect(() => {
    // If engine already created, nothing to do
    if (gameEngineRef.current) return

    // Only proceed when both sprites are loaded and canvasRef is available
    if (spritesLoaded && canvasRef.current) {
      try {
        console.log('useGameLogic: Initializing GameEngine...')
        const engine = new GameEngine(canvasRef.current, spriteManager)

        engine.onScoreUpdate = (stats) => {
          setGameStats(stats)
        }

        engine.onGameOver = (stats) => {
          setGameState('gameOver')
          setFinalStats(stats)
          toast.error('Game Over!', {
            icon: '💀',
            duration: 3000
          })
        }

        engine.onPowerupCollect = (powerupType) => {
          toast.success(`${powerupType.replace('_', ' ')} collected!`, {
            icon: '⚡',
            duration: 2000
          })
        }

        gameEngineRef.current = engine
        setGameState('menu')
        console.log('useGameLogic: GameEngine initialized successfully')
      } catch (err) {
        console.error('Failed to initialize GameEngine:', err)
        toast.error('Failed to initialize game engine')
      }
    }
  }, [spritesLoaded, canvasRef])
// Run when spritesLoaded flips or canvasRef becomes available

  // startGame with a helpful fallback toast/log if engine not ready
  const startGame = useCallback(() => {
    if (gameEngineRef.current) {
      try {
        gameEngineRef.current.start()
        setGameState('playing')
        setFinalStats(null)
        toast.success('Game Started!', {
          icon: '🚀',
          duration: 2000
        })
      } catch (err) {
        console.error('Error when starting game:', err)
        toast.error('Could not start game — see console for details')
      }
    } else {
      console.warn('Attempted to start game but engine is not initialized yet')
      toast.error('Game not ready yet. Please wait a moment and try again.', { duration: 3000 })
    }
  }, [])

  const pauseGame = useCallback(() => {
    if (gameEngineRef.current && gameState === 'playing') {
      gameEngineRef.current.togglePause()
      setGameState('paused')
      toast('Game Paused', {
        icon: '⏸️',
        duration: 2000
      })
    }
  }, [gameState])

  const resumeGame = useCallback(() => {
    if (gameEngineRef.current && gameState === 'paused') {
      gameEngineRef.current.togglePause()
      setGameState('playing')
      toast('Game Resumed', {
        icon: '▶️',
        duration: 2000
      })
    }
  }, [gameState])

  const restartGame = useCallback(() => {
    if (gameEngineRef.current) {
      try {
        gameEngineRef.current.reset()
        gameEngineRef.current.start()
        setGameState('playing')
        setFinalStats(null)
        toast.success('Game Restarted!', {
          icon: '🔄',
          duration: 2000
        })
      } catch (err) {
        console.error('Error when restarting game:', err)
        toast.error('Could not restart game — see console for details')
      }
    } else {
      toast.error('Game engine not initialized yet.')
    }
  }, [])

  const backToMenu = useCallback(() => {
    if (gameEngineRef.current) {
      // Prefer calling engine's API if available, otherwise just change state
      try {
        gameEngineRef.current.gameState = 'menu'
      } catch {}
      setGameState('menu')
      setFinalStats(null)
    } else {
      setGameState('menu')
      setFinalStats(null)
    }
  }, [])

  const getCurrentStats = useCallback(() => {
    if (gameEngineRef.current) {
      return gameEngineRef.current.getGameStats()
    }
    return gameStats
  }, [gameStats])

  // Handle keyboard shortcuts
    // Handle keyboard shortcuts
    useEffect(() => {
      const handleKeyPress = (event) => {
        // DEBUG: log key presses and current gameState so we can see handler activity in console
        console.log('Key pressed', event.code, 'gameState=', gameState);
  
        switch (event.code) {
          case 'KeyP':
            if (gameState === 'playing') {
              pauseGame()
            } else if (gameState === 'paused') {
              resumeGame()
            }
            break
          case 'KeyR':
            if (gameState === 'gameOver') {
              restartGame()
            }
            break
          case 'Escape':
            if (gameState !== 'menu') {
              backToMenu()
            }
            break
        }
      }
  
      window.addEventListener('keydown', handleKeyPress)
      return () => window.removeEventListener('keydown', handleKeyPress)
    }, [gameState, pauseGame, resumeGame, restartGame, backToMenu])
  
  // Cleanup on unmount (ensure engine stopped)
  useEffect(() => {
    return () => {
      if (gameEngineRef.current) {
        try {
          gameEngineRef.current.destroy()
          gameEngineRef.current = null
        } catch {}
      }
    }
  }, [])

  return {
    // State
    gameState,
    gameStats,
    finalStats,
    isLoading,
    canvasRef,
    
    // Actions
    startGame,
    pauseGame,
    resumeGame,
    restartGame,
    backToMenu,
    getCurrentStats,
    
    // Utils
    isPlaying: gameState === 'playing',
    isPaused: gameState === 'paused',
    isGameOver: gameState === 'gameOver',
    isMenu: gameState === 'menu',
  }
}
