pragma solidity ^0.4.18;

contract IEnumerableRegistry {

  /**
   * @notice Enumerate active tokens
   * @dev Throws if `index` >= `countOfDeeds()`, otherwise SHALL NOT throw.
   * @param index A counter less than `countOfDeeds()`
   * @return The identifier for the `index`th deed, (sort order not
   *  specified)
   */
  // TODO (eordano): Not implemented
  // function tokenByIndex(uint256 index) public view returns (uint256 _deedId);

  /**
   * @notice Count of owners which own at least one deed
   *  Must not throw.
   * @return A count of the number of owners which own deeds
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
   * @notice Enumerate tokens assigned to an owner
   * @dev Throws if `index` >= `countOfDeedsByOwner(owner)` or if
   *  `owner` is the zero address, representing invalid deeds.
   *  Otherwise this must not throw.
   * @param owner An address where we are interested in deeds owned by them
   * @param index A counter less than `countOfDeedsByOwner(owner)`
   * @return The identifier for the `index`th deed assigned to `owner`,
   *   (sort order not specified)
   */
  function tokenOfOwnerByIndex(
    address owner, uint256 index
  ) public view returns (uint256 tokenId);
}
