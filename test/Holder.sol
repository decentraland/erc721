pragma solidity ^0.4.18;

import '../contracts/AssetHolder.sol';

contract Holder is AssetHolder {

  function onAssetReceived(uint256, address, address, bytes) public {
    return /* 📨 */;
  }
}
