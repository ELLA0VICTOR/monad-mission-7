const USE_SERVER_RELAY = import.meta.env.VITE_USE_SERVER_RELAY === 'true';
const API_BASE = import.meta.env.VITE_API_BASE || window.location.origin;

export class ScoreSubmissionManager {
  constructor(options = {}) {
    this.pendingScore = 0;
    this.pendingTransactions = 0;
    this.submitTimeout = null;
    this.isSubmitting = false;
    this.retryCount = 0;
    this.submitOnChainCallback = options.submitOnChainCallback || null; 
    this.batchDelay = options.batchDelay || 3000; 
    this.maxRetry = options.maxRetry || 3;

  
    this.name = 'ScoreSubmissionManager';
    console.log(`[${this.name}] initialized - mode: ${USE_SERVER_RELAY ? 'server-relay' : 'wallet-first (preferred)'}; API_BASE=${API_BASE}`);
  }

 
  addScore(points) {
    this.pendingScore += Number(points || 0);
    this.scheduleSubmission();
  }


  addTransaction(count = 1) {
    this.pendingTransactions += Number(count || 0);
    this.scheduleSubmission();
  }

  scheduleSubmission() {
    if (this.submitTimeout) clearTimeout(this.submitTimeout);
    this.submitTimeout = setTimeout(() => this.submitImmediately(), this.batchDelay);
  }

  async submitImmediately() {
    if (this.isSubmitting) {
      console.log(`[${this.name}] submitImmediately: already submitting, skip`);
      return { success: false, message: 'already_submitting' };
    }

    if (this.submitTimeout) {
      clearTimeout(this.submitTimeout);
      this.submitTimeout = null;
    }

    const score = this.pendingScore;
    const transactions = this.pendingTransactions;

   
    this.pendingScore = 0;
    this.pendingTransactions = 0;

    if (!score && !transactions) {
      return { success: true, message: 'nothing_to_submit' };
    }

   
    const userData =
      (window.monadGamesManager && typeof window.monadGamesManager.getUserData === 'function')
        ? window.monadGamesManager.getUserData()
        : null;

    if (!userData || !userData.walletAddress) {
      console.warn(`[${this.name}] No user wallet available; submission may still proceed (server-relay)`);
      
    }

    this.isSubmitting = true;

    try {
     
      if (!USE_SERVER_RELAY && typeof this.submitOnChainCallback === 'function') {
        console.log(`[${this.name}] Attempting wallet-first on-chain submission via provided callback...`);
        try {
          const onChainResult = await this.submitOnChainCallback({
            score,
            distance: 0,
            powerups: 0,
            transactions
          });

          if (onChainResult && (onChainResult.success || onChainResult.transactionHash)) {
            // After wallet tx success, optionally notify backend leaderboard
            await this._notifyBackendPersistence(userData, score, transactions, onChainResult);
            this.retryCount = 0;
            console.log(`[${this.name}] Wallet-first submission succeeded`, onChainResult);
            return { success: true, message: 'wallet_tx_success', onChainResult };
          } else {
            console.warn(`[${this.name}] Wallet callback returned failure, falling back to server-relay if enabled`, onChainResult);
            if (!USE_SERVER_RELAY) {
              
              return { success: false, message: 'wallet_tx_failed', detail: onChainResult };
            }
            
          }
        } catch (err) {
          console.error(`[${this.name}] Wallet callback threw`, err);
          if (!USE_SERVER_RELAY) {
            return { success: false, message: 'wallet_tx_exception', error: String(err) };
          }
         
        }
      }

      // Server-relay path
      if (USE_SERVER_RELAY) {
        console.log(`[${this.name}] Using server-relay: POST ${API_BASE}/api/submit-score`);
        const resp = await fetch(`${API_BASE}/api/submit-score`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerAddress: userData?.walletAddress || null,
            scoreAmount: score,
            transactionAmount: transactions,
            metadata: {
              timestamp: new Date().toISOString(),
              source: 'neon-runner-frontend'
            }
          })
        });

