import React from 'react'
import { motion } from 'framer-motion'
import { Gamepad2, User, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react'
import { useMonadGames } from '../../hooks/useMonadGames'
import { MONADGAMES_CONFIG } from '../../utils/monadgames-config'

const MonadGamesIDStatus = () => {
  const { 
    isConnected, 
    monadGamesUser, 
    monadGamesAddress, 
    connecting,
    connectMonadGamesID 
  } = useMonadGames()

  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 border border-gray-600 rounded-lg p-4"
      >
        <div className="flex items-center space-x-3 mb-3">
          <Gamepad2 size={20} className="text-purple-400" />
          <h3 className="text-lg font-semibold text-white">MonadGames ID</h3>
        </div>
        <p className="text-gray-400 text-sm mb-4">
          Connect your MonadGames ID to submit scores to the global leaderboard and access NFT powerups.
        </p>
        <button
          onClick={connectMonadGamesID}
          disabled={connecting}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {connecting ? 'Connecting...' : 'Connect MonadGames ID'}
        </button>
      </motion.div>
    )
  }

  if (!monadGamesAddress) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4"
      >
        <div className="flex items-center space-x-3 mb-3">
          <AlertCircle size={20} className="text-yellow-400" />
          <h3 className="text-lg font-semibold text-yellow-400">MonadGames ID Connected</h3>
        </div>
        <p className="text-yellow-300 text-sm mb-4">
          Your MonadGames ID is connected, but we couldn't retrieve your wallet address. Please try refreshing the page.
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-green-900/20 border border-green-600/30 rounded-lg p-4"
    >
      <div className="flex items-center space-x-3 mb-3">
        <CheckCircle size={20} className="text-green-400" />
        <h3 className="text-lg font-semibold text-green-400">MonadGames ID Active</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-300 text-sm">Wallet Address:</span>
          <span className="text-green-400 font-mono text-sm">
            {monadGamesAddress.slice(0, 6)}...{monadGamesAddress.slice(-4)}
          </span>
        </div>
        
        {monadGamesUser?.username ? (
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-sm">Username:</span>
            <span className="text-green-400 font-medium">{monadGamesUser.username}</span>
          </div>
        ) : (
          <div className="bg-yellow-900/30 border border-yellow-600/30 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <User size={16} className="text-yellow-400" />
              <span className="text-yellow-400 font-medium text-sm">No Username Set</span>
            </div>
            <p className="text-yellow-300 text-xs mb-3">
              Register a username to appear on the global leaderboard with your chosen name.
            </p>
            <a
              href={MONADGAMES_CONFIG.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors"
            >
              <span>Register Username</span>
              <ExternalLink size={14} />
            </a>
          </div>
        )}
        
        <div className="pt-3 border-t border-green-600/30">
          <div className="flex items-center space-x-2">
            <Gamepad2 size={16} className="text-purple-400" />
            <span className="text-purple-400 text-sm font-medium">
              Ready to play and submit scores!
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default MonadGamesIDStatus
