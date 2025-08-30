import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, RefreshCw, Award, Clock } from 'lucide-react'
import { useMonadGames } from '../../hooks/useMonadGames'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

const Leaderboard = () => {
  const { isConnected, user } = useMonadGames()
  const [leaderboardData, setLeaderboardData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [selectedTab, setSelectedTab] = useState('all')

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const resp = await fetch(`${API_BASE}/api/leaderboard`)
      const text = await resp.text()

      if (!resp.ok) {
        // If backend returned HTML (index.html), text will start with "<"
        throw new Error(`HTTP ${resp.status} - ${text.slice(0, 200)}`)
      }

      // parse JSON safely
      let data
      try {
        data = JSON.parse(text)
      } catch (parseErr) {
        throw new Error('Failed to parse leaderboard JSON: ' + (text.slice(0, 200)))
      }

      if (!data.success) throw new Error(data.error || 'Failed to fetch leaderboard')

      // format score + date
      const formatted = (data.entries || []).map((entry, i) => {
        const ts = Number(entry.timestamp) || Date.now()
        return {
          ...entry,
          formattedScore: Number(entry.score || 0).toLocaleString(),
          date: new Date(ts).toLocaleDateString(),
          // ensure rank exists
          rank: entry.rank || i + 1
        }
      })

      setLeaderboardData(formatted)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('fetchLeaderboard error', err)
      setError(String(err.message || err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
    // optionally refresh periodically
    // const id = setInterval(fetchLeaderboard, 30_000)
    // return () => clearInterval(id)
  }, [])

  const getRankColor = (rank) => {
    switch (rank) {
      case 1: return 'text-yellow-400'
      case 2: return 'text-gray-300'
      case 3: return 'text-orange-400'
      default: return 'text-green-400'
    }
  }

  const getScoreColor = (score) => {
    if (score > 10000) return 'text-purple-400'
    if (score > 5000) return 'text-blue-400'
    return 'text-white'
  }

  const formatRank = (rank) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  const renderLeaderboardEntry = (entry, index) => {
    const isCurrent = isConnected && user?.address && entry.address && user.address.toLowerCase() === entry.address.toLowerCase()

    // fallback for missing addresses as key
    const key = `${entry.address || 'noaddr'}-${entry.rank || index}-${index}`

    return (
      <motion.div
        key={key}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className={`bg-gray-800/50 border rounded-lg p-4 transition-all duration-200 ${
          isCurrent
            ? 'border-green-400/50 bg-green-400/10 neon-glow'
            : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/70'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-900 rounded-lg border border-gray-700">
              <span className={`text-lg font-bold ${getRankColor(entry.rank)}`}>
                {formatRank(entry.rank)}
              </span>
            </div>
            <div>
              <div className={`font-semibold ${isCurrent ? 'text-green-400' : 'text-white'}`}>
                {entry.username || (entry.address ? `${entry.address.slice(0,6)}...${entry.address.slice(-4)}` : 'Unknown')}
                {isCurrent && (
                  <span className="ml-2 text-xs bg-green-400 text-black px-2 py-1 rounded-full">
                    YOU
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-400">
                {entry.address ? `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}` : '—'}
              </div>
            </div>
          </div>

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
      </motion.div>
    )
  }

  const tabs = [
    { id: 'all', label: 'All Players', icon: Trophy },
    { id: 'top10', label: 'Top 10', icon: Award },
  ]

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

        <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
          <span>
            Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
          </span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={fetchLeaderboard}
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
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="text-green-400 mb-4">
              <Trophy size={48} />
            </motion.div>
            <p className="text-green-400 text-lg">Loading leaderboard...</p>
          </motion.div>
        ) : error ? (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-red-500/10 border border-red-500/30 rounded-lg p-8 text-center">
            <p className="text-red-400 text-lg mb-4">Failed to load leaderboard</p>
            <p className="text-gray-400 text-sm mb-4">{error}</p>
            <button onClick={fetchLeaderboard} className="btn-neon px-6 py-2">Try Again</button>
          </motion.div>
        ) : (
          <motion.div key={selectedTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
            {selectedTab === 'all' && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">All Players ({leaderboardData.length})</h2>
                <div className="space-y-3">
                  {leaderboardData.map((entry, index) => renderLeaderboardEntry(entry, index))}
                </div>
              </div>
            )}

            {selectedTab === 'top10' && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-white">Top 10 Players</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {leaderboardData.slice(0, 10).map((entry, index) => (
                    <motion.div key={`${entry.address || index}-${entry.rank || index}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1 }} className={`bg-gray-800/50 border rounded-lg p-6 text-center ${ entry.rank === 1 ? 'border-yellow-400/50 bg-yellow-400/10' : entry.rank === 2 ? 'border-gray-400/50 bg-gray-400/10' : entry.rank === 3 ? 'border-orange-400/50 bg-orange-400/10' : 'border-gray-700' }`}>
                      <div className={`text-4xl mb-3 ${getRankColor(entry.rank)}`}>{formatRank(entry.rank)}</div>
                      <div className={`font-semibold mb-1 ${isConnected && user?.address === entry.address ? 'text-green-400' : 'text-white'}`}>{entry.username}</div>
                      <div className="text-sm text-gray-400 mb-3">{entry.address ? `${entry.address.slice(0,6)}...${entry.address.slice(-4)}` : '—'}</div>
                      <div className={`text-2xl font-bold ${getScoreColor(entry.score)}`}>{entry.formattedScore}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Leaderboard
