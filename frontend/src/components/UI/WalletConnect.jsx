import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, Zap, Shield, AlertCircle } from 'lucide-react'
import { useMonadGames } from '../../hooks/useMonadGames'

const WalletConnect = ({ className = '' }) => {
  const { connectWallet, isConnected } = useMonadGames()
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    try {
      setIsConnecting(true)
      await connectWallet()
    } catch (error) {
      console.error('Failed to connect wallet:', error)
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
        className="btn-neon px-6 py-3 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <Wallet size={20} />
            <span>Connect Wallet</span>
          </>
        )}
      </motion.button>

      
      <div className="relative group">
        <AlertCircle size={16} className="text-gray-400 cursor-help" />
        
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className="absolute right-0 top-8 w-64 bg-gray-800 border border-gray-600 rounded-lg p-3 text-xs text-gray-300 shadow-xl z-50 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
          >
            <div className="flex items-center space-x-2 mb-2">
              <Shield size={14} className="text-green-400" />
              <span className="font-semibold text-green-400">Why Connect?</span>
            </div>
            <ul className="space-y-1">
              <li>• Submit scores to global leaderboard</li>
              <li>• Purchase and use NFT powerups</li>
              <li>• Track your game statistics</li>
              <li>• Compete with other players</li>
            </ul>
            <div className="mt-2 pt-2 border-t border-gray-700">
              <span className="text-yellow-400">Powered by Monad Games ID</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default WalletConnect
