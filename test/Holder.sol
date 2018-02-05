pragma solidity ^0.4.18;

import 'eip820/contracts/EIP820Implementer.sol';

import '../contracts/IAssetHolder.sol';

contract Holder is IAssetHolder, EIP820Implementer {

  function Holder() public {
    setInterfaceImplementation('IAssetHolder', this);
  }

  function canImplementInterfaceForAddress(address addr, bytes32 interfaceHash) view public returns(bool) {
    return true;
  }

  function onAssetReceived(uint256, address, address, bytes, address, bytes) public {
    return /* 📨 */;
  }
}
