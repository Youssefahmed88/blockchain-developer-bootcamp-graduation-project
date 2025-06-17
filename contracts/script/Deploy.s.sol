// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "forge-std/Script.sol";
import "../src/PriceDataFeed.sol";
import "../src/NFTminter.sol";
import "../src/VRFv25Consumer.sol";
import "../src/Crowdfunding.sol";
import "../src/LogTriager.sol";

contract DeployScript is Script {
    // Contract instances
    PriceDataFeed public priceFeed;
    NFTminter public nftMinter;
    VRFv25Consumer public vrfConsumer;
    Crowdfunding public crowdfunding;
    LogTriager public logTriager;
    
    // Deployment parameters
    uint256 public constant VRF_SUBSCRIPTION_ID = 0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B; // Replace with your actual subscription ID
    
    function run() external {
        // Get deployment key from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts with account:", deployer);
        console.log("Account balance:", deployer.balance);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Step 1: Deploy PriceDataFeed
        console.log("Deploying PriceDataFeed...");
        priceFeed = new PriceDataFeed();
        console.log("PriceDataFeed deployed at:", address(priceFeed));
        
        // Step 2: Deploy NFTminter
        console.log("Deploying NFTminter...");
        nftMinter = new NFTminter();
        console.log("NFTminter deployed at:", address(nftMinter));
        
        // Step 3: Deploy VRFv25Consumer
        console.log("Deploying VRFv25Consumer...");
        vrfConsumer = new VRFv25Consumer(VRF_SUBSCRIPTION_ID);
        console.log("VRFv25Consumer deployed at:", address(vrfConsumer));
        
        // Step 4: Deploy Crowdfunding (main contract)
        console.log("Deploying Crowdfunding...");
        crowdfunding = new Crowdfunding(
            address(priceFeed),
            address(nftMinter),
            address(vrfConsumer)
        );
        console.log("Crowdfunding deployed at:", address(crowdfunding));
        
        // Step 5: Deploy LogTriager
        console.log("Deploying LogTriager...");
        logTriager = new LogTriager(address(crowdfunding));
        console.log("LogTriager deployed at:", address(logTriager));
        
        // Step 6: Set up contract relationships
        console.log("Setting up contract relationships...");
        
        // Set Crowdfunding address in NFTminter
        nftMinter.setCrowdFundContract(address(crowdfunding));
        console.log("NFTminter: Set Crowdfunding contract address");
        
        // Set NFTminter address in VRFConsumer
        vrfConsumer.setNFTMinter(address(nftMinter));
        console.log("VRFConsumer: Set NFTminter address");
        
        // Set VRF Consumer in Crowdfunding (if needed)
        crowdfunding.setVRFConsumer(address(vrfConsumer));
        console.log("Crowdfunding: Set VRFConsumer address");
        
        vm.stopBroadcast();
        
        // Step 7: Log all deployed addresses
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("PriceDataFeed:", address(priceFeed));
        console.log("NFTminter:", address(nftMinter));
        console.log("VRFv25Consumer:", address(vrfConsumer));
        console.log("Crowdfunding:", address(crowdfunding));
        console.log("LogTriager:", address(logTriager));
        console.log("========================\n");
        
        // Step 8: Save addresses to file for verification
        string memory addresses = string(abi.encodePacked(
            "PRICE_FEED_ADDRESS=", vm.toString(address(priceFeed)), "\n",
            "NFT_MINTER_ADDRESS=", vm.toString(address(nftMinter)), "\n",
            "VRF_CONSUMER_ADDRESS=", vm.toString(address(vrfConsumer)), "\n",
            "CROWDFUNDING_ADDRESS=", vm.toString(address(crowdfunding)), "\n",
            "LOG_TRIAGER_ADDRESS=", vm.toString(address(logTriager)), "\n"
        ));
        
        vm.writeFile("deployed-addresses.txt", addresses);
        console.log("Addresses saved to deployed-addresses.txt");
    }
}
