pragma solidity ^0.4.18;

import './IEnumerableRegistry.sol';
import './AssetRegistryStorage.sol';

contract EnumerableRegistry is AssetRegistryStorage, IEnumerableRegistry {

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
    ) public view returns (uint256 assetId)
  {
    require(index < _assetsOf[owner].length);
    require(index < (1<<127));
    return _assetsOf[owner].length;
  }

}
