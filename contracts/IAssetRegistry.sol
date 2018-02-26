pragma solidity ^0.4.18;

interface IERC821Base {
  function totalSupply() public view returns (uint256);

  function exists(uint256 assetId) public view returns (bool);
  function ownerOf(uint256 assetId) public view returns (address);

  function balanceOf(address holder) public view returns (uint256);

  function reassignTo(address from, address to, uint256 assetId) public;

  function transferFrom(address from, address to, uint256 assetId) public;
  function transferFrom(address from, address to, uint256 assetId, bytes userData) public;

  function setApprovalForAll(address operator, bool authorized) public;
  function approve(address operator, uint256 assetId) public;

  function isApprovedForAll(address operator, address assetOwner) public view returns (bool);
  function getApprovedAddress(uint256 assetId) public;

  function isAuthorized(address operator, uint256 assetId) public view returns (bool);

  event Transfer(
    address indexed from,
    address indexed to,
    uint256 indexed assetId,
    address operator,
    bytes userData
  );
  event ApprovalForAll(
    address indexed operator,
    address indexed holder,
    bool authorized
  );
  event Approval(
    address indexed owner,
    address indexed operator,
    uint256 indexed assetId
  );
}
