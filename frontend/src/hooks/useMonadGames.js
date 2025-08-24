import { useState, useEffect, useCallback } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { useAccount, useWriteContract, useReadContract } from 'wagmi'
import { CONTRACT_ADDRESSES, NEON_RUNNER_ABI, buildSubmitScoreParams, buildSetUsernameParams } from '../utils/blockchain'
import { monadTestnet } from '../utils/constants'
import toast from 'react-hot-toast'

export const useMonadGames = () => {
  const { login, logout, authenticated, user } = usePrivy()
  const { address, isConnected } = useAccount()
  const [username, setUsername] = useState('')
  const [isSubmittingScore, setIsSubmittingScore] = useState(false)
  const [playerStats, setPlayerStats] = useState({
    highScore: 0,
    totalGames: 0,
    totalDistance: 0
  })

  // Contract interactions
  const { writeContract: submitScore } = useWriteContract()
  const { writeContract: setUsernameContract } = useWriteContract()

  // Read player stats from contract
  const { data: contractStats } = useReadContract({
    address: CONTRACT_ADDRESSES.NEON_RUNNER_GAME,
    abi: NEON_RUNNER_ABI,
    functionName: 'getPlayerStats',
    args: address ? [address] : undefined,
    enabled: !!address && !!CONTRACT_ADDRESSES.NEON_RUNNER_GAME,
  })

  // Read username from contract
  const { data: contractUsername } = useReadContract({
    address: CONTRACT_ADDRESSES.NEON_RUNNER_GAME,
    abi: NEON_RUNNER_ABI,
    functionName: 'getUsername',
    args: address ? [address] : undefined,
    enabled: !!address && !!CONTRACT_ADDRESSES.NEON_RUNNER_GAME,
  })

  // Update stats when contract data changes
  useEffect(() => {
    if (contractStats) {
      setPlayerStats({
        highScore: Number(contractStats[0]) || 0,
        totalGames: Number(contractStats[1]) || 0,
        totalDistance: Number(contractStats[2]) || 0
      })
    }
  }, [contractStats])

  // Update username when contract data changes
  useEffect(() => {
    if (contractUsername) {
      setUsername(contractUsername)
    }
  }, [contractUsername])

  // Connect wallet using Privy
  const connectWallet = useCallback(async () => {
    try {
      await login()
      toast.success('Wallet connected!', {
        icon: '🔗',
        duration: 3000
      })
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      toast.error('Failed to connect wallet')
    }
  }, [login])

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    try {
      await logout()
      setUsername('')
      setPlayerStats({
        highScore: 0,
        totalGames: 0,
        totalDistance: 0
      })
      toast.success('Wallet disconnected!', {
        icon: '👋',
        duration: 3000
      })
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
      toast.error('Failed to disconnect wallet')
    }
  }, [logout])

  // Submit score to blockchain
  const submitGameScore = useCallback(async (gameStats) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first')
      return false
    }

    if (!CONTRACT_ADDRESSES.NEON_RUNNER_GAME || CONTRACT_ADDRESSES.NEON_RUNNER_GAME === '0x0000000000000000000000000000000000000000') {
      toast.error('Game contract not deployed yet')
      return false
    }

    try {
      setIsSubmittingScore(true)
      
      const { score, distance, powerupsCollected } = gameStats
      const params = buildSubmitScoreParams(score, distance, powerupsCollected || 0)

      toast.loading('Submitting score to blockchain...', {
        id: 'submit-score'
      })

      await submitScore({
        address: CONTRACT_ADDRESSES.NEON_RUNNER_GAME,
        abi: NEON_RUNNER_ABI,
        functionName: 'submitScore',
        ...params,
      })

      toast.success(`Score submitted: ${score.toLocaleString()}!`, {
        id: 'submit-score',
        icon: '🏆',
        duration: 4000
      })

      return true
    } catch (error) {
      console.error('Failed to submit score:', error)
      toast.error('Failed to submit score to blockchain', {
        id: 'submit-score'
      })
      return false
    } finally {
      setIsSubmittingScore(false)
    }
  }, [isConnected, address, submitScore])

  // Set username on blockchain
  const updateUsername = useCallback(async (newUsername) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first')
      return false
    }

    if (!CONTRACT_ADDRESSES.NEON_RUNNER_GAME || CONTRACT_ADDRESSES.NEON_RUNNER_GAME === '0x0000000000000000000000000000000000000000') {
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
      toast.loading('Updating username...', {
        id: 'update-username'
      })

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
        duration: 3000
      })

      return true
    } catch (error) {
      console.error('Failed to update username:', error)
      toast.error('Failed to update username', {
        id: 'update-username'
      })
      return false
    }
  }, [isConnected, address, setUsernameContract])

  // Get user display info
  const getUserInfo = useCallback(() => {
    if (!authenticated || !user) {
      return {
        isConnected: false,
        address: null,
        username: '',
        displayName: 'Not Connected'
      }
    }

    const displayName = username || 
                       user.discord?.username || 
                       user.twitter?.username || 
                       user.email?.address ||
                       (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Unknown')

    return {
      isConnected: true,
      address,
      username,
      displayName,
      email: user.email?.address,
      discord: user.discord?.username,
      twitter: user.twitter?.username
    }
  }, [authenticated, user, address, username])

  // Check if user can submit scores
  const canSubmitScore = useCallback(() => {
    return isConnected && 
           address && 
           CONTRACT_ADDRESSES.NEON_RUNNER_GAME !== '0x0000000000000000000000000000000000000000'
  }, [isConnected, address])

  // Get leaderboard rank (estimated based on high score)
  const getEstimatedRank = useCallback(() => {
    // This is a placeholder - in a real implementation, you'd query the contract
    // for the actual leaderboard position
    if (playerStats.highScore === 0) return null
    
    // Simple estimation based on score ranges
    if (playerStats.highScore > 10000) return 'Top 10'
    if (playerStats.highScore > 5000) return 'Top 50'
    if (playerStats.highScore > 2000) return 'Top 100'
    if (playerStats.highScore > 500) return 'Top 500'
    return 'Unranked'
  }, [playerStats.highScore])

  return {
    // Authentication state
    isConnected: authenticated && isConnected,
    address,
    user: getUserInfo(),
    
    // User data
    username,
    playerStats,
    estimatedRank: getEstimatedRank(),
    
    // Loading states
    isSubmittingScore,
    
    // Actions
    connectWallet,
    disconnectWallet,
    submitGameScore,
    updateUsername,
    canSubmitScore,
    
    // Utils
    formatAddress: (addr) => addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '',
    isValidUsername: (name) => name && name.trim().length >= 3 && name.trim().length <= 20,
  }
}