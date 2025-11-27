# Monad Neon Runner 🏃

A web3-powered endless runner game built on the **Monad Testnet**, featuring identity via **MonadGames ID** and permanent **Powerup NFTs**.

---

## 🔥 Features

- 🎮 **Endless Runner Game** with obstacles, scoring, and leaderboard.
- 🆔 **MonadGames ID Integration** for seamless login, profiles, and leaderboards.
- 🛒 **NFT Powerup Shop**:
  - Players can purchase permanent powerups as NFTs.
  - Uses **injected wallets (MetaMask)** only for minting, ensuring minting happens on **Monad Testnet**, not Ethereum.
  - App automatically switches between **MonadGames ID (identity/leaderboard)** and **Injected Wallet (minting)** depending on the page.
- 🛡️ **Shields & Powerups** that actually protect the player in-game.
- 📊 **Leaderboard** synced with MonadGames ID accounts.
- 🌐 **Full-stack setup**:
  - Frontend → Vite + React (deployable on **Vercel**).
  - Backend → Node.js/Express (deployable on **Render**).
  - Smart Contracts → Solidity (deployed on **Monad Testnet**).

---

## 🛠️ Tech Stack

- **Frontend**: Reac18 + Vite + TailwindCSS + Framer Motion  
- **Backend**: Node.js + Express  
- **Web3**: Wagmi + Ethers.js  
- **Identity**: MonadGames ID  
- **Contracts**: Solidity  
- **Deployment**:  
  - Vercel → frontend  
  - Render → backend  

---

##  Deployment Instructions

### Frontend (Vercel)
1. Push this repo to GitHub.
2. Go to [Vercel](https://vercel.com) → “New Project” → Import your GitHub repo.
3. Set root to `/frontend`.
4. Add environment variables (see `.env.example`).
5. Deploy 🚀

### Backend (Render)
1. Push your backend folder to GitHub (part of this repo).
2. Go to [Render](https://render.com) → “New Web Service”.
3. Connect repo → select backend folder.
4. Choose **Node environment** → build command `npm install` → start command `npm start`.
5. Add environment variables.
6. Deploy 🚀

---

## ⚙️ Environment Variables

Create a `.env` in both `frontend/` and `backend/`:

**Frontend**


---

##  How it Works

1. Player logs in with **MonadGames ID**.  
2. They can play the game → scores sync to leaderboard via backend.  
3. Visiting the **NFT Shop** automatically switches connection:
   - Disconnects MonadGames ID
   - Prompts for injected wallet (MetaMask)
   - Ensures wallet is on **Monad Testnet**
4. NFT minting charges fees in Monad Testnet tokens.s  
5. Leaving the shop switches back to MonadGames ID seamlessly.  


Network Name: Monad Testnet
RPC URL: https://testnet-rpc.monad.xyz

Chain ID: 20143
Currency: MON

---

- Contracts are already deployed to Monad Testnet.  
- Game runs fully in browser with backend syncing scores + NFT metadata.

---

## 👨‍💻 Authors

Built with  by Victor.


## 📌 Notes

- Make sure your MetaMask is set up with the **Monad Testnet RPC**:
