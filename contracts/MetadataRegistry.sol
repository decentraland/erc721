#pragma solidity ^0.4.18;

import IMetadataRegistry from './IMetadataRegistry';
import AssetRegistryStorage from './AssetRegistryStorage';

contract MetadataRegistry is AssetRegistryStorage, IMetadataRegistry {
  function name() {
    return _name;
  }
  function symbol() {
    return _symbol;
  }
  function description() {
    return _description;
  }
  function tokenMetadata(uint256 assetId) {
    return _assetData[asssetdId];
  }
}
