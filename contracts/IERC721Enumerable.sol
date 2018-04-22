pragma solidity ^0.4.18;

contract IERC721Enumerable {

  /**
   * @notice Enumerate active tokens
   * @dev Throws if `index` >= `totalSupply()`, otherwise SHALL NOT throw.
   * @param index A counter less than `totalSupply()`
   * @return The identifier for the `index`th asset, (sort order not
   *  specified)
   */
  // TODO (eordano): Not implemented
  // function tokenByIndex(uint256 index) public view returns (uint256 _assetId);

  /**
   * @notice Count of owners which own at least one asset
   *  Must not throw.
   * @return A count of the number of owners which own asset
   */
  // TODO (eordano): Not implemented
  // function countOfOwners() public view returns (uint256 _count);

  /**
   * @notice Enumerate owners
   * @dev Throws if `index` >= `countOfOwners()`, otherwise must not throw.
   * @param index A counter less than `countOfOwners()`
   * @return The address of the `index`th owner (sort order not specified)
   */
  // TODO (eordano): Not implemented
  // function ownerByIndex(uint256 index) public view returns (address owner);

  /**
   * @notice Get all tokens of a given address
   * @dev This is not intended to be used on-chain
   * @param owner address of the owner to query
   * @return a list of all assetIds of a user
   */
  function tokensOf(address owner) external view returns (uint256[]);

  /**
   * @notice Enumerate tokens assigned to an owner
   * @dev Throws if `index` >= `balanceOf(owner)` or if
   *  `owner` is the zero address, representing invalid assets.
   *  Otherwise this must not throw.
   * @param owner An address where we are interested in assets owned by them
   * @param index A counter less than `balanceOf(owner)`
   * @return The identifier for the `index`th asset assigned to `owner`,
   *   (sort order not specified)
   */
  function tokenOfOwnerByIndex(
    address owner, uint256 index
  ) external view returns (uint256 tokenId);
}
