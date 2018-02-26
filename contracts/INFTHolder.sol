pragma solidity ^0.4.18;

interface INFTHolder {
  function onNFTReceived(
    uint256 _tokenId,
    address _oldOwner,
    bytes   _userData
  ) public;
}
