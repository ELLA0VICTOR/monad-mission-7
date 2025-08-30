// backend/routes/leaderboard.js
import express from 'express'
import fetch from 'node-fetch'

const router = express.Router()

// helper: safe JSON parse
function tryParseJSON(str) {
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}

// GET /api/leaderboard
router.get('/', async (req, res) => {
  try {
    const gameId = process.env.MONAD_GAMES_GAMEID || '237' // fallback to Neon_Runner
    // Try both sensible param orders (some endpoints/platform proxies can be picky)
    const urls = [
      `https://monad-games-id-site.vercel.app/api/leaderboard?gameId=${gameId}&sortBy=scores&page=1`,
      `https://monad-games-id-site.vercel.app/api/leaderboard?page=1&gameId=${gameId}&sortBy=scores`
    ]

    let data = null
    let lastText = ''

    for (const url of urls) {
      console.log('[leaderboard] fetching:', url)
      const resp = await fetch(url)
      lastText = await resp.text()

      // If response looks like JSON, parse it
      if (resp.ok && lastText.trim().startsWith('{')) {
        data = tryParseJSON(lastText)
        if (data) break
      } else {
        console.warn('[leaderboard] non-json or bad response (first 200 chars):', lastText.slice(0, 200))
      }
    }

    if (!data) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch leaderboard (API returned non-JSON or HTML)',
        debugSnippet: lastText.slice(0, 200)
      })
    }

    const rawEntries = data?.data || []
    const entries = Array.isArray(rawEntries)
      ? rawEntries.map((entry, index) => ({
          rank: index + 1,
          username:
            entry.username ||
            entry.player ||
            (entry.walletAddress ? `${entry.walletAddress.slice(0, 6)}...${entry.walletAddress.slice(-4)}` : 'Unknown'),
          address: entry.walletAddress || entry.wallet || null,
          score: Number(entry.score || 0),
          transactions: Number(entry.transactions || 0),
          timestamp: entry.updatedAt || Date.now()
        }))
      : []

    return res.json({ success: true, entries })
  } catch (err) {
    console.error('[leaderboard] error', err)
    return res.status(500).json({ success: false, error: err.message })
  }
})

export default router
