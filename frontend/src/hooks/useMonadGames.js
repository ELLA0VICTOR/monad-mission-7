// frontend/src/hooks/useMonadGames.js
import { useState, useEffect, useCallback } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import toast from 'react-hot-toast'
import {
  CONTRACT_ADDRESSES,
  NEON_RUNNER_ABI,
  buildSubmitScoreParams,
  buildSetUsernameParams,
} from '../utils/blockchain'
import { MONADGAMES_CONFIG } from '../utils/monadgames-config'

// Hook that provides connect/disconnect/submit flows for Monad Games + Privy integration
export const useMonadGames = () => {
  // Privy
  const { login, logout, authenticated, user: privyUser, getCrossAppAccounts } = usePrivy()

  // Wagmi (injected wallet state)
  const { address, isConnected: wagmiIsConnected } = useAccount()

  // Local UI / state
  const [username, setUsername] = useState('')
  const [isSubmittingScore, setIsSubmittingScore] = useState(false)
  const [playerStats, setPlayerStats] = useState({
    highScore: 0,
    totalGames: 0,
    totalDistance: 0,
  })
  const [connecting, setConnecting] = useState(false)
  const [monadGamesUser, setMonadGamesUser] = useState(null)

  // Contract write hooks (retain your existing usage)
  const { writeContract: submitScore } = useWriteContract()
  const { writeContract: setUsernameContract } = useWriteContract()

  // Contract read hooks to populate player stats / username
  const { data: contractStats } = useReadContract({
    address: CONTRACT_ADDRESSES.NEON_RUNNER_GAME,
    abi: NEON_RUNNER_ABI,
    functionName: 'getPlayerStats',
    args: address ? [address] : undefined,
    enabled: !!address && !!CONTRACT_ADDRESSES.NEON_RUNNER_GAME,
  })

  const { data: contractUsername } = useReadContract({
    address: CONTRACT_ADDRESSES.NEON_RUNNER_GAME,
    abi: NEON_RUNNER_ABI,
    functionName: 'getUsername',
    args: address ? [address] : undefined,
    enabled: !!address && !!CONTRACT_ADDRESSES.NEON_RUNNER_GAME,
  })

  useEffect(() => {
    if (contractStats) {
      setPlayerStats({
        highScore: Number(contractStats[0]) || 0,
        totalGames: Number(contractStats[1]) || 0,
        totalDistance: Number(contractStats[2]) || 0,
      })
    }
  }, [contractStats])

  useEffect(() => {
    if (contractUsername) {
      setUsername(contractUsername)
    }
  }, [contractUsername])

  // Check for MonadGames cross-app account
  useEffect(() => {
    if (authenticated && getCrossAppAccounts) {
      const checkMonadGamesAccount = async () => {
        try {
          const crossAppAccounts = getCrossAppAccounts()
          const monadAccount = (crossAppAccounts || []).find(
            account => account.providerAppId === MONADGAMES_CONFIG.crossAppId
          )
          if (monadAccount) {
            setMonadGamesUser(monadAccount)
            console.log('MonadGames account found:', monadAccount)
          }
        } catch (error) {
          console.error('Error checking cross-app accounts:', error)
        }
      }
      checkMonadGamesAccount()
    }
  }, [authenticated, getCrossAppAccounts])

  // Detect multiple injected providers and warn the user (common cause of the "ethereum" errors)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const eth = window.ethereum
    if (!eth) return

    // Some wallets expose window.ethereum.providers (array) when multiple providers present
    const providers = eth.providers || (eth && Array.isArray(eth) ? eth : undefined)
    if (providers && providers.length > 1) {
      console.warn('Multiple injected wallet providers detected:', providers)
      toast(
        'Multiple wallet extensions detected. Please disable extra wallets (Backpack/Coinbase) and keep one (e.g., MetaMask) for stable login.',
        { duration: 8000 }
      )
    }
  }, [])

  // Utility: build user object for UI (Navbar/Header expects certain shape)
  const buildDisplayUser = useCallback(() => {
    const walletAddress = address || null

    // Prefer MonadGames username, then contract username, then privy user data
    const displayName =
      monadGamesUser?.username ||
      username ||
      privyUser?.username ||
      privyUser?.discord?.username ||
      privyUser?.twitter?.username ||
      privyUser?.email?.address ||
      (walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Unknown')

    return {
      wallet: walletAddress,
      address: walletAddress,
      username: monadGamesUser?.username || username || privyUser?.username || '',
      displayName,
      email: privyUser?.email?.address,
      discord: privyUser?.discord?.username,
      twitter: privyUser?.twitter?.username,
      balance: null,
      monadGamesConnected: !!monadGamesUser,
    }
  }, [address, username, privyUser, monadGamesUser])

  // MonadGames ID specific connect flow - simplified
  const connectMonadGamesID = useCallback(async () => {
    if (connecting) {
      return { success: false, error: 'already_connecting' }
    }

    setConnecting(true)
    try {
      // Just call login - with cross_app as only method, it should show MonadGames ID
      if (!authenticated) {
        await login()
        toast.success('MonadGames ID connected successfully!')
        setConnecting(false)
        return { success: true }
      }

      setConnecting(false)
      return { success: true }
    } catch (error) {
      console.error('MonadGames ID connection error:', error)
      toast.error('Failed to connect with MonadGames ID')
      setConnecting(false)
      return { success: false, error }
    }
  }, [authenticated, login, connecting])

  // Generic connect wallet (fallback to regular login)
  const connectWallet = useCallback(
    async (provider = undefined) => {
      // If MonadGames specific connection is requested, use that flow
      if (provider && provider.includes(MONADGAMES_CONFIG.crossAppId)) {
        return connectMonadGamesID()
      }

      // Otherwise use standard connection flow
      if (connecting) {
        return { success: false, error: 'already_connecting' }
      }

      if (authenticated && address) {
        toast.success('Already connected', { icon: '✅', duration: 2000 })
        return { success: true, address }
      }

      setConnecting(true)
      try {
        if (!authenticated) {
          await login()
        }

        if (!window.ethereum || !window.ethereum.request) {
          toast.error('No injected wallet found. Please install MetaMask or a compatible wallet.')
          setConnecting(false)
          return { success: false, error: 'no_wallet' }
        }

        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
          if (accounts && accounts.length > 0) {
            toast.success('Wallet connected!', { icon: '🔗', duration: 2000 })
            setConnecting(false)
            return { success: true, address: accounts[0] }
          } else {
            toast.error('No wallet accounts returned. Please unlock your wallet.')
            setConnecting(false)
            return { success: false, error: 'no_accounts' }
          }
        } catch (reqErr) {
          console.error('eth_requestAccounts error:', reqErr)
          toast.error('Wallet permission request failed or was dismissed.')
          setConnecting(false)
          return { success: false, error: reqErr }
        }
      } finally {
        setConnecting(false)
      }
    },
    [authenticated, address, login, connecting, connectMonadGamesID]
  )

  // Provide alias names expected by Navbar/Header
  const connect = connectWallet

  // Disconnect flow (Privy logout + UI notifications)
  const disconnectWallet = useCallback(async () => {
    try {
      await logout()
      setMonadGamesUser(null)
    } catch (err) {
      console.warn('Privy logout non-fatal error:', err)
    } finally {
      toast.success('Wallet disconnected', { duration: 2000 })
    }
  }, [logout])

  const logoutAlias = disconnectWallet
  const logoutFn = logoutAlias

  // Submit score (keeps your contract interaction pattern)
  const submitGameScore = useCallback(
    async (gameStats) => {
      if (!address || !authenticated) {
        toast.error('Please connect your wallet first')
        return false
      }

      if (
        !CONTRACT_ADDRESSES.NEON_RUNNER_GAME ||
        CONTRACT_ADDRESSES.NEON_RUNNER_GAME === '0x0000000000000000000000000000000000000000'
      ) {
        toast.error('Game contract not deployed yet')
        return false
      }

      try {
        setIsSubmittingScore(true)
        const { score, distance, powerupsCollected } = gameStats
        const params = buildSubmitScoreParams(score, distance, powerupsCollected || 0)

        toast.loading('Submitting score to blockchain...', { id: 'submit-score' })

        await submitScore({
          address: CONTRACT_ADDRESSES.NEON_RUNNER_GAME,
          abi: NEON_RUNNER_ABI,
          functionName: 'submitScore',
          ...params,
        })

        toast.success(`Score submitted: ${score.toLocaleString()}!`, {
          id: 'submit-score',
          icon: '🏆',
          duration: 4000,
        })

        // Log to MonadGames ID system
        console.log('Score submitted to MonadGames ID:', {
          score,
          distance,
          powerupsCollected,
          username: monadGamesUser?.username || username,
          wallet: address
        })

        return true
      } catch (error) {
        console.error('Failed to submit score:', error)
        toast.error('Failed to submit score to blockchain', { id: 'submit-score' })
        return false
      } finally {
        setIsSubmittingScore(false)
      }
    },
    [address, authenticated, submitScore, monadGamesUser, username]
  )

  const updateUsername = useCallback(
    async (newUsername) => {
      if (!address || !authenticated) {
        toast.error('Please connect your wallet first')
        return false
      }

      if (
        !CONTRACT_ADDRESSES.NEON_RUNNER_GAME ||
        CONTRACT_ADDRESSES.NEON_RUNNER_GAME === '0x0000000000000000000000000000000000000000'
      ) {
        toast.error('Game contract not deployed yet')
        return false
      }

      if (!newUsername || newUsername.trim().length < 3) {
        toast.error('Username must be at least 3 characters long')
        return false
      }

      if (newUsername.trim().length > 20) {
        toast.error('Username must be less than 20 characters')
        return false
      }

      try {
        toast.loading('Updating username...', { id: 'update-username' })
        const params = buildSetUsernameParams(newUsername.trim())

        await setUsernameContract({
          address: CONTRACT_ADDRESSES.NEON_RUNNER_GAME,
          abi: NEON_RUNNER_ABI,
          functionName: 'setUsername',
          ...params,
        })

        setUsername(newUsername.trim())

        toast.success('Username updated successfully!', {
          id: 'update-username',
          icon: '✅',
          duration: 3000,
        })

        return true
      } catch (error) {
        console.error('Failed to update username:', error)
        toast.error('Failed to update username', { id: 'update-username' })
        return false
      }
    },
    [address, authenticated, setUsernameContract]
  )

  // react to provider / chain events (defensive)
  useEffect(() => {
    if (!window.ethereum) return

    const handleAccounts = (accounts) => {
      if (!accounts || accounts.length === 0) {
        toast('Wallet disconnected or locked', { icon: '⚠️' })
      } else {
        toast.success('Account changed', { duration: 1500 })
      }
    }

    const handleChain = (chainId) => {
      // optional: verify chainId === expected chain
    }

    try {
      window.ethereum.on('accountsChanged', handleAccounts)
      window.ethereum.on('chainChanged', handleChain)
    } catch (e) {
      console.warn('Failed to attach ethereum listeners', e)
    }

    return () => {
      try {
        window.ethereum.removeListener('accountsChanged', handleAccounts)
        window.ethereum.removeListener('chainChanged', handleChain)
      } catch (e) {}
    }
  }, [])

  const userInfo = buildDisplayUser()

  return {
    // status
    isConnected: Boolean(authenticated && address),
    address,
    user: userInfo,
    username,
    playerStats,
    monadGamesUser,
    estimatedRank: (() => {
      if (playerStats.highScore === 0) return null
      if (playerStats.highScore > 10000) return 'Top 10'
      if (playerStats.highScore > 5000) return 'Top 50'
      if (playerStats.highScore > 2000) return 'Top 100'
      if (playerStats.highScore > 500) return 'Top 500'
      return 'Unranked'
    })(),

    // loading flags
    isSubmittingScore,
    connecting,

    // actions + aliases expected by your UI
    connectWallet,
    connectMonadGamesID, // Specific MonadGames ID connect method
    connect, // alias expected by Navbar
    disconnectWallet,
    logout: logoutFn,

    // contract actions
    submitGameScore,
    updateUsername,

    // utilities
    canSubmitScore: () => Boolean(authenticated && address && CONTRACT_ADDRESSES.NEON_RUNNER_GAME),
    formatAddress: (addr) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : ''),
    isValidUsername: (name) => name && name.trim().length >= 3 && name.trim().length <= 20,
  }
}

export default useMonadGames
