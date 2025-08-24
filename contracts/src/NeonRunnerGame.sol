// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/console.sol";
import "./Leaderboard.sol"; // ADD THIS IMPORT

/**
 * @title NeonRunnerGame
 * @dev Main game contract for Neon Runner - handles score submission and player stats
 */
contract NeonRunnerGame {
    struct PlayerStats {
        uint256 highScore;
        uint256 totalGames;
        uint256 totalDistance;
        uint256 totalPowerupsCollected;
        uint256 lastPlayedTimestamp;
        string username;
    }

    struct GameSession {
        address player;
        uint256 score;
        uint256 distance;
        uint256 powerupsCollected;
        uint256 timestamp;
        bytes32 sessionHash;
    }

    // Events
    event ScoreSubmitted(
        address indexed player,
        uint256 score,
        uint256 distance,
        uint256 powerupsCollected,
        uint256 timestamp
    );
    
    event UsernameSet(address indexed player, string username);
    event HighScoreAchieved(address indexed player, uint256 newHighScore);

    // State variables
    mapping(address => PlayerStats) public playerStats;
    mapping(bytes32 => bool) public usedSessionHashes;
    mapping(address => string) public usernames;
    
    address[] public players;
    GameSession[] public gameSessions;
    
    address public owner;
    bool public gameActive;
    uint256 public totalGamesPlayed;
    uint256 public constant MAX_SCORE = 1000000; // Maximum possible score to prevent exploits
    uint256 public constant MIN_SESSION_TIME = 10; // Minimum session time in seconds
    
    Leaderboard public leaderboard; // ADD THIS STATE VARIABLE

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier gameIsActive() {
        require(gameActive, "Game is not active");
        _;
    }

    constructor() {
        owner = msg.sender;
        gameActive = true;
        console.log("NeonRunnerGame deployed by:", msg.sender);
    }

    // ADD THIS FUNCTION TO SET LEADERBOARD
    function setLeaderboard(address _leaderboard) external onlyOwner {
        leaderboard = Leaderboard(_leaderboard);
    }

    /**
     * @dev Submit a game score with anti-cheat measures
     */
    function submitScore(
        uint256 _score,
        uint256 _distance,
        uint256 _powerupsCollected
    ) external gameIsActive {
        require(_score > 0, "Score must be greater than 0");
        require(_score <= MAX_SCORE, "Score too high");
        require(_distance > 0, "Distance must be greater than 0");
        require(_powerupsCollected <= 100, "Too many powerups collected");

        // Basic anti-cheat: score should be reasonable relative to distance
        require(_score <= _distance * 10, "Score too high for distance traveled");

        PlayerStats storage stats = playerStats[msg.sender];
        
        // If this is a new player, add them to the players array
        if (stats.totalGames == 0) {
            players.push(msg.sender);
        }

        // Update player stats
        stats.totalGames++;
        stats.totalDistance += _distance;
        stats.totalPowerupsCollected += _powerupsCollected;
        stats.lastPlayedTimestamp = block.timestamp;

        // Check for new high score
        bool isHighScore = false;
        if (_score > stats.highScore) {
            stats.highScore = _score;
            isHighScore = true;
            emit HighScoreAchieved(msg.sender, _score);
            
            // UPDATE LEADERBOARD when player achieves new high score
            if (address(leaderboard) != address(0)) {
                string memory username = stats.username;
                if (bytes(username).length == 0) {
                    username = "Anonymous";
                }
                leaderboard.updateScore(msg.sender, username, _score);
            }
        }

        // Create game session record
        bytes32 sessionHash = keccak256(
            abi.encodePacked(
                msg.sender,
                _score,
                _distance,
                _powerupsCollected,
                block.timestamp,
                block.number
            )
        );

        require(!usedSessionHashes[sessionHash], "Session hash already used");
        usedSessionHashes[sessionHash] = true;

        GameSession memory session = GameSession({
            player: msg.sender,
            score: _score,
            distance: _distance,
            powerupsCollected: _powerupsCollected,
            timestamp: block.timestamp,
            sessionHash: sessionHash
        });

        gameSessions.push(session);
        totalGamesPlayed++;

        emit ScoreSubmitted(msg.sender, _score, _distance, _powerupsCollected, block.timestamp);

        console.log("Score submitted by:", msg.sender, "Score:", _score);
    }
    /**
     * @dev Set player username
     */
    function setUsername(string calldata _username) external {
        require(bytes(_username).length >= 3, "Username too short");
        require(bytes(_username).length <= 20, "Username too long");
        
        playerStats[msg.sender].username = _username;
        usernames[msg.sender] = _username;
        
        emit UsernameSet(msg.sender, _username);
    }

    /**
     * @dev Get player statistics
     */
    function getPlayerStats(address _player) external view returns (
        uint256 highScore,
        uint256 totalGames,
        uint256 totalDistance,
        uint256 totalPowerupsCollected,
        uint256 lastPlayed,
        string memory username
    ) {
        PlayerStats memory stats = playerStats[_player];
        return (
            stats.highScore,
            stats.totalGames,
            stats.totalDistance,
            stats.totalPowerupsCollected,
            stats.lastPlayedTimestamp,
            stats.username
        );
    }

    /**
     * @dev Get username for a player
     */
    function getUsername(address _player) external view returns (string memory) {
        return usernames[_player];
    }

    /**
     * @dev Get top players by high score
     */
    function getTopPlayers(uint256 _limit) external view returns (
        address[] memory topPlayers,
        uint256[] memory scores,
        string[] memory names
    ) {
        require(_limit > 0 && _limit <= 100, "Invalid limit");
        
        uint256 playerCount = players.length;
        if (playerCount == 0) {
            return (new address[](0), new uint256[](0), new string[](0));
        }

        // Create arrays to sort
        address[] memory sortedPlayers = new address[](playerCount);
        uint256[] memory sortedScores = new uint256[](playerCount);
        
        for (uint256 i = 0; i < playerCount; i++) {
            sortedPlayers[i] = players[i];
            sortedScores[i] = playerStats[players[i]].highScore;
        }

        // Simple bubble sort (inefficient for large datasets, but OK for game leaderboards)
        for (uint256 i = 0; i < playerCount - 1; i++) {
            for (uint256 j = 0; j < playerCount - i - 1; j++) {
                if (sortedScores[j] < sortedScores[j + 1]) {
                    // Swap scores
                    uint256 tempScore = sortedScores[j];
                    sortedScores[j] = sortedScores[j + 1];
                    sortedScores[j + 1] = tempScore;
                    
                    // Swap players
                    address tempPlayer = sortedPlayers[j];
                    sortedPlayers[j] = sortedPlayers[j + 1];
                    sortedPlayers[j + 1] = tempPlayer;
                }
            }
        }

        // Return top N players
        uint256 resultSize = playerCount < _limit ? playerCount : _limit;
        address[] memory resultPlayers = new address[](resultSize);
        uint256[] memory resultScores = new uint256[](resultSize);
        string[] memory resultNames = new string[](resultSize);

        for (uint256 i = 0; i < resultSize; i++) {
            resultPlayers[i] = sortedPlayers[i];
            resultScores[i] = sortedScores[i];
            resultNames[i] = usernames[sortedPlayers[i]];
        }

        return (resultPlayers, resultScores, resultNames);
    }

    /**
     * @dev Get recent game sessions
     */
    function getRecentSessions(uint256 _limit) external view returns (GameSession[] memory) {
        require(_limit > 0 && _limit <= 50, "Invalid limit");
        
        uint256 sessionCount = gameSessions.length;
        if (sessionCount == 0) {
            return new GameSession[](0);
        }

        uint256 resultSize = sessionCount < _limit ? sessionCount : _limit;
        GameSession[] memory recentSessions = new GameSession[](resultSize);

        // Return most recent sessions first
        for (uint256 i = 0; i < resultSize; i++) {
            recentSessions[i] = gameSessions[sessionCount - 1 - i];
        }

        return recentSessions;
    }

    /**
     * @dev Get total number of players
     */
    function getTotalPlayers() external view returns (uint256) {
        return players.length;
    }

    /**
     * @dev Get total number of game sessions
     */
    function getTotalSessions() external view returns (uint256) {
        return gameSessions.length;
    }

    /**
     * @dev Get game statistics
     */
    function getGameStats() external view returns (
        uint256 totalPlayers,
        uint256 totalSessions,
        uint256 highestScore,
        address topPlayer
    ) {
        uint256 playerCount = players.length;
        uint256 maxScore = 0;
        address topScorer = address(0);

        for (uint256 i = 0; i < playerCount; i++) {
            uint256 playerScore = playerStats[players[i]].highScore;
            if (playerScore > maxScore) {
                maxScore = playerScore;
                topScorer = players[i];
            }
        }

        return (playerCount, gameSessions.length, maxScore, topScorer);
    }

    // Owner functions
    function setGameActive(bool _active) external onlyOwner {
        gameActive = _active;
    }

    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    // Receive function to accept ETH
    receive() external payable {}
}