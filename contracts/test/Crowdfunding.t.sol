// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "forge-std/Test.sol";
import "../src/Crowdfunding.sol";
import "../src/NFTminter.sol";

// Mock contracts for testing
contract MockPriceDataFeed {
    function getChainlinkDataFeedLatestAnswer() public pure returns (int) {
        return 200000000000; // $2000 USD with 8 decimals
    }
}

contract MockVRFConsumer {
    address public nftMinterAddr;
    mapping(uint256 => address[]) public campaignParticipants;
    
    function setNFTMinter(address _nftMinter) external {
        nftMinterAddr = _nftMinter;
    }
    
    function setParticipants(uint256 _campaignId, address[] memory _participants) external {
        campaignParticipants[_campaignId] = _participants;
    }
    
    function requestRandomWinner(uint256 _campaignId) external returns (uint256) {
        return 1; // Mock request ID
    }
    
    function getParticipants(uint256 _campaignId) external view returns (address[] memory) {
        return campaignParticipants[_campaignId];
    }
    
    function emergencyClearParticipants(uint256 _campaignId) external {
        delete campaignParticipants[_campaignId];
    }
}

contract CrowdfundingTest is Test {
    Crowdfunding public crowdfunding;
    MockPriceDataFeed public priceFeed;
    NFTminter public nftMinter;
    MockVRFConsumer public vrfConsumer;
    
    address public owner = address(0x1);
    address public creator = address(0x2);
    address public contributor1 = address(0x3);
    address public contributor2 = address(0x4);
    
    uint256 public constant CAMPAIGN_GOAL = 1 ether;
    uint256 public constant CAMPAIGN_PERIOD = 30; // 30 days
    string public constant CAMPAIGN_TITLE = "Test Campaign";
    string public constant CAMPAIGN_DESCRIPTION = "This is a test campaign";

    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy mock contracts
        priceFeed = new MockPriceDataFeed();
        nftMinter = new NFTminter();
        vrfConsumer = new MockVRFConsumer();
        
        // Deploy main contract
        crowdfunding = new Crowdfunding(
            address(priceFeed),
            address(nftMinter),
            address(vrfConsumer)
        );
        
        // Set up contract addresses
        nftMinter.setCrowdFundContract(address(crowdfunding));
        vrfConsumer.setNFTMinter(address(nftMinter));
        
        vm.stopPrank();
        
        // Fund test accounts
        vm.deal(contributor1, 10 ether);
        vm.deal(contributor2, 10 ether);
        vm.deal(creator, 1 ether);
    }

    /**
     * Test 1: Campaign Creation
     * This test verifies that a new campaign can be created successfully
     * and that all campaign parameters are stored correctly
     */
    function testLaunchCampaign() public {
        vm.startPrank(creator);
        
        // Launch a new campaign
        crowdfunding.launchCampaign(
            CAMPAIGN_TITLE,
            CAMPAIGN_DESCRIPTION,
            CAMPAIGN_GOAL,
            CAMPAIGN_PERIOD
        );
        
        // Verify campaign was created correctly
        (
            uint256 id,
            address campaignCreator,
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
        ) = crowdfunding.campaigns(1);
        
        assertEq(id, 1);
        assertEq(campaignCreator, creator);
        assertEq(topSupporter, address(0));
        assertEq(firstContributor, address(0));
        assertEq(title, CAMPAIGN_TITLE);
        assertEq(description, CAMPAIGN_DESCRIPTION);
        assertEq(goalAmount, CAMPAIGN_GOAL);
        assertGt(deadline, block.timestamp);
        assertEq(amountRaised, 0);
        assertEq(highestContribution, 0);
        assertTrue(isOpen);
        assertFalse(goalReached);
        assertFalse(fundsClaimed);
        
        // Verify campaigns count increased
        assertEq(crowdfunding.campaignsCount(), 1);
        
        vm.stopPrank();
    }

    /**
     * Test 2: Campaign Contribution
     * This test verifies that users can contribute ETH to campaigns
     * and that contribution data is tracked correctly including first and top supporters
     */
    function testContributeToCampaign() public {
        // First create a campaign
        vm.prank(creator);
        crowdfunding.launchCampaign(
            CAMPAIGN_TITLE,
            CAMPAIGN_DESCRIPTION,
            CAMPAIGN_GOAL,
            CAMPAIGN_PERIOD
        );
        
        uint256 contributionAmount1 = 0.3 ether;
        uint256 contributionAmount2 = 0.5 ether;
        
        // First contribution
        vm.prank(contributor1);
        crowdfunding.contribute{value: contributionAmount1}(1);
        
        // Second contribution (higher amount)
        vm.prank(contributor2);
        crowdfunding.contribute{value: contributionAmount2}(1);
        
        // Verify campaign state after contributions
        (, , address topSupporter, address firstContributor, , , , , uint256 amountRaised, uint256 highestContribution, , , ) = crowdfunding.campaigns(1);
        
        assertEq(firstContributor, contributor1); // First contributor should be contributor1
        assertEq(topSupporter, contributor2); // Top supporter should be contributor2 (higher amount)
        assertEq(amountRaised, contributionAmount1 + contributionAmount2);
        assertEq(highestContribution, contributionAmount2);
        
        // Verify contributions are recorded
        Crowdfunding.Contribution[] memory contributions = crowdfunding.getContributors(1);
        assertEq(contributions.length, 2);
        assertEq(contributions[0].sender, contributor1);
        assertEq(contributions[0].amount, contributionAmount1);
        assertEq(contributions[1].sender, contributor2);
        assertEq(contributions[1].amount, contributionAmount2);
    }

    /**
     * Test 3: Successful Fund Withdrawal
     * This test verifies that campaign creators can withdraw funds
     * when the funding goal is reached and all conditions are met
     */
    function testWithdrawFunds() public {
        // Create campaign
        vm.prank(creator);
        crowdfunding.launchCampaign(
            CAMPAIGN_TITLE,
            CAMPAIGN_DESCRIPTION,
            CAMPAIGN_GOAL,
            CAMPAIGN_PERIOD
        );
        
        // Contribute enough to reach goal
        vm.prank(contributor1);
        crowdfunding.contribute{value: CAMPAIGN_GOAL}(1);
        
        // Verify goal is reached
        (, , , , , , , , , , , bool goalReached, ) = crowdfunding.campaigns(1);
        assertTrue(goalReached);
        
        // Record creator's balance before withdrawal
        uint256 creatorBalanceBefore = creator.balance;
        
        // Creator withdraws funds
        vm.prank(creator);
        crowdfunding.withdrawFunds(1);
        
        // Verify funds were transferred and campaign state updated
        uint256 creatorBalanceAfter = creator.balance;
        assertEq(creatorBalanceAfter, creatorBalanceBefore + CAMPAIGN_GOAL);
        
        // Verify funds claimed flag is set
        (, , , , , , , , , , , , bool fundsClaimed) = crowdfunding.campaigns(1);
        assertTrue(fundsClaimed);
    }

    /**
     * Test 4: Contributor Refund Process
     * This test verifies that contributors can get refunds when a campaign fails
     * (doesn't reach goal and deadline passes)
     */
    function testRefundProcess() public {
        // Create campaign
        vm.prank(creator);
        crowdfunding.launchCampaign(
            CAMPAIGN_TITLE,
            CAMPAIGN_DESCRIPTION,
            CAMPAIGN_GOAL,
            CAMPAIGN_PERIOD
        );
        
        uint256 contributionAmount = 0.5 ether; // Less than goal
        
        // Contribute (but not enough to reach goal)
        vm.prank(contributor1);
        crowdfunding.contribute{value: contributionAmount}(1);
        
        // Fast forward time past deadline
        vm.warp(block.timestamp + CAMPAIGN_PERIOD * 1 days + 1);
        
        // Verify campaign didn't reach goal
        (, , , , , , , , , , , bool goalReached, ) = crowdfunding.campaigns(1);
        assertFalse(goalReached);
        
        // Record contributor balance before refund
        uint256 contributorBalanceBefore = contributor1.balance;
        
        // Request refund
        vm.prank(contributor1);
        crowdfunding.refund(1);
        
        // Verify refund was processed
        uint256 contributorBalanceAfter = contributor1.balance;
        assertEq(contributorBalanceAfter, contributorBalanceBefore + contributionAmount);
        
        // Verify contribution amount was zeroed out
        Crowdfunding.Contribution[] memory contributions = crowdfunding.getContributors(1);
        assertEq(contributions[0].amount, 0);
    }

    /**
     * Test 5: ETH to USD Price Conversion
     * This test verifies that the price feed integration works correctly
     * and ETH amounts are properly converted to USD values
     */
    function testGetEthPriceInUSD() public view {
        // Test getting current ETH price (pass 0 for current price per ETH)
        uint256 ethPricePerUnit = crowdfunding.getEthPriceInUSD(0);
        assertEq(ethPricePerUnit, 2000); // Mock returns 200000000000 / 1e8 = 2000
        
        // Test converting specific ETH amount to USD
        uint256 ethAmount = 1 ether; // 1e18
        uint256 usdValue = crowdfunding.getEthPriceInUSD(ethAmount);
        // Calculation: (1e18 * 200000000000) / 1e18 = 200000000000
        assertEq(usdValue, 200000000000);
        
        // Test with smaller ETH amount
        uint256 smallEthAmount = 0.1 ether; // 1e17
        uint256 smallUsdValue = crowdfunding.getEthPriceInUSD(smallEthAmount);
        // Calculation: (1e17 * 200000000000) / 1e18 = 20000000000
        assertEq(smallUsdValue, 20000000000);
        
        // Verify proportional relationship
        assertEq(usdValue, smallUsdValue * 10);
    }

    /**
     * Test 6: Campaign Failure Scenarios
     * This test verifies that various failure conditions are properly handled
     */
    function testCampaignFailureScenarios() public {
        // Test contributing to non-existent campaign
        vm.expectRevert("Campaign doesn't exist");
        vm.prank(contributor1);
        crowdfunding.contribute{value: 1 ether}(999);
        
        // Create campaign for other tests
        vm.prank(creator);
        crowdfunding.launchCampaign(
            CAMPAIGN_TITLE,
            CAMPAIGN_DESCRIPTION,
            CAMPAIGN_GOAL,
            CAMPAIGN_PERIOD
        );
        
        // Test contributing 0 ETH
        vm.expectRevert("Send ETH to contribute");
        vm.prank(contributor1);
        crowdfunding.contribute{value: 0}(1);
        
        // Test non-creator trying to withdraw
        vm.prank(contributor1);
        crowdfunding.contribute{value: CAMPAIGN_GOAL}(1);
        
        vm.expectRevert("Only creator can withdraw");
        vm.prank(contributor1);
        crowdfunding.withdrawFunds(1);
    }
}
