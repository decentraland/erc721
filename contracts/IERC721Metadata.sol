pragma solidity ^0.4.18;

contract IERC721Metadata {

  /**
   * @notice A descriptive name for a collection of NFTs in this contract
   */
  function name() external view returns (string);

  /**
   * @notice An abbreviated name for NFTs in this contract
   */
  function symbol() external view returns (string);

  /**
   * @notice A description of what this DAR is used for
   */
  function description() external view returns (string);

  /**
   * Stores arbitrary info about a token
   */
  function tokenMetadata(uint256 assetId) external view returns (string);
}
