pragma solidity ^0.4.18;

import './INFTHolder.sol';

contract NFTHolder is INFTHolder {
  function onAssetReceived(uint256 tokenId, address oldOwner, bytes data) public {
    return;
  }
}
