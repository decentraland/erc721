pragma solidity ^0.4.18;

import './StandardAssetRegistry.sol';
import './EnumerableRegistry.sol';
import './MetadataRegistry.sol';

contract FullAssetRegistry is StandardAssetRegistry, EnumerableRegistry, MetadataRegistry {

  function FullAssetRegistry() public {
  }
}
