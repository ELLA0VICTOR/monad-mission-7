import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, RefreshCw, TrendingUp, Award, Clock, Target } from 'lucide-react'
import { useLeaderboard } from '../../hooks/useLeaderboard'
import { useMonadGames } from '../../hooks/useMonadGames'

const Leaderboard = () => {
  const {
    leaderboardData,
    topPlayers,
    scoreStats,
    isLoading,
    error,
    lastUpdated,
    refreshLeaderboard,
    updateCurrentUser,
    getUserRank,
    formatRank,
    getRankColor,
    getScoreColor
  } = useLeaderboard()

  const { isConnected, user } = useMonadGames()
  const [selectedTab, setSelectedTab] = useState('all') // all, top10, stats

  // Update current user highlighting when user connects
  useEffect(() => {
    if (isConnected && user.address) {
      updateCurrentUser(user.address)
    } else {
      updateCurrentUser(null)
    }
  }, [isConnected, user.address, updateCurrentUser])

  const userRank = isConnected && user.address ? getUserRank(user.address) : null

  const tabs = [
    { id: 'all', label: 'All Players', icon: Trophy },
    { id: 'top10', label: 'Top 10', icon: Award },
    { id: 'stats', label: 'Statistics', icon: TrendingUp }
  ]

  const renderLeaderboardEntry = (entry, index) => (
    <motion.div
      key={entry.address}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-gray-800/50 border rounded-lg p-4 transition-all duration-200 ${
        entry.isCurrentUser 
          ? 'border-green-400/50 bg-green-400/10 neon-glow' 
          : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/70'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Rank */}
          <div className="flex items-center justify-center w-12 h-12 bg-gray-900 rounded-lg border border-gray-700">
            <span className={`text-lg font-bold ${getRankColor(entry.rank)}`}>
              {formatRank(entry.rank)}
            </span>
          </div>

          {/* Player Info */}
          <div>
            <div className={`font-semibold ${entry.isCurrentUser ? 'text-green-400' : 'text-white'}`}>
              {entry.username}
              {entry.isCurrentUser && (
                <span className="ml-2 text-xs bg-green-400 text-black px-2 py-1 rounded-full">
                  YOU
                </span>
              )}
            </div>
            <div className="text-sm text-gray-400">
              {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
            </div>
          </div>
        </div>

        {/* Score and Date */}
        <div className="text-right">
          <div className={`text-xl font-bold ${getScoreColor(entry.score)}`}>
            {entry.formattedScore}
          </div>
          <div className="text-sm text-gray-400 flex items-center">
            <Clock size={12} className="mr-1" />
            {entry.date}
          </div>
        </div>
      </div>

      {/* Progress bar for visual score comparison */}
      <div className="mt-3">
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${
              entry.rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
              entry.rank === 2 ? 'bg-gradient-to-r from-gray-300 to-gray-400' :
              entry.rank === 3 ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
              'bg-gradient-to-r from-green-400 to-blue-400'
            }`}
            initial={{ width: 0 }}
            animate={{ 
              width: scoreStats ? `${(entry.score / scoreStats.highestScore) * 100}%` : '0%' 
            }}
            transition={{ delay: index * 0.1, duration: 0.8 }}
          />
        </div>
      </div>
    </motion.div>
  )

  const renderStatistics = () => (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scoreStats && (
          <>
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">
                {scoreStats.formattedHighest}
              </div>
              <div className="text-sm text-gray-400">Highest Score</div>
              <div className="w-full h-2 bg-gray-700 rounded-full mt-3">
                <div className="h-full bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full w-full"></div>
              </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {scoreStats.formattedAverage}
              </div>
              <div className="text-sm text-gray-400">Average Score</div>
              <div className="w-full h-2 bg-gray-700 rounded-full mt-3">
                <motion.div 
                  className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(scoreStats.averageScore / scoreStats.highestScore) * 100}%` }}
                  transition={{ delay: 0.5, duration: 1 }}
                />
              </div>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">
                {scoreStats.totalPlayers}
              </div>
              <div className="text-sm text-gray-400">Total Players</div>
              <div className="w-full h-2 bg-gray-700 rounded-full mt-3">
                <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full w-full"></div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* User Stats (if connected) */}
      {isConnected && userRank && (
        <div className="bg-green-400/10 border border-green-400/30 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-400 mb-4 flex items-center">
            <Target className="mr-2" size={20} />
            Your Performance
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {formatRank(userRank)}
              </div>
              <div className="text-sm text-gray-400">Current Rank</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {user.playerStats?.highScore?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-gray-400">High Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {user.playerStats?.totalGames || '0'}
              </div>
              <div className="text-sm text-gray-400">Games Played</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">
                {Math.round((user.playerStats?.totalDistance || 0) / 1000)}km
              </div>
              <div className="text-sm text-gray-400">Total Distance</div>
            </div>
          </div>
        </div>
      )}

      {/* Score Distribution Chart (simplified) */}
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-green-400 mb-4">Score Distribution</h3>
        <div className="space-y-3">
          {scoreStats && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">10,000+ points</span>
                <div className="flex-1 mx-4 h-2 bg-gray-700 rounded-full">
                  <div className="h-full bg-purple-400 rounded-full" style={{ width: '15%' }}></div>
                </div>
                <span className="text-sm text-purple-400">15%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">5,000-9,999</span>
                <div className="flex-1 mx-4 h-2 bg-gray-700 rounded-full">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: '25%' }}></div>
                </div>
                <span className="text-sm text-blue-400">25%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">1,000-4,999</span>
                <div className="flex-1 mx-4 h-2 bg-gray-700 rounded-full">
                  <div className="h-full bg-green-400 rounded-full" style={{ width: '40%' }}></div>
                </div>
                <span className="text-sm text-green-400">40%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">0-999</span>
                <div className="flex-1 mx-4 h-2 bg-gray-700 rounded-full">
                  <div className="h-full bg-gray-400 rounded-full" style={{ width: '20%' }}></div>
                </div>
                <span className="text-sm text-gray-400">20%</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-green-400 neon-text mb-4">
          Global Leaderboard
        </h1>
        <p className="text-gray-400 mb-6">
          Compete with players worldwide on the Monad blockchain
        </p>

        {/* Last Updated */}
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
          <span>
            Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
          </span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={refreshLeaderboard}
            disabled={isLoading}
            className="p-2 hover:text-green-400 transition-colors disabled:opacity-50"
          >
            <motion.div
              animate={isLoading ? { rotate: 360 } : {}}
              transition={{ duration: 1, repeat: isLoading ? Infinity : 0, ease: "linear" }}
            >
              <RefreshCw size={16} />
            </motion.div>
          </motion.button>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex justify-center"
      >
        <div className="flex space-x-1 bg-gray-800/50 rounded-lg p-1 border border-gray-700">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2 ${
                  selectedTab === tab.id
                    ? 'bg-green-400/20 text-green-400 border border-green-400/50'
                    : 'text-gray-400 hover:text-green-400 hover:bg-green-400/10'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="text-green-400 mb-4"
            >
              <Trophy size={48} />
            </motion.div>
            <p className="text-green-400 text-lg">Loading leaderboard...</p>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-lg p-8 text-center"
          >
            <p className="text-red-400 text-lg mb-4">Failed to load leaderboard</p>
            <p className="text-gray-400 text-sm mb-4">{error}</p>
            <button
              onClick={refreshLeaderboard}
              className="btn-neon px-6 py-2"
            >
              Try Again
            </button>
          </motion.div>
        ) : (
          <motion.div
            key={selectedTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {selectedTab === 'all' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-white">
                    All Players ({leaderboardData.length})
                  </h2>
                  {isConnected && userRank && (
                    <div className="text-green-400 text-sm">
                      You're ranked #{userRank}
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  {leaderboardData.map((entry, index) => renderLeaderboardEntry(entry, index))}
                </div>
              </div>
            )}

            {selectedTab === 'top10' && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Top 10 Players</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {topPlayers.slice(0, 10).map((entry, index) => (
                    <motion.div
                      key={entry.address}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={`bg-gray-800/50 border rounded-lg p-6 text-center ${
                        entry.rank === 1 ? 'border-yellow-400/50 bg-yellow-400/10' :
                        entry.rank === 2 ? 'border-gray-400/50 bg-gray-400/10' :
                        entry.rank === 3 ? 'border-orange-400/50 bg-orange-400/10' :
                        'border-gray-700'
                      }`}
                    >
                      <div className={`text-4xl mb-3 ${getRankColor(entry.rank)}`}>
                        {formatRank(entry.rank)}
                      </div>
                      <div className={`font-semibold mb-1 ${entry.isCurrentUser ? 'text-green-400' : 'text-white'}`}>
                        {entry.username}
                      </div>
                      <div className="text-sm text-gray-400 mb-3">
                        {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                      </div>
                      <div className={`text-2xl font-bold ${getScoreColor(entry.score)}`}>
                        {entry.formattedScore}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {selectedTab === 'stats' && renderStatistics()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection prompt */}
      {!isConnected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6 text-center"
        >
          <p className="text-blue-400 mb-4">
            Connect your wallet to see your rank and submit scores!
          </p>
        </motion.div>
      )}
    </div>
  )
}

export default Leaderboard