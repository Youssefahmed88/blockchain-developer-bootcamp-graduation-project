// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {VRFConsumerBaseV2Plus} from "@chainlink/contracts/src/v0.8/vrf/dev/VRFConsumerBaseV2Plus.sol";
import {VRFV2PlusClient} from "@chainlink/contracts/src/v0.8/vrf/dev/libraries/VRFV2PlusClient.sol";

/// @notice Interface for NFT minter.
interface INFTMinter {
    function mintRaffleNFT(uint256 campaignId, address winner) external;
}

/// @title VRFv25Consumer Contract
/// @notice Selects random winners using Chainlink VRF.
/// @dev Integrates with NFTMinter for raffle rewards.
contract VRFv25Consumer is VRFConsumerBaseV2Plus {
    /// @notice Chainlink VRF subscription ID.
    uint256 public s_subscriptionId;
    /// @notice Maps request ID to campaign ID.
    mapping(uint256 => uint256) public requestIdToCampaignId;
    /// @notice Maps campaign ID to participants.
    mapping(uint256 => address[]) public campaignParticipants;
    /// @notice NFT minter contract address.
    address public nftMinterAddr;
    /// @notice Last raffle winner.
    address public lastWinner;

    /// @notice Emitted when a winner is selected.
    /// @param campaignId Campaign ID.
    /// @param winner Winner address.
    event WinnerSelected(uint256 campaignId, address winner);

    /// @notice Initializes with VRF subscription ID.
    /// @param subscriptionId Chainlink subscription ID.
    constructor(uint256 subscriptionId) VRFConsumerBaseV2Plus(0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B) {
        s_subscriptionId = subscriptionId;
    }

    /// @notice Sets NFT minter address.
    /// @param _nftMinter New address.
    function setNFTMinter(address _nftMinter) external onlyOwner {
        nftMinterAddr = _nftMinter;
    }

    /// @notice Sets participants for a campaign.
    /// @param _campaignId Campaign ID.
    /// @param _participants Array of participant addresses.
    function setParticipants(uint256 _campaignId, address[] memory _participants) external virtual onlyOwner {
        require(_participants.length > 0, "Participants array cannot be empty");
        campaignParticipants[_campaignId] = _participants;
    }

    /// @notice Requests random winner from Chainlink VRF.
    /// @param _campaignId Campaign ID.
    /// @return Request ID.
    function requestRandomWinner(uint256 _campaignId) external virtual onlyOwner returns (uint256) {
        require(campaignParticipants[_campaignId].length > 0, "No participants for campaign");
        require(nftMinterAddr != address(0), "NFTMinter not set");

        VRFV2PlusClient.RandomWordsRequest memory req = VRFV2PlusClient.RandomWordsRequest({
            keyHash: 0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae,
            subId: s_subscriptionId,
            requestConfirmations: 3,
            callbackGasLimit: 40000,
            numWords: 1,
            extraArgs: VRFV2PlusClient._argsToBytes(VRFV2PlusClient.ExtraArgsV1({nativePayment: false}))
        });

        uint256 requestId = s_vrfCoordinator.requestRandomWords(req);
        requestIdToCampaignId[requestId] = _campaignId;
        return requestId;
    }

    /// @notice Handles VRF random number callback.
    /// @param requestId VRF request ID.
    /// @param randomWords Random numbers.
    function fulfillRandomWords(uint256 requestId, uint256[] calldata randomWords) internal virtual override {
        uint256 _campaignId = requestIdToCampaignId[requestId];
        require(_campaignId != 0, "Invalid requestId");

        address[] storage participants = campaignParticipants[_campaignId];
        require(participants.length > 0, "No participants for campaign");

        uint256 index = randomWords[0] % participants.length;
        address winner = participants[index];
        lastWinner = winner;

        require(nftMinterAddr != address(0), "NFTMinter not set");
        INFTMinter(nftMinterAddr).mintRaffleNFT(_campaignId, winner);
        emit WinnerSelected(_campaignId, winner);

        delete requestIdToCampaignId[requestId];
        delete campaignParticipants[_campaignId];
    }

    /// @notice Gets participants for a campaign.
    /// @param _campaignId Campaign ID.
    /// @return Array of participant addresses.
    function getParticipants(uint256 _campaignId) external view virtual returns (address[] memory) {
        return campaignParticipants[_campaignId];
    }

    /// @notice Clears participant list in emergency.
    /// @param _campaignId Campaign ID.
    function emergencyClearParticipants(uint256 _campaignId) external onlyOwner {
        delete campaignParticipants[_campaignId];
    }
}
