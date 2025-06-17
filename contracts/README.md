# 🚀 Decentralized Crowdfunding Platform - Smart Contracts

A comprehensive blockchain-based crowdfunding platform built with Solidity, featuring Chainlink integration for price feeds, VRF randomness, automation, and NFT rewards for contributors.

## 📋 Overview

This smart contract system enables users to create and fund crowdfunding campaigns using Ethereum, with automated goal handling, fair winner selection, and NFT rewards. The platform leverages Chainlink's decentralized oracle network for enhanced functionality and security.

## 🏗️ Contract Architecture

### Core Contracts

| Contract | Description | Key Features |
|----------|-------------|--------------|
| **Crowdfunding.sol** | Main platform contract | Campaign creation, contribution handling, fund management |
| **NFTminter.sol** | ERC721 NFT rewards system | Mints reward NFTs for first/top supporters and VRF winners |
| **PriceDataFeed.sol** | Chainlink price oracle | Fetches real-time ETH/USD price data |
| **VRFv25Consumer.sol** | Chainlink VRF integration | Provably fair random winner selection |
| **LogTriager.sol** | Chainlink Automation | Automated campaign lifecycle management |

### Contract Interactions

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Crowdfunding  │◄──►│   NFTminter      │◄──►│ VRFv25Consumer  │
│   (Main Logic)  │    │   (Rewards)      │    │ (Randomness)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  PriceDataFeed  │    │   LogTriager     │    │   Chainlink     │
│  (Price Oracle) │    │  (Automation)    │    │   Services      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## ✨ Key Features

### 🎯 Campaign Management
- **Campaign Creation**: Launch crowdfunding campaigns with customizable goals and deadlines
- **ETH Contributions**: Accept Ethereum contributions with real-time progress tracking
- **Automated Lifecycle**: Chainlink Automation handles campaign completion and closure

### 🏆 NFT Reward System
- **First Supporter NFT**: Exclusive reward for the first contributor
- **Top Supporter NFT**: Premium reward for the highest contributor
- **VRF Winner NFT**: Random winner selected via Chainlink VRF

### 🔗 Chainlink Integration
- **Price Feeds**: Real-time ETH/USD conversion for contribution tracking
- **VRF v2.5**: Provably fair random winner selection
- **Automation**: Event-driven campaign management

### 🔒 Security Features
- **ReentrancyGuard**: Protection against reentrancy attacks
- **Access Control**: Owner-only functions for critical operations
- **Input Validation**: Comprehensive parameter validation
- **Safe Transfers**: Secure ETH and token transfers

## 📁 Contract Details

### Crowdfunding.sol
**Main platform contract managing campaigns and contributions**

**Key Functions:**
- `launchCampaign()` - Create new crowdfunding campaign
- `contribute()` - Contribute ETH to campaigns
- `withdrawFunds()` - Creator withdraws successful campaign funds
- `refund()` - Contributors get refunds from failed campaigns
- `handleGoalReached()` - Automated goal completion handling

**Events:**
- `CampaignLaunched` - New campaign created
- `GoalReached` - Campaign funding goal achieved
- `FundsWithdrawn` - Creator withdrew funds
- `RefundIssued` - Contributor received refund

### NFTminter.sol
**ERC721 contract for minting reward NFTs**

**Key Functions:**
- `mintToFirstSupporter()` - Mint NFT for first contributor
- `mintToTopSupporter()` - Mint NFT for highest contributor
- `mintRaffleNFT()` - Mint NFT for VRF winner
- `updateURIs()` - Update NFT metadata URIs

**NFT Types:**
- **First Supporter**: Rare collectible for pioneering support
- **Top Supporter**: Epic collectible for highest contribution
- **VRF Winner**: Legendary collectible for random selection

### VRFv25Consumer.sol
**Chainlink VRF integration for fair winner selection**

**Key Functions:**
- `requestRandomWinner()` - Request random number from Chainlink VRF
- `fulfillRandomWords()` - Handle VRF callback and select winner
- `setParticipants()` - Set campaign participants for raffle
- `getParticipants()` - Get participants list

**VRF Configuration:**
- **Key Hash**: `0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae`
- **Confirmations**: 3 blocks
- **Gas Limit**: 40,000
- **Network**: Sepolia Testnet

### PriceDataFeed.sol
**Chainlink price oracle for ETH/USD conversion**

**Key Functions:**
- `getChainlinkDataFeedLatestAnswer()` - Get latest ETH/USD price

**Price Feed:**
- **Address**: `0x694AA1769357215DE4FAC081bf1f309aDC325306` (Sepolia)
- **Pair**: ETH/USD
- **Decimals**: 8

### LogTriager.sol
**Chainlink Automation for campaign lifecycle management**

**Key Functions:**
- `checkLog()` - Check for GoalReached events
- `performUpkeep()` - Execute automated campaign handling

**Event Monitoring:**
- **Event**: `GoalReached`
- **Signature**: `0xb0159aff0fc172e60f3c6c72806aa85b50e524a9e8c2a3e2035996fe177321bb`

## 🚀 Deployment Guide

### Prerequisites

1. **Install Foundry**
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

2. **Clone Repository**
```bash
git clone <repository-url>
cd contracts
```

3. **Install Dependencies**
```bash
forge install
```

### Environment Setup

Create `.env` file:
```env
# Deployment Configuration
PRIVATE_KEY=your_private_key_here
RPC_URL=https://sepolia.infura.io/v3/your_infura_key
ETHERSCAN_API_KEY=your_etherscan_api_key

# Chainlink Configuration
VRF_SUBSCRIPTION_ID=your_vrf_subscription_id
EXPECTED_CHAIN_ID=11155111

# Contract Addresses (will be populated after deployment)
CROWDFUNDING_ADDRESS=
NFT_MINTER_ADDRESS=
VRF_CONSUMER_ADDRESS=
PRICE_FEED_ADDRESS=
LOG_TRIAGER_ADDRESS=
```

