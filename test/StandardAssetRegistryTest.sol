pragma solidity ^0.4.18;

import '../contracts/StandardAssetRegistry.sol';

contract StandardAssetRegistryTest is StandardAssetRegistry {

  function StandardAssetRegistryTest () public {
    _name = "Test";
    _symbol = "TEST";
    _description = "Loremp ipsum";
  }

  function isContractProxy(address addr) public view returns (bool) {
    return isContract(addr);
  }

}
