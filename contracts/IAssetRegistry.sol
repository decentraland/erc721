pragma solidity ^0.4.18;

interface IAssetRegistry {

  /**
   * Global Registry getter functions
   */
  function name() public view returns (string);
  function symbol() public view returns (string);
  function description() public view returns (string);
  function totalSupply() public view returns (uint256);
  function decimals() public view returns (uint256);

  function isERC821() public view returns (bool);

  /**
   * Asset-centric getter functions
   */
  function exists(uint256 assetId) public view returns (bool);

  function holderOf(uint256 assetId) public view returns (address);
  function ownerOf(uint256 assetId) public view returns (address);

  function safeHolderOf(uint256 assetId) public view returns (address);
  function safeOwnerOf(uint256 assetId) public view returns (address);

  function assetData(uint256 assetId) public view returns (string);
  function safeAssetData(uint256 assetId) public view returns (string);

  /**
   * Holder-centric getter functions
   */
  function assetCount(address holder) public view returns (uint256);
  function balanceOf(address holder) public view returns (uint256);

  function assetByIndex(address holder, uint256 index) public view returns (uint256);
  function assetsOf(address holder) external view returns (uint256[]);

  /**
   * Transfer Operations
   */
  function transfer(address to, uint256 assetId) public;
  function transfer(address to, uint256 assetId, bytes userData) public;
  function transfer(address to, uint256 assetId, bytes userData, bytes operatorData) public;

  /**
   * Authorization operations
   */
  function authorizeOperator(address operator, bool authorized) public;
  function approve(address operator, uint256 assetId) public;

  /**
   * Authorization getters
   */
  function isOperatorAuthorizedBy(address operator, address assetHolder)
    public view returns (bool);

  function approvedFor(uint256 assetId)
    public view returns (address);

  function isApprovedFor(address operator, uint256 assetId)
    public view returns (bool);

  /**
   * Events
   */
  event Transfer(
    address indexed from,
    address indexed to,
    uint256 indexed assetId,
    address operator,
    bytes userData,
    bytes operatorData
  );
  event Update(
    uint256 indexed assetId,
    address indexed holder,
    address indexed operator,
    string data
  );
  event AuthorizeOperator(
    address indexed operator,
    address indexed holder,
    bool authorized
  );
  event Approve(
    address indexed owner,
    address indexed operator,
    uint256 indexed assetId
  );
}
