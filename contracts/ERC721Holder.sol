pragma solidity ^0.4.18;

import './IERC721Receiver.sol';

contract ERC721Holder is IERC721Receiver {
    /**
   * @dev Magic value to be returned upon successful reception of an NFT
   *  Equals to `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`
   */
  bytes4 internal constant ERC721_RECEIVED = 0x150b7a02;

  function onERC721Received(address /* _operator */, address /* _from */, uint256 /* _tokenId */, bytes /* _data */) external returns (bytes4) {
    return ERC721_RECEIVED;
  }
}
