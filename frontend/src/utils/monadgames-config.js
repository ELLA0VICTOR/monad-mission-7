// frontend/src/utils/monadgames-config.js
const MONADGAMES_CONFIG = {
  appId: import.meta.env.VITE_PRIVY_APP_ID || 'cmeoh0zfu0339l80bldo6zjou',
  crossAppId: 'cmd8euall0037le0my79qpz42',
  apiEndpoint: 'https://monad-games-id-site.vercel.app/api/check-wallet',
  registrationUrl: 'https://monad-games-id-site.vercel.app/',
  apiBase: import.meta.env.VITE_API_BASE || 'http://localhost:4000',
  contractAddress: import.meta.env.VITE_NEON_RUNNER_GAME || '0x4FfD2c9EEB93D633d217B945C7Baf66a35aB6343',
}

export { MONADGAMES_CONFIG }
export default MONADGAMES_CONFIG
