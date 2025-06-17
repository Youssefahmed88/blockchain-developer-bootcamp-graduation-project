// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { AutomationCompatibleInterface } from "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";
import { Log, ILogAutomation } from "@chainlink/contracts/src/v0.8/automation/interfaces/ILogAutomation.sol";

interface ICrowdfunding {
    function handleGoalReached(uint256 _campaignId) external;
    function getDeadlineAndStatus(uint256 _campaignId) external view returns (uint256 deadline, bool isOpen);
    function closeCampaign(uint256 _campaignId) external;
    function campaignsCount() external view returns (uint256);
    function campaigns(uint256) external view returns (
        uint256 id,
        address creator,
        address topSupporter,
        address firstContributor,
        string memory title,
        string memory description,
        uint256 goalAmount,
        uint256 deadline,
        uint256 amountRaised,
        uint256 highestContribution,
        bool isOpen,
        bool goalReached,
        bool fundsClaimed
    );
    
}

contract Automation is ILogAutomation, AutomationCompatibleInterface {

    enum upKeepType {LogBased, TimeBased}

    ICrowdfunding public crowdfunding;

    constructor(address _crowdfundingAddress) {
        crowdfunding = ICrowdfunding(_crowdfundingAddress);
    }

    function checkLog(Log calldata log, bytes memory) external pure override returns (bool upkeepNeeded, bytes memory performData) {
        upkeepNeeded = true;
        uint256 campaignId = uint256(log.topics[1]);        
        performData = abi.encode(upKeepType.LogBased, campaignId);
    }

    function checkUpkeep(bytes calldata) external view override returns (bool upkeepNeeded, bytes memory performData) {
        uint256 count = crowdfunding.campaignsCount();
        for (uint256 i = 1; i <= count; i++) {
            (, , , , , , uint256 deadline, , , , bool isOpen, , ) = crowdfunding.campaigns(i);
            if (isOpen && block.timestamp >= deadline) {
                upkeepNeeded = true;
                performData = abi.encode(upKeepType.TimeBased, i);
                return (upkeepNeeded, performData);
            }
        }
        upkeepNeeded = false;
    }

    function performUpkeep(bytes calldata performData) external override (AutomationCompatibleInterface, ILogAutomation){
        (upKeepType upKeeptype, uint256 campaignId) = abi.decode(performData, (upKeepType, uint256));
        if (upKeeptype == upKeepType.LogBased) {
            crowdfunding.handleGoalReached(campaignId);
            crowdfunding.closeCampaign(campaignId);
        } else if (upKeeptype == upKeepType.TimeBased) {
            crowdfunding.closeCampaign(campaignId);
        }
    }
}
