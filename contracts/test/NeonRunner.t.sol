// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/NeonRunnerGame.sol";
import "../src/PowerupNFT.sol";
import "../src/Leaderboard.sol";

contract NeonRunnerTest is Test {
    NeonRunnerGame public gameContract;
    PowerupNFT public powerupContract;
    Leaderboard public leaderboardContract;
    
    address public player1 = makeAddr("player1");
    address public player2 = makeAddr("player2");
    address public player3 = makeAddr("player3");
    
    function setUp() public {
        // Deploy contracts
        gameContract = new NeonRunnerGame();
        powerupContract = new PowerupNFT();
        leaderboardContract = new Leaderboard();
        
        // Configure leaderboard
        leaderboardContract.setGameContract(address(gameContract));
        
        // Give players some ETH
        vm.deal(player1, 10 ether);
        vm.deal(player2, 10 ether);
        vm.deal(player3, 10 ether);
        
        console.log("Setup complete - contracts deployed and configured");
    }
    
    function testGameContractInitialization() public {
        assertTrue(gameContract.gameActive());
        assertEq(gameContract.owner(), address(this));
        assertEq(gameContract.getTotalPlayers(), 0);
        assertEq(gameContract.getTotalSessions(), 0);
    }
    
    function testScoreSubmission() public {
        vm.startPrank(player1);
        
        // Submit first score
        gameContract.submitScore(1000, 500, 2);
        
        // Check stats
        (
            uint256 highScore,
            uint256 totalGames,
            uint256 totalDistance,
            uint256 totalPowerups,
            uint256 lastPlayed,
            string memory username
        ) = gameContract.getPlayerStats(player1);
        
        assertEq(highScore, 1000);
        assertEq(totalGames, 1);
        assertEq(totalDistance, 500);
        assertEq(totalPowerups, 2);
        assertGt(lastPlayed, 0);
        assertEq(bytes(username).length, 0); // No username set yet
        
        vm.stopPrank();
    }
    
    function testLeaderboardIntegration() public {
        vm.startPrank(player1);
        gameContract.setUsername("LeaderPlayer1");
        vm.stopPrank();
        
        vm.startPrank(player2);
        gameContract.setUsername("LeaderPlayer2");
        vm.stopPrank();
        
        // Manually update leaderboard (in real implementation, this would be called by game contract)
        leaderboardContract.updateScore(player1, "LeaderPlayer1", 1500);
        leaderboardContract.updateScore(player2, "LeaderPlayer2", 2000);
        
        // Check leaderboard
        Leaderboard.LeaderboardEntry[] memory topScores = leaderboardContract.getTopScores(2);
        
        assertEq(topScores.length, 2);
        assertEq(topScores[0].player, player2); // Highest score first
        assertEq(topScores[0].score, 2000);
        assertEq(topScores[1].player, player1);
        assertEq(topScores[1].score, 1500);
        
        // Check player ranks
        (uint256 rank1, uint256 score1, bool exists1) = leaderboardContract.getPlayerRank(player1);
        (uint256 rank2, uint256 score2, bool exists2) = leaderboardContract.getPlayerRank(player2);
        
        assertTrue(exists1);
        assertTrue(exists2);
        assertEq(rank1, 2);
        assertEq(rank2, 1);
        assertEq(score1, 1500);
        assertEq(score2, 2000);
    }
    
    function testInvalidScoreSubmission() public {
        vm.startPrank(player1);
        
        // Test invalid scores
        vm.expectRevert("Score must be greater than 0");
        gameContract.submitScore(0, 100, 1);
        
        vm.expectRevert("Distance must be greater than 0");
        gameContract.submitScore(100, 0, 1);
        
        vm.expectRevert("Too many powerups collected");
        gameContract.submitScore(100, 50, 101);
        
        vm.expectRevert("Score too high for distance traveled");
        gameContract.submitScore(10000, 100, 1); // Score way too high for distance
        
        vm.stopPrank();
    }
    
    function testInsufficientPaymentForPowerup() public {
        vm.startPrank(player1);
        
        uint256 speedBoostPrice = powerupContract.getPowerupPrice(0);
        
        // Try to mint with insufficient payment
        vm.expectRevert("Insufficient payment");
        powerupContract.mintPowerup{value: speedBoostPrice - 1}(0);
        
        vm.stopPrank();
    }
    
    function testGameStats() public {
        // Add some players and scores
        vm.prank(player1);
        gameContract.submitScore(1000, 500, 2);
        
        vm.prank(player2);
        gameContract.submitScore(1500, 750, 3);
        
        vm.prank(player3);
        gameContract.submitScore(800, 400, 1);
        
        // Check game stats
        (
            uint256 totalPlayers,
            uint256 totalSessions,
            uint256 highestScore,
            address topPlayer
        ) = gameContract.getGameStats();
        
        assertEq(totalPlayers, 3);
        assertEq(totalSessions, 3);
        assertEq(highestScore, 1500);
        assertEq(topPlayer, player2);
    }
    
    function testPowerupPriceUpdates() public {
        // Only owner should be able to update prices
        vm.expectRevert("Only owner can call this function");
        vm.prank(player1);
        powerupContract.setPowerupPrice(0, 0.02 ether);
        
        // Owner can update price
        powerupContract.setPowerupPrice(0, 0.02 ether);
        assertEq(powerupContract.getPowerupPrice(0), 0.02 ether);
    }
    
    function testGameActiveToggle() public {
        // Only owner should be able to toggle game active state
        vm.expectRevert("Only owner can call this function");
        vm.prank(player1);
        gameContract.setGameActive(false);
        
        // Owner can toggle
        gameContract.setGameActive(false);
        assertFalse(gameContract.gameActive());
        
        // Should not be able to submit scores when inactive
        vm.expectRevert("Game is not active");
        vm.prank(player1);
        gameContract.submitScore(1000, 500, 2);
        
        // Re-activate
        gameContract.setGameActive(true);
        assertTrue(gameContract.gameActive());
    }
    
    function testLeaderboardReset() public {
        // Add some scores to leaderboard
        leaderboardContract.updateScore(player1, "Player1", 1000);
        leaderboardContract.updateScore(player2, "Player2", 1500);
        
        assertEq(leaderboardContract.getLeaderboardSize(), 2);
        
        // Only owner should be able to reset
        vm.expectRevert("Only owner can call this function");
        vm.prank(player1);
        leaderboardContract.resetLeaderboard();
        
        // Owner can reset
        leaderboardContract.resetLeaderboard();
        assertEq(leaderboardContract.getLeaderboardSize(), 0);
    }
    
    function testRecentSessions() public {
        // Submit some game sessions
        vm.prank(player1);
        gameContract.submitScore(1000, 500, 2);
        
        vm.prank(player2);
        gameContract.submitScore(1200, 600, 3);
        
        vm.prank(player3);
        gameContract.submitScore(800, 400, 1);
        
        // Get recent sessions
        NeonRunnerGame.GameSession[] memory recentSessions = gameContract.getRecentSessions(2);
        
        assertEq(recentSessions.length, 2);
        // Should be in reverse chronological order (most recent first)
        assertEq(recentSessions[0].player, player3); // Last submitted
        assertEq(recentSessions[0].score, 800);
        assertEq(recentSessions[1].player, player2);
        assertEq(recentSessions[1].score, 1200);
    }
    
    function testOwnership() public {
        // Check contract ownership
        assertEq(gameContract.owner(), address(this));
        assertEq(powerupContract.owner(), address(this));
        assertEq(leaderboardContract.owner(), address(this));
    }
    
    function testEventEmission() public {
        vm.startPrank(player1);
        
        // Test score submission event
        vm.expectEmit(true, false, false, true);
        emit NeonRunnerGame.ScoreSubmitted(player1, 1000, 500, 2, block.timestamp);
        gameContract.submitScore(1000, 500, 2);
        
        // Test username setting event
        vm.expectEmit(true, false, false, true);
        emit NeonRunnerGame.UsernameSet(player1, "TestUser");
        gameContract.setUsername("TestUser");
        
        vm.stopPrank();
    }
    
    function testEdgeCases() public {
        vm.startPrank(player1);
        
        // Test minimum valid inputs
        gameContract.submitScore(1, 1, 0);
        
        // Test maximum valid inputs
        gameContract.submitScore(1000000, 100000, 100); // Max score with reasonable distance
        
        vm.stopPrank();
        
        // Test empty leaderboard queries
        Leaderboard.LeaderboardEntry[] memory emptyBoard = leaderboardContract.getTopScores(10);
        assertEq(emptyBoard.length, 0);
    }
    
    // Events for testing
    event ScoreSubmitted(address indexed player, uint256 score, uint256 distance, uint256 powerupsCollected, uint256 timestamp);
    event UsernameSet(address indexed player, string username);
}
    }
    
    function testUsernameSettingAndRetrieval() public {
        vm.startPrank(player1);
        
        // Set username
        gameContract.setUsername("TestPlayer1");
        
        // Check username
        string memory retrievedUsername = gameContract.getUsername(player1);
        assertEq(retrievedUsername, "TestPlayer1");
        
        // Check in player stats
        (,,,,, string memory username) = gameContract.getPlayerStats(player1);
        assertEq(username, "TestPlayer1");
        
        vm.stopPrank();
    }
    
    function testMultipleScoreSubmissions() public {
        vm.startPrank(player1);
        
        // Submit multiple scores
        gameContract.submitScore(500, 250, 1);
        gameContract.submitScore(1000, 500, 2); // Higher score
        gameContract.submitScore(750, 375, 1);  // Lower score
        
        // Check that high score is updated correctly
        (uint256 highScore, uint256 totalGames,,,, ) = gameContract.getPlayerStats(player1);
        assertEq(highScore, 1000);
        assertEq(totalGames, 3);
        
        vm.stopPrank();
    }
    
    function testTopPlayersLeaderboard() public {
        // Set usernames
        vm.prank(player1);
        gameContract.setUsername("Player1");
        vm.prank(player2);
        gameContract.setUsername("Player2");
        vm.prank(player3);
        gameContract.setUsername("Player3");
        
        // Submit scores for different players
        vm.prank(player1);
        gameContract.submitScore(1500, 750, 3);
        
        vm.prank(player2);
        gameContract.submitScore(2000, 1000, 4); // Highest score
        
        vm.prank(player3);
        gameContract.submitScore(1000, 500, 2);
        
        // Get top players
        (address[] memory players, uint256[] memory scores, string[] memory names) = 
            gameContract.getTopPlayers(3);
        
        // Should be ordered by score (highest first)
        assertEq(players.length, 3);
        assertEq(players[0], player2); // Highest score
        assertEq(scores[0], 2000);
        assertEq(names[0], "Player2");
        
        assertEq(players[1], player1); // Second highest
        assertEq(scores[1], 1500);
        assertEq(names[1], "Player1");
        
        assertEq(players[2], player3); // Lowest
        assertEq(scores[2], 1000);
        assertEq(names[2], "Player3");
    }
    
    function testPowerupNFTMinting() public {
        vm.startPrank(player1);
        
        // Check initial balance
        assertEq(powerupContract.balanceOf(player1), 0);
        
        // Get price for speed boost
        uint256 speedBoostPrice = powerupContract.getPowerupPrice(0);
        
        // Mint a speed boost powerup
        powerupContract.mintPowerup{value: speedBoostPrice}(0);
        
        // Check balance updated
        assertEq(powerupContract.balanceOf(player1), 1);
        
        // Check powerup details
        uint256[] memory ownedPowerups = powerupContract.getPowerups(player1);
        assertEq(ownedPowerups.length, 1);
        
        uint256 tokenId = ownedPowerups[0];
        (uint8 powerupType, address owner, bool used,,,, ) = powerupContract.getPowerupDetails(tokenId);
        
        assertEq(powerupType, 0); // SPEED_BOOST
        assertEq(owner, player1);
        assertFalse(used);
        
        vm.stopPrank();
    }
    
    function testPowerupUsage() public {
        vm.startPrank(player1);
        
        // Mint and use a powerup
        uint256 shieldPrice = powerupContract.getPowerupPrice(1);
        powerupContract.mintPowerup{value: shieldPrice}(1); // SHIELD
        
        uint256[] memory ownedPowerups = powerupContract.getPowerups(player1);
        uint256 tokenId = ownedPowerups[0];
        
        // Use the powerup
        powerupContract.usePowerup(tokenId);
        
        // Check it's marked as used
        (,, bool used,, uint256 useTimestamp,, ) = powerupContract.getPowerupDetails(tokenId);
        assertTrue(used);
        assertGt(useTimestamp, 0);
        
        vm.stopPrank();