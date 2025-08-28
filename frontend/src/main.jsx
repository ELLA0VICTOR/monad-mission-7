import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/globals.css'
import { initializeScoreSubmissionManager } from './utils/score-submission-manager'
import { initializeMonadGamesManager } from './utils/monadgames-manager'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
try {
  initializeScoreSubmissionManager && initializeScoreSubmissionManager()
} catch (e) {
  console.warn('Failed to init scoreSubmissionManager at bootstrap', e)
}

try {
  initializeMonadGamesManager && initializeMonadGamesManager()
} catch (e) {
  console.warn('Failed to init monadGamesManager at bootstrap', e)
}