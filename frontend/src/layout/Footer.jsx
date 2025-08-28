import React from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Github, Globe, Zap } from 'lucide-react'

const Footer = () => {
  const links = [
    { name: 'Monad Explorer', url: 'https://testnet.monadexplorer.com', icon: Globe },
    { name: 'Mission 7 Hub', url: 'https://monad-foundation.notion.site/Mission-7-Monad-Game-Jam-Resources-24d6367594f280268926d344bc82c67a', icon: ExternalLink },
    { name: 'GitHub Repo', url: 'https://github.com/ELLA0VICTOR/monad-mission-7', icon: Github }, // You'll need to add your actual repo URL
  ]

  return (
    <footer className="bg-gray-900/50 border-t border-green-400/30 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Project Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center md:text-left"
          >
            <div className="flex items-center justify-center md:justify-start space-x-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-400 rounded-lg flex items-center justify-center">
                <Zap size={20} className="text-black" />
              </div>
              <h3 className="text-xl font-bold text-green-400">Neon Runner</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              The ultimate cyberpunk endless runner built for the Monad Mission 7 Game Jam. 
              Experience fast-paced gameplay with blockchain-verified scores and NFT powerups.
            </p>
          </motion.div>

          {/* Game Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <h4 className="text-lg font-semibold text-green-400 mb-4">Features</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex items-center justify-center space-x-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span>Blockchain Leaderboards</span>
              </li>
              <li className="flex items-center justify-center space-x-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                <span>NFT Powerup System</span>
              </li>
              <li className="flex items-center justify-center space-x-2">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span>Monad Games ID Integration</span>
              </li>
              <li className="flex items-center justify-center space-x-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                <span>Real-time Score Verification</span>
              </li>
            </ul>
          </motion.div>

          {/* Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center md:text-right"
          >
            <h4 className="text-lg font-semibold text-green-400 mb-4">Links</h4>
            <div className="space-y-3">
              {links.map((link) => {
                const Icon = link.icon
                return (
                  <a
                    key={link.name}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center md:justify-end space-x-2 text-gray-400 hover:text-green-400 transition-colors group"
                  >
                    <span className="text-sm">{link.name}</span>
                    <Icon 
                      size={16} 
                      className="group-hover:translate-x-1 transition-transform duration-200" 
                    />
                  </a>
                )
              })}
            </div>

            {/* Chain Info */}
            <div className="mt-6 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="text-xs text-gray-400 mb-1">Running on</div>
              <div className="flex items-center justify-center md:justify-end space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-green-400">Monad Testnet</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">Chain ID: 10143</div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="border-t border-gray-700 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between text-sm text-gray-500"
        >
          <div className="mb-4 md:mb-0">
            <p>© 2024 Neon Runner - Built for Mission 7 Game Jam</p>
          </div>
          
          <div className="flex items-center space-x-6">
            <span className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span>Game Status: Live</span>
            </span>
            
            <div className="text-xs">
              Made with ⚡ by{' '}
              <span className="text-green-400 font-semibold">Vickytor</span>
            </div>
          </div>
        </motion.div>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 p-4 bg-yellow-400/10 border border-yellow-400/30 rounded-lg"
        >
          <p className="text-xs text-yellow-400 text-center">
            ⚠️ This is a testnet game built for educational purposes. 
            All tokens and NFTs have no real monetary value. 
            Play responsibly and have fun!
          </p>
        </motion.div>
      </div>
    </footer>
  )
}

export default Footer