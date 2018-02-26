pragma solidity ^0.4.18;

import './IMetadataRegistry.sol';
import './AssetRegistryStorage.sol';

contract MetadataRegistry is AssetRegistryStorage, IMetadataRegistry {
  function name() public view returns (string) {
    return _name;
  }
  function symbol() public view returns (string) {
    return _symbol;
  }
  function description() public view returns (string) {
    return _description;
  }
  function tokenMetadata(uint256 assetId) public view returns (string) {
    return _assetData[assetId];
  }
}
