pragma solidity ^0.4.18;

import '../contracts/IERC721Receiver.sol';

contract Holder is IERC721Receiver {

  function onERC721Received(uint256, address, bytes) public {
    return /* 📨 */;
  }
}
