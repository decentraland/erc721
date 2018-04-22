pragma solidity ^0.4.18;

import './IERC721Enumerable.sol';
import './AssetRegistryStorage.sol';

contract ERC721Enumerable is AssetRegistryStorage, IERC721Enumerable {

  /**
   * @notice Get all tokens of a given address
   * @dev This is not intended to be used on-chain
   * @param owner address of the owner to query
   * @return a list of all assetIds of a user
   */
  function tokensOf(address owner) external view returns (uint256[]) {
    return _assetsOf[owner];
  }

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
  )
    external
    view
    returns (uint256 assetId)
  {
    require(index < _assetsOf[owner].length);
    require(index < (1<<127));
    return _assetsOf[owner][index];
  }

}
