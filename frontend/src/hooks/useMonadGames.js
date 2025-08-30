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
  const { login, logout, authenticated, user: privyUser, ready } = usePrivy()
  
  // Cross-app accounts for MonadGames ID
  const { loginWithCrossAppAccount, linkCrossAppAccount, getCrossAppAccounts } = useCrossAppAccounts()

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
  const [monadGamesAddress, setMonadGamesAddress] = useState('')

  // Contract write hooks (retain your existing usage)
  const { writeContract: submitScore } = useWriteContract()
  const { writeContract: setUsernameContract } = useWriteContract()

  // >>> PREFER_MONAD: prefer monadGamesAddress for reads; fallback to injected only if no monadGamesAddress
  const activeAddressForReads = monadGamesAddress || address || undefined

  // Contract read hooks to populate player stats / username
  const { data: contractStats } = useReadContract({
    address: CONTRACT_ADDRESSES.NEON_RUNNER_GAME,
    abi: NEON_RUNNER_ABI,
    functionName: 'getPlayerStats',
    args: activeAddressForReads ? [activeAddressForReads] : undefined,
    enabled: !!activeAddressForReads && !!CONTRACT_ADDRESSES.NEON_RUNNER_GAME,
  })

  const { data: contractUsername } = useReadContract({
    address: CONTRACT_ADDRESSES.NEON_RUNNER_GAME,
    abi: NEON_RUNNER_ABI,
    functionName: 'getUsername',
    args: activeAddressForReads ? [activeAddressForReads] : undefined,
    enabled: !!activeAddressForReads && !!CONTRACT_ADDRESSES.NEON_RUNNER_GAME,
  })
 
 // Robust check for cross-app (MonadGames ID) account using getCrossAppAccounts when available
useEffect(() => {
  const checkCrossApp = async () => {
    if (!authenticated) {
      setMonadGamesAddress('')
      setMonadGamesUser(null)
      return
    }

    try {
      let crossApps = []

      // Prefer the direct API if available
      if (typeof getCrossAppAccounts === 'function') {
        // getCrossAppAccounts may return [] if none linked
        crossApps = await getCrossAppAccounts()
      } else if (privyUser?.linkedAccounts) {
        crossApps = privyUser.linkedAccounts
      }

      console.log('checkCrossApp: found crossApps count=', (crossApps || []).length)

      const crossAppAccount = (crossApps || []).find(
        account =>
          account.type === 'cross_app' &&
          account.providerApp?.id === MONADGAMES_CONFIG.crossAppId
      )

      if (crossAppAccount && crossAppAccount.embeddedWallets?.length > 0) {
        const addr = crossAppAccount.embeddedWallets[0].address
        setMonadGamesAddress(addr)
        setMonadGamesUser({
          username: crossAppAccount.username || null,
          walletAddress: addr,
          providerApp: crossAppAccount.providerApp
        })
        console.log('MonadGames crossAppAccount found:', crossAppAccount)
      } else {
        // Clear if nothing relevant found
        setMonadGamesAddress('')
        setMonadGamesUser(null)
      }
    } catch (err) {
      console.error('Error checking cross-app accounts:', err)
      setMonadGamesAddress('')
      setMonadGamesUser(null)
    }
  }

  // Run check once (and again when dependencies change)
  checkCrossApp()
}, [authenticated, privyUser, ready, getCrossAppAccounts])


  // Fetch MonadGames username from API
  useEffect(() => {
    const fetchMonadGamesUsername = async () => {
      if (!monadGamesAddress) return
      
      try {
        const response = await fetch(
          `${MONADGAMES_CONFIG.apiEndpoint}?wallet=${monadGamesAddress}`
        )
        
        if (response.ok) {
          const data = await response.json()
          if (data.hasUsername && data.user) {
            setMonadGamesUser(prev => ({
              ...prev,
              username: data.user.username
            }))
            console.log('MonadGames username fetched:', data.user.username)
          }
        }
      } catch (error) {
        console.error('Failed to fetch MonadGames username:', error)
      }
    }

    fetchMonadGamesUsername()
  }, [monadGamesAddress])

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

  // Utility: build user object for UI (Navbar/Header expects certain shape)
  const buildDisplayUser = useCallback(() => {
    // >>> PREFER_MONAD: prefer monadGamesAddress for display too
    const walletAddress = monadGamesAddress || address || null

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
  }, [address, monadGamesAddress, username, privyUser, monadGamesUser])

  // FIXED: MonadGames ID specific connect flow (following documentation)
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
      setMonadGamesAddress('')
      toast.success('Disconnected from MonadGames ID', { duration: 2000 })
    } catch (err) {
      console.warn('Privy logout error:', err)
      toast.error('Error disconnecting')
    }
  }, [logout])

  const logoutAlias = disconnectWallet
  const logoutFn = logoutAlias

  // Submit score (keeps your contract interaction pattern)
  // replace existing submitGameScore implementation with this
