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
  
  const gameEngineRef = useRef(null)
  const canvasRef = useRef(null)

  // Initialize game engine
  useEffect(() => {
    const initializeGame = async () => {
      try {
        setIsLoading(true)
        
        // Load all sprites
        await spriteManager.loadAllSprites()
        
        // Initialize game engine when canvas is ready
        if (canvasRef.current) {
          const engine = new GameEngine(canvasRef.current, spriteManager)
          
          // Set up callbacks
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
        }
      } catch (error) {
        console.error('Failed to initialize game:', error)
        toast.error('Failed to load game assets')
      } finally {
        setIsLoading(false)
      }
    }

    initializeGame()
  }, [])

  const startGame = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.start()
      setGameState('playing')
      setFinalStats(null)
      toast.success('Game Started!', {
        icon: '🚀',
        duration: 2000
      })
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
      gameEngineRef.current.reset()
      gameEngineRef.current.start()
      setGameState('playing')
      setFinalStats(null)
      toast.success('Game Restarted!', {
        icon: '🔄',
        duration: 2000
      })
    }
  }, [])

  const backToMenu = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.gameState = 'menu'
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
  useEffect(() => {
    const handleKeyPress = (event) => {
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.gameState = 'stopped'
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