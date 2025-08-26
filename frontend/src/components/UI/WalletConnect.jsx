import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gamepad2, Zap, Shield, AlertCircle } from 'lucide-react'
import { useMonadGames } from '../../hooks/useMonadGames'

const WalletConnect = ({ className = '' }) => {
  const { connectMonadGamesID, isConnected, monadGamesUser } = useMonadGames()
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    try {
      setIsConnecting(true)
      await connectMonadGamesID()
    } catch (error) {
      console.error('Failed to connect MonadGames ID:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  if (isConnected) return null

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleConnect}
        disabled={isConnecting}
        className="btn-neon px-6 py-3 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500"
      >
        {isConnecting ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Zap size={20} />
            </motion.div>
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <Gamepad2 size={20} />
            <span>🔗 Sign in with MonadGames ID</span>
          </>
        )}
      </motion.button>

      <div className="relative group">
        <AlertCircle size={16} className="text-gray-400 cursor-help" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -10 }}
          whileHover={{ opacity: 1, scale: 1, y: 0 }}
          className="absolute right-0 top-8 w-72 bg-gray-800 border border-gray-600 rounded-lg p-4 text-xs text-gray-300 shadow-xl z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
        >
          <div className="flex items-center space-x-2 mb-3">
            <Shield size={14} className="text-green-400" />
            <span className="font-semibold text-green-400">MonadGames ID Benefits</span>
          </div>
          <ul className="space-y-1.5 mb-3">
            <li>• Submit scores to global leaderboard</li>
            <li>• Purchase and use NFT powerups</li>
            <li>• Track your game statistics across all Monad games</li>
            <li>• Compete with players worldwide</li>
            <li>• Access your wallet across Monad ecosystem</li>
          </ul>
          <div className="pt-2 border-t border-gray-700">
            <div className="flex items-center space-x-2">
              <Gamepad2 size={12} className="text-purple-400" />
              <span className="text-purple-400 font-medium">Powered by MonadGames ID</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Secure cross-app wallet integration
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default WalletConnect