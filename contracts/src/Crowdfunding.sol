// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "./PriceDataFeed.sol";
import "./NFTminter.sol";
import "./VRFv25Consumer.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Crowdfunding Platform
/// @notice Enables campaign creation, ETH contributions, and NFT rewards.
/// @dev Uses Chainlink for price feeds and VRF, plus NFT minting.
contract Crowdfunding is Ownable, ReentrancyGuard {
    /// @notice Chainlink ETH/USD price feed.
    PriceDataFeed public ethPriceFeed;
    /// @notice NFT minting contract.
    NFTminter public nftMinter;
    /// @notice Chainlink VRF consumer.
    VRFv25Consumer public vrfConsumer;
    /// @notice Maps campaign ID to details.
    mapping(uint256 => Campaign) public campaigns;
    /// @notice Maps campaign ID to contributions.
    mapping(uint256 => Contribution[]) public contributions;
    /// @notice Total campaigns created.
    uint256 public campaignsCount;

    /// @notice Stores campaign details.
    struct Campaign {
        uint256 id;
        address creator;
        address topSupporter;
        address firstContributor;
        string title;
        string description;
        uint256 goalAmount;
        uint256 deadline;
        uint256 amountRaised;
        uint256 highestContribution;
        bool isOpen;
        bool goalReached;
        bool fundsClaimed;
    }

    /// @notice Stores contribution details.
    struct Contribution {
        address sender;
        uint256 amount;
        uint256 timestamp;
    }

    /// @notice Emitted when a campaign is launched.
    /// @param campaignId Campaign ID.
    /// @param creator Campaign creator.
    /// @param name Campaign title.
    event CampaignLaunched(uint256 indexed campaignId, address indexed creator, string name);

    /// @notice Emitted for contribution in USD.
    /// @param usdAmount Contribution in USD.
    event ContributionInUSD(uint256 usdAmount);

    /// @notice Emitted when funds are withdrawn.
    /// @param campaignId Campaign ID.
    /// @param creator Creator address.
    /// @param amount Amount in wei.
    event FundsWithdrawn(uint256 indexed campaignId, address indexed creator, uint256 amount);

    /// @notice Emitted for contributor refunds.
    /// @param campaignId Campaign ID.
    /// @param contributor Contributor address.
    /// @param amount Refunded amount in wei.
    event RefundIssued(uint256 indexed campaignId, address indexed contributor, uint256 amount);

    /// @notice Emitted when goal is reached.
    /// @param campaignId Campaign ID.
    /// @param amountRaised Total raised in wei.
    /// @param goalReached Goal status.
    /// @param timestamp When goal was reached.
    event GoalReached(uint256 indexed campaignId, uint256 amountRaised, bool goalReached, uint256 timestamp);

    /// @notice Emitted when top supporter updates.
    /// @param campaignId Campaign ID.
    /// @param newTopSupporter Top supporter address.
    /// @param newHighestContribution Contribution in wei.
    event TopSupporterUpdated(uint256 indexed campaignId, address indexed newTopSupporter, uint256 newHighestContribution);

    /// @notice Emitted for first supporter.
    /// @param campaignId Campaign ID.
    /// @param firstSupporter First supporter address.
    event FirstSupporter(uint256 indexed campaignId, address indexed firstSupporter);

    /// @notice Emitted when goal handling completes.
    /// @param campaignId Campaign ID.
    event GoalHandled(uint256 indexed campaignId);

    /// @notice Sets up contract with external addresses.
    /// @param _priceFeedAddress Chainlink price feed address.
    /// @param _nftMinter NFT minter address.
    /// @param _vrfConsumer VRF consumer address.
    constructor(address _priceFeedAddress, address _nftMinter, address _vrfConsumer) Ownable(msg.sender) {
        ethPriceFeed = PriceDataFeed(_priceFeedAddress);
        nftMinter = NFTminter(_nftMinter);
        vrfConsumer = VRFv25Consumer(_vrfConsumer);
    }

    /// @notice Gets LINK token balance.
    /// @return Balance in wei.
    function checkLinkBalance() public view returns (uint256) {
        return IERC20(0x779877A7B0D9E8603169DdbD7836e478b4624789).balanceOf(address(this));
    }

    /// @notice Converts ETH to USD.
    /// @param ethAmount ETH amount in wei (0 for price per ETH).
    /// @return USD equivalent.
    function getEthPriceInUSD(uint256 ethAmount) public view returns (uint256) {
        int256 ethPrice = ethPriceFeed.getChainlinkDataFeedLatestAnswer();
        require(ethPrice > 0, "Invalid ETH price");
        if (ethAmount == 0) {
            return uint256(ethPrice) / 1e8;
        }
        return (ethAmount * uint256(ethPrice)) / 1e18;
    }

    /// @notice Updates VRF consumer address.
    /// @param _vrfConsumer New VRF consumer address.
    function setVRFConsumer(address _vrfConsumer) external onlyOwner {
        vrfConsumer = VRFv25Consumer(_vrfConsumer);
    }

    /// @notice Verifies campaign ID exists.
    /// @param _id Campaign ID.
    modifier campaignExists(uint256 _id) {
        require(_id > 0 && _id <= campaignsCount, "Campaign doesn't exist");
        _;
    }

    /// @notice Creates a new campaign.
    /// @param _title Campaign title.
    /// @param _description Campaign description.
    /// @param _goalAmount Funding goal in wei.
    /// @param period Campaign duration in days.
    function launchCampaign(string calldata _title, string calldata _description, uint256 _goalAmount, uint256 period) public {
        campaignsCount++;
        campaigns[campaignsCount] = Campaign({
            id: campaignsCount,
            creator: msg.sender,
            topSupporter: address(0),
            firstContributor: address(0),
            title: _title,
            description: _description,
            goalAmount: _goalAmount,
            deadline: block.timestamp + (period * 1 days),
            amountRaised: 0,
            highestContribution: 0,
            isOpen: true,
            goalReached: false,
            fundsClaimed: false
        });
        emit CampaignLaunched(campaignsCount, msg.sender, _title);
    }

    /// @notice Contributes ETH to a campaign.
    /// @param _campaignId Campaign ID.
    function contribute(uint256 _campaignId) external payable nonReentrant campaignExists(_campaignId) {
        require(msg.value > 0, "Send ETH to contribute");
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.isOpen, "Campaign is closed");
        require(block.timestamp < campaign.deadline, "Campaign ended");

        campaign.amountRaised += msg.value;
        contributions[_campaignId].push(Contribution({
            sender: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp
        }));
        
        _updateTopSupporter(campaign, msg.sender, msg.value);

        if (campaign.amountRaised >= campaign.goalAmount) {
            campaign.goalReached = true;
            emit GoalReached(_campaignId, campaign.amountRaised, campaign.goalReached, block.timestamp);
        }
        
        if (campaign.firstContributor == address(0)) {
            campaign.firstContributor = msg.sender;
            emit FirstSupporter(_campaignId, msg.sender);
        }
        uint256 contributionUSD = getEthPriceInUSD(msg.value);
        emit ContributionInUSD(contributionUSD);
    }

    /// @notice Closes a campaign after deadline.
    /// @param _campaignId Campaign ID.
    function closeCampaign(uint256 _campaignId) external campaignExists(_campaignId) {
        Campaign storage campaign = campaigns[_campaignId];
        require(block.timestamp >= campaign.deadline, "Deadline not reached");
        campaign.isOpen = false;
    }

    /// @notice Updates top supporter if contribution is higher.
    /// @param campaign Campaign storage reference.
    /// @param sender Contributor address.
    /// @param amount Contribution in wei.
    function _updateTopSupporter(Campaign storage campaign, address sender, uint256 amount) internal {
        if (amount > campaign.highestContribution) {
            campaign.topSupporter = sender;
            campaign.highestContribution = amount;
            emit TopSupporterUpdated(campaign.id, sender, amount);
        }
    }

    /// @notice Handles NFT minting and VRF for successful campaigns.
    /// @param _campaignId Campaign ID.
    function handleGoalReached(uint256 _campaignId) external campaignExists(_campaignId) {
        Campaign storage campaign = campaigns[_campaignId]; 
        require(address(nftMinter) != address(0), "NFTMinter not set");
        nftMinter.mintToFirstSupporter(campaign.id, campaign.firstContributor);
        nftMinter.mintToTopSupporter(campaign.id, campaign.topSupporter);

        require(contributions[_campaignId].length > 0, "No contributions found");

        address[] memory contributors = new address[](contributions[_campaignId].length);
        for (uint256 i = 0; i < contributions[_campaignId].length; i++) {
            contributors[i] = contributions[_campaignId][i].sender;
        }
        vrfConsumer.setParticipants(_campaignId, contributors);
        vrfConsumer.requestRandomWinner(_campaignId);

        emit GoalHandled(_campaignId);
    }

    /// @notice Gets contributors for a campaign.
    /// @param _campaignId Campaign ID.
    /// @return Array of contributions.
    function getContributors(uint256 _campaignId) external view returns (Contribution[] memory) {
        return contributions[_campaignId];
    }

    /// @notice Withdraws funds for successful campaign.
    /// @param _campaignId Campaign ID.
    function withdrawFunds(uint256 _campaignId) external nonReentrant campaignExists(_campaignId) {
        Campaign storage campaign = campaigns[_campaignId];
        require(msg.sender == campaign.creator, "Only creator can withdraw");
        require(campaign.goalReached, "Funding goal not reached");
        require(!campaign.fundsClaimed, "Funds already claimed");

        campaign.fundsClaimed = true;
        payable(campaign.creator).transfer(campaign.amountRaised);

        emit FundsWithdrawn(_campaignId, campaign.creator, campaign.amountRaised);
    }

    /// @notice Refunds contributors if campaign fails.
    /// @param _campaignId Campaign ID.
    function refund(uint256 _campaignId) external nonReentrant campaignExists(_campaignId) {
        Campaign storage campaign = campaigns[_campaignId];
        require(block.timestamp > campaign.deadline, "Campaign still active");
        require(!campaign.goalReached, "Campaign was successful");

        Contribution[] storage contribs = contributions[_campaignId];
        uint256 refundAmount = 0;

        for (uint256 i = 0; i < contribs.length; i++) {
            if (contribs[i].sender == msg.sender && contribs[i].amount > 0) {
                refundAmount += contribs[i].amount;
                contribs[i].amount = 0;
            }
        }
        require(refundAmount > 0, "No funds to refund");
        payable(msg.sender).transfer(refundAmount);

        emit RefundIssued(_campaignId, msg.sender, refundAmount);
    }
}