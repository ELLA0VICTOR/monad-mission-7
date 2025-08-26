import React from 'react'
import { motion } from 'framer-motion'
import { Trophy, RotateCcw, Upload, Target, Zap, Award } from 'lucide-react'

const GameOver = ({ 
  finalStats, 
  onRestart, 
  onSubmitScore, 
  hasSubmittedScore,
  userInfo 
}) => {
  if (!finalStats) return null

  const { score, distance, powerupsCollected } = finalStats

  const getScoreRating = () => {
    if (score >= 15000) return { rating: 'LEGENDARY', color: 'text-purple-400', icon: '👑' }
    if (score >= 10000) return { rating: 'EPIC', color: 'text-yellow-400', icon: '🏆' }
    if (score >= 5000) return { rating: 'EXCELLENT', color: 'text-blue-400', icon: '⭐' }
    if (score >= 2000) return { rating: 'GOOD', color: 'text-green-400', icon: '👍' }
    if (score >= 500) return { rating: 'DECENT', color: 'text-orange-400', icon: '🎯' }
    return { rating: 'KEEP TRYING', color: 'text-gray-400', icon: '💪' }
  }

  const scoreRating = getScoreRating()
  const survivalTime = Math.floor(distance / 100) 

  const achievements = []
  if (score >= 1000) achievements.push({ name: 'Score Master', desc: 'Reached 1,000 points', icon: '🎯' })
  if (distance >= 5000) achievements.push({ name: 'Long Runner', desc: 'Traveled 5,000m', icon: '🏃' })
  if (powerupsCollected >= 5) achievements.push({ name: 'Collector', desc: 'Collected 5+ powerups', icon: '⚡' })
  if (score >= 10000) achievements.push({ name: 'High Scorer', desc: 'Reached 10,000 points', icon: '🏆' })

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl bg-gradient-to-br from-gray-900 to-black border-2 border-red-500/50 rounded-lg p-8 shadow-2xl"
      style={{
        boxShadow: '0 0 50px rgba(255, 68, 68, 0.3)'
      }}
    >
      
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center w-24 h-24 bg-red-500/20 rounded-full mb-4"
        >
          <span className="text-4xl">💀</span>
        </motion.div>
        
        <motion.h2
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-bold text-red-400 mb-2"
        >
          GAME OVER
        </motion.h2>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-gray-400"
        >
          Your neon adventure has come to an end
        </motion.p>
      </div>

      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center mb-8"
      >
        <div className={`text-6xl font-bold ${scoreRating.color} mb-2 neon-text`}>
          {score.toLocaleString()}
        </div>
        <div className={`text-xl ${scoreRating.color} mb-4 flex items-center justify-center`}>
          <span className="mr-2">{scoreRating.icon}</span>
          {scoreRating.rating}
        </div>
      </motion.div>

      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8"
      >
        <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700">
          <Target className="text-green-400 w-8 h-8 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-400">
            {score.toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">Final Score</div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700">
          <div className="text-blue-400 w-8 h-8 mx-auto mb-2 flex items-center justify-center text-2xl">
            📏
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {distance.toLocaleString()}m
          </div>
          <div className="text-sm text-gray-400">Distance</div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700">
          <div className="text-orange-400 w-8 h-8 mx-auto mb-2 flex items-center justify-center text-2xl">
            ⏱️
          </div>
          <div className="text-2xl font-bold text-orange-400">
            {survivalTime}s
          </div>
          <div className="text-sm text-gray-400">Survival Time</div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-4 text-center border border-gray-700">
          <Zap className="text-purple-400 w-8 h-8 mx-auto mb-2" />
          <div className="text-2xl font-bold text-purple-400">
            {powerupsCollected || 0}
          </div>
          <div className="text-sm text-gray-400">Powerups</div>
        </div>
      </motion.div>

      
      {achievements.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mb-8"
        >
          <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center">
            <Award className="mr-2" size={20} />
            Achievements Unlocked
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.name}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="bg-green-400/10 border border-green-400/30 rounded-lg p-3 flex items-center"
              >
                <span className="text-2xl mr-3">{achievement.icon}</span>
                <div>
                  <div className="font-semibold text-green-400">{achievement.name}</div>
                  <div className="text-sm text-gray-400">{achievement.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      
      {userInfo.isConnected && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-gray-800/30 rounded-lg p-4 mb-6 border border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-green-400 font-semibold">{userInfo.displayName}</div>
              <div className="text-sm text-gray-400">{userInfo.address}</div>
            </div>
            {hasSubmittedScore && (
              <div className="flex items-center text-green-400 text-sm">
                <Upload size={16} className="mr-1" />
                Score Submitted
              </div>
            )}
          </div>
        </motion.div>
      )}

      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        <button
          onClick={onRestart}
          className="btn-neon px-8 py-3 text-lg flex items-center justify-center animate-pulse-neon"
        >
          <RotateCcw className="mr-2" size={20} />
          Play Again
        </button>

        {onSubmitScore && !hasSubmittedScore && (
          <button
            onClick={onSubmitScore}
            className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white px-8 py-3 rounded-lg font-semibold text-lg flex items-center justify-center transition-all duration-200 shadow-lg"
          >
            <Trophy className="mr-2" size={20} />
            Submit to Leaderboard
          </button>
        )}
      </motion.div>

      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        className="mt-8 text-center"
      >
        <div className="text-sm text-gray-500">
          💡 Pro tip: {score < 1000 
            ? "Focus on collecting powerups and avoiding obstacles" 
            : score < 5000 
            ? "Try to maintain combos and use powerups strategically"
            : "You're doing great! Keep pushing for higher scores!"
          }
        </div>
      </motion.div>
    </motion.div>
  )
}

export default GameOver