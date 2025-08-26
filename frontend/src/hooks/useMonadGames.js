// frontend/src/hooks/useMonadGames.js
import { useState, useEffect, useCallback } from 'react'
import { usePrivy, useCrossAppAccounts } from '@privy-io/react-auth'
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
  const { login, logout, authenticated, user: privyUser } = usePrivy()
  
  // THIS IS THE KEY FIX: Use useCrossAppAccounts hook
  const { loginWithCrossAppAccount, linkCrossAppAccount } = useCrossAppAccounts()

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

  // FIXED: Check for MonadGames cross-app account properly
  useEffect(() => {
    if (authenticated && privyUser && privyUser.linkedAccounts) {
      const monadAccount = privyUser.linkedAccounts.find(
        account => account.type === 'cross_app' && 
        account.providerApp.id === MONADGAMES_CONFIG.crossAppId
      )
      
      if (monadAccount) {
        setMonadGamesUser({
          username: monadAccount.username || null,
          walletAddress: monadAccount.embeddedWallets?.[0]?.address || null,
          providerApp: monadAccount.providerApp
        })
        console.log('MonadGames account found:', monadAccount)
        toast.success('MonadGames ID connected!', { icon: '🎮' })
      } else {
        setMonadGamesUser(null)
      }
    } else {
      setMonadGamesUser(null)
    }
  }, [authenticated, privyUser])

  // Utility: build user object for UI (Navbar/Header expects certain shape)
  const buildDisplayUser = useCallback(() => {
    const walletAddress = address || monadGamesUser?.walletAddress || null

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

  // FIXED: MonadGames ID specific connect flow
  const connectMonadGamesID = useCallback(async () => {
    if (connecting) {
      return { success: false, error: 'already_connecting' }
    }

    setConnecting(true)
    try {
      // If user is not authenticated at all, first get them authenticated
      if (!authenticated) {
        await login()
      }

      // Now try to link/login with MonadGames ID cross-app account
      try {
        await loginWithCrossAppAccount({ appId: MONADGAMES_CONFIG.crossAppId })
        toast.success('MonadGames ID connected successfully!', { icon: '🎮' })
        setConnecting(false)
        return { success: true }
      } catch (crossAppError) {
        console.log('loginWithCrossAppAccount failed, trying linkCrossAppAccount:', crossAppError)
        
        // If loginWithCrossAppAccount fails, try linkCrossAppAccount
        try {
          await linkCrossAppAccount({ appId: MONADGAMES_CONFIG.crossAppId })
          toast.success('MonadGames ID linked successfully!', { icon: '🎮' })
          setConnecting(false)
          return { success: true }
        } catch (linkError) {
          console.error('Both loginWithCrossAppAccount and linkCrossAppAccount failed:', linkError)
          toast.error('Failed to connect with MonadGames ID. Please make sure you have a MonadGames ID account.')
          setConnecting(false)
          return { success: false, error: linkError }
        }
      }
    } catch (error) {
      console.error('MonadGames ID connection error:', error)
      toast.error('Failed to connect with MonadGames ID')
      setConnecting(false)
      return { success: false, error }
    }
  }, [authenticated, login, loginWithCrossAppAccount, linkCrossAppAccount, connecting])

  // Generic connect wallet (fallback to regular login)
  const connectWallet = useCallback(async () => {
    // For MonadGames integration, always use the MonadGames ID flow
    return connectMonadGamesID()
  }, [connectMonadGamesID])

  // Provide alias names expected by Navbar/Header
  const connect = connectWallet

  // Disconnect flow (Privy logout + UI notifications)
  const disconnectWallet = useCallback(async () => {
    try {
      await logout()
      setMonadGamesUser(null)
      toast.success('Disconnected from MonadGames ID', { duration: 2000 })
    } catch (err) {
      console.warn('Privy logout error:', err)
      toast.error('Error disconnecting')
    }
  }, [logout])

  const logoutAlias = disconnectWallet
  const logoutFn = logoutAlias

  // Submit score (keeps your contract interaction pattern)
  const submitGameScore = useCallback(
    async (gameStats) => {
      const activeAddress = address || monadGamesUser?.walletAddress
      
      if (!activeAddress || !authenticated) {
        toast.error('Please connect your MonadGames ID first')
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
          wallet: activeAddress
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
    [address, monadGamesUser?.walletAddress, authenticated, submitScore, monadGamesUser, username]
  )

  const updateUsername = useCallback(
    async (newUsername) => {
      const activeAddress = address || monadGamesUser?.walletAddress
      
      if (!activeAddress || !authenticated) {
        toast.error('Please connect your MonadGames ID first')
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
    [address, monadGamesUser?.walletAddress, authenticated, setUsernameContract]
  )

  const userInfo = buildDisplayUser()

  return {
    // status
    isConnected: Boolean(authenticated && (address || monadGamesUser?.walletAddress)),
    address: address || monadGamesUser?.walletAddress,
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
    canSubmitScore: () => Boolean(authenticated && (address || monadGamesUser?.walletAddress) && CONTRACT_ADDRESSES.NEON_RUNNER_GAME),
    formatAddress: (addr) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : ''),
    isValidUsername: (name) => name && name.trim().length >= 3 && name.trim().length <= 20,
  }
}

export default useMonadGames