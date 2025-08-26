require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');

const app = express();
app.use(express.json());
app.use(cors()); 
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.NEON_RUNNER_GAME_CONTRACT;
const PORT = process.env.PORT || 4000;


const NEON_RUNNER_MINIMAL_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "_score", "type": "uint256" },
      { "internalType": "uint256", "name": "_distance", "type": "uint256" },
      { "internalType": "uint256", "name": "_powerupsCollected", "type": "uint256" }
    ],
    "name": "submitScore",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

if (!RPC_URL || !PRIVATE_KEY || !CONTRACT_ADDRESS) {
  console.error('Missing env vars. Copy .env.example to .env and set RPC_URL, PRIVATE_KEY, NEON_RUNNER_GAME_CONTRACT');
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const contract = new ethers.Contract(CONTRACT_ADDRESS, NEON_RUNNER_MINIMAL_ABI, wallet);

app.get('/health', (req, res) => {
  res.json({ ok: true, chain: RPC_URL });
});


app.post('/api/submit-score', async (req, res) => {
  try {
    const { playerAddress, score, distance = 0, powerups = 0, metadata = {} } = req.body;

    // Basic validation
    if (typeof score === 'undefined' || Number(score) <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid score' });
    }

    // Log for debugging
    console.log('Submit-score request', { playerAddress, score, distance, powerups, metadata });

   
    const tx = await contract.submitScore(BigInt(score), BigInt(distance || 0), BigInt(powerups || 0), {
      
    });

    console.log('Transaction sent:', tx.hash);

    // Wait for 1 confirmation
    const receipt = await tx.wait(1);
    console.log('Transaction mined:', receipt.transactionHash, 'block', receipt.blockNumber);

    return res.json({
      success: true,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : null,
      note: 'Submitted on-chain via server EOA. Contract attributes submission to the tx sender (server EOA).'
    });
  } catch (err) {
    console.error('submit-score failed', err);
    return res.status(500).json({ success: false, error: err.message || String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
