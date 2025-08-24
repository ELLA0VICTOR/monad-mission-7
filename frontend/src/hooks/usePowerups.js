import { useState, useEffect, useCallback } from 'react'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { CONTRACT_ADDRESSES, POWERUP_NFT_ABI, buildMintPowerupParams } from '../utils/blockchain'
import { POWERUP_TYPES } from '../utils/constants'
import toast from 'react-hot-toast'
import { parseEther } from 'viem'

export const usePowerups = () => {
  const { address, isConnected } = useAccount()
  const [ownedPowerups, setOwnedPowerups] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isMinting, setIsMinting] = useState(false)

  // Contract interactions
  const { writeContract: mintPowerup } = useWriteContract()
  const { writeContract: usePowerup } = useWriteContract()

  // Read owned powerups from contract
  const { data: contractPowerups, refetch: refetchPowerups } = useReadContract({
    address: CONTRACT_ADDRESSES.POWERUP_NFT,
    abi: POWERUP_NFT_ABI,
    functionName: 'getPowerups',
    args: address ? [address] : undefined,
    enabled: !!address && !!CONTRACT_ADDRESSES.POWERUP_NFT && CONTRACT_ADDRESSES.POWERUP_NFT !== '0x0000000000000000000000000000000000000000',
  })

  // Process owned powerups
  useEffect(() => {
    if (contractPowerups && Array.isArray(contractPowerups)) {
      const powerups = contractPowerups.map((tokenId, index) => ({
        tokenId: Number(tokenId),
        type: getPowerupTypeFromId(Number(tokenId)),
        index,
        isUsed: false // This would need to be tracked in the contract
      }))
      setOwnedPowerups(powerups)
    } else {
      setOwnedPowerups([])
    }
  }, [contractPowerups])

  // Get powerup type from token ID (this depends on your contract implementation)
  const getPowerupTypeFromId = (tokenId) => {
    // Simple mapping - adjust based on your contract logic
    const types = Object.keys(POWERUP_TYPES)
    return types[tokenId % types.length]
  }

  // Get powerup prices (in ETH/MON)
  const getPowerupPrices = () => ({
    SPEED_BOOST: '0.01',
    SHIELD: '0.015',
    DOUBLE_JUMP: '0.02',
    SCORE_MULTIPLIER: '0.025'
  })

  // Get powerup shop data
  const getShopData = useCallback(() => {
    const prices = getPowerupPrices()
    
    return Object.entries(POWERUP_TYPES).map(([type, config]) => ({
      type,
      name: type.replace('_', ' '),
      description: getPowerupDescription(type),
      price: prices[type] || '0.01',
      color: config.color,
      duration: config.duration,
      effect: config.effect,
      owned: ownedPowerups.filter(p => p.type === type).length,
      icon: getPowerupIcon(type)
    }))
  }, [ownedPowerups])

  // Get powerup descriptions
  const getPowerupDescription = (type) => {
    const descriptions = {
      SPEED_BOOST: 'Increases running speed by 50% for 5 seconds',
      SHIELD: 'Protects from one obstacle collision for 10 seconds',
      DOUBLE_JUMP: 'Allows double jumping for 15 seconds',
      SCORE_MULTIPLIER: 'Doubles score gain for 8 seconds'
    }
    return descriptions[type] || 'Mystery powerup'
  }

  // Get powerup icons
  const getPowerupIcon = (type) => {
    const icons = {
      SPEED_BOOST: '⚡',
      SHIELD: '🛡️',
      DOUBLE_JUMP: '🦘',
      SCORE_MULTIPLIER: '✨'
    }
    return icons[type] || '🎮'
  }

  // Mint powerup NFT
  const buyPowerup = useCallback(async (powerupType) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first')
      return false
    }

    if (!CONTRACT_ADDRESSES.POWERUP_NFT || CONTRACT_ADDRESSES.POWERUP_NFT === '0x0000000000000000000000000000000000000000') {
      toast.error('Powerup contract not deployed yet')
      return false
    }

    const prices = getPowerupPrices()
    const price = prices[powerupType]
    
    if (!price) {
      toast.error('Invalid powerup type')
      return false
    }

    try {
      setIsMinting(true)
      
      toast.loading('Minting powerup NFT...', {
        id: 'mint-powerup'
      })

      const powerupTypeId = Object.keys(POWERUP_TYPES).indexOf(powerupType)
      const params = buildMintPowerupParams(powerupTypeId, parseEther(price))

      await mintPowerup({
        address: CONTRACT_ADDRESSES.POWERUP_NFT,
        abi: POWERUP_NFT_ABI,
        functionName: 'mintPowerup',
        ...params,
      })

      toast.success(`${powerupType.replace('_', ' ')} NFT minted!`, {
        id: 'mint-powerup',
        icon: getPowerupIcon(powerupType),
        duration: 4000
      })

      // Refresh powerups after a delay
      setTimeout(() => {
        refetchPowerups()
      }, 2000)

      return true
    } catch (error) {
      console.error('Failed to mint powerup:', error)
      
      let errorMessage = 'Failed to mint powerup'
      if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for this powerup'
      } else if (error.message?.includes('user rejected')) {
        errorMessage = 'Transaction cancelled'
      }
      
      toast.error(errorMessage, {
        id: 'mint-powerup'
      })
      return false
    } finally {
      setIsMinting(false)
    }
  }, [isConnected, address, mintPowerup, refetchPowerups])

  // Use powerup (this would be called during gameplay)
  const activatePowerup = useCallback(async (tokenId) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first')
      return false
    }

    try {
      toast.loading('Activating powerup...', {
        id: 'use-powerup'
      })

      await usePowerup({
        address: CONTRACT_ADDRESSES.POWERUP_NFT,
        abi: POWERUP_NFT_ABI,
        functionName: 'usePowerup',
        args: [BigInt(tokenId)],
        gas: 50000n,
      })

      toast.success('Powerup activated!', {
        id: 'use-powerup',
        icon: '⚡',
        duration: 3000
      })

      // Refresh powerups
      refetchPowerups()
      
      return true
    } catch (error) {
      console.error('Failed to use powerup:', error)
      toast.error('Failed to activate powerup', {
        id: 'use-powerup'
      })
      return false
    }
  }, [isConnected, address, usePowerup, refetchPowerups])

  // Get powerup stats
  const getPowerupStats = useCallback(() => {
    const stats = {
      total: ownedPowerups.length,
      byType: {},
      totalValue: 0
    }

    const prices = getPowerupPrices()

    ownedPowerups.forEach(powerup => {
      if (!stats.byType[powerup.type]) {
        stats.byType[powerup.type] = 0
      }
      stats.byType[powerup.type]++
      stats.totalValue += parseFloat(prices[powerup.type] || '0')
    })

    return stats
  }, [ownedPowerups])

  // Check if user can afford powerup
  const canAfford = useCallback((powerupType, userBalance) => {
    const prices = getPowerupPrices()
    const price = parseFloat(prices[powerupType] || '0')
    const balance = parseFloat(userBalance || '0')
    return balance >= price
  }, [])

  // Get recommended powerups based on user's gameplay
  const getRecommendedPowerups = useCallback((gameStats) => {
    const recommendations = []
    
    if (!gameStats) return recommendations

    // Recommend based on gameplay patterns
    if (gameStats.averageScore < 1000) {
      recommendations.push({
        type: 'SHIELD',
        reason: 'Protect yourself from obstacles while learning'
      })
    }
    
    if (gameStats.averageDistance > 5000) {
      recommendations.push({
        type: 'SCORE_MULTIPLIER',
        reason: 'Boost your high scores even further'
      })
    }
    
    if (gameStats.jumpAccuracy < 0.8) {
      recommendations.push({
        type: 'DOUBLE_JUMP',
        reason: 'Give yourself more jumping options'
      })
    }
    
    recommendations.push({
      type: 'SPEED_BOOST',
      reason: 'Essential for high-speed gameplay'
    })

    return recommendations
  }, [])

  return {
    // Data
    ownedPowerups,
    shopData: getShopData(),
    powerupStats: getPowerupStats(),
    prices: getPowerupPrices(),
    
    // State
    isLoading,
    isMinting,
    isConnected,
    
    // Actions
    buyPowerup,
    activatePowerup,
    refetchPowerups,
    
    // Utils
    canAfford,
    getRecommendedPowerups,
    getPowerupDescription,
    getPowerupIcon,
    
    // Helpers
    formatPrice: (price) => `${price} MON`,
    getPowerupsByType: (type) => ownedPowerups.filter(p => p.type === type),
    hasAnyPowerups: ownedPowerups.length > 0,
    getMostOwnedPowerup: () => {
      const counts = {}
      ownedPowerups.forEach(p => {
        counts[p.type] = (counts[p.type] || 0) + 1
      })
      return Object.entries(counts).sort(([,a], [,b]) => b - a)[0]?.[0] || null
    }
  }
}