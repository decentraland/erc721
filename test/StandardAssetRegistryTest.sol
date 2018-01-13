pragma solidity ^0.4.18;

import '../contracts/StandardAssetRegistry.sol';

contract StandardAssetRegistryTest is StandardAssetRegistry {

  function StandardAssetRegistryTest() {
    _name = "Test";
    _symbol = "TEST";
  }
}
