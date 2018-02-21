pragma solidity ^0.4.18;

interface IAssetRegistry {
  function totalSupply() public view returns (uint256);

  function exists(uint256 assetId) public view returns (bool);
  function ownerOf(uint256 assetId) public view returns (address);

  function balanceOf(address holder) public view returns (uint256);

  function assetByIndex(address holder, uint256 index) public view returns (uint256);
  function assetsOf(address holder) external view returns (uint256[]);

  function transfer(address to, uint256 assetId) public;
  function transfer(address to, uint256 assetId, bytes userData) public;
  function transfer(address to, uint256 assetId, bytes userData, bytes operatorData) public;

  function transferFrom(address from, address to, uint256 assetId) public;
  function transferFrom(address from, address to, uint256 assetId, bytes userData) public;
  function transferFrom(address from, address to, uint256 assetId, bytes userData, bytes operatorData) public;

  function approveAll(address operator, bool authorized) public;
  function approve(address operator, uint256 assetId) public;

  function isAuthorizedBy(address operator, address assetOwner) public view returns (bool);
  function isApprovedFor(address operator, uint256 assetId) public view returns (bool);
  function approvedFor(uint256 assetId) public view returns (address);

  event Transfer(
    address indexed from,
    address indexed to,
    uint256 indexed assetId,
    address operator,
    bytes userData,
    bytes operatorData
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
