pragma solidity ^0.4.18;

interface ERC165 {
  function supportsInterface(bytes4 interfaceID) external view returns (bool);
}
