pragma solidity ^0.4.18;

interface IERC721Receiver {
  function onERC721Received(
    uint256 _tokenId,
    address _oldOwner,
    bytes   _userData
  ) public;
}
