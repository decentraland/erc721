pragma solidity ^0.4.18;

import './IERC721Receiver.sol';

contract ERC721Holder is IERC721Receiver {
  function onERC721Received(address /* oldOwner */, uint256 /* tokenId */, bytes /* data */) public returns (bytes4) {
    return bytes4(0xf0b9e5ba);
  }
}
