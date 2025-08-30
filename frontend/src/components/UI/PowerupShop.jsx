import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Zap, Shield, Crown, Star, Wallet, Info, Clock, AlertCircle } from 'lucide-react'
import { usePowerups } from '../../hooks/usePowerups'
import { useMonadGames } from '../../hooks/useMonadGames'
import toast from 'react-hot-toast' // <- missing import fixed

const PowerupShop = () => {
  const {
    shopData,
    powerupStats,
    ownedPowerups,
    isLoading,
    isMinting,
    buyPowerup,
    canAfford,
    formatPrice,
    getPowerupDescription,
    getPowerupIcon
  } = usePowerups()

  // Use MonadGames connection state instead of generic wallet
  const { 
    isConnected: monadConnected, 
    user: monadUser, 
    monadGamesAddress,
    connectMonadGamesID 
  } = useMonadGames()
  
  const [selectedPowerup, setSelectedPowerup] = useState(null)
  const [selectedTab, setSelectedTab] = useState('shop') // shop, inventory, stats

  const tabs = [
    { id: 'shop', label: 'Shop', icon: ShoppingCart },
    { id: 'inventory', label: 'My NFTs', icon: Star },
    { id: 'stats', label: 'Statistics', icon: Info }
  ]

  const handleBuyPowerup = async (powerupType) => {
    if (!monadConnected) {
      toast.error('Please connect with MonadGames ID first')
      return
    }

    try {
      const success = await buyPowerup(powerupType)
      if (success) {
        toast.success(`${powerupType.replace('_',' ')} purchased!`)
        console.log(`Successfully purchased ${powerupType} with MonadGames ID wallet`)
      }
    } catch (err) {
      console.error('handleBuyPowerup error', err)
      toast.error('Purchase failed')
    }
  }

  const renderPowerupCard = (powerup, isOwned = false) => (
    <motion.div
      key={powerup.type}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className={`bg-gradient-to-br from-gray-800 to-gray-900 border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 ${
        selectedPowerup?.type === powerup.type
          ? 'border-green-400 shadow-lg shadow-green-400/20'
          : 'border-gray-600 hover:border-gray-500'
      }`}
      onClick={() => setSelectedPowerup(powerup)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl border-2"
            style={{ 
              backgroundColor: `${powerup.color}20`,
              borderColor: `${powerup.color}50`,
              color: powerup.color
            }}
          >
            {powerup.icon}
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">{powerup.name}</h3>
            {isOwned && (
              <span className="text-xs bg-green-400 text-black px-2 py-1 rounded-full">
                OWNED: {powerup.owned}
              </span>
            )}
          </div>
        </div>
        
        {!isOwned && (
          <div className="text-right">
            <div className="text-2xl font-bold text-green-400">
              {formatPrice(powerup.price)}
            </div>
            <div className="text-xs text-gray-400">per NFT</div>
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-gray-400 text-sm mb-4 leading-relaxed">
        {powerup.description}
      </p>

      {/* Duration */}
      <div className="flex items-center text-xs text-gray-500 mb-4">
        <Clock size={12} className="mr-1" />
        Duration: {(powerup.duration / 1000).toFixed(0)} seconds
      </div>

      {/* Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => {
          e.stopPropagation()
          if (!isOwned) {
            handleBuyPowerup(powerup.type)
          }
        }}
        disabled={!monadConnected || isMinting || isOwned}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
          isOwned
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : !monadConnected
            ? 'bg-blue-600 hover:bg-blue-500 text-white'
            : 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white'
        }`}
      >
        {isMinting ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Zap size={16} />
            </motion.div>
            <span>Purchasing...</span>
          </>
        ) : isOwned ? (
          <span>Owned</span>
        ) : !monadConnected ? (
          <>
            <Wallet size={16} />
            <span>Connect MonadGames ID</span>
          </>
        ) : (
          <>
            <ShoppingCart size={16} />
            <span>Buy with MonadGames ID</span>
          </>
        )}
      </motion.button>
    </motion.div>
  )

  const renderInventory = () => (
    <div className="space-y-6">
      {ownedPowerups.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🎒</div>
          <h3 className="text-xl font-semibold text-gray-400 mb-2">
            No Powerups Yet
          </h3>
          <p className="text-gray-500 mb-6">
            Purchase your first powerup NFT to get started!
          </p>
          <button
            onClick={() => setSelectedTab('shop')}
            className="btn-neon px-6 py-3"
          >
            Browse Shop
          </button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white">
              Your Powerup Collection
            </h2>
            <div className="text-green-400">
              {ownedPowerups.length} NFTs owned
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shopData.filter(p => p.owned > 0).map(powerup => 
              renderPowerupCard(powerup, true)
            )}
          </div>
        </>
      )}
    </div>
  )

  const renderStats = () => (
    <div className="space-y-6">
      {/* Collection Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-green-400 mb-2">
            {powerupStats.total}
          </div>
          <div className="text-sm text-gray-400">Total NFTs</div>
        </div>
        
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-blue-400 mb-2">
            {Object.keys(powerupStats.byType).length}
          </div>
          <div className="text-sm text-gray-400">Types Owned</div>
        </div>
        
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-purple-400 mb-2">
            {powerupStats.totalValue.toFixed(3)}
          </div>
          <div className="text-sm text-gray-400">Total Value (MON)</div>
        </div>
        
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 text-center">
          <div className="text-3xl font-bold text-orange-400 mb-2">
            {shopData.length}
          </div>
          <div className="text-sm text-gray-400">Available Types</div>
        </div>
      </div>

      {/* Collection Breakdown */}
      {Object.keys(powerupStats.byType).length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Collection Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(powerupStats.byType).map(([type, count]) => {
              const powerup = shopData.find(p => p.type === type)
              return (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{powerup?.icon || '🎮'}</span>
                    <span className="text-white">{powerup?.name || type}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400 font-semibold">{count}</span>
                    <span className="text-gray-400 text-sm">NFTs</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Rarity Information */}
      <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-purple-400 mb-4 flex items-center">
          <Crown className="mr-2" size={20} />
          NFT Rarity & Benefits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="text-white font-semibold mb-2">Ownership Benefits:</h4>
            <ul className="space-y-1 text-gray-400">
              <li>• Permanent powerup access</li>
              <li>• Tradeable on secondary markets</li>
              <li>• Exclusive holder rewards</li>
              <li>• Priority access to new features</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-2">Future Utility:</h4>
            <ul className="space-y-1 text-gray-400">
              <li>• Tournament entry tickets</li>
              <li>• Governance voting rights</li>
              <li>• Staking rewards</li>
              <li>• Cross-game compatibility</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-green-400 neon-text mb-4">
          Powerup NFT Shop
        </h1>
        <p className="text-gray-400 mb-6">
          Purchase permanent powerup NFTs with your MonadGames ID wallet
        </p>
      </motion.div>

      {/* MonadGames Connection Status */}
      {monadConnected && monadGamesAddress && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center"
        >
          <div className="flex items-center justify-center space-x-2 text-green-400">
            <Wallet size={16} />
            <span className="font-medium">MonadGames ID Connected</span>
          </div>
          <p className="text-green-300 text-sm mt-1">
            Wallet: {monadGamesAddress ? `${monadGamesAddress.slice(0,6)}...${monadGamesAddress.slice(-4)}` : '—'}
          </p>
          <p className="text-gray-400 text-xs mt-2">
            NFT purchases will be charged directly from your MonadGames ID wallet
          </p>
        </motion.div>
      )}

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
        <motion.div
          key={selectedTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {selectedTab === 'shop' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-white">Available Powerups</h2>
                {monadConnected && (
                  <div className="text-green-400 flex items-center space-x-2">
                    <Wallet size={16} />
                    <span>MonadGames ID Ready</span>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {shopData.map(powerup => renderPowerupCard(powerup))}
              </div>

              {/* Information about seamless purchases */}
              {monadConnected && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4"
                >
                  <div className="flex items-center space-x-2 text-blue-400 mb-2">
                    <Info size={16} />
                    <span className="font-medium">Seamless Purchasing</span>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Your purchases will be automatically charged from your connected MonadGames ID wallet. 
                    No additional wallet popups required!
                  </p>
                </motion.div>
              )}
            </div>
          )}

          {selectedTab === 'inventory' && renderInventory()}
          {selectedTab === 'stats' && renderStats()}
        </motion.div>
      </AnimatePresence>

      {/* MonadGames ID Connection prompt */}
      {!monadConnected && selectedTab === 'shop' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-8 text-center"
        >
          <Wallet className="text-blue-400 w-16 h-16 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-blue-400 mb-4">
            Connect MonadGames ID
          </h3>
          <p className="text-gray-400 mb-6">
            Connect your MonadGames ID to purchase and manage your powerup NFTs
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={connectMonadGamesID}
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-500 hover:to-green-500 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center space-x-2 mx-auto"
          >
            <Wallet size={16} />
            <span>Sign in with MonadGames ID</span>
          </motion.button>
        </motion.div>
      )}

      {/* Powerup Details Modal */}
      <AnimatePresence>
        {selectedPowerup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedPowerup(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 border border-green-400/50 rounded-xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div 
                  className="w-20 h-20 rounded-xl flex items-center justify-center text-4xl border-2 mx-auto mb-4"
                  style={{ 
                    backgroundColor: `${selectedPowerup.color}20`,
                    borderColor: `${selectedPowerup.color}50`,
                    color: selectedPowerup.color
                  }}
                >
                  {selectedPowerup.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {selectedPowerup.name}
                </h3>
                <p className="text-gray-400 mb-4">
                  {selectedPowerup.description}
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-400">Effect Duration:</span>
                  <span className="text-white">{(selectedPowerup.duration / 1000).toFixed(0)}s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Price:</span>
                  <span className="text-green-400 font-bold">
                    {formatPrice(selectedPowerup.price)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Owned:</span>
                  <span className="text-blue-400">{selectedPowerup.owned}</span>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setSelectedPowerup(null)}
                  className="flex-1 py-3 px-4 border border-gray-600 text-gray-400 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleBuyPowerup(selectedPowerup.type)}
                  disabled={!monadConnected || isMinting}
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white rounded-lg font-semibold disabled:opacity-50 transition-all"
                >
                  {isMinting ? 'Purchasing...' : monadConnected ? 'Buy with MonadGames ID' : 'Connect First'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PowerupShop
