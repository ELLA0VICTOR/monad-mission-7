// backend/routes/submit-score.js
import express from 'express'
import dotenv from 'dotenv'
import { JsonRpcProvider, Wallet, Contract, getAddress } from 'ethers'

dotenv.config()
const router = express.Router()

// Minimal ABI for the Monad Games contract updatePlayerData function
const MONAD_GAMES_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "player", "type": "address" },
      { "internalType": "uint256", "name": "scoreAmount", "type": "uint256" },
      { "internalType": "uint256", "name": "transactionAmount", "type": "uint256" }
    ],
    "name": "updatePlayerData",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
]

// Basic sanity limits to avoid misuse
const MAX_SCORE_PER_SUBMIT = BigInt(5_000_000) // adjust if needed
const MAX_TXS_PER_SUBMIT = BigInt(1000)

const PRIVATE_KEY = process.env.PRIVATE_KEY
const MONAD_RPC = process.env.MONAD_RPC
const MONAD_GAMES_CONTRACT = process.env.MONAD_GAMES_CONTRACT
const SUBMIT_SECRET = process.env.SUBMIT_SECRET || null

if (!PRIVATE_KEY || !MONAD_RPC || !MONAD_GAMES_CONTRACT) {
  console.error('Missing required env vars PRIVATE_KEY, MONAD_RPC or MONAD_GAMES_CONTRACT')
  // server will still start but route will fail with clear error
}

const provider = MONAD_RPC ? new JsonRpcProvider(MONAD_RPC) : null
const wallet = PRIVATE_KEY && provider ? new Wallet(PRIVATE_KEY, provider) : null
const contract = wallet && MONAD_GAMES_CONTRACT ? new Contract(MONAD_GAMES_CONTRACT, MONAD_GAMES_ABI, wallet) : null

// POST /api/submit-score
// body: { playerAddress, scoreAmount, transactionAmount, metadata }
router.post('/', async (req, res) => {
  try {
    // LOG: incoming request details for tracing
    console.log('[submit-score] incoming', { ip: req.ip, headers: req.headers, body: req.body });

    // Optional shared-secret protection
    if (SUBMIT_SECRET) {
      const headerSecret = req.get('x-submit-secret')
      if (!headerSecret || headerSecret !== SUBMIT_SECRET) {
        return res.status(401).json({ success: false, error: 'invalid_submit_secret' })
      }
    }

    if (!contract) {
      return res.status(500).json({ success: false, error: 'server_not_configured' })
    }

    const { playerAddress, scoreAmount, transactionAmount } = req.body || {}

    if (!playerAddress || typeof playerAddress !== 'string') {
      return res.status(400).json({ success: false, error: 'missing_playerAddress' })
    }

    const score = BigInt(scoreAmount || 0)
    const txCount = BigInt(transactionAmount || 0)

    // Basic validation limits
    if (score < 0n || score > MAX_SCORE_PER_SUBMIT) {
      return res.status(400).json({ success: false, error: 'invalid_score' })
    }
    if (txCount < 0n || txCount > MAX_TXS_PER_SUBMIT) {
      return res.status(400).json({ success: false, error: 'invalid_tx_count' })
    }

    // Convert address to checksum (throws if invalid)
    const player = getAddress(playerAddress)

    // ✅ OPTIONAL: Verify player has a MonadGames username
    if (process.env.REQUIRE_MONAD_USERNAME === 'true') {
      try {
        const checkUrl = `${process.env.MONADGAMES_CHECK_API || 'https://monad-games-id-site.vercel.app/api/check-wallet'}?wallet=${player}`
        const checkResp = await fetch(checkUrl)
        if (!checkResp.ok) {
          console.warn('check-wallet endpoint returned', checkResp.status)
          return res.status(400).json({ success: false, error: 'failed_username_check' })
        }
        const checkJson = await checkResp.json().catch(() => null)
        if (!checkJson?.hasUsername) {
          console.warn('player has no MonadGames username', player)
          return res.status(400).json({ success: false, error: 'player_has_no_monad_username' })
        }
      } catch (err) {
        console.warn('Failed to verify monad username', err)
        return res.status(500).json({ success: false, error: 'username_check_failed' })
      }
    }

    // Send transaction
    console.log('Submitting updatePlayerData on-chain for', player, score.toString(), txCount.toString())
    const tx = await contract.updatePlayerData(player, score, txCount)
    // Wait for 1 confirmation
    const receipt = await tx.wait(1)

    console.log('Submitted to Monad Games contract txHash=', receipt.hash)
    return res.json({ success: true, txHash: receipt.hash, blockNumber: receipt.blockNumber })
  } catch (err) {
    console.error('submit-score error', err)
    return res.status(500).json({ success: false, error: err.message || String(err) })
  }
})

export default router