        const json = await resp.json().catch(() => null);
        if (resp.ok) {
          console.log(`[${this.name}] Server-relay submission ok`, json);
          
          await this._notifyLeaderboardPersistence(userData, score, transactions, json);
          this.retryCount = 0;
          return { success: true, message: 'server_relay_success', result: json };
        } else {
          console.error(`[${this.name}] Server-relay failed`, resp.status, json);
          throw new Error(json?.error || `HTTP ${resp.status}`);
        }
      }

     
      return { success: false, message: 'no_submission_route_available' };
    } catch (error) {
      console.error(`[${this.name}] submitImmediately error:`, error);
      // Retry logic
      if (this.retryCount < this.maxRetry) {
        this.retryCount++;
        console.log(`[${this.name}] Retrying submission in ${2000 * this.retryCount}ms (attempt ${this.retryCount})`);
        // re-add amounts
        this.pendingScore += score;
        this.pendingTransactions += transactions;
        setTimeout(() => this.submitImmediately(), 2000 * this.retryCount);
        return { success: false, message: 'retrying', attempt: this.retryCount };
      } else {
        this.retryCount = 0;
        return { success: false, message: 'submission_failed', error: String(error) };
      }
    } finally {
      this.isSubmitting = false;
    }
  }

  // Internal helper: after on-chain success, notify backend to persist to leaderboard (if backend endpoint exists)
  async _notifyBackendPersistence(userData, score, transactions, onChainResult) {
    try {
      const url = `${API_BASE}/api/scores/submit`;
      const body = {
        username: userData?.username || null,
        walletAddress: userData?.walletAddress || null,
        score,
        transactions,
        txHash: onChainResult?.transactionHash || null,
        meta: {
          submittedAt: new Date().toISOString(),
        }
      };

      
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (resp.ok) {
        const json = await resp.json().catch(() => null);
        console.log(`[${this.name}] Backend persisted score OK`, json);
        return json;
      } else {
        console.warn(`[${this.name}] Backend persist call failed`, resp.status);
      }
    } catch (err) {
      console.warn(`[${this.name}] _notifyBackendPersistence error`, err);
    }
  }

  async _notifyLeaderboardPersistence(userData, score, transactions, serverResult) {
    
    return this._notifyBackendPersistence(userData, score, transactions, serverResult);
  }

  async submitGameCompletion(chartName, difficulty, finalScore, gameStats = {}) {
    try {
      console.log(`[${this.name}] submitGameCompletion`, { chartName, difficulty, finalScore, gameStats });
      // Add any game-specific multipliers here if you need
      const adjustedScore = finalScore; // keep same for now
      this.addScore(adjustedScore);
      this.addTransaction(1);
      const result = await this.submitImmediately();

      // Attempt to update frontend leaderboard UI if available
      if (window.leaderboardManager && typeof window.leaderboardManager.updateLeaderboard === 'function') {
        try { await window.leaderboardManager.updateLeaderboard(); } catch (e) { /* ignore */ }
      }

      return result;
    } catch (err) {
      console.error(`[${this.name}] submitGameCompletion failed`, err);
      return { success: false, message: String(err) };
    }
  }

  getPendingData() {
    return {
      score: this.pendingScore,
      transactions: this.pendingTransactions,
      isSubmitting: this.isSubmitting
    };
  }

  destroy() {
    if (this.submitTimeout) {
      clearTimeout(this.submitTimeout);
      this.submitTimeout = null;
    }
    this.isSubmitting = false;
    this.pendingScore = 0;
    this.pendingTransactions = 0;
  }
}


export function initializeScoreSubmissionManager(options = {}) {
  if (!window) return null;
  if (!window.scoreSubmissionManager) {
    window.scoreSubmissionManager = new ScoreSubmissionManager(options);
    console.log('[ScoreSubmissionManager] global instance created at window.scoreSubmissionManager');
  } else {
    
    if (options.submitOnChainCallback) {
      window.scoreSubmissionManager.submitOnChainCallback = options.submitOnChainCallback;
      console.log('[ScoreSubmissionManager] updated submitOnChainCallback');
    }
  }
  return window.scoreSubmissionManager;
}
