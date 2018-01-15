pragma solidity ^0.4.18;

import '../contracts/StandardAssetRegistry.sol';

contract StandardAssetRegistryTest is StandardAssetRegistry {

  function StandardAssetRegistryTest() {
    _name = "Test";
    _symbol = "TEST";
  }

  function isContractProxy(address addr) public view returns (bool) {
    return isContract(addr);
  }

}
