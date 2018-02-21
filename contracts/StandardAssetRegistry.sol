pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';

import './AssetRegistryStorage.sol';

import './IAssetRegistry.sol';

import './IAssetHolder.sol';

interface ERC165 {
  function supportsInterface(bytes4 interfaceID) external view returns (bool);
}

contract StandardAssetRegistry is AssetRegistryStorage, IAssetRegistry {
  using SafeMath for uint256;

  bytes4 public receiverInterface = bytes4(keccak256('onAssetReceived(uint256,address,address,bytes)'));

  bytes4 public erc165Interface = bytes4(keccak256('supportsInterface(bytes4)'));

  bytes4 public interfaceID = bytes4(
    keccak256('totalSupply()') ^
    keccak256('exists(uint256)') ^
    keccak256('ownerOf(uint256)') ^
    keccak256('balanceOf(address)') ^
    keccak256('assetByIndex(address,uint256)') ^
    keccak256('transfer(address,uint256)') ^
    keccak256('transfer(address,uint256,bytes)') ^
    keccak256('transfer(address,uint256,bytes,bytes)') ^
    keccak256('transferFrom(address,address,uint256)') ^
    keccak256('transferFrom(address,address,uint256,bytes)') ^
    keccak256('transferFrom(address,address,uint256,bytes,bytes)') ^
    keccak256('approveAll(address,bool)') ^
    keccak256('approve(address,uint256)') ^
    keccak256('isAuthorizedBy(address,address)') ^
    keccak256('isApprovedFor(address,uint256)') ^
    keccak256('approvedFor(uint256)')
  );

  //
  // Global Getters
  //

  /**
   * @dev Gets the total amount of assets stored by the contract
   * @return uint256 representing the total amount of assets
   */
  function totalSupply() public view returns (uint256) {
    return _count;
  }

  // Non-standard implementation to see the asset in normal ERC20 wallets
  function decimals() public pure returns (uint256) {
    return 0;
  }

  //
  // Asset-centric getter functions
  //
  /**
   * @dev Method to check if an asset identified by the given id exists under this DAR.
   * @return uint256 the assetId
   */
  function exists(uint256 assetId) public view returns (bool) {
    return _holderOf[assetId] != 0;
  }

  /**
   * @dev Queries what address owns an asset. This method does not throw.
   * In order to check if the asset exists, use the `exists` function or check if the
   * return value of this call is `0`.
   * @return uint256 the assetId
   */
  function ownerOf(uint256 assetId) public view returns (address) {
    return _holderOf[assetId];
  }

  //
  // Holder-centric getter functions
  //
  /**
   * @dev Gets the balance of the specified address
   * @param owner address to query the balance of
   * @return uint256 representing the amount owned by the passed address
   */
  function balanceOf(address owner) public view returns (uint256) {
    return _assetsOf[owner].length;
  }

  /**
   * @dev Retrieve the `index`-th asset held by the specified address
   * NOTE: This method might have concurrency issues, as changes in the array might
   * happen between calls.
   * @param holder address to query
   * @param index index of the asset in the array of assets held by the owner
   * @return uint256 the assetId of the `index`-th asset of the owner
   */
  function assetByIndex(address holder, uint256 index) public view returns (uint256) {
    require(index < _assetsOf[holder].length);
    require(index < (1<<127));
    return _assetsOf[holder][index];
  }

  /**
   * @dev Retrieve all the assets owned by the given address
   * @param holder address to query
   * @return uint256[] an array of assetId's held by the owner
   */
  function assetsOf(address holder) external view returns (uint256[]) {
    return _assetsOf[holder];
  }

  //
  // Authorization getters
  //

  /**
   * @dev Query whether an address has been authorized to move any assets on behalf of someone else
   * @param operator the address that might be authorized
   * @param assetHolder the address that provided the authorization
   * @return bool true if the operator has been authorized to move any assets
   */
  function isAuthorizedBy(address operator, address assetHolder)
    public view returns (bool)
  {
    return _operators[assetHolder][operator];
  }

  /**
   * @dev Query what address has been particularly authorized to move an asset
   * @param assetId the asset to be queried for
   * @return bool true if the asset has been approved by the holder
   */
  function approvedFor(uint256 assetId) public view returns (address) {
    return _approval[assetId];
  }

  /**
   * @dev Query if an operator can move an asset.
   * @param operator the address that might be authorized
   * @param assetId the asset that has been `approved` for transfer
   * @return bool true if the asset has been approved by the holder
   */
  function isApprovedFor(address operator, uint256 assetId)
    public view returns (bool)
  {
    require(operator != 0);
    address owner = ownerOf(assetId);
    if (operator == owner) {
      return true;
    }
    return isAuthorizedBy(operator, owner) || approvedFor(assetId) == operator;
  }

  //
  // Authorization
  //


  /**
   * @dev Authorize a third party operator to manage (send) msg.sender's asset
   * @param operator address to be approved
   * @param authorized bool set to true to authorize, false to withdraw authorization
   */
  function approveAll(address operator, bool authorized) public {
    if (authorized) {
      require(!isAuthorizedBy(operator, msg.sender));
      _addAuthorization(operator, msg.sender);
    } else {
      require(isAuthorizedBy(operator, msg.sender));
      _clearAuthorization(operator, msg.sender);
    }
    AuthorizeOperator(operator, msg.sender, authorized);
  }

  /**
   * @dev Authorize a third party operator to manage one particular asset
   * @param operator address to be approved
   * @param assetId asset to approve
   */
  function approve(address operator, uint256 assetId) public {
    address holder = ownerOf(assetId);
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

    uint256 length = balanceOf(to);

    _assetsOf[to].push(assetId);

    _indexOfAsset[assetId] = length;

    _count = _count.add(1);
  }

  function _removeAssetFrom(address from, uint256 assetId) internal {
    uint256 assetIndex = _indexOfAsset[assetId];
    uint256 lastAssetIndex = balanceOf(from).sub(1);
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
    if (ownerOf(assetId) == holder && _approval[assetId] != 0) {
      _approval[assetId] = 0;
      Approve(holder, 0, assetId);
    }
  }

  //
  // Supply-altering functions
  //

  function _generate(uint256 assetId, address beneficiary) internal {
    require(_holderOf[assetId] == 0);

    _addAssetTo(beneficiary, assetId);

    Transfer(0, beneficiary, assetId, msg.sender, '', '');
  }

  function _destroy(uint256 assetId) internal {
    address holder = _holderOf[assetId];
    require(holder != 0);

    _removeAssetFrom(holder, assetId);

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
      || isAuthorizedBy(msg.sender, _holderOf[assetId])
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

  /**
   * @dev Transfers the ownership of a given asset from one address to another address
   * @param to address to receive the ownership of the asset
   * @param assetId uint256 ID of the asset to be transferred
   * @param userData bytes arbitrary user information to attach to this transfer
   * @param operatorData bytes arbitrary information to attach to this transfer, provided by the operator
   */
  function transfer(address to, uint256 assetId, bytes userData, bytes operatorData) public {
    return _doTransfer(to, assetId, userData, msg.sender, operatorData);
  }

  /**
   * @dev Alias for transfer(to, assetId, userData, EMPTY_BYTES)
   * @param to address to receive the ownership of the asset
   * @param assetId uint256 ID of the asset to be transferred
   * @param userData bytes arbitrary user information to attach to this transfer
   */
  function transfer(address to, uint256 assetId, bytes userData) public {
    return _doTransfer(to, assetId, userData, msg.sender, '');
  }

  /**
   * @dev Alias for transfer(to, assetId, EMPTY_BYTES, EMPTY_BYTES)
   * @param to address to receive the ownership of the asset
   * @param assetId uint256 ID of the asset to be transferred
   */
  function transfer(address to, uint256 assetId) public {
    return _doTransfer(to, assetId, '', msg.sender, '');
  }

  /**
   * @dev Transfers the ownership of a given asset from one address to another address
   * @param from address sending the asset
   * @param to address to receive the ownership of the asset
   * @param assetId uint256 ID of the asset to be transferred
   * @param userData bytes arbitrary user information to attach to this transfer
   * @param operatorData bytes arbitrary information to attach to this transfer, provided by the operator
   */
  function transferFrom(address from, address to, uint256 assetId, bytes userData, bytes operatorData) public {
    return _doTransferFrom(from, to, assetId, userData, msg.sender, operatorData);
  }

  /**
   * @dev Alias for transferFrom(from, to, assetId, userData, EMPTY_BYTES)
   * @param from address sending the asset
   * @param to address to receive the ownership of the asset
   * @param assetId uint256 ID of the asset to be transferred
   * @param userData bytes arbitrary user information to attach to this transfer
   */
  function transferFrom(address from, address to, uint256 assetId, bytes userData) public {
    return _doTransferFrom(from, to, assetId, userData, msg.sender, '');
  }

  /**
   * @dev Alias for transferFrom(from, to, assetId, EMPTY_BYTES, EMPTY_BYTES)
   * @param from address sending the asset
   * @param to address to receive the ownership of the asset
   * @param assetId uint256 ID of the asset to be transferred
   */
  function transferFrom(address from, address to, uint256 assetId) public {
    return _doTransferFrom(from, to, assetId, '', msg.sender, '');
  }

  function _doTransferFrom(
    address from, address to, uint256 assetId, bytes userData, address operator, bytes operatorData
  ) internal {
    require(from == _holderOf[assetId]);
    return _doTransfer(to, assetId, userData, operator, operatorData);
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
      require(ERC165(to).supportsInterface.gas(30000)(receiverInterface));
      IAssetHolder(to).onAssetReceived.gas(50000)(
        assetId, holder, to, userData
      );
    }

    Transfer(holder, to, assetId, operator, userData, operatorData);
  }


  /**
   * @dev Returns `true` if the contract implements `interfaceID` and `interfaceID` is not 0xffffffff, `false` otherwise
   * @param  interfaceID The interface identifier, as specified in ERC-165
   */
  function supportsInterface(bytes4 interfaceID) external view returns (bool) {
    if (interfaceID == 0xffffffff) {
      return false;
    }
    if (interfaceID == interfaceID) {
      return true;
    }
    if (interfaceID == erc165Interface) {
      return true;
    }
    return false;
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
