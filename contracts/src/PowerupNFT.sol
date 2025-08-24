// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/console.sol";

/**
 * @title PowerupNFT
 * @dev NFT contract for Neon Runner powerups - simplified ERC721 implementation
 */
contract PowerupNFT {
    // ERC721 Events
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    
    // Custom Events
    event PowerupMinted(address indexed to, uint256 indexed tokenId, uint8 powerupType);
    event PowerupUsed(uint256 indexed tokenId, address indexed user);

    // Powerup types
    enum PowerupType {
        SPEED_BOOST,    // 0
        SHIELD,         // 1
        DOUBLE_JUMP,    // 2
        SCORE_MULTIPLIER // 3
    }

    struct Powerup {
        PowerupType powerupType;
        address owner;
        bool used;
        uint256 mintTimestamp;
        uint256 useTimestamp;
    }

    // State variables
    string public name = "Neon Runner Powerups";
    string public symbol = "NRP";
    
    uint256 private _currentTokenId;
    mapping(uint256 => Powerup) public powerups;
    mapping(address => uint256[]) public ownerTokens;
    mapping(uint256 => address) public tokenApprovals;
    mapping(address => mapping(address => bool)) public operatorApprovals;
    mapping(address => uint256) public balanceOf;
    
    address public owner;
    mapping(uint8 => uint256) public powerupPrices; // Price for each powerup type
    mapping(uint8 => string) public powerupNames;
    mapping(uint8 => string) public powerupDescriptions;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier tokenExists(uint256 tokenId) {
        require(_exists(tokenId), "Token does not exist");
        _;
    }

    constructor() {
        owner = msg.sender;
        
        // Set powerup prices (in wei)
        powerupPrices[0] = 0.01 ether; // SPEED_BOOST
        powerupPrices[1] = 0.015 ether; // SHIELD
        powerupPrices[2] = 0.02 ether; // DOUBLE_JUMP
        powerupPrices[3] = 0.025 ether; // SCORE_MULTIPLIER
        
        // Set powerup names
        powerupNames[0] = "Speed Boost";
        powerupNames[1] = "Shield";
        powerupNames[2] = "Double Jump";
        powerupNames[3] = "Score Multiplier";
        
        // Set powerup descriptions
        powerupDescriptions[0] = "Increases running speed by 50% for 5 seconds";
        powerupDescriptions[1] = "Protects from one obstacle collision for 10 seconds";
        powerupDescriptions[2] = "Allows double jumping for 15 seconds";
        powerupDescriptions[3] = "Doubles score gain for 8 seconds";
        
        console.log("PowerupNFT deployed by:", msg.sender);
    }

    /**
     * @dev Mint a new powerup NFT
     */
    function mintPowerup(uint8 _powerupType) external payable {
        require(_powerupType <= 3, "Invalid powerup type");
        require(msg.value >= powerupPrices[_powerupType], "Insufficient payment");
        
        uint256 tokenId = _currentTokenId++;
        
        powerups[tokenId] = Powerup({
            powerupType: PowerupType(_powerupType),
            owner: msg.sender,
            used: false,
            mintTimestamp: block.timestamp,
            useTimestamp: 0
        });
        
        balanceOf[msg.sender]++;
        ownerTokens[msg.sender].push(tokenId);
        
        emit Transfer(address(0), msg.sender, tokenId);
        emit PowerupMinted(msg.sender, tokenId, _powerupType);
        
        // Fixed console.log - split into multiple calls
        console.log("Powerup minted - Type:", _powerupType);
        console.log("Token ID:", tokenId);
        console.log("Owner:", msg.sender);
        
        // Refund excess payment
        if (msg.value > powerupPrices[_powerupType]) {
            payable(msg.sender).transfer(msg.value - powerupPrices[_powerupType]);
        }
    }

    /**
     * @dev Use a powerup (marks it as used)
     */
    function usePowerup(uint256 tokenId) external tokenExists(tokenId) {
        require(powerups[tokenId].owner == msg.sender, "You don't own this powerup");
        require(!powerups[tokenId].used, "Powerup already used");
        
        powerups[tokenId].used = true;
        powerups[tokenId].useTimestamp = block.timestamp;
        
        emit PowerupUsed(tokenId, msg.sender);
        
        console.log("Powerup used - Token ID:", tokenId);
        console.log("User:", msg.sender);
    }

    /**
     * @dev Get all powerup token IDs owned by an address
     */
    function getPowerups(address _owner) external view returns (uint256[] memory) {
        return ownerTokens[_owner];
    }

    /**
     * @dev Get unused powerups for an owner
     */
    function getUnusedPowerups(address _owner) external view returns (uint256[] memory) {
        uint256[] memory ownedTokens = ownerTokens[_owner];
        uint256 unusedCount = 0;
        
        // Count unused powerups
        for (uint256 i = 0; i < ownedTokens.length; i++) {
            if (!powerups[ownedTokens[i]].used) {
                unusedCount++;
            }
        }
        
        // Create array of unused powerups
        uint256[] memory unusedPowerups = new uint256[](unusedCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < ownedTokens.length; i++) {
            if (!powerups[ownedTokens[i]].used) {
                unusedPowerups[index] = ownedTokens[i];
                index++;
            }
        }
        
        return unusedPowerups;
    }

    /**
     * @dev Get powerup details
     */
    function getPowerupDetails(uint256 tokenId) external view tokenExists(tokenId) returns (
        uint8 powerupType,
        address powerupOwner,
        bool used,
        uint256 mintTimestamp,
        uint256 useTimestamp,
        string memory powerupName,  // Changed from 'name' to 'powerupName' to avoid shadowing
        string memory description
    ) {
        Powerup memory powerup = powerups[tokenId];
        return (
            uint8(powerup.powerupType),
            powerup.owner,
            powerup.used,
            powerup.mintTimestamp,
            powerup.useTimestamp,
            powerupNames[uint8(powerup.powerupType)],
            powerupDescriptions[uint8(powerup.powerupType)]
        );
    }

    /**
     * @dev Get powerup price
     */
    function getPowerupPrice(uint8 _powerupType) external view returns (uint256) {
        require(_powerupType <= 3, "Invalid powerup type");
        return powerupPrices[_powerupType];
    }

    /**
     * @dev Get total supply of powerups
     */
    function totalSupply() external view returns (uint256) {
        return _currentTokenId;
    }

    // ERC721 Standard Functions (simplified)
    
    function ownerOf(uint256 tokenId) public view tokenExists(tokenId) returns (address) {
        return powerups[tokenId].owner;
    }

    function approve(address to, uint256 tokenId) public tokenExists(tokenId) {
        address tokenOwner = ownerOf(tokenId);
        require(to != tokenOwner, "Approval to current owner");
        require(
            msg.sender == tokenOwner || operatorApprovals[tokenOwner][msg.sender],
            "Not approved or owner"
        );

        tokenApprovals[tokenId] = to;
        emit Approval(tokenOwner, to, tokenId);
    }

    function getApproved(uint256 tokenId) public view tokenExists(tokenId) returns (address) {
        return tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) public {
        require(operator != msg.sender, "Approve to caller");
        operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address tokenOwner, address operator) public view returns (bool) {
        return operatorApprovals[tokenOwner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public tokenExists(tokenId) {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not approved or owner");
        require(from != address(0), "Transfer from zero address");
        require(to != address(0), "Transfer to zero address");
        require(ownerOf(tokenId) == from, "Transfer from incorrect owner");

        // Clear approvals
        tokenApprovals[tokenId] = address(0);

        // Update balances
        balanceOf[from]--;
        balanceOf[to]++;

        // Update powerup owner
        powerups[tokenId].owner = to;

        // Update owner tokens arrays
        _removeTokenFromOwner(from, tokenId);
        ownerTokens[to].push(tokenId);

        emit Transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public {
        transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public {
        transferFrom(from, to, tokenId);
        // Note: In a full implementation, you would check if `to` is a contract and call onERC721Received
    }

    // Internal helper functions

    function _exists(uint256 tokenId) internal view returns (bool) {
        return tokenId < _currentTokenId;
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        require(_exists(tokenId), "Token does not exist");
        address tokenOwner = ownerOf(tokenId);
        return (spender == tokenOwner || getApproved(tokenId) == spender || operatorApprovals[tokenOwner][spender]);
    }

    function _removeTokenFromOwner(address from, uint256 tokenId) internal {
        uint256[] storage tokens = ownerTokens[from];
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] == tokenId) {
                tokens[i] = tokens[tokens.length - 1];
                tokens.pop();
                break;
            }
        }
    }

    // Owner functions

    function setPowerupPrice(uint8 _powerupType, uint256 _price) external onlyOwner {
        require(_powerupType <= 3, "Invalid powerup type");
        powerupPrices[_powerupType] = _price;
    }

    function setPowerupName(uint8 _powerupType, string calldata _name) external onlyOwner {
        require(_powerupType <= 3, "Invalid powerup type");
        powerupNames[_powerupType] = _name;
    }

    function setPowerupDescription(uint8 _powerupType, string calldata _description) external onlyOwner {
        require(_powerupType <= 3, "Invalid powerup type");
        powerupDescriptions[_powerupType] = _description;
    }

    function withdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    // Receive function to accept ETH
    receive() external payable {}

    // ERC165 - Interface detection
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == 0x80ac58cd || // ERC721
               interfaceId == 0x5b5e139f || // ERC721Metadata
               interfaceId == 0x01ffc9a7;   // ERC165
    }
}