### Deployment Steps

1. **Deploy Contracts**
```bash
# Make deployment script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

2. **Verify Contracts**
```bash
# Make verification script executable
chmod +x verify.sh

# Run verification
./verify.sh
```

3. **Manual Deployment (Alternative)**
```bash
# Deploy using Foundry script
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

### Post-Deployment Setup

1. **Fund VRF Subscription**
   - Visit [Chainlink VRF Subscription Manager](https://vrf.chain.link/)
   - Add LINK tokens to your subscription
   - Add VRFv25Consumer as a consumer

2. **Set Up Chainlink Automation**
   - Visit [Chainlink Automation](https://automation.chain.link/)
   - Create new upkeep for LogTriager contract
   - Fund upkeep with LINK tokens

## 🧪 Testing

### Run All Tests
```bash
forge test
```

### Run Specific Test File
```bash
forge test --match-path test/CrowdfundingTest.t.sol
```

### Run Tests with Verbose Output
```bash
forge test -vvv
```

### Generate Coverage Report
```bash
forge coverage
```

### Test Categories

**Unit Tests:**
- Campaign creation and management
- Contribution handling and validation
- Fund withdrawal and refund mechanisms
- NFT minting for different reward types
- Price feed integration
- VRF winner selection

**Integration Tests:**
- End-to-end campaign lifecycle
- Cross-contract interactions
- Chainlink service integration
- Event emission and handling

**Security Tests:**
- Reentrancy protection
- Access control validation
- Input sanitization
- Edge case handling

## 📊 Gas Optimization

### Estimated Gas Costs (Sepolia)

| Function | Gas Cost | USD Cost* |
|----------|----------|-----------|
| Launch Campaign | ~200,000 | $2.00 |
| Contribute | ~100,000 | $1.00 |
| Withdraw Funds | ~50,000 | $0.50 |
| Mint NFT | ~150,000 | $1.50 |
| VRF Request | ~200,000 | $2.00 |

*Estimated at 10 gwei gas price and $2000 ETH

### Optimization Techniques
- Packed structs for storage efficiency
- Batch operations where possible
- Efficient loops and mappings
- Minimal external calls

## 🔒 Security Considerations

### Implemented Protections
- **Reentrancy Guard**: Prevents reentrancy attacks
- **Access Control**: Owner-only sensitive functions
- **Input Validation**: Comprehensive parameter checks
- **Safe Math**: Solidity 0.8+ overflow protection
- **Deadline Checks**: Time-based validation

### Security Best Practices
- Regular security audits recommended
- Monitor contract interactions
- Keep dependencies updated
- Use multi-signature wallets for ownership
- Implement emergency pause mechanisms

### Known Limitations
- Centralized owner control (consider DAO governance)
- LINK token dependency for Chainlink services
- Gas price volatility affects transaction costs

## 📈 Usage Examples

### Creating a Campaign
```solidity
// Create a 30-day campaign with 10 ETH goal
crowdfunding.launchCampaign(
    "Revolutionary DApp",
    "Building the future of decentralized applications",
    10 ether,
    30 // days
);
```

### Contributing to a Campaign
```solidity
// Contribute 1 ETH to campaign ID 1
crowdfunding.contribute{value: 1 ether}(1);
```

### Withdrawing Funds
```solidity
// Creator withdraws funds after goal is reached
crowdfunding.withdrawFunds(1);
```

### Getting Campaign Details
```solidity
// Get campaign information
(
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
) = crowdfunding.campaigns(1);
```

## 🔗 Contract Addresses (Sepolia Testnet)

```
Crowdfunding:    0x8003D32D8ccC97B108C4Ed4Bc327315f52C49E76
NFTminter:       0x274625e8192e4cde0F54876a325e7B7CcA52e78C
VRFv25Consumer:  0x7cEb9095Ad00D6b155C0AaD30f02Fc8524C21Dc5
PriceDataFeed:   0x18ad382B50f8BAE8010F3FBb3a98fCEd1279778C
LogTriager:      0x536c0cFBF886e90ACbe342d9D8bbfaB037AA3c80
```

### Verified Contracts
All contracts are verified on Etherscan:
- [View on Sepolia Etherscan](https://sepolia.etherscan.io/)

## 🛠️ Development Tools

### Required Tools
- **Foundry**: Smart contract development framework
- **Solidity**: Version 0.8.20
- **OpenZeppelin**: Security-audited contract libraries
- **Chainlink**: Decentralized oracle services

## 📚 Additional Resources

### Documentation
- [Foundry Book](https://book.getfoundry.sh/)
- [Chainlink Documentation](https://docs.chain.link/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Solidity Documentation](https://docs.soliditylang.org/)

### Chainlink Services
- [VRF v2.5 Documentation](https://docs.chain.link/vrf/v2-5/overview)
- [Price Feeds](https://docs.chain.link/data-feeds/price-feeds)
- [Automation](https://docs.chain.link/chainlink-automation)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write comprehensive tests
4. Follow Solidity style guide
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This software is experimental and provided "as is". Use at your own risk. Always conduct thorough testing and security audits before deploying to mainnet.

---

**Built with ❤️ using Foundry, Chainlink, and OpenZeppelin**
```

This README provides comprehensive documentation for your smart contracts, including architecture overview, deployment instructions, testing guidelines, and usage examples. The contracts implement a sophisticated crowdfunding platform with integrated Chainlink services and NFT rewards.