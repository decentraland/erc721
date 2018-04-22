pragma solidity ^0.4.18;

import './ERC721Base.sol';
import './ERC721Enumerable.sol';
import './ERC721Metadata.sol';

contract FullAssetRegistry is ERC721Base, ERC721Enumerable, ERC721Metadata {
  constructor() public {
  }

  /**
   * @dev Method to check if an asset identified by the given id exists under this DAR.
   * @return uint256 the assetId
   */
  function exists(uint256 assetId) external view returns (bool) {
    return _exists(assetId);
  }
  function _exists(uint256 assetId) internal view returns (bool) {
    return _holderOf[assetId] != 0;
  }

  function decimals() external pure returns (uint256) {
    return 0;
  }
}
