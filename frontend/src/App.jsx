import React, { useState } from 'react'
import { PrivyProvider } from '@privy-io/react-auth'
import { WagmiProvider } from '@privy-io/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { monadTestnet } from './utils/constants'
import { wagmiConfig } from './utils/blockchain'
import { Toaster } from 'react-hot-toast'
import Header from './layout/Header'
import Footer from './Layout/Footer'
import GameCanvas from './components/Game/GameCanvas'
import Leaderboard from './components/UI/Leaderboard'
import PowerupShop from './components/UI/PowerupShop'

const queryClient = new QueryClient()


const MONAD_CROSS_APP_ID = 'cmd8euall0037le0my79qpz42'

function App() {
  const [currentView, setCurrentView] = useState('game')

  const handleViewChange = (view) => {
    setCurrentView(view)
  }

  
  const privyAppId = import.meta.env.VITE_PRIVY_APP_ID || 'cmeoh0zfu0339l80bldo6zjou'

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
       
        loginMethodsAndOrder: {
          
          primary: [`privy:${MONAD_CROSS_APP_ID}`, 'wallet', 'email'],
        },

        appearance: {
          theme: 'dark',
          accentColor: '#00ff88',
          logo: '/neon-runner-logo.png',
          showWalletLoginFirst: true,
          walletChainType: 'ethereum-only',
        },

        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
          requireUserPasswordOnCreate: true,
        },

        mfa: {
          noPromptOnMfaRequired: false,
        },

        
        supportedChains: [monadTestnet],
        defaultChain: monadTestnet,

        customAuth: {
          enabled: true,
          name: 'MONAD GAMES ID',
          logo: 'https://app.privy.io/api/img?src=https://monad.xyz/favicon.ico',
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black text-white">
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: 'rgba(0, 255, 136, 0.1)',
                  color: '#00ff88',
                  border: '1px solid #00ff88',
                },
              }}
            />

            <Header onViewChange={handleViewChange} currentView={currentView} />

            <main className="container mx-auto px-4 py-8">
              {currentView === 'game' && <GameCanvas />}
              {currentView === 'leaderboard' && <Leaderboard />}
              {currentView === 'shop' && <PowerupShop />}
            </main>

            <Footer />
          </div>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  )
}

export default App
