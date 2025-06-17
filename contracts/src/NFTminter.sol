// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title NFTMinter Contract
/// @notice Mints ERC721 NFTs for crowdfunding rewards.
/// @dev Integrates with Crowdfunding and VRF contracts.
contract NFTminter is ERC721URIStorage, Ownable {
    /// @notice Crowdfunding contract address.
    address public crowdFundContractAddr;
    /// @notice VRF consumer contract address.
    address public vrfContractAddr;
    /// @notice Current token ID counter.
    uint256 public tokenId;
    /// @notice URI for first supporter NFTs.
    string public firstSupporterURI;
    /// @notice URI for top supporter NFTs.
    string public topSupporterURI;
    /// @notice URI for VRF winner NFTs.
    string public vrfWinnerURI;
    /// @notice Tracks if first supporter NFT minted per campaign.
    mapping(uint => bool) public firstSupporterMinted;
    /// @notice Tracks if top supporter NFT minted per campaign.
    mapping(uint => bool) public topSupporterMinted;
    /// @notice Maps user to campaign token ID.
    mapping(address => mapping(uint256 => uint256)) public userToCampaignToken;

    /// @notice Emitted when an NFT is minted.
    /// @param to Recipient address.
    /// @param tokenId Token ID.
    /// @param tokenURI Token URI.
    event NFTMinted(address indexed to, uint256 indexed tokenId, string tokenURI);

    /// @notice Restricts to Crowdfunding contract.
    modifier onlyCrowdFundContract() {
        require(msg.sender == crowdFundContractAddr, "Unauthorized caller");
        _;
    }

    /// @notice Restricts to VRF contract.
    modifier onlyVRFContract() {
        require(msg.sender == vrfContractAddr, "Only VRF contract can mint");
        _;
    }

    /// @notice Initializes NFT contract.
    constructor() ERC721("CrowdFundReward", "CFR") Ownable(msg.sender) {
        tokenId = 0;
        firstSupporterURI = "https://jade-managing-dinosaur-851.mypinata.cloud/ipfs/bafybeifdfe2ckr2h2st3zubqmgkur2czpnwhqhwapdjk55qwhop7m52j4i/firstContributor.webp";
        topSupporterURI = "https://jade-managing-dinosaur-851.mypinata.cloud/ipfs/bafybeifdfe2ckr2h2st3zubqmgkur2czpnwhqhwapdjk55qwhop7m52j4i/TopContributor.webp";
        vrfWinnerURI = "https://jade-managing-dinosaur-851.mypinata.cloud/ipfs/bafybeifdfe2ckr2h2st3zubqmgkur2czpnwhqhwapdjk55qwhop7m52j4i/VRF Winner.webp";
    }

    /// @notice Sets Crowdfunding contract address.
    /// @param _addr New address.
    function setCrowdFundContract(address _addr) external onlyOwner {
        crowdFundContractAddr = _addr;
    }

    /// @notice Sets VRF contract address.
    /// @param _addr New address.
    function setVRFContract(address _addr) external onlyOwner {
        vrfContractAddr = _addr;
    }

    /// @notice Mints NFT for first supporter.
    /// @param _campaignId Campaign ID.
    /// @param firstSupporter Recipient address.
    function mintToFirstSupporter(uint256 _campaignId, address firstSupporter) external onlyCrowdFundContract {
        require(!firstSupporterMinted[_campaignId], "Already minted");
        require(firstSupporter != address(0), "No first supporter");

        tokenId++;
        _safeMint(firstSupporter, tokenId);
        _setTokenURI(tokenId, firstSupporterURI);
        userToCampaignToken[firstSupporter][_campaignId] = tokenId;
        emit NFTMinted(firstSupporter, tokenId, firstSupporterURI);

        firstSupporterMinted[_campaignId] = true;
    }

    /// @notice Mints NFT for top supporter.
    /// @param _campaignId Campaign ID.
    /// @param topSupporter Recipient address.
    function mintToTopSupporter(uint256 _campaignId, address topSupporter) external onlyCrowdFundContract {
        require(topSupporter != address(0), "No top supporter");
        require(!topSupporterMinted[_campaignId], "Already minted");

        tokenId++;
        _safeMint(topSupporter, tokenId);
        _setTokenURI(tokenId, topSupporterURI);
        userToCampaignToken[topSupporter][_campaignId] = tokenId;
        emit NFTMinted(topSupporter, tokenId, topSupporterURI);

        topSupporterMinted[_campaignId] = true;
    }

    /// @notice Mints NFT for VRF raffle winner.
    /// @param _campaignId Campaign ID.
    /// @param winner Recipient address.
    function mintRaffleNFT(uint256 _campaignId, address winner) external onlyVRFContract {
        require(winner != address(0), "No winner");

        tokenId++;
        _safeMint(winner, tokenId);
        _setTokenURI(tokenId, vrfWinnerURI);
        userToCampaignToken[winner][_campaignId] = tokenId;
        emit NFTMinted(winner, tokenId, vrfWinnerURI);
    }

    /// @notice Updates NFT URIs.
    /// @param _firstURI First supporter URI.
    /// @param _topURI Top supporter URI.
    /// @param _vrfWinnerURI VRF winner URI.
    function updateURIs(string memory _firstURI, string memory _topURI, string memory _vrfWinnerURI) external onlyOwner {
        firstSupporterURI = _firstURI;
        topSupporterURI = _topURI;
        vrfWinnerURI = _vrfWinnerURI;
    }
}