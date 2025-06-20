# Decentralized Crowdfunding Platform

A modern, blockchain-based crowdfunding platform built with Next.js, Solidity smart contracts, and integrated with Chainlink services for enhanced functionality and fairness.

## 📋 About This Project

This decentralized crowdfunding platform enables users to create and support innovative projects using cryptocurrency. The platform features NFT rewards, automated goal handling, and provably fair winner selection through Chainlink VRF.

### ✨ Key Features

- **Campaign Creation**: Launch crowdfunding campaigns with customizable goals and deadlines
- **ETH Contributions**: Support projects using Ethereum with real-time progress tracking
- **NFT Rewards**: Automatic NFT minting for special contributors (First, Top, VRF Winner)
- **Fair Winner Selection**: Chainlink VRF integration for provably random winner selection
- **Real-time Price Feeds**: Chainlink Price Feeds for accurate ETH/USD conversion
- **Automated Goal Handling**: Chainlink Automation for campaign lifecycle management
- **Responsive Design**: Modern UI with dark/light mode support
- **IPFS Integration**: Decentralized storage for NFT metadata and images

## 🏗️ Directory Structure

```
CROWDFUNDING/
├── contracts/                       # Smart contracts directory
├── front-end/                      # Next.js Frontend Application
│   ├── context/                          # React Context & Smart Contract Integration
│   │   ├── Constants.tsx                # Contract addresses and ABIs
│   │   ├── Crowdfunding.json           # Crowdfunding contract ABI
│   │   ├── CrowdFundingContext.tsx     # Main crowdfunding logic context
│   │   ├── NFTContext.tsx              # NFT management context
│   │   ├── NFTminter.json              # NFT minter contract ABI
│   │   ├── package-lock.json           # Context dependencies
│   │   └── package.json                # Context package configuration
│   ├── .next/                      # Next.js build output
│   ├── app/                        # Next.js App Router
│   │   ├── campaign/[id]/          # Dynamic campaign detail pages
│   │   │   └── page.tsx           # Individual campaign page
│   │   ├── campaigns/              # All campaigns listing
│   │   │   ├── loading.tsx        # Loading component
│   │   │   └── page.tsx          # Campaigns listing page
│   │   ├── create/                 # Campaign creation
│   │   │   └── page.tsx          # Create campaign page
│   │   ├── rewards/                # NFT rewards section
│   │   │   └── page.tsx          # Rewards page
│   │   ├── globals.css            # Global styles and custom CSS
│   │   ├── layout.tsx             # Root layout component
│   │   └── page.tsx               # Home page
│   ├── components/                 # Reusable React Components
│   │   ├── ui/                    # shadcn/ui base components
│   │   ├── campaign-actions.tsx   # Campaign interaction components
│   │   ├── campaign-card.tsx      # Campaign display card
│   │   ├── create-campaign-form.tsx # Campaign creation form
│   │   ├── eth-price.tsx          # ETH price display
│   │   ├── ipfs-upload.tsx        # IPFS file upload component
│   │   ├── navbar.tsx             # Navigation component
│   │   ├── theme-provider.tsx     # Theme context provider
│   │   ├── theme-switcher.tsx     # Dark/light mode toggle
│   │   ├── theme-toggle.tsx       # Theme toggle button
│   │   ├── timeline.tsx           # Campaign timeline component
│   │   └── wallet-connect.tsx     # Wallet connection component
│   ├── hooks/                     # Custom React Hooks
│   │   ├── use-mobile.tsx         # Mobile detection hook
│   │   └── use-toast.ts          # Toast notification hook
│   ├── lib/                       # Utility Libraries
│   │   ├── contract-config.ts     # Smart contract configuration
│   │   ├── ipfs.ts               # IPFS integration utilities
│   │   ├── utils.ts              # General utility functions
│   │   ├── wagmi-config.ts       # Wagmi configuration
│   │   ├── wallet-context.tsx    # Wallet context provider
│   │   └── web3modal-provider.tsx # Web3Modal provider
│   ├── .env.local                 # Environment variables
│   ├── .gitignore                # Git ignore rules
│   ├── components.json           # shadcn/ui configuration
│   ├── next-env.d.ts            # Next.js TypeScript declarations
│   ├── next.config.mjs          # Next.js configuration
│   ├── package-lock.json        # NPM lock file
│   ├── package.json             # NPM dependencies
│   ├── postcss.config.mjs       # PostCSS configuration
│   ├── tailwind.config.ts       # Tailwind CSS configuration
│   ├── tsconfig.json            # TypeScript configuration
│   └── types.d.ts               # Custom type declarations
```

## 🎨 Design Patterns

The project implements several key design patterns:

- **Factory Pattern**: Campaign creation through the main contract
- **Observer Pattern**: Event-driven architecture for campaign updates
- **Context Pattern**: React Context for state management across components
- **Provider Pattern**: Web3 and wallet connection management
- **Compound Component Pattern**: Reusable UI components with shadcn/ui
- **Custom Hook Pattern**: Encapsulated logic in custom React hooks

## 🔒 Security Measures

- **Reentrancy Protection**: OpenZeppelin's ReentrancyGuard implementation
- **Access Control**: Proper permission management for sensitive functions
- **Input Validation**: Comprehensive validation for all user inputs
- **Safe Math**: Built-in overflow protection in Solidity 0.8+
- **Environment Variables**: Secure storage of sensitive configuration
- **Type Safety**: Full TypeScript implementation for type safety

