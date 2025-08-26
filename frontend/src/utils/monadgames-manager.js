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

export default MonadGamesManagerClient;
