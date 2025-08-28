import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import submitRoutes from './routes/submit-score.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/submit-score', submitRoutes)

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`)
})
