// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "forge-std/console.sol";
import "../src/NeonRunnerGame.sol";
import "../src/PowerupNFT.sol";
import "../src/Leaderboard.sol";

contract NeonRunnerGameTest is Test {
    NeonRunnerGame public gameContract;
    PowerupNFT public powerupContract;
    Leaderboard public leaderboardContract;
    
    address public player1 = makeAddr("player1");
    address public player2 = makeAddr("player2");
    address public player3 = makeAddr("player3");
    
    function setUp() public {
        gameContract = new NeonRunnerGame();
        powerupContract = new PowerupNFT();
        leaderboardContract = new Leaderboard();
        
        leaderboardContract.setGameContract(address(gameContract));
        gameContract.setLeaderboard(address(leaderboardContract));
        
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
        
        gameContract.submitScore(1000, 500, 2);
        
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
        assertEq(bytes(username).length, 0);
        
        vm.stopPrank();
    }
    
   function testLeaderboardIntegration() public {
        vm.startPrank(player1);
        gameContract.setUsername("LeaderPlayer1");
        gameContract.submitScore(1500, 750, 3); // This will automatically update the leaderboard
        vm.stopPrank();
        
        vm.startPrank(player2);
        gameContract.setUsername("LeaderPlayer2");
        gameContract.submitScore(2000, 1000, 4); // This will automatically update the leaderboard
        vm.stopPrank();
        
        Leaderboard.LeaderboardEntry[] memory topScores = leaderboardContract.getTopScores(2);
        
        assertEq(topScores.length, 2);
        assertEq(topScores[0].player, player2);
        assertEq(topScores[0].score, 2000);
        assertEq(topScores[1].player, player1);
        assertEq(topScores[1].score, 1500);
        
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
        
        vm.expectRevert("Score must be greater than 0");
        gameContract.submitScore(0, 100, 1);
        
        vm.expectRevert("Distance must be greater than 0");
        gameContract.submitScore(100, 0, 1);
        
        vm.expectRevert("Too many powerups collected");
        gameContract.submitScore(100, 50, 101);
        
        vm.expectRevert("Score too high for distance traveled");
        gameContract.submitScore(10000, 100, 1);
        
        vm.stopPrank();
    }
    
    function testInsufficientPaymentForPowerup() public {
        vm.startPrank(player1);
        
        uint256 speedBoostPrice = powerupContract.getPowerupPrice(0);
        
        vm.expectRevert("Insufficient payment");
        powerupContract.mintPowerup{value: speedBoostPrice - 1}(0);
        
        vm.stopPrank();
    }
    
    function testGameStats() public {
        vm.prank(player1);
        gameContract.submitScore(1000, 500, 2);
        
        vm.prank(player2);
        gameContract.submitScore(1500, 750, 3);
        
        vm.prank(player3);
        gameContract.submitScore(800, 400, 1);
        
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
        vm.expectRevert("Only owner can call this function");
        vm.prank(player1);
        powerupContract.setPowerupPrice(0, 0.02 ether);
        
        powerupContract.setPowerupPrice(0, 0.02 ether);
        assertEq(powerupContract.getPowerupPrice(0), 0.02 ether);
    }
    
    function testGameActiveToggle() public {
        vm.expectRevert("Only owner can call this function");
        vm.prank(player1);
        gameContract.setGameActive(false);
        
        gameContract.setGameActive(false);
        assertFalse(gameContract.gameActive());
        
        vm.expectRevert("Game is not active");
        vm.prank(player1);
        gameContract.submitScore(1000, 500, 2);
        
        gameContract.setGameActive(true);
        assertTrue(gameContract.gameActive());
    }
    
     function testLeaderboardReset() public {
        // Use the game contract to submit scores, which will update the leaderboard
        vm.prank(player1);
        gameContract.setUsername("Player1");
        vm.prank(player1);
        gameContract.submitScore(1000, 500, 2);
        
        vm.prank(player2);
        gameContract.setUsername("Player2");
        vm.prank(player2);
        gameContract.submitScore(1500, 750, 3);
        
        assertEq(leaderboardContract.getLeaderboardSize(), 2);
        
        // Fix the error message to match what the contract actually returns
        vm.expectRevert("Only owner can call this");
        vm.prank(player1);
        leaderboardContract.resetLeaderboard();
        
        leaderboardContract.resetLeaderboard();
        assertEq(leaderboardContract.getLeaderboardSize(), 0);
    }
    
    function testRecentSessions() public {
        vm.prank(player1);
        gameContract.submitScore(1000, 500, 2);
        
        vm.prank(player2);
        gameContract.submitScore(1200, 600, 3);
        
        vm.prank(player3);
        gameContract.submitScore(800, 400, 1);
        
        NeonRunnerGame.GameSession[] memory recentSessions = gameContract.getRecentSessions(2);
        
        assertEq(recentSessions.length, 2);
        assertEq(recentSessions[0].player, player3);
        assertEq(recentSessions[0].score, 800);
        assertEq(recentSessions[1].player, player2);
        assertEq(recentSessions[1].score, 1200);
    }
    
    function testOwnership() public {
        assertEq(gameContract.owner(), address(this));
        assertEq(powerupContract.owner(), address(this));
        assertEq(leaderboardContract.owner(), address(this));
    }
    
    function testBasicFunctionality() public {
        vm.startPrank(player1);
        
        gameContract.submitScore(1000, 500, 2);
        gameContract.setUsername("TestUser");
        
        (uint256 highScore,,,,, string memory username) = gameContract.getPlayerStats(player1);
        assertEq(highScore, 1000);
        assertEq(username, "TestUser");
        
        vm.stopPrank();
    }
    
   function testEdgeCases() public {
        vm.startPrank(player1);
        
        gameContract.submitScore(1, 1, 0);
        gameContract.submitScore(1000000, 100000, 100);
        
        vm.stopPrank();
        
        // The leaderboard now works, so it will contain the scores we submitted
        // Instead of expecting empty, let's verify it contains our scores
        Leaderboard.LeaderboardEntry[] memory topScores = leaderboardContract.getTopScores(10);
        assertEq(topScores.length, 1); // Only 1 player (player1) with their highest score
        assertEq(topScores[0].player, player1);
        assertEq(topScores[0].score, 1000000); // The higher score should be recorded
    }
    
    function testUsernameSettingAndRetrieval() public {
        vm.startPrank(player1);
        
        gameContract.setUsername("TestPlayer1");
        
        string memory retrievedUsername = gameContract.getUsername(player1);
        assertEq(retrievedUsername, "TestPlayer1");
        
        (,,,,, string memory username) = gameContract.getPlayerStats(player1);
        assertEq(username, "TestPlayer1");
        
        vm.stopPrank();
    }
    
    function testMultipleScoreSubmissions() public {
        vm.startPrank(player1);
        
        gameContract.submitScore(500, 250, 1);
        gameContract.submitScore(1000, 500, 2);
        gameContract.submitScore(750, 375, 1);
        
        (uint256 highScore, uint256 totalGames,,,, ) = gameContract.getPlayerStats(player1);
        assertEq(highScore, 1000);
        assertEq(totalGames, 3);
        
        vm.stopPrank();
    }
    
    function testTopPlayersLeaderboard() public {
        vm.prank(player1);
        gameContract.setUsername("Player1");
        vm.prank(player2);
        gameContract.setUsername("Player2");
        vm.prank(player3);
        gameContract.setUsername("Player3");
        
        vm.prank(player1);
        gameContract.submitScore(1500, 750, 3);
        
        vm.prank(player2);
        gameContract.submitScore(2000, 1000, 4);
        
        vm.prank(player3);
        gameContract.submitScore(1000, 500, 2);
        
        (address[] memory players, uint256[] memory scores, string[] memory names) = 
            gameContract.getTopPlayers(3);
        
        assertEq(players.length, 3);
        assertEq(players[0], player2);
        assertEq(scores[0], 2000);
        assertEq(names[0], "Player2");
        
        assertEq(players[1], player1);
        assertEq(scores[1], 1500);
        assertEq(names[1], "Player1");
        
        assertEq(players[2], player3);
        assertEq(scores[2], 1000);
        assertEq(names[2], "Player3");
    }
    
    function testPowerupNFTMinting() public {
        vm.startPrank(player1);
        
        assertEq(powerupContract.balanceOf(player1), 0);
        
        uint256 speedBoostPrice = powerupContract.getPowerupPrice(0);
        
        powerupContract.mintPowerup{value: speedBoostPrice}(0);
        
        assertEq(powerupContract.balanceOf(player1), 1);
        
        uint256[] memory ownedPowerups = powerupContract.getPowerups(player1);
        assertEq(ownedPowerups.length, 1);
        
        uint256 tokenId = ownedPowerups[0];
        (uint8 powerupType, address owner, bool used,,,, ) = powerupContract.getPowerupDetails(tokenId);
        
        assertEq(powerupType, 0);
        assertEq(owner, player1);
        assertFalse(used);
        
        vm.stopPrank();
    }
    
    function testPowerupUsage() public {
        vm.startPrank(player1);
        
        uint256 shieldPrice = powerupContract.getPowerupPrice(1);
        powerupContract.mintPowerup{value: shieldPrice}(1);
        
        uint256[] memory ownedPowerups = powerupContract.getPowerups(player1);
        uint256 tokenId = ownedPowerups[0];
        
        powerupContract.usePowerup(tokenId);
        
        (,, bool used,, uint256 useTimestamp,, ) = powerupContract.getPowerupDetails(tokenId);
        assertTrue(used);
        assertGt(useTimestamp, 0);
        
        vm.stopPrank();
    }
}