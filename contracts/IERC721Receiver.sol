pragma solidity ^0.4.18;

interface IERC721Receiver {
  function onERC721Received(
    address _oldOwner,
    uint256 _tokenId,
    bytes   _userData
  ) external returns (bytes4);
}