## 🔗 Important Links & Addresses

### 📍 Contract Addresses (Sepolia Testnet)

```
Crowdfunding Contract: 0x8003D32D8ccC97B108C4Ed4Bc327315f52C49E76
NFT Minter Contract: 0x274625e8192e4cde0F54876a325e7B7CcA52e78C
Price Feed Contract: 0x18ad382B50f8BAE8010F3FBb3a98fCEd1279778C
VRF Consumer Contract: 0x7cEb9095Ad00D6b155C0AaD30f02Fc8524C21Dc5
Log Triager Contract: 0x536c0cFBF886e90ACbe342d9D8bbfaB037AA3c80
```

### 🔍 Verified Contracts

All smart contracts are verified on Etherscan:
- [Crowdfunding Contract](https://sepolia.etherscan.io/address/0x8003D32D8ccC97B108C4Ed4Bc327315f52C49E76)
- [NFT Minter Contract](https://sepolia.etherscan.io/address/0x274625e8192e4cde0F54876a325e7B7CcA52e78C)
- [VRF2.5 Consumer Contract](https://sepolia.etherscan.io/address/0x7cEb9095Ad00D6b155C0AaD30f02Fc8524C21Dc5)
- [Price DataFeed](https://sepolia.etherscan.io/address/0x18ad382B50f8BAE8010F3FBb3a98fCEd1279778C)
- [Log Triager](https://sepolia.etherscan.io/address/0x536c0cFBF886e90ACbe342d9D8bbfaB037AA3c80)

### 🌐 Live Demo

- **Hosting**: [https://blockchain-developer-bootcamp-graduation-project-3jirb0sbb.vercel.app](https://blockchain-developer-bootcamp-graduation-project-3jirb0sbb.vercel.app)
- **IPFS Gateway**: [https://jade-managing-dinosaur-851.mypinata.cloud/ipfs/](https://jade-managing-dinosaur-851.mypinata.cloud/ipfs/)

## 🧪 How to Run Tests

### Prerequisites
- [Foundry](https://book.getfoundry.sh/getting-started/installation) installed
- Node.js 18+ and npm/yarn

### Running Smart Contract Tests

```bash
# Navigate to contracts directory
cd contracts

# Install Foundry dependencies
forge install

# Run all tests
forge test

# Run tests with verbose output
forge test -vvv

# Generate coverage report
forge coverage
```

## 🚀 How to Run the Program

### Environment Setup

1. **Clone the repository**
```bash
git clone https://github.com/your-username/crowdfunding-platform.git
cd crowdfunding-platform
```

2. **Install frontend dependencies**
```bash
cd front-end
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Fill in your environment variables in `.env.local`:
```env
# Blockchain Configuration
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_EXPECTED_CHAIN_ID=11155111
PRIVATE_KEY=your_private_key_here
RPC_URL=https://sepolia.infura.io/v3/your_infura_key
ETHERSCAN_API_KEY=your_etherscan_api_key

# IPFS Configuration
NEXT_PUBLIC_INFURA_IPFS_API_KEY=your_infura_ipfs_project_id
NEXT_PUBLIC_INFURA_IPFS_API_KEY_SECRET=your_infura_ipfs_project_secret
NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/

# Chainlink VRF
VRF_SUBSCRIPTION_ID=1
```

### Local Development

```bash
# Start the development server (from front-end directory)
npm run dev

# Open http://localhost:3000 in your browser
```

### Smart Contract Deployment

```bash
# Navigate to contracts directory
cd contracts

# Deploy contracts to Sepolia testnet
forge script script/Deploy.s.sol:DeployScript --rpc-url $RPC_URL --broadcast --verify --etherscan-api-key $ETHERSCAN_API_KEY
```

## 🎬 Demo

### Live Demo Walkthrough

1. **Connect Wallet**: Connect your MetaMask wallet to Sepolia testnet
2. **Browse Campaigns**: Explore active crowdfunding campaigns
3. **Create Campaign**: Launch your own crowdfunding project
4. **Contribute**: Support projects with ETH contributions
5. **Earn NFTs**: Receive special NFT rewards for contributions
6. **Track Progress**: Monitor campaign progress in real-time
7. **Withdraw Funds**: Campaign creators can withdraw funds when goals are met

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Smart Contracts**: Solidity 0.8.20, Foundry, OpenZeppelin
- **Blockchain**: Ethereum (Sepolia Testnet)
- **Oracles**: Chainlink Price Feeds, VRF, Automation
- **Storage**: IPFS (Infura/Pinata)
- **Wallet**: MetaMask, WalletConnect, Web3Modal
- **UI Components**: shadcn/ui, Lucide React
- **State Management**: React Context API
- **Web3 Integration**: Wagmi, Viem
- **Testing**: Foundry (Solidity)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Join our Discord community [Hackat](https://discord.gg/fsptJjK2)
- Follow us on Twitter [@0xYoussef](https://twitter.com/0xYoussef0)
- Linktree of me [LinkTree](https://linktr.ee/0xyoussef)
- Feel Free to connect me on [Linkedin](www.linkedin.com/in/youssefahmed70) 

---

**⚠️ Disclaimer**: This is experimental software. Use at your own risk. Always do your own research before contributing to any crowdfunding campaign.
```