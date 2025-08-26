import React from 'react'
import { motion } from 'framer-motion'
import { Pause, RotateCcw, Heart, Zap, Target } from 'lucide-react'

const GameHUD = ({ gameStats, onPause, onRestart, isPaused }) => {
  const { score, distance, health, speed } = gameStats

  const healthPercentage = (health / 3) * 100
  const getHealthColor = () => {
    if (health >= 3) return 'text-green-400'
    if (health >= 2) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getSpeedColor = () => {
    const speedValue = parseFloat(speed)
    if (speedValue >= 2.0) return 'text-purple-400'
    if (speedValue >= 1.5) return 'text-blue-400'
    return 'text-green-400'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl bg-black/80 border border-green-400/30 rounded-lg p-4 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between">
        
        <div className="flex items-center space-x-8">
          
          <div className="text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
              Score
            </div>
            <div className="text-2xl font-bold text-green-400 neon-text">
              {score.toLocaleString()}
            </div>
          </div>

          
          <div className="text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">
              Distance
            </div>
            <div className="text-xl font-bold text-blue-400">
              {distance.toLocaleString()}m
            </div>
          </div>

          
          <div className="text-center">
            <div className="text-xs text-gray-400 uppercase tracking-wider mb-1 flex items-center">
              <Zap size={12} className="mr-1" />
              Speed
            </div>
            <div className={`text-xl font-bold ${getSpeedColor()}`}>
              {speed}x
            </div>
          </div>
        </div>

        
        <div className="flex items-center space-x-3">
          <Heart className={`w-5 h-5 ${getHealthColor()}`} />
          <div className="relative">
            <div className="w-32 h-4 bg-gray-800 rounded-full border border-gray-600">
              <motion.div
                className={`h-full rounded-full ${
                  health >= 3 
                    ? 'bg-gradient-to-r from-green-400 to-green-500' 
                    : health >= 2 
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                    : 'bg-gradient-to-r from-red-400 to-red-500'
                }`}
                initial={{ width: '100%' }}
                animate={{ width: `${healthPercentage}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-semibold text-white drop-shadow-lg">
                {health}/3
              </span>
            </div>
          </div>
        </div>

        
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onPause}
            className="p-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-green-400/50 rounded-lg transition-all duration-200"
            disabled={isPaused}
          >
            <Pause size={16} className="text-green-400" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRestart}
            className="p-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-yellow-400/50 rounded-lg transition-all duration-200"
          >
            <RotateCcw size={16} className="text-yellow-400" />
          </motion.button>
        </div>
      </div>

      
      <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Target size={12} className="mr-1" />
            <span>Next milestone: {((Math.floor(score / 500) + 1) * 500).toLocaleString()}</span>
          </div>
        </div>

        <div className="text-right">
          <span>Use SPACE or CLICK to jump • P to pause • R to restart</span>
        </div>
      </div>

      
      <div className="mt-2 w-full">
        <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-green-400 to-blue-400"
            initial={{ width: '0%' }}
            animate={{ 
              width: `${((score % 500) / 500) * 100}%` 
            }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </motion.div>
  )
}

export default GameHUD