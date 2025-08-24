// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/NeonRunnerGame.sol";
import "../src/PowerupNFT.sol";
import "../src/Leaderboard.sol";

/**
 * @title Deploy
 * @dev Deployment script for all Neon Runner contracts
 */
contract Deploy is Script {
    function run() external {
        // Get private key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts with address:", deployer);
        console.log("Deployer balance:", deployer.balance / 1e18, "ETH");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy NeonRunnerGame contract
        console.log("Deploying NeonRunnerGame...");
        NeonRunnerGame gameContract = new NeonRunnerGame();
        console.log("NeonRunnerGame deployed at:", address(gameContract));
        
        // 2. Deploy PowerupNFT contract
        console.log("Deploying PowerupNFT...");
        PowerupNFT powerupContract = new PowerupNFT();
        console.log("PowerupNFT deployed at:", address(powerupContract));
        
        // 3. Deploy Leaderboard contract
        console.log("Deploying Leaderboard...");
        Leaderboard leaderboardContract = new Leaderboard();
        console.log("Leaderboard deployed at:", address(leaderboardContract));
        
        // 4. Configure contracts
        console.log("Configuring contracts...");
        
        // Set game contract in leaderboard
        leaderboardContract.setGameContract(address(gameContract));
        console.log("Game contract set in leaderboard");
        
        // Set test usernames and initial data if needed
        // gameContract.setUsername("TestPlayer1");
        
        vm.stopBroadcast();
        
        // Log deployment summary
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("Network: Monad Testnet");
        console.log("Deployer:", deployer);
        console.log("NeonRunnerGame:", address(gameContract));
        console.log("PowerupNFT:", address(powerupContract));
        console.log("Leaderboard:", address(leaderboardContract));
        console.log("========================\n");
        
        // Save deployment addresses to file
        _saveDeploymentAddresses(
            address(gameContract),
            address(powerupContract),
            address(leaderboardContract)
        );
        
        // Verify contracts are working
        _verifyDeployment(gameContract, powerupContract, leaderboardContract);
    }
    
    function _saveDeploymentAddresses(
        address gameContract,
        address powerupContract,
        address leaderboardContract
    ) internal {
        string memory addresses = string(abi.encodePacked(
            "{\n",
            '  "NEON_RUNNER_GAME": "', vm.toString(gameContract), '",\n',
            '  "POWERUP_NFT": "', vm.toString(powerupContract), '",\n',
            '  "LEADERBOARD": "', vm.toString(leaderboardContract), '"\n',
            "}"
        ));
        
        vm.writeFile("./deployments/monad-testnet.json", addresses);
        console.log("Deployment addresses saved to ./deployments/monad-testnet.json");
    }
    
    function _verifyDeployment(
        NeonRunnerGame gameContract,
        PowerupNFT powerupContract,
        Leaderboard leaderboardContract
    ) internal view {
        console.log("\n=== VERIFICATION ===");
        
        // Verify NeonRunnerGame
        console.log("Game contract active:", gameContract.gameActive());
        console.log("Game total players:", gameContract.getTotalPlayers());
        
        // Verify PowerupNFT
        console.log("Powerup contract name:", powerupContract.name());
        console.log("Powerup contract symbol:", powerupContract.symbol());
        console.log("Speed Boost price:", powerupContract.getPowerupPrice(0), "wei");
        
        // Verify Leaderboard
        console.log("Leaderboard size:", leaderboardContract.getLeaderboardSize());
        console.log("Leaderboard game contract:", leaderboardContract.gameContract());
        
        console.log("All contracts verified successfully!");
        console.log("==================\n");
    }
}