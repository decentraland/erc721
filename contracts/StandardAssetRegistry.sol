pragma solidity ^0.4.18;

import 'zeppelin-solidity/contracts/math/SafeMath.sol';

import './AssetRegistryStorage.sol';

import './IAssetRegistry.sol';

import './INFTHolder.sol';

interface ERC165 {
  function supportsInterface(bytes4 interfaceID) public view returns (bool);
}

contract StandardAssetRegistry is AssetRegistryStorage, IERC821Base {
  using SafeMath for uint256;

  bytes4 public erc165Interface = bytes4(keccak256('supportsInterface(bytes4)'));

  bytes4 public interfaceID = bytes4(
    keccak256('totalSupply()') ^
    keccak256('exists(uint256)') ^
    keccak256('ownerOf(uint256)') ^
    keccak256('balanceOf(address)') ^
    keccak256('reassignTo(address,address,uint256)') ^
    keccak256('transferFrom(address,address,uint256)') ^
    keccak256('transferFrom(address,address,uint256,bytes)') ^
    keccak256('approve(address,uint256)') ^
    keccak256('getApprovedAddress(uint256)') ^
    keccak256('setApprovalForAll(address,bool)') ^
    keccak256('isApprovedForAll(address,address)') ^
    keccak256('isAuthorized(address,uint256)')
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

  //
  // Authorization getters
  //

  /**
   * @dev Query whether an address has been authorized to move any assets on behalf of someone else
   * @param operator the address that might be authorized
   * @param assetHolder the address that provided the authorization
   * @return bool true if the operator has been authorized to move any assets
   */
  function isApprovedForAll(address operator, address assetHolder)
    public view returns (bool)
  {
    return _operators[assetHolder][operator];
  }

  /**
   * @dev Query what address has been particularly authorized to move an asset
   * @param assetId the asset to be queried for
   * @return bool true if the asset has been approved by the holder
   */
  function getApprovedAddress(uint256 assetId) public view returns (address) {
    return _approval[assetId];
  }

  /**
   * @dev Query if an operator can move an asset.
   * @param operator the address that might be authorized
   * @param assetId the asset that has been `approved` for transfer
   * @return bool true if the asset has been approved by the holder
   */
  function isAuthorized(address operator, uint256 assetId)
    public view returns (bool)
  {
    require(operator != 0);
    address owner = ownerOf(assetId);
    if (operator == owner) {
      return true;
    }
    return isApprovedForAll(operator, owner) || getApprovedAddress(assetId) == operator;
  }

  //
  // Authorization
  //

  /**
   * @dev Authorize a third party operator to manage (send) msg.sender's asset
   * @param operator address to be approved
   * @param authorized bool set to true to authorize, false to withdraw authorization
   */
  function setApprovalForAll(address operator, bool authorized) public {
    if (authorized) {
      require(!isApprovedForAll(operator, msg.sender));
      _addAuthorization(operator, msg.sender);
    } else {
      require(isApprovedForAll(operator, msg.sender));
      _clearAuthorization(operator, msg.sender);
    }
    ApprovalForAll(operator, msg.sender, authorized);
  }

  /**
   * @dev Authorize a third party operator to manage one particular asset
   * @param operator address to be approved
   * @param assetId asset to approve
   */
  function approve(address operator, uint256 assetId) public {
    address holder = ownerOf(assetId);
    require(operator != holder);
    if (getApprovedAddress(assetId) != operator) {
      _approval[assetId] = operator;
      Approval(holder, operator, assetId);
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
      Approval(holder, 0, assetId);
    }
  }

  //
  // Supply-altering functions
  //

  function _generate(uint256 assetId, address beneficiary) internal {
    require(_holderOf[assetId] == 0);

    _addAssetTo(beneficiary, assetId);

    Transfer(0, beneficiary, assetId, msg.sender, '');
  }

  function _destroy(uint256 assetId) internal {
    address holder = _holderOf[assetId];
    require(holder != 0);

    _removeAssetFrom(holder, assetId);

    Transfer(holder, 0, assetId, msg.sender, '');
  }

  //
  // Transaction related operations
  //

  modifier onlyHolder(uint256 assetId) {
    require(_holderOf[assetId] == msg.sender);
    _;
  }

  modifier onlyAuthorized(uint256 assetId) {
    require(isAuthorized(msg.sender, assetId));
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
   * Warning! This function does not attempt to verify that the target address can send
   * tokens.
   *
   * @param from address that currently owns an asset
   * @param to address to receive the ownership of the asset
   * @param assetId uint256 ID of the asset to be transferred
   */
  function reassignTo(address from, address to, uint256 assetId) public {
    return _doTransferFrom(from, to, assetId, '', msg.sender, false);
  }

  /**
   * @dev Securely transfers the ownership of a given asset from one address to
   * another address, calling the method `onNFTReceived` on the target address if
   * there's code associated with it
   *
   * @param from address sending the asset
   * @param to address to receive the ownership of the asset
   * @param assetId uint256 ID of the asset to be transferred
   * @param userData bytes arbitrary user information to attach to this transfer
   */
  function transferFrom(address from, address to, uint256 assetId, bytes userData) public {
    return _doTransferFrom(from, to, assetId, userData, msg.sender, true);
  }

  /**
   * @dev Alias for transferFrom(from, to, assetId, EMPTY_BYTES)
   *
   * @param from address sending the asset
   * @param to address to receive the ownership of the asset
   * @param assetId uint256 ID of the asset to be transferred
   */
  function transferFrom(address from, address to, uint256 assetId) public {
    return _doTransferFrom(from, to, assetId, '', msg.sender, true);
  }

  function _doTransferFrom(
    address from,
    address to,
    uint256 assetId,
    bytes userData,
    address operator,
    bool doCheck
  )
    isDestinataryDefined(to)
    destinataryIsNotHolder(assetId, to)
    onlyAuthorized(assetId)
    internal
  {
    address holder = _holderOf[assetId];
    _removeAssetFrom(holder, assetId);
    _clearApproval(holder, assetId);
    _addAssetTo(to, assetId);

    if (doCheck && _isContract(to)) {
      INFTHolder(to).onNFTReceived.gas(50000)(
        assetId, holder, userData
      );
    }

    Transfer(holder, to, assetId, operator, userData);
  }


  /**
   * @dev Returns `true` if the contract implements `interfaceID` and `interfaceID` is not 0xffffffff, `false` otherwise
   * @param  _interfaceID The interface identifier, as specified in ERC-165
   */
  function supportsInterface(bytes4 _interfaceID) public view returns (bool) {
    if (_interfaceID == 0xffffffff) {
      return false;
    }
    if (_interfaceID == interfaceID) {
      return true;
    }
    if (_interfaceID == erc165Interface) {
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
