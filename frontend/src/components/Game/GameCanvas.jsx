import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, Trophy, Zap } from 'lucide-react'
import { useGameLogic } from '../../hooks/useGameLogic'
import { useMonadGames } from '../../hooks/useMonadGames'
import { GAME_CONFIG } from '../../utils/constants'
import GameHUD from './GameHUD'
import GameOver from './GameOver'

const GameCanvas = () => {
  const {
    gameState,
    gameStats,
    finalStats,
    isLoading,
    canvasRef,
    startGame,
    pauseGame,
    resumeGame,
    restartGame,
    isPlaying,
    isPaused,
    isGameOver,
    isMenu
  } = useGameLogic()

  const { isConnected, submitGameScore, user } = useMonadGames()
  const [showSubmitScore, setShowSubmitScore] = useState(false)
  const [hasSubmittedScore, setHasSubmittedScore] = useState(false)

  // Handle score submission when game ends
  useEffect(() => {
    if (isGameOver && finalStats && !hasSubmittedScore) {
      setShowSubmitScore(true)
    }
  }, [isGameOver, finalStats, hasSubmittedScore])

  const handleSubmitScore = async () => {
    if (finalStats && isConnected) {
      const success = await submitGameScore(finalStats)
      if (success) {
        setHasSubmittedScore(true)
        setShowSubmitScore(false)
      }
    }
  }

  const handleRestartGame = () => {
    setHasSubmittedScore(false)
    setShowSubmitScore(false)
    restartGame()
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] bg-gradient-to-br from-gray-900 to-black rounded-lg border border-green-400/20">
        <div className="animate-pulse-neon">
          <Zap size={64} className="text-green-400 mb-4" />
        </div>
        <p className="text-green-400 text-lg font-bold animate-pulse">
          Loading Game Assets<span className="loading-dots"></span>
        </p>
        <div className="mt-4 w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-400 to-blue-400"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Game Canvas Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative bg-black rounded-lg overflow-hidden border-2 border-green-400/50 shadow-2xl"
        style={{
          boxShadow: '0 0 50px rgba(0, 255, 136, 0.3)'
        }}
      >
        <canvas
          ref={canvasRef}
          width={GAME_CONFIG.CANVAS_WIDTH}
          height={GAME_CONFIG.CANVAS_HEIGHT}
          className="game-canvas pixel-art block"
        />
        
        {/* Game Overlay UI */}
        <AnimatePresence>
          {isMenu && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center"
            >
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center mb-8"
              >
                <h1 className="text-6xl font-bold neon-text mb-4">
                  NEON RUNNER
                </h1>
                <p className="text-xl text-green-300 mb-6">
                  The Ultimate Cyberpunk Running Experience
                </p>
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
                  <span>🎮 SPACE/CLICK to Jump</span>
                  <span>⏸️ P to Pause</span>
                  <span>🔄 R to Restart</span>
                </div>
              </motion.div>

              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGame}
                className="btn-neon text-2xl px-12 py-4 mb-6 animate-pulse-neon"
              >
                <Play className="inline mr-3" size={24} />
                START GAME
              </motion.button>

              {!isConnected && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-center text-yellow-400 bg-yellow-400/10 border border-yellow-400/30 rounded-lg p-4"
                >
                  <p className="text-sm">
                    💡 Connect your wallet to submit scores to the leaderboard!
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {isPaused && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center"
            >
              <h2 className="text-4xl font-bold text-green-400 mb-8 neon-text">
                GAME PAUSED
              </h2>
              
              <div className="flex space-x-4">
                <button
                  onClick={resumeGame}
                  className="btn-neon px-8 py-3"
                >
                  <Play className="inline mr-2" size={20} />
                  Resume
                </button>
                
                <button
                  onClick={handleRestartGame}
                  className="btn-neon px-8 py-3"
                >
                  <RotateCcw className="inline mr-2" size={20} />
                  Restart
                </button>
              </div>
            </motion.div>
          )}

          {showSubmitScore && finalStats && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 bg-black/90 flex items-center justify-center"
            >
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-green-400/50 rounded-lg p-8 max-w-md w-full mx-4">
                <div className="text-center mb-6">
                  <Trophy className="text-yellow-400 w-16 h-16 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-green-400 mb-2">
                    Submit Your Score!
                  </h3>
                  <p className="text-gray-300">
                    Save your achievement to the blockchain leaderboard
                  </p>
                </div>

                <div className="bg-black/50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Final Score:</span>
                      <span className="text-green-400 font-bold ml-2">
                        {finalStats.score.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Distance:</span>
                      <span className="text-blue-400 font-bold ml-2">
                        {finalStats.distance.toLocaleString()}m
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={handleSubmitScore}
                    className="btn-neon flex-1 py-3"
                    disabled={!isConnected}
                  >
                    {isConnected ? 'Submit Score' : 'Connect Wallet'}
                  </button>
                  
                  <button
                    onClick={() => setShowSubmitScore(false)}
                    className="px-6 py-3 border border-gray-600 text-gray-400 rounded-lg hover:bg-gray-800"
                  >
                    Skip
                  </button>
                </div>

                {!isConnected && (
                  <p className="text-xs text-yellow-400 text-center mt-4">
                    Connect your wallet to submit scores to the leaderboard
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Game HUD */}
      {(isPlaying || isPaused) && (
        <GameHUD 
          gameStats={gameStats}
          onPause={pauseGame}
          onRestart={handleRestartGame}
          isPaused={isPaused}
        />
      )}

      {/* Game Over Screen */}
      {isGameOver && !showSubmitScore && (
        <GameOver
          finalStats={finalStats}
          onRestart={handleRestartGame}
          onSubmitScore={isConnected ? () => setShowSubmitScore(true) : null}
          hasSubmittedScore={hasSubmittedScore}
          userInfo={user}
        />
      )}

      {/* Game Controls Help */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gray-900/50 border border-green-400/20 rounded-lg p-4"
      >
        <h3 className="text-lg font-semibold text-green-400 mb-3">Controls</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center">
            <kbd className="bg-gray-800 px-2 py-1 rounded text-xs mr-2">SPACE</kbd>
            <span className="text-gray-300">Jump</span>
          </div>
          <div className="flex items-center">
            <kbd className="bg-gray-800 px-2 py-1 rounded text-xs mr-2">P</kbd>
            <span className="text-gray-300">Pause</span>
          </div>
          <div className="flex items-center">
            <kbd className="bg-gray-800 px-2 py-1 rounded text-xs mr-2">R</kbd>
            <span className="text-gray-300">Restart</span>
          </div>
          <div className="flex items-center">
            <kbd className="bg-gray-800 px-2 py-1 rounded text-xs mr-2">CLICK</kbd>
            <span className="text-gray-300">Jump</span>
          </div>
        </div>
      </motion.div>

      {/* Game Features */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl"
      >
        <div className="neon-card text-center">
          <Zap className="text-green-400 w-8 h-8 mx-auto mb-2" />
          <h4 className="font-semibold text-green-400 mb-1">Power-ups</h4>
          <p className="text-sm text-gray-400">
            Collect speed boosts, shields, and score multipliers
          </p>
        </div>
        
        <div className="neon-card text-center">
          <Trophy className="text-yellow-400 w-8 h-8 mx-auto mb-2" />
          <h4 className="font-semibold text-green-400 mb-1">Leaderboard</h4>
          <p className="text-sm text-gray-400">
            Compete globally with blockchain-verified scores
          </p>
        </div>
        
        <div className="neon-card text-center">
          <div className="text-purple-400 w-8 h-8 mx-auto mb-2 flex items-center justify-center text-lg">
            🎮
          </div>
          <h4 className="font-semibold text-green-400 mb-1">NFT Powerups</h4>
          <p className="text-sm text-gray-400">
            Purchase permanent powerup NFTs in the shop
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default GameCanvas