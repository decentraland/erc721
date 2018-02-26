pragma solidity ^0.4.18;

import '../contracts/INFTHolder.sol';

contract Holder is INFTHolder {

  function onNFTReceived(uint256, address, bytes) public {
    return /* 📨 */;
  }
}
