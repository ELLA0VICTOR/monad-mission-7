import { createConfig, http } from 'wagmi'
import { monadTestnet } from './constants'


export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  transports: {
    [monadTestnet.id]: http('https://testnet-rpc.monad.xyz'),
  },
})


export const NEON_RUNNER_ABI = [
  {
    "inputs": [
      {"internalType": "uint256", "name": "_score", "type": "uint256"},
      {"internalType": "uint256", "name": "_distance", "type": "uint256"},
      {"internalType": "uint256", "name": "_powerupsCollected", "type": "uint256"}
    ],
    "name": "submitScore",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_player", "type": "address"}],
    "name": "getPlayerStats",
    "outputs": [
      {"internalType": "uint256", "name": "highScore", "type": "uint256"},
      {"internalType": "uint256", "name": "totalGames", "type": "uint256"},
      {"internalType": "uint256", "name": "totalDistance", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTopPlayers",
    "outputs": [
      {"internalType": "address[]", "name": "players", "type": "address[]"},
      {"internalType": "uint256[]", "name": "scores", "type": "uint256[]"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "string", "name": "_username", "type": "string"}],
    "name": "setUsername",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_player", "type": "address"}],
    "name": "getUsername",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  }
]

export const POWERUP_NFT_ABI = [
  {
    "inputs": [{"internalType": "uint256", "name": "_powerupType", "type": "uint256"}],
    "name": "mintPowerup",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "_owner", "type": "address"}],
    "name": "getPowerups",
    "outputs": [{"internalType": "uint256[]", "name": "", "type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_tokenId", "type": "uint256"}],
    "name": "usePowerup",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

export const LEADERBOARD_ABI = [
  {
    "inputs": [],
    "name": "getLeaderboard",
    "outputs": [
      {
        "components": [
          {"internalType": "address", "name": "player", "type": "address"},
          {"internalType": "string", "name": "username", "type": "string"},
          {"internalType": "uint256", "name": "score", "type": "uint256"},
          {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
        ],
        "internalType": "struct Leaderboard.LeaderboardEntry[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "uint256", "name": "_limit", "type": "uint256"}],
    "name": "getTopScores",
    "outputs": [
      {
        "components": [
          {"internalType": "address", "name": "player", "type": "address"},
          {"internalType": "string", "name": "username", "type": "string"},
          {"internalType": "uint256", "name": "score", "type": "uint256"},
          {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
        ],
        "internalType": "struct Leaderboard.LeaderboardEntry[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]


export const formatAddress = (address) => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export const formatScore = (score) => {
  return new Intl.NumberFormat().format(score)
}

export const formatMON = (amount) => {
  return `${(Number(amount) / 1e18).toFixed(4)} MON`
}

export const getExplorerUrl = (hash, type = 'tx') => {
  return `https://testnet.monadexplorer.com/${type}/${hash}`
}


export const GAS_ESTIMATES = {
  SUBMIT_SCORE: 80000n,
  SET_USERNAME: 60000n,
  MINT_POWERUP: 120000n,
  USE_POWERUP: 50000n,
}


export const buildSubmitScoreParams = (score, distance, powerupsCollected) => {
  return {
    args: [BigInt(score), BigInt(distance), BigInt(powerupsCollected)],
    gas: GAS_ESTIMATES.SUBMIT_SCORE,
  }
}

export const buildSetUsernameParams = (username) => {
  return {
    args: [username],
    gas: GAS_ESTIMATES.SET_USERNAME,
  }
}

export const buildMintPowerupParams = (powerupType, value) => {
  return {
    args: [BigInt(powerupType)],
    value: BigInt(value),
    gas: GAS_ESTIMATES.MINT_POWERUP,
  }

  


}
export { CONTRACT_ADDRESSES } from './constants'