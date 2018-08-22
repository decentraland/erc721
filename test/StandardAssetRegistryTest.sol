pragma solidity ^0.4.18;

import '../contracts/FullAssetRegistry.sol';

contract StandardAssetRegistryTest is FullAssetRegistry {

  constructor() public {
    _name = "Test";
    _symbol = "TEST";
    _description = "lorem ipsum";
  }

  function isContractProxy(address addr) public view returns (bool) {
    return _isContract(addr);
  }

  function generate(uint256 assetId, address beneficiary) public {
    _generate(assetId, beneficiary);
  }

  function destroy(uint256 assetId) public {
    _destroy(assetId);
  }

  // Problematic override on truffle
  function safeTransfer(address from, address to, uint256 assetId, bytes data) public {
    return _doTransferFrom(from, to, assetId, data, true);
  }
}
