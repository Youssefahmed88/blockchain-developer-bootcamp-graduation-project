// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/// @title PriceDataFeed Contract
/// @notice Fetches ETH/USD price via Chainlink.
/// @dev Uses Chainlink AggregatorV3Interface.
contract PriceDataFeed {
    /// @notice Chainlink data feed interface.
    AggregatorV3Interface public dataFeed;

    /// @notice Initializes with Chainlink feed address.
    constructor() {
        dataFeed = AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);
    }

    /// @notice Gets latest ETH/USD price.
    /// @return Price in USD (scaled).
    function getChainlinkDataFeedLatestAnswer() public view virtual returns (int) {
        (, int256 answer, , , ) = dataFeed.latestRoundData();
        return answer;
    }
}