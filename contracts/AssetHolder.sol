pragma solidity ^0.4.18;

import './IAssetHolder.sol';

contract AssetHolder is IAssetHolder {

  bytes4 public receiverInterface = bytes4(keccak256('onAssetReceived(uint256,address,address,bytes)'));

  bytes4 public erc165Interface = bytes4(keccak256('supportsInterface(bytes4)'));

  /**
   * @dev Returns `true` if the contract implements `interfaceID` and `interfaceID` is not 0xffffffff, `false` otherwise
   * @param  interfaceID The interface identifier, as specified in ERC-165
   */
  function supportsInterface(bytes4 interfaceID) external view returns (bool) {
    if (interfaceID == 0xffffffff) {
      return false;
    }
    if (interfaceID == receiverInterface) {
      return true;
    }
    if (interfaceID == erc165Interface) {
      return true;
    }
    return false;
  }
}
