// frontend/src/utils/monadWalletUtils.js
import { createWalletClient, custom } from 'viem'
import { monadTestnet } from './constants'

/**
 * Utility functions for MonadGames embedded wallet integration
 */

// Create a wallet client from Privy's embedded wallet
export const createMonadWalletClient = async (embeddedWallet) => {
  if (!embeddedWallet || !embeddedWallet.provider) {
    throw new Error('No embedded wallet provider available')
  }

  try {
    const walletClient = createWalletClient({
      chain: monadTestnet,
      transport: custom(embeddedWallet.provider)
    })

    return walletClient
  } catch (error) {
    console.error('Failed to create wallet client:', error)
    throw error
  }
}

// Get the embedded wallet from Privy context
export const getEmbeddedWalletFromPrivy = async (privyUser, getCrossAppAccounts) => {
  if (!privyUser || !getCrossAppAccounts) {
    return null
  }

  try {
    const crossApps = await getCrossAppAccounts()
    const monadGamesAccount = crossApps.find(
      account => account.type === 'cross_app' && 
                 account.providerApp?.id === 'cmd8euall0037le0my79qpz42'
    )

    if (monadGamesAccount && monadGamesAccount.embeddedWallets?.length > 0) {
      return monadGamesAccount.embeddedWallets[0]
    }

    return null
  } catch (error) {
    console.error('Failed to get embedded wallet:', error)
    return null
  }
}

// Check if user has sufficient balance for transaction
export const checkBalance = async (walletClient, address, requiredAmount) => {
  try {
    const balance = await walletClient.getBalance({ address })
    return balance >= BigInt(requiredAmount)
  } catch (error) {
    console.error('Failed to check balance:', error)
    return false
  }
}

// Format balance for display
export const formatBalance = (balance) => {
  if (!balance) return '0.00'
  return (Number(balance) / 1e18).toFixed(4)
}

// Estimate gas for powerup mint transaction
export const estimateGasForMint = async (walletClient, contractAddress, abi, powerupType, value) => {
  try {
    const gasEstimate = await walletClient.estimateContractGas({
      address: contractAddress,
      abi,
      functionName: 'mintPowerup',
      args: [BigInt(powerupType)],
      value: BigInt(value)
    })

    // Add 20% buffer
    return gasEstimate * 12n / 10n
  } catch (error) {
    console.error('Gas estimation failed:', error)
    // Return default gas limit
    return 120000n
  }
}

export default {
  createMonadWalletClient,
  getEmbeddedWalletFromPrivy,
  checkBalance,
  formatBalance,
  estimateGasForMint
}