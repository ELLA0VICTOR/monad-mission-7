import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gamepad2, Trophy, ShoppingCart, User, LogOut } from 'lucide-react'
import { useMonadGames } from '../hooks/useMonadGames'
import WalletConnect from '../components/UI/WalletConnect'

const Header = ({ onViewChange, currentView }) => {
  const { isConnected, user, playerStats, disconnectWallet } = useMonadGames()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const navigationItems = [
    { id: 'game', label: 'Game', icon: Gamepad2 },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'shop', label: 'NFT Shop', icon: ShoppingCart },
  ]

  const handleNavClick = (viewId) => {
    onViewChange(viewId)
  }

  return (
    <header className="bg-gray-900/80 border-b border-green-400/30 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => handleNavClick('game')}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-400 rounded-lg flex items-center justify-center">
              <Gamepad2 size={20} className="text-black" />
            </div>
            <h1 className="text-xl font-bold text-green-400">Neon Runner</h1>
          </motion.div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigationItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleNavClick(id)}
                className={`flex items-center space-x-2 text-sm font-medium transition-colors ${
                  currentView === id
                    ? 'text-green-400'
                    : 'text-gray-400 hover:text-green-300'
                }`}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* Wallet + User */}
          <div className="flex items-center space-x-4">
            {!isConnected ? (
              <WalletConnect />
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu((prev) => !prev)}
                  className="flex items-center space-x-2 text-sm font-medium text-green-400 hover:text-green-300"
                >
                  <User size={18} />
                  <span>{user?.displayName ?? 'Player'}</span>
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-gray-800 border border-green-400/30 rounded-lg shadow-lg overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 border-b border-gray-700">
                        <p className="text-xs text-gray-400">Wallet</p>
                        <p className="text-sm font-medium text-green-400 truncate">
                          {user?.address}
                        </p>
                        <p className="text-xs text-gray-500">
                          Score: {playerStats?.highScore ?? 0}
                        </p>
                      </div>
                      <button
                        onClick={disconnectWallet}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                      >
                        <LogOut size={16} className="mr-2" />
                        Disconnect
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
