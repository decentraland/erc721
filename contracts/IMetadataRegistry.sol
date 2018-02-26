pragma solidity ^0.4.18;

contract IMetadataRegistry {

  /**
   * @notice A descriptive name for a collection of NFTs in this contract
   */
  function name() public view returns (string);

  /**
   * @notice An abbreviated name for NFTs in this contract
   */
  function symbol() public view returns (string);

  /**
   * @notice A description of what this DAR is used for
   */
  function description() public view returns (string);

  /**
   * Stores arbitrary info about a token
   */
  function tokenMetadata(uint256 assetId) public view returns (string);
}
