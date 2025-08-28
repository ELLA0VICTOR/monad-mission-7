// frontend/src/utils/monadgames-manager.js
import { MONADGAMES_CONFIG } from './monadgames-config.js';

const API_BASE = MONADGAMES_CONFIG.apiBase || window.location.origin;

const MonadGamesManagerClient = {
  async submitScoreToBackend({ playerAddress, score, distance = 0, powerups = 0, metadata = {} }) {
    try {
      const url = `${API_BASE}/api/submit-score`;
      const body = {
        playerAddress,
        score: Number(score) || 0,
        distance: Number(distance) || 0,
        powerups: Number(powerups) || 0,
        metadata,
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error('Backend submit-score error:', json);
        return { success: false, error: json.error || json.message || 'Server returned error', raw: json };
      }

      return { success: true, ...json };
    } catch (err) {
      console.error('submitScoreToBackend failed', err);
      return { success: false, error: err.message || String(err) };
    }
  },
};

// Expose an initializer that registers a light-weight global manager on window
export function initializeMonadGamesManager() {
  if (typeof window === 'undefined') return null;

  if (window.monadGamesManager) {
    // update submit method if it changed
    window.monadGamesManager.submitScoreToBackend = MonadGamesManagerClient.submitScoreToBackend;
    return window.monadGamesManager;
  }

  const manager = {
    isAuthenticated: false,
    username: null,
    walletAddress: null,
    error: null,

    // public accessor for other code that expects getUserData()
    getUserData: () => ({
      username: manager.username,
      walletAddress: manager.walletAddress,
      isAuthenticated: manager.isAuthenticated,
      error: manager.error,
    }),

    // method used by the frontend to submit to your backend
    submitScoreToBackend: MonadGamesManagerClient.submitScoreToBackend,
  };

  window.monadGamesManager = manager;
  console.log('[monadgames-manager] initialized window.monadGamesManager');
  return manager;
}

export default MonadGamesManagerClient;
