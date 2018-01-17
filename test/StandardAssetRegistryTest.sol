pragma solidity ^0.4.18;

import '../contracts/StandardAssetRegistry.sol';

contract StandardAssetRegistryTest is StandardAssetRegistry {

  function StandardAssetRegistryTest () public {
    _name = "Test";
    _symbol = "TEST";
    _description = "lorem ipsum";
  }

  function isContractProxy(address addr) public view returns (bool) {
    return _isContract(addr);
  }

  function generate(uint256 assetId, address beneficiary, string data) public {
    _generate(assetId, beneficiary, data);
  }

  function update(uint256 assetId, string data) public {
    _update(assetId, data);
  }

  function destroy(uint256 assetId) public {
    _destroy(assetId);
  }
  function transferTo(
    address to, uint256 assetId, bytes userData, bytes operatorData
  ) public {
    return transfer(to, assetId, userData, operatorData);
  }
}
