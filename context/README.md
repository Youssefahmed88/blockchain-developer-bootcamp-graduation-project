# React Context & Contract Integration

This directory contains all logic and configurations needed to interact with the smart contracts in a clean and modular way using React Context.

## 📂 Files Breakdown

- **`Constants.tsx`**  
  Contains contract addresses and ABI imports to be reused across the app.

- **`Crowdfunding.json`**  
  The ABI for the Crowdfunding smart contract.

- **`NFTminter.json`**  
  The ABI for the NFT Minter smart contract.

- **`CrowdFundingContext.tsx`**  
  Provides all functions and data related to campaign creation, funding, and state handling using the Crowdfunding contract.

- **`NFTContext.tsx`**  
  Manages reward NFTs — minting, assigning, and interacting with the NFT Minter contract.

- **`package.json` & `package-lock.json`**  
  Defines dependencies needed to run the context separately, useful if extracted or reused in isolation.

## 🧠 Purpose

Helps centralize contract logic and state management into React Contexts, improving maintainability and separation of concerns in the front-end architecture.

