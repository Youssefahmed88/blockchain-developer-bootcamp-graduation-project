// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Log, ILogAutomation} from "@chainlink/contracts/src/v0.8/automation/interfaces/ILogAutomation.sol";

/// @notice Interface for Crowdfunding contract.
interface ICrowdfunding {
    function handleGoalReached(uint256 _campaignId) external;
    function closeCampaign(uint256 _campaignId) external;
}

/// @title LogTriager Contract
/// @notice Automates campaign goal handling via Chainlink logs.
/// @dev Listens for GoalReached events.
contract LogTriager is ILogAutomation {
    /// @notice Crowdfunding contract interface.
    ICrowdfunding public crowdfunding;
    /// @notice GoalReached event signature.
    bytes32 public constant GOAL_REACHED_EVENT_SIG = 0xb0159aff0fc172e60f3c6c72806aa85b50e524a9e8c2a3e2035996fe177321bb;

    /// @notice Emitted for successful campaign handling.
    /// @param campaignId Campaign ID.
    event CampaignSuccess(uint256 indexed campaignId);

    /// @notice Initializes with Crowdfunding address.
    /// @param _crowdfundingAddress Crowdfunding contract address.
    constructor(address _crowdfundingAddress) {
        crowdfunding = ICrowdfunding(_crowdfundingAddress);
    }

    /// @notice Checks log for GoalReached event.
    /// @param log Event log.
    /// @param checkData Additional data (unused).
    /// @return upkeepNeeded True if upkeep is needed.
    /// @return performData Data for upkeep.
    function checkLog(Log calldata log, bytes memory checkData) external pure override returns (bool upkeepNeeded, bytes memory performData) {
        if (log.topics.length > 0 && log.topics[0] == GOAL_REACHED_EVENT_SIG) {
            uint256 campaignId = uint256(log.topics[1]);
            upkeepNeeded = true;
            performData = abi.encode(campaignId);
        } else {
            upkeepNeeded = false;
            performData = "";
        }
        return (upkeepNeeded, performData);
    }

    /// @notice Performs upkeep for successful campaign.
    /// @param performData Encoded campaign ID.
    function performUpkeep(bytes calldata performData) external override {
        uint256 campaignId = abi.decode(performData, (uint256));
        crowdfunding.handleGoalReached(campaignId);
        crowdfunding.closeCampaign(campaignId);
        emit CampaignSuccess(campaignId);
    }
}
