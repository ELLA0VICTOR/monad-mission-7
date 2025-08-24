import { useState, useEffect, useCallback } from 'react'
import { useReadContract } from 'wagmi'
import { CONTRACT_ADDRESSES, LEADERBOARD_ABI, formatScore } from '../utils/blockchain'
import { LEADERBOARD_SIZE } from '../utils/constants'

export const useLeaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Read leaderboard from contract
  const { 
    data: contractLeaderboard, 
    isLoading: contractLoading, 
    error: contractError,
    refetch: refetchLeaderboard 
  } = useReadContract({
    address: CONTRACT_ADDRESSES.LEADERBOARD,
    abi: LEADERBOARD_ABI,
    functionName: 'getTopScores',
    args: [BigInt(LEADERBOARD_SIZE)],
    enabled: !!CONTRACT_ADDRESSES.LEADERBOARD && CONTRACT_ADDRESSES.LEADERBOARD !== '0x0000000000000000000000000000000000000000',
  })

  // Process leaderboard data
  useEffect(() => {
    setIsLoading(contractLoading)
    
    if (contractError) {
      console.error('Leaderboard contract error:', contractError)
      setError('Failed to load leaderboard')
      // Use mock data for development
      setLeaderboardData(getMockLeaderboard())
      setLastUpdated(new Date())
      return
    }

    if (contractLeaderboard && Array.isArray(contractLeaderboard)) {
      const processedData = contractLeaderboard.map((entry, index) => ({
        rank: index + 1,
        address: entry.player,
        username: entry.username || `Player ${index + 1}`,
        score: Number(entry.score),
        formattedScore: formatScore(Number(entry.score)),
        timestamp: Number(entry.timestamp),
        date: new Date(Number(entry.timestamp) * 1000).toLocaleDateString(),
        isCurrentUser: false // Will be updated when user connects
      }))
      
      setLeaderboardData(processedData)
      setLastUpdated(new Date())
      setError(null)
    } else if (!contractLoading) {
      // Use mock data if no contract data
      setLeaderboardData(getMockLeaderboard())
      setLastUpdated(new Date())
    }
  }, [contractLeaderboard, contractLoading, contractError])

  // Get mock leaderboard for development/testing
  const getMockLeaderboard = () => [
    {
      rank: 1,
      address: '0x1234567890123456789012345678901234567890',
      username: 'NeonMaster',
      score: 15420,
      formattedScore: '15,420',
      timestamp: Date.now() / 1000 - 3600,
      date: new Date().toLocaleDateString(),
      isCurrentUser: false
    },
    {
      rank: 2,
      address: '0x2345678901234567890123456789012345678901',
      username: 'SpeedRunner',
      score: 12350,
      formattedScore: '12,350',
      timestamp: Date.now() / 1000 - 7200,
      date: new Date().toLocaleDateString(),
      isCurrentUser: false
    },
    {
      rank: 3,
      address: '0x3456789012345678901234567890123456789012',
      username: 'JumpMaster',
      score: 9980,
      formattedScore: '9,980',
      timestamp: Date.now() / 1000 - 14400,
      date: new Date(Date.now() - 86400000).toLocaleDateString(),
      isCurrentUser: false
    },
    {
      rank: 4,
      address: '0x4567890123456789012345678901234567890123',
      username: 'PowerUpPro',
      score: 8750,
      formattedScore: '8,750',
      timestamp: Date.now() / 1000 - 21600,
      date: new Date(Date.now() - 86400000).toLocaleDateString(),
      isCurrentUser: false
    },
    {
      rank: 5,
      address: '0x5678901234567890123456789012345678901234',
      username: 'CyberDash',
      score: 7200,
      formattedScore: '7,200',
      timestamp: Date.now() / 1000 - 28800,
      date: new Date(Date.now() - 172800000).toLocaleDateString(),
      isCurrentUser: false
    }
  ]

  // Update current user highlighting
  const updateCurrentUser = useCallback((userAddress) => {
    if (!userAddress) {
      setLeaderboardData(prev => prev.map(entry => ({ ...entry, isCurrentUser: false })))
      return
    }

    setLeaderboardData(prev => prev.map(entry => ({
      ...entry,
      isCurrentUser: entry.address.toLowerCase() === userAddress.toLowerCase()
    })))
  }, [])

  // Find user's rank
  const getUserRank = useCallback((userAddress) => {
    if (!userAddress) return null
    
    const userEntry = leaderboardData.find(
      entry => entry.address.toLowerCase() === userAddress.toLowerCase()
    )
    
    return userEntry ? userEntry.rank : null
  }, [leaderboardData])

  // Get top N players
  const getTopPlayers = useCallback((count = 10) => {
    return leaderboardData.slice(0, count)
  }, [leaderboardData])

  // Refresh leaderboard
  const refreshLeaderboard = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      if (refetchLeaderboard) {
        await refetchLeaderboard()
      }
    } catch (err) {
      console.error('Failed to refresh leaderboard:', err)
      setError('Failed to refresh leaderboard')
    }
  }, [refetchLeaderboard])

  // Get score statistics
  const getScoreStats = useCallback(() => {
    if (leaderboardData.length === 0) return null

    const scores = leaderboardData.map(entry => entry.score)
    const highestScore = Math.max(...scores)
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
    const medianScore = scores.sort((a, b) => a - b)[Math.floor(scores.length / 2)]

    return {
      highestScore,
      averageScore: Math.round(averageScore),
      medianScore,
      totalPlayers: leaderboardData.length,
      formattedHighest: formatScore(highestScore),
      formattedAverage: formatScore(Math.round(averageScore)),
      formattedMedian: formatScore(medianScore)
    }
  }, [leaderboardData])

  // Check if user is in top N
  const isUserInTopN = useCallback((userAddress, n = 10) => {
    const rank = getUserRank(userAddress)
    return rank !== null && rank <= n
  }, [getUserRank])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading && !error) {
        refreshLeaderboard()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [isLoading, error, refreshLeaderboard])

  return {
    // Data
    leaderboardData,
    topPlayers: getTopPlayers(),
    scoreStats: getScoreStats(),
    
    // State
    isLoading,
    error,
    lastUpdated,
    
    // Actions
    refreshLeaderboard,
    updateCurrentUser,
    
    // Utils
    getUserRank,
    getTopPlayers,
    isUserInTopN,
    
    // Helpers
    formatRank: (rank) => {
      if (rank === 1) return '🥇'
      if (rank === 2) return '🥈'
      if (rank === 3) return '🥉'
      return `#${rank}`
    },
    
    getRankColor: (rank) => {
      if (rank === 1) return 'text-yellow-400'
      if (rank === 2) return 'text-gray-300'
      if (rank === 3) return 'text-orange-400'
      return 'text-green-400'
    },
    
    getScoreColor: (score) => {
      if (score >= 10000) return 'text-purple-400'
      if (score >= 5000) return 'text-blue-400'
      if (score >= 2000) return 'text-green-400'
      if (score >= 500) return 'text-yellow-400'
      return 'text-gray-400'
    }
  }
}