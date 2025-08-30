// frontend/src/hooks/usePowerups.js
import { useState, useEffect, useCallback } from 'react'
import { useReadContract } from 'wagmi' // we keep read via wagmi for convenience
import { usePrivy, useCrossAppAccounts } from '@privy-io/react-auth'
import { CONTRACT_ADDRESSES, POWERUP_NFT_ABI, buildMintPowerupParams } from '../utils/blockchain'
import { POWERUP_TYPES } from '../utils/constants'
import { useMonadGames } from './useMonadGames'
import toast from 'react-hot-toast'
import { parseEther } from 'viem'

// monad wallet helpers you already included
import {
  createMonadWalletClient,
  getEmbeddedWalletFromPrivy,
  estimateGasForMint,
  checkBalance,
  formatBalance
} from '../utils/monadWalletUtils'

export const usePowerups = () => {
  // MonadGames connection info
  const { monadGamesAddress, isConnected: monadConnected } = useMonadGames()

  // Privy context + cross-app helper
  const { authenticated, user: privyUser } = usePrivy()
  const { getCrossAppAccounts } = useCrossAppAccounts ? useCrossAppAccounts() : { getCrossAppAccounts: null }

  const [ownedPowerups, setOwnedPowerups] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isMinting, setIsMinting] = useState(false)

  // embeddedSigner will hold { embeddedWallet, walletClient } when available
  const [embeddedSigner, setEmbeddedSigner] = useState(null)

  // Read owned powerups from contract using MonadGames address
  const activeAddress = monadGamesAddress
  const { data: contractPowerups, refetch: refetchPowerups } = useReadContract({
    address: CONTRACT_ADDRESSES.POWERUP_NFT,
    abi: POWERUP_NFT_ABI,
    functionName: 'getPowerups',
    args: activeAddress ? [activeAddress] : undefined,
    enabled: !!activeAddress && !!CONTRACT_ADDRESSES.POWERUP_NFT && CONTRACT_ADDRESSES.POWERUP_NFT !== '0x0000000000000000000000000000000000000000',
  })

  // Build embedded signer from Privy cross-app accounts (robust, same logic as useMonadGames)
  useEffect(() => {
    const setupEmbeddedSigner = async () => {
      if (!authenticated || !monadGamesAddress) {
        setEmbeddedSigner(null)
        return
      }

      try {
        // Try utility that will use privyUser or getCrossAppAccounts
        const embeddedWallet = await getEmbeddedWalletFromPrivy(privyUser, getCrossAppAccounts)
        if (!embeddedWallet) {
          console.warn('[usePowerups] no embedded wallet found from Privy')
          setEmbeddedSigner(null)
          return
        }

        // Create a viem wallet client from the embedded wallet provider
        const walletClient = await createMonadWalletClient(embeddedWallet)

        // Quick-check: can we read balance?
        try {
          const bal = await walletClient.getBalance({ address: monadGamesAddress })
          console.log('[usePowerups] embedded wallet balance:', formatBalance(bal))
        } catch (e) {
          console.warn('[usePowerups] embedded wallet exists but balance read failed', e)
        }

        setEmbeddedSigner({ embeddedWallet, walletClient })
        console.log('[usePowerups] embedded signer configured for', monadGamesAddress)
      } catch (err) {
        console.error('[usePowerups] Failed to setup embedded signer:', err)
        setEmbeddedSigner(null)
      }
    }

    setupEmbeddedSigner()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, monadGamesAddress, privyUser, getCrossAppAccounts])

  // Process owned powerups
  useEffect(() => {
    if (contractPowerups && Array.isArray(contractPowerups)) {
      const powerups = contractPowerups.map((tokenId, index) => ({
        tokenId: Number(tokenId),
        type: getPowerupTypeFromId(Number(tokenId)),
        index,
        isUsed: false
      }))
      setOwnedPowerups(powerups)
    } else {
      setOwnedPowerups([])
    }
  }, [contractPowerups])

  // Helper: derive powerup type (adjust if your NFT encoding differs)
  const getPowerupTypeFromId = (tokenId) => {
    const types = Object.keys(POWERUP_TYPES)
    return types[tokenId % types.length]
  }

  // Prices (MON)
  const getPowerupPrices = () => ({
    SPEED: '0.01',
    SHIELD: '0.015',
    DOUBLE_JUMP: '0.02',
    MULTIPLIER: '0.025'
  })

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

  const getPowerupDescription = (type) => {
    const descriptions = {
      SPEED: 'Increases running speed by 50% for 5 seconds',
      SHIELD: 'Protects from one obstacle collision for 10 seconds',
      DOUBLE_JUMP: 'Allows double jumping for 15 seconds',
      MULTIPLIER: 'Doubles score gain for 8 seconds'
    }
    return descriptions[type] || 'Mystery powerup'
  }

  const getPowerupIcon = (type) => {
    const icons = {
      SPEED: '⚡',
      SHIELD: '🛡️',
      DOUBLE_JUMP: '🦘',
      MULTIPLIER: '✨'
    }
    return icons[type] || '🎮'
  }

  // BUY: Use embedded wallet client to call contract directly (no injected wallet)
  const buyPowerup = useCallback(async (powerupType) => {
    if (!monadConnected || !monadGamesAddress) {
      toast.error('Please connect with MonadGames ID first')
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

    if (!embeddedSigner || !embeddedSigner.walletClient) {
      toast.error('MonadGames embedded wallet not available for signing transactions')
      console.warn('[usePowerups] buyPowerup aborted: no embeddedSigner', { embeddedSigner })
      return false
    }

    const powerupTypeMapping = {
      'SPEED': 0,
      'SHIELD': 1,
      'DOUBLE_JUMP': 2,
      'MULTIPLIER': 3
    }

    const powerupTypeId = powerupTypeMapping[powerupType]
    if (powerupTypeId === undefined) {
      toast.error('Invalid powerup mapping')
      return false
    }

    try {
      setIsMinting(true)
      toast.loading('Purchasing powerup with MonadGames ID wallet...', { id: 'mint-powerup' })

      // parse price to BigInt (viem's parseEther returns bigint)
      const value = parseEther(price) // bigint

      // OPTIONAL: check balance first
      try {
        const hasBalance = await checkBalance(embeddedSigner.walletClient, monadGamesAddress, value)
        if (!hasBalance) {
          const bal = await embeddedSigner.walletClient.getBalance({ address: monadGamesAddress }).catch(()=>0n)
          toast.error(`Insufficient MON. Balance: ${formatBalance(bal)} MON. Need ${price} MON.` , { id: 'mint-powerup' })
          setIsMinting(false)
          return false
        }
      } catch (balErr) {
        console.warn('[usePowerups] balance check failed', balErr)
        // continue and let the transaction fail if needed
      }

      // Estimate gas (optional)
      let gasLimit = 120000n
      try {
        gasLimit = await estimateGasForMint(embeddedSigner.walletClient, CONTRACT_ADDRESSES.POWERUP_NFT, POWERUP_NFT_ABI, powerupTypeId, value)
      } catch (e) {
        console.warn('[usePowerups] gas estimate failed', e)
      }

      // Perform the write using the embedded wallet client (viem)
      // NOTE: walletClient.writeContract typically expects args as primitives/BigInt
      const tx = await embeddedSigner.walletClient.writeContract({
        address: CONTRACT_ADDRESSES.POWERUP_NFT,
        abi: POWERUP_NFT_ABI,
        functionName: 'mintPowerup',
        args: [BigInt(powerupTypeId)],
        value: BigInt(value),
        // some viem providers accept a gas limit override as 'gas' or 'gasLimit'
        // gas: gasLimit
      })

      console.log('[usePowerups] mint tx sent via embedded wallet:', tx)
      toast.success(`${powerupType.replace('_', ' ')} NFT purchased with MonadGames ID!`, { id: 'mint-powerup', duration: 4000 })

      // refetch owned powerups after a short delay to let chain indexer run
      setTimeout(() => {
        refetchPowerups()
      }, 3000)

      return true
    } catch (error) {
      console.error('[usePowerups] Failed to mint powerup with embedded wallet:', error)
      let errorMessage = 'Failed to purchase powerup'
      if (String(error).includes('insufficient funds')) {
        errorMessage = `Insufficient MON in your MonadGames ID wallet. Need ${price} MON.`
      } else if (String(error).toLowerCase().includes('user rejected')) {
        errorMessage = 'Transaction cancelled'
      }
      toast.error(errorMessage, { id: 'mint-powerup' })
      return false
    } finally {
      setIsMinting(false)
    }
  }, [monadConnected, monadGamesAddress, embeddedSigner, refetchPowerups])

  // Activate powerup (this can still use contract writes if you want; we attempt embedded client too)
  const activatePowerup = useCallback(async (tokenId) => {
    if (!monadConnected || !monadGamesAddress) {
      toast.error('Please connect MonadGames ID first')
      return false
    }
    if (!embeddedSigner || !embeddedSigner.walletClient) {
      toast.error('MonadGames embedded wallet not available')
      return false
    }

    try {
      toast.loading('Activating powerup...', { id: 'use-powerup' })
      await embeddedSigner.walletClient.writeContract({
        address: CONTRACT_ADDRESSES.POWERUP_NFT,
        abi: POWERUP_NFT_ABI,
        functionName: 'usePowerup',
        args: [BigInt(tokenId)],
      })
      toast.success('Powerup activated!', { id: 'use-powerup' })
      refetchPowerups()
      return true
    } catch (err) {
      console.error('Failed to use powerup:', err)
      toast.error('Failed to activate powerup', { id: 'use-powerup' })
      return false
    }
  }, [monadConnected, monadGamesAddress, embeddedSigner, refetchPowerups])

  const getPowerupStats = useCallback(() => {
    const stats = { total: ownedPowerups.length, byType: {}, totalValue: 0 }
    const prices = getPowerupPrices()
    ownedPowerups.forEach(powerup => {
      stats.byType[powerup.type] = (stats.byType[powerup.type] || 0) + 1
      stats.totalValue += parseFloat(prices[powerup.type] || '0')
    })
    return stats
  }, [ownedPowerups])

  const canAfford = useCallback((powerupType, userBalance) => {
    const prices = getPowerupPrices()
    const price = parseFloat(prices[powerupType] || '0')
    const balance = parseFloat(userBalance || '0')
    return balance >= price
  }, [])

  const getRecommendedPowerups = useCallback((gameStats) => {
    const recommendations = []
    if (!gameStats) return recommendations
    if (gameStats.averageScore < 1000) recommendations.push({ type: 'SHIELD', reason: 'Protect yourself from obstacles while learning' })
    if (gameStats.averageDistance > 5000) recommendations.push({ type: 'MULTIPLIER', reason: 'Boost your high scores' })
    if (gameStats.jumpAccuracy < 0.8) recommendations.push({ type: 'DOUBLE_JUMP', reason: 'More jumping options' })
    recommendations.push({ type: 'SPEED', reason: 'Essential for high-speed gameplay' })
    return recommendations
  }, [])

  return {
    ownedPowerups,
    shopData: getShopData(),
    powerupStats: getPowerupStats(),
    prices: getPowerupPrices(),
    isLoading,
    isMinting,
    isConnected: monadConnected,
    address: monadGamesAddress,
    buyPowerup,
    activatePowerup,
    refetchPowerups,
    canAfford,
    getRecommendedPowerups,
    getPowerupDescription,
    getPowerupIcon,
    formatPrice: (price) => `${price} MON`,
    getPowerupsByType: (type) => ownedPowerups.filter(p => p.type === type),
    hasAnyPowerups: ownedPowerups.length > 0,
  }
}

export default usePowerups
