pragma solidity ^0.4.18;

import 'eip820/contracts/EIP820.sol';

import '../contracts/IAssetHolder.sol';

contract Holder is IAssetHolder, EIP820 {

  function Holder() public {
    setInterfaceImplementation('IAssetHolder', this);
  }

  function onAssetReceived(uint256, address, address, bytes, address, bytes) public {
    return /* 📨 */;
  }
}
