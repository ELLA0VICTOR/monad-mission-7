// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/console.sol";

/**
 * @title Leaderboard
 * @dev Dedicated leaderboard contract for Neon Runner
 */
contract Leaderboard {
    struct LeaderboardEntry {
        address player;
        string username;
        uint256 score;
        uint256 timestamp;
    }

    struct PlayerRank {
        uint256 rank;
        uint256 score;
        bool exists;
    }

    // Events
    event ScoreUpdated(address indexed player, uint256 score, uint256 rank);
    event LeaderboardReset();

    // State variables
    LeaderboardEntry[] public leaderboard;
    mapping(address => PlayerRank) public playerRanks;
    mapping(address => string) public playerUsernames;
    
    address public gameContract;
    address public owner;
    uint256 public constant MAX_LEADERBOARD_SIZE = 1000;
    uint256 public constant TOP_PLAYERS_LIMIT = 100;

    modifier onlyGameContract() {
        require(msg.sender == gameContract, "Only game contract can call this");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    constructor() {
        owner = msg.sender;
        console.log("Leaderboard deployed by:", msg.sender);
    }

    /**
     * @dev Set the game contract address
     */
    function setGameContract(address _gameContract) external onlyOwner {
        require(_gameContract != address(0), "Invalid game contract address");
        gameContract = _gameContract;
        console.log("Game contract set to:", _gameContract);
    }

    /**
     * @dev Update player score on leaderboard
     */
    function updateScore(address _player, string calldata _username, uint256 _score) external onlyGameContract {
        require(_player != address(0), "Invalid player address");
        require(_score > 0, "Score must be positive");
        
        // Update username
        if (bytes(_username).length > 0) {
            playerUsernames[_player] = _username;
        }
        
        PlayerRank storage playerRank = playerRanks[_player];
        
        if (!playerRank.exists) {
            // New player - add to leaderboard
            _addNewPlayer(_player, _score);
        } else if (_score > playerRank.score) {
            // Existing player with new high score - update
            _updateExistingPlayer(_player, _score);
        }
        
        console.log("Score updated for player:", _player, "Score:", _score);
    }

    /**
     * @dev Add a new player to the leaderboard
     */
    function _addNewPlayer(address _player, uint256 _score) internal {
        string memory username = playerUsernames[_player];
        if (bytes(username).length == 0) {
            username = _addressToString(_player);
        }
        
        LeaderboardEntry memory newEntry = LeaderboardEntry({
            player: _player,
            username: username,
            score: _score,
            timestamp: block.timestamp
        });
        
        // Find correct position to insert
        uint256 insertPosition = _findInsertPosition(_score);
        
        // If leaderboard is at max size and new score doesn't make it, don't add
        if (leaderboard.length >= MAX_LEADERBOARD_SIZE && insertPosition >= MAX_LEADERBOARD_SIZE) {
            return;
        }
        
        // Insert at correct position
        if (insertPosition >= leaderboard.length) {
            // Add to end
            leaderboard.push(newEntry);
        } else {
            // Insert and shift
            leaderboard.push(LeaderboardEntry(address(0), "", 0, 0)); // Extend array
            
            // Shift elements
            for (uint256 i = leaderboard.length - 1; i > insertPosition; i--) {
                leaderboard[i] = leaderboard[i - 1];
            }
            
            leaderboard[insertPosition] = newEntry;
        }
        
        // Trim if over max size
        if (leaderboard.length > MAX_LEADERBOARD_SIZE) {
            leaderboard.pop();
        }
        
        // Update player rank
        playerRanks[_player] = PlayerRank({
            rank: insertPosition + 1,
            score: _score,
            exists: true
        });
        
        // Update ranks for affected players
        _updateRanks(insertPosition);
        
        emit ScoreUpdated(_player, _score, insertPosition + 1);
    }

    /**
     * @dev Update existing player's score
     */
    function _updateExistingPlayer(address _player, uint256 _score) internal {
        // Find and remove current entry
        uint256 currentPosition = _findPlayerPosition(_player);
        require(currentPosition < leaderboard.length, "Player not found in leaderboard");
        
        // Remove current entry
        for (uint256 i = currentPosition; i < leaderboard.length - 1; i++) {
            leaderboard[i] = leaderboard[i + 1];
        }
        leaderboard.pop();
        
        // Add as new player (will find correct position)
        _addNewPlayer(_player, _score);
    }

    /**
     * @dev Find the correct position to insert a score
     */
    function _findInsertPosition(uint256 _score) internal view returns (uint256) {
        for (uint256 i = 0; i < leaderboard.length; i++) {
            if (_score > leaderboard[i].score) {
                return i;
            }
        }
        return leaderboard.length;
    }

    /**
     * @dev Find player's current position in leaderboard
     */
    function _findPlayerPosition(address _player) internal view returns (uint256) {
        for (uint256 i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i].player == _player) {
                return i;
            }
        }
        revert("Player not found");
    }

    /**
     * @dev Update ranks for players after a position
     */
    function _updateRanks(uint256 _fromPosition) internal {
        for (uint256 i = _fromPosition; i < leaderboard.length && i < MAX_LEADERBOARD_SIZE; i++) {
            address player = leaderboard[i].player;
            if (player != address(0)) {
                playerRanks[player].rank = i + 1;
            }
        }
    }

    /**
     * @dev Get the full leaderboard
     */
    function getLeaderboard() external view returns (LeaderboardEntry[] memory) {
        return leaderboard;
    }

    /**
     * @dev Get top N scores
     */
    function getTopScores(uint256 _limit) external view returns (LeaderboardEntry[] memory) {
        require(_limit > 0 && _limit <= TOP_PLAYERS_LIMIT, "Invalid limit");
        
        uint256 resultSize = _limit > leaderboard.length ? leaderboard.length : _limit;
        LeaderboardEntry[] memory topScores = new LeaderboardEntry[](resultSize);
        
        for (uint256 i = 0; i < resultSize; i++) {
            topScores[i] = leaderboard[i];
        }
        
        return topScores;
    }

    /**
     * @dev Get player's rank and score
     */
    function getPlayerRank(address _player) external view returns (uint256 rank, uint256 score, bool exists) {
        PlayerRank memory playerRank = playerRanks[_player];
        return (playerRank.rank, playerRank.score, playerRank.exists);
    }

    /**
     * @dev Get players around a specific rank
     */
    function getPlayersAroundRank(uint256 _rank, uint256 _range) external view returns (LeaderboardEntry[] memory) {
        require(_rank > 0 && _rank <= leaderboard.length, "Invalid rank");
        require(_range > 0 && _range <= 50, "Invalid range");
        
        uint256 startIndex = _rank > _range ? _rank - _range - 1 : 0;
        uint256 endIndex = _rank + _range - 1;
        if (endIndex >= leaderboard.length) {
            endIndex = leaderboard.length - 1;
        }
        
        uint256 resultSize = endIndex - startIndex + 1;
        LeaderboardEntry[] memory players = new LeaderboardEntry[](resultSize);
        
        for (uint256 i = 0; i < resultSize; i++) {
            players[i] = leaderboard[startIndex + i];
        }
        
        return players;
    }

    /**
     * @dev Get leaderboard statistics
     */
    function getLeaderboardStats() external view returns (
        uint256 totalPlayers,
        uint256 highestScore,
        address topPlayer,
        uint256 averageTopTen
    ) {
        totalPlayers = leaderboard.length;
        
        if (totalPlayers == 0) {
            return (0, 0, address(0), 0);
        }
        
        highestScore = leaderboard[0].score;
        topPlayer = leaderboard[0].player;
        
        // Calculate average of top 10
        uint256 topTenCount = totalPlayers > 10 ? 10 : totalPlayers;
        uint256 topTenSum = 0;
        
        for (uint256 i = 0; i < topTenCount; i++) {
            topTenSum += leaderboard[i].score;
        }
        
        averageTopTen = topTenSum / topTenCount;
        
        return (totalPlayers, highestScore, topPlayer, averageTopTen);
    }

    /**
     * @dev Convert address to string (simplified)
     */
    function _addressToString(address _addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        for (uint256 i = 0; i < 20; i++) {
            str[2 + i * 2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3 + i * 2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        return string(str);
    }

    // Owner functions
    
    /**
     * @dev Reset the entire leaderboard (emergency function)
     */
    function resetLeaderboard() external onlyOwner {
        // Clear leaderboard array
        while (leaderboard.length > 0) {
            address player = leaderboard[leaderboard.length - 1].player;
            delete playerRanks[player];
            leaderboard.pop();
        }
        
        emit LeaderboardReset();
        console.log("Leaderboard reset by owner");
    }

    /**
     * @dev Remove a specific player from leaderboard
     */
    function removePlayer(address _player) external onlyOwner {
        require(playerRanks[_player].exists, "Player not in leaderboard");
        
        uint256 position = _findPlayerPosition(_player);
        
        // Remove entry
        for (uint256 i = position; i < leaderboard.length - 1; i++) {
            leaderboard[i] = leaderboard[i + 1];
        }
        leaderboard.pop();
        
        // Clear player rank
        delete playerRanks[_player];
        
        // Update ranks for remaining players
        _updateRanks(position);
        
        console.log("Player removed from leaderboard:", _player);
    }

    /**
     * @dev Get leaderboard size
     */
    function getLeaderboardSize() external view returns (uint256) {
        return leaderboard.length;
    }
}