const submitGameScore = useCallback(
  async (gameStats) => {
    // >>> PREFER_MONAD: prefer monadGamesAddress for submission. If monadGamesAddress not present, refuse.
    const activeAddress = monadGamesAddress || address || null;
    const USE_SERVER_RELAY = import.meta.env.VITE_USE_SERVER_RELAY === 'true';
    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
    const SUBMIT_SECRET = import.meta.env.VITE_SUBMIT_SECRET || null;

    if (!activeAddress || !authenticated || !monadGamesAddress) {
      // require monadGamesAddress specifically - prevents injected wallet submissions
      toast.error('Please connect using Monad Games ID (Sign in with Monad Games ID).')
      return false;
    }

    if (
      !CONTRACT_ADDRESSES.NEON_RUNNER_GAME ||
      CONTRACT_ADDRESSES.NEON_RUNNER_GAME === '0x0000000000000000000000000000000000000000'
    ) {
      toast.error('Game contract not deployed yet');
      return false;
    }

    try {
      setIsSubmittingScore(true);
      const { score, distance = 0, powerupsCollected = 0 } = gameStats || {};
      const numericScore = Number(score || 0);

      // SERVER-RELAY PATH: POST to your backend (server will call the Monad Games contract)
      if (USE_SERVER_RELAY) {
        toast.loading('Submitting score to server relay...', { id: 'submit-score' });

        const body = {
          // IMPORTANT: use the MONAD address only
          playerAddress: activeAddress,
          scoreAmount: numericScore,
          transactionAmount: 1,
          distance: Number(distance || 0),
          powerupsCollected: Number(powerupsCollected || 0),
          source: 'neon-runner-frontend'
        };

        const headers = { 'Content-Type': 'application/json' };
        if (SUBMIT_SECRET) headers['x-submit-secret'] = SUBMIT_SECRET;

        // ADDED LOG: show exactly what we're sending to backend
        console.log('[useMonadGames] server-relay POST body', {
          api: `${API_BASE}/api/submit-score`,
          body,
          headers,
          monadGamesAddress,
          address,
          monadGamesUser,
          privyUser
        });

        const resp = await fetch(`${API_BASE}/api/submit-score`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        if (!resp.ok) {
          const json = await resp.json().catch(() => ({}));
          console.error('Server-relay failed', resp.status, json);
          toast.error('Server-relay submission failed');
          return false;
        }

        const json = await resp.json().catch(() => null);
        toast.success(`Score submitted to global leaderboard: ${numericScore.toLocaleString()}!`, {
          id: 'submit-score',
          icon: '🏆',
          duration: 4000,
        });
        console.log('Server-relay result', json);

        return true;
      }

      // WALLET-FIRST PATH: Send transaction from user's wallet (if you ever enable it)
      toast.loading('Submitting score to blockchain...', { id: 'submit-score' });

      const params = buildSubmitScoreParams(numericScore, Number(distance || 0), Number(powerupsCollected || 0));
      await submitScore({
        address: CONTRACT_ADDRESSES.NEON_RUNNER_GAME,
        abi: NEON_RUNNER_ABI,
        functionName: 'submitScore',
        ...params,
      });

      toast.success(`Score submitted: ${numericScore.toLocaleString()}!`, {
        id: 'submit-score',
        icon: '🏆',
        duration: 4000,
      });

      // Optionally notify backend (no harm if also server-relay is enabled separately)
      (async () => {
        try {
          const apiBase = API_BASE;
          const secret = SUBMIT_SECRET;
          const headers = { 'Content-Type': 'application/json' };
          if (secret) headers['x-submit-secret'] = secret;

          await fetch(`${apiBase}/api/submit-score`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              playerAddress: activeAddress,
              scoreAmount: numericScore,
              transactionAmount: 1,
              distance: Number(distance || 0),
              powerupsCollected: Number(powerupsCollected || 0),
            }),
          });
        } catch (e) {
          console.warn('notify-backend failure', e);
        }
      })();

      console.log('Score submitted to MonadGames ID:', {
        score: numericScore,
        distance,
        powerupsCollected,
        username: monadGamesUser?.username || username,
        wallet: activeAddress,
      });

      return true;
    } catch (error) {
      console.error('Failed to submit score:', error);
      toast.error('Failed to submit score', { id: 'submit-score' });
      return false;
    } finally {
      setIsSubmittingScore(false);
    }
  },
  [monadGamesAddress, address, authenticated, submitScore, monadGamesUser, username]
);
  const updateUsername = useCallback(
    async (newUsername) => {
      const activeAddress = monadGamesAddress || address
      
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
    [monadGamesAddress, address, authenticated, setUsernameContract]
  )
    // Expose a small global manager expected by legacy code / submission manager
    useEffect(() => {
      const getUserData = () => ({
        username: monadGamesUser?.username || username || privyUser?.username || null,
        // >>> PREFER_MONAD: expose monadGamesAddress as primary walletAddress
        walletAddress: monadGamesAddress || address || null,
        isAuthenticated: !!authenticated,
        privyUser: privyUser || null
      })
  
      // Provide minimal submission API (others can extend)
      window.monadGamesManager = {
        getUserData,
        // optionally allow other modules to call submit via hook (this uses submitGameScore defined in this hook)
        submitScore: async (score, distance = 0, powerups = 0, meta = {}) => {
          // Use submitGameScore which already handles contract submission
          try {
            const result = await submitGameScore({ score, distance, powerupsCollected: powerups, ...meta });
            return { success: !!result, message: result ? 'ok' : 'failed' }
          } catch (err) {
            return { success: false, error: String(err) }
          }
        }
      }
      // cleanup optional
      return () => { /* keep the manager even if component unmounts? decide based on your app */ }
    }, [monadGamesUser, monadGamesAddress, address, username, privyUser, authenticated, submitGameScore])

      // keep the global manager updated for non-React modules that rely on window.monadGamesManager
  useEffect(() => {
    if (typeof window !== 'undefined' && window.monadGamesManager) {
      // enforce preference for monadGamesAddress
      window.monadGamesManager.username = monadGamesUser?.username || username || null
      window.monadGamesManager.walletAddress = monadGamesAddress || address || null
      window.monadGamesManager.isAuthenticated = Boolean(authenticated && !!monadGamesAddress)
      window.monadGamesManager.error = null
    }
  }, [monadGamesUser, monadGamesAddress, username, address, authenticated])

  

  const userInfo = buildDisplayUser()

  return {
    // status
    // >>> PREFER_MONAD: require monadGames address for "isConnected"
    isConnected: Boolean(authenticated && !!monadGamesAddress),
    address: monadGamesAddress || address,
    user: userInfo,
    username,
    playerStats,
    monadGamesUser,
    monadGamesAddress,
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
    // require monadGamesAddress specifically for submission
    canSubmitScore: () => Boolean(authenticated && !!monadGamesAddress && CONTRACT_ADDRESSES.NEON_RUNNER_GAME),
    formatAddress: (addr) => (addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : ''),
    isValidUsername: (name) => name && name.trim().length >= 3 && name.trim().length <= 20,
  }
}

export default useMonadGames
