pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';

import 'eip820/contracts/EIP820Registry.sol';
import 'eip820/contracts/EIP820Implementer.sol';

import './AssetRegistryStorage.sol';

import './IAssetRegistry.sol';

import './IAssetHolder.sol';

contract StandardAssetRegistry is AssetRegistryStorage, IAssetRegistry, EIP820Implementer {
  using SafeMath for uint256;

  //
  // Global Getters
  //

  function name() public view returns (string) {
    return _name;
  }

  function symbol() public view returns (string) {
    return _symbol;
  }

  function description() public view returns (string) {
    return _description;
  }

  function totalSupply() public view returns (uint256) {
    return _count;
  }

  function decimals() public view returns (uint256) {
    return 0;
  }

  function isERC821() public view returns (bool) {
    return true;
  }

  //
  // Asset-centric getter functions
  //

  function exists(uint256 assetId) public view returns (bool) {
    return _holderOf[assetId] != 0;
  }

  function holderOf(uint256 assetId) public view returns (address) {
    return _holderOf[assetId];
  }

  function ownerOf(uint256 assetId) public view returns (address) {
    // It's OK to be inefficient here, as this method is for compatibility.
    // Users should call `holderOf`
    return holderOf(assetId);
  }

  function safeHolderOf(uint256 assetId) public view returns (address) {
    address holder = _holderOf[assetId];
    require(holder != 0);
    return holder;
  }

  function safeOwnerOf(uint256 assetId) public view returns (address) {
    return safeHolderOf(assetId);
  }

  function assetData(uint256 assetId) public view returns (string) {
    return _assetData[assetId];
  }

  function safeAssetData(uint256 assetId) public view returns (string) {
    require(_holderOf[assetId] != 0);
    return _assetData[assetId];
  }

  //
  // Holder-centric getter functions
  //

  function assetCount(address holder) public view returns (uint256) {
    return _assetsOf[holder].length;
  }

  function balanceOf(address holder) public view returns (uint256) {
    return assetCount(holder);
  }

  function assetByIndex(address holder, uint256 index) public view returns (uint256) {
    require(index < _assetsOf[holder].length);
    require(index < (1<<127));
    return _assetsOf[holder][index];
  }

  function assetsOf(address holder) external view returns (uint256[]) {
    return _assetsOf[holder];
  }

  //
  // Authorization getters
  //

  function isOperatorAuthorizedBy(address operator, address assetHolder)
    public view returns (bool)
  {
    return _operators[assetHolder][operator];
  }

  function approvedFor(uint256 assetId) public view returns (address) {
    return _approval[assetId];
  }

  function isApprovedFor(address operator, uint256 assetId)
    public view returns (bool)
  {
    require(operator != 0);
    if (operator == holderOf(assetId)) {
      return true;
    }
    return _approval[assetId] == operator;
  }

  //
  // Authorization
  //

  function authorizeOperator(address operator, bool authorized) public {
    if (authorized) {
      require(!isOperatorAuthorizedBy(operator, msg.sender));
      _addAuthorization(operator, msg.sender);
    } else {
      require(isOperatorAuthorizedBy(operator, msg.sender));
      _clearAuthorization(operator, msg.sender);
    }
    AuthorizeOperator(operator, msg.sender, authorized);
  }

  function approve(address operator, uint256 assetId) public {
    address holder = holderOf(assetId);
    require(operator != holder);
    if (approvedFor(assetId) != operator) {
      _approval[assetId] = operator;
      Approve(holder, operator, assetId);
    }
  }

  function _addAuthorization(address operator, address holder) private {
    _operators[holder][operator] = true;
  }

  function _clearAuthorization(address operator, address holder) private {
    _operators[holder][operator] = false;
  }

  //
  // Internal Operations
  //

  function _addAssetTo(address to, uint256 assetId) internal {
    _holderOf[assetId] = to;

    uint256 length = assetCount(to);

    _assetsOf[to].push(assetId);

    _indexOfAsset[assetId] = length;

    _count = _count.add(1);
  }

  function _addAssetTo(address to, uint256 assetId, string data) internal {
    _addAssetTo(to, assetId);

    _assetData[assetId] = data;
  }

  function _removeAssetFrom(address from, uint256 assetId) internal {
    uint256 assetIndex = _indexOfAsset[assetId];
    uint256 lastAssetIndex = assetCount(from).sub(1);
    uint256 lastAssetId = _assetsOf[from][lastAssetIndex];

    _holderOf[assetId] = 0;

    // Insert the last asset into the position previously occupied by the asset to be removed
    _assetsOf[from][assetIndex] = lastAssetId;

    // Resize the array
    _assetsOf[from][lastAssetIndex] = 0;
    _assetsOf[from].length--;

    // Remove the array if no more assets are owned to prevent pollution
    if (_assetsOf[from].length == 0) {
      delete _assetsOf[from];
    }

    // Update the index of positions for the asset
    _indexOfAsset[assetId] = 0;
    _indexOfAsset[lastAssetId] = assetIndex;

    _count = _count.sub(1);
  }

  function _clearApproval(address holder, uint256 assetId) internal {
    if (holderOf(assetId) == holder && _approval[assetId] != 0) {
      _approval[assetId] = 0;
      Approve(holder, 0, assetId);
    }
  }

  function _removeAssetData(uint256 assetId) internal {
    _assetData[assetId] = '';
  }

  //
  // Supply-altering functions
  //

  function _generate(uint256 assetId, address beneficiary, string data) internal {
    require(_holderOf[assetId] == 0);

    _addAssetTo(beneficiary, assetId, data);

    Transfer(0, beneficiary, assetId, msg.sender, bytes(data), '');
  }

  function _destroy(uint256 assetId) internal {
    address holder = _holderOf[assetId];
    require(holder != 0);

    _removeAssetFrom(holder, assetId);
    _removeAssetData(assetId);

    Transfer(holder, 0, assetId, msg.sender, '', '');
  }

  //
  // Transaction related operations
  //

  modifier onlyHolder(uint256 assetId) {
    require(_holderOf[assetId] == msg.sender);
    _;
  }

  modifier onlyOperatorOrHolder(uint256 assetId) {
    require(
      _holderOf[assetId] == msg.sender
      || isOperatorAuthorizedBy(msg.sender, _holderOf[assetId])
      || isApprovedFor(msg.sender, assetId)
    );
    _;
  }

  modifier isDestinataryDefined(address destinatary) {
    require(destinatary != 0);
    _;
  }

  modifier destinataryIsNotHolder(uint256 assetId, address to) {
    require(_holderOf[assetId] != to);
    _;
  }

  function transfer(address to, uint256 assetId) public {
    return _doTransfer(to, assetId, '', 0, '');
  }

  function transfer(address to, uint256 assetId, bytes userData) public {
    return _doTransfer(to, assetId, userData, 0, '');
  }

  function transfer(address to, uint256 assetId, bytes userData, bytes operatorData) public {
    return _doTransfer(to, assetId, userData, msg.sender, operatorData);
  }

  function _doTransfer(
    address to, uint256 assetId, bytes userData, address operator, bytes operatorData
  )
    isDestinataryDefined(to)
    destinataryIsNotHolder(assetId, to)
    onlyOperatorOrHolder(assetId)
    internal
  {
    return _doSend(to, assetId, userData, operator, operatorData);
  }


  function _doSend(
    address to, uint256 assetId, bytes userData, address operator, bytes operatorData
  )
    internal
  {
    address holder = _holderOf[assetId];
    _removeAssetFrom(holder, assetId);
    _clearApproval(holder, assetId);
    _addAssetTo(to, assetId);

    if (_isContract(to)) {
      require(!_reentrancy);
      _reentrancy = true;

      address recipient = interfaceAddr(to, 'IAssetHolder');
      require(recipient != 0);

      IAssetHolder(recipient).onAssetReceived(assetId, holder, to, userData, operator, operatorData);

      _reentrancy = false;
    }

    Transfer(holder, to, assetId, operator, userData, operatorData);
  }

  //
  // Update related functions
  //

  function _update(uint256 assetId, string data) internal {
    require(exists(assetId));
    _assetData[assetId] = data;
    Update(assetId, _holderOf[assetId], msg.sender, data);
  }

  //
  // Utilities
  //

  function _isContract(address addr) internal view returns (bool) {
    uint size;
    assembly { size := extcodesize(addr) }
    return size > 0;
  }
}
