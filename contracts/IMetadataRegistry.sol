contract MetadataEnabledRegistry {

  /**
   * @notice A descriptive name for a collection of NFTs in this contract
   */
  function name() public pure returns (string _name);

  /**
   * @notice An abbreviated name for NFTs in this contract
   */
  function symbol() public pure returns (string _symbol);

  /**
   * Stores arbitrary info about a token
   */
  function tokenMetadata(uint256 _tokenId) public view returns (string);
}
