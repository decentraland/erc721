pragma solidity ^0.4.18;

import './StandardAssetRegistryTest.sol';

contract Exchange {
  // From asset to amount
  mapping(uint256 => uint256) internal _orders;

  StandardAssetRegistryTest internal nonFungible;

  constructor(address _nonFungible) public {
    nonFungible = StandardAssetRegistryTest(_nonFungible);
  }

  function sell(uint256 assetId, uint256 amount) public {
    require(nonFungible.ownerOf(assetId) == msg.sender);
    _orders[assetId] = amount;
  }

  function buy(uint256 assetId) payable public {
    require(msg.value >= _orders[assetId]);
    require(_orders[assetId] > 0);
    address owner = nonFungible.ownerOf(assetId);
    owner.transfer(_orders[assetId]);
    uint remaining = msg.value - _orders[assetId];
    if (remaining > 0) {
     msg.sender.transfer(remaining);
    }
    nonFungible.safeTransferFrom(owner, msg.sender, assetId);
  }
}

