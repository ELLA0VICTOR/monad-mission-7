import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import submitRoutes from './routes/submit-score.js'
import leaderboardRoute from './routes/leaderboard.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/submit-score', submitRoutes)
app.use('/api/leaderboard', leaderboardRoute)

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`)
})
