import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Gamepad2, Trophy, ShoppingCart, User, LogOut, GamepadIcon } from 'lucide-react'
import { useMonadGames } from '../hooks/useMonadGames'
import WalletConnect from '../components/UI/WalletConnect'

const Header = ({ onViewChange, currentView }) => {
  const { isConnected, user, playerStats, disconnectWallet, monadGamesUser, monadGamesAddress } = useMonadGames()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const navigationItems = [
    { id: 'game', label: 'Game', icon: Gamepad2 },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'shop', label: 'NFT Shop', icon: ShoppingCart },
  ]

  const handleNavClick = (viewId) => {
    onViewChange(viewId)
  }

  // Get the best display name - prefer MonadGames username
  const getDisplayName = () => {
    if (monadGamesUser?.username) {
      return monadGamesUser.username
    }
    return user?.displayName ?? 'Player'
  }

  // Get the best wallet address - prefer MonadGames address
  const getWalletAddress = () => {
    return monadGamesAddress || user?.address || 'Unknown'
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
                  {monadGamesUser ? (
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <GamepadIcon size={14} className="text-white" />
                    </div>
                  ) : (
                    <User size={18} />
                  )}
                  <span>{getDisplayName()}</span>
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-56 bg-gray-800 border border-green-400/30 rounded-lg shadow-lg overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 border-b border-gray-700">
                        {monadGamesUser ? (
                          <>
                            <div className="flex items-center space-x-2 mb-2">
                              <GamepadIcon size={14} className="text-purple-400" />
                              <span className="text-xs text-purple-400 font-medium">MonadGames ID</span>
                            </div>
                            <p className="text-sm font-medium text-green-400">
                              {monadGamesUser.username || 'No Username'}
                            </p>
                            {!monadGamesUser.username && (
                              <a
                                href="https://monad-games-id-site.vercel.app"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-400 hover:text-blue-300 underline"
                              >
                                Register Username
                              </a>
                            )}
                          </>
                        ) : (
                          <p className="text-xs text-gray-400">Wallet</p>
                        )}
                        <p className="text-sm font-medium text-green-400 truncate mt-1">
                          {getWalletAddress()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
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
