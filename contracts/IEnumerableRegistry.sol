contract EnumerableRegistry {
  /**
   * @notice Enumerate active tokens
   * @dev Throws if `_index` >= `countOfDeeds()`, otherwise SHALL NOT throw.
   * @param _index A counter less than `countOfDeeds()`
   * @return The identifier for the `_index`th deed, (sort order not
   *  specified)
   */
  // TODO (eordano): Not implemented
  // function tokenByIndex(uint256 _index) public view returns (uint256 _deedId);

  /**
   * @notice Count of owners which own at least one deed
   *  Must not throw.
   * @return A count of the number of owners which own deeds
   */
  // TODO (eordano): Not implemented
  // function countOfOwners() public view returns (uint256 _count);

  /**
   * @notice Enumerate owners
   * @dev Throws if `_index` >= `countOfOwners()`, otherwise must not throw.
   * @param _index A counter less than `countOfOwners()`
   * @return The address of the `_index`th owner (sort order not specified)
   */
  // TODO (eordano): Not implemented
  // function ownerByIndex(uint256 _index) public view returns (address _owner);

  /**
   * @notice Enumerate tokens assigned to an owner
   * @dev Throws if `_index` >= `countOfDeedsByOwner(_owner)` or if
   *  `_owner` is the zero address, representing invalid deeds.
   *  Otherwise this must not throw.
   * @param _owner An address where we are interested in deeds owned by them
   * @param _index A counter less than `countOfDeedsByOwner(_owner)`
   * @return The identifier for the `_index`th deed assigned to `_owner`,
   *   (sort order not specified)
   */
  function tokenOfOwnerByIndex(
    address owner, uint256 index
    ) external view returns (uint256 tokenId);
}
