
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./BondAssetRegistry.sol";
import "./InvestorIdentity.sol";
import "./ReserveVerifier.sol";

contract BondToken is ERC20, AccessControl, ReentrancyGuard {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant TOKEN_ADMIN_ROLE = keccak256("TOKEN_ADMIN_ROLE");

    string public bondId;
    uint256 public maxSupply;
    bool public transfersPaused;

    mapping(address => bool) public trustedContracts;

    BondAssetRegistry public immutable registry;
    InvestorIdentity public immutable identity;
    ReserveVerifier public immutable reserveVerifier;

    event TokensMinted(address indexed to, uint256 amount, address indexed mintedBy);
    event TokensBurned(address indexed from, uint256 amount, address indexed burnedBy);
    event TransfersPaused(address indexed by);
    event TransfersUnpaused(address indexed by);
    event TrustedContractUpdated(address indexed contractAddress, bool trusted);

    constructor(
        string memory _bondId,
        string memory _name,
        string memory _symbol,
        uint256 _maxSupply,
        address _registry,
        address _identity,
        address _reserveVerifier,
        address _admin
    ) ERC20(_name, _symbol) {
        require(bytes(_bondId).length > 0, "BondToken: empty bondId");
        require(_maxSupply > 0, "BondToken: maxSupply must be > 0");
        require(_registry != address(0), "BondToken: registry is zero address");
        require(_identity != address(0), "BondToken: identity is zero address");
        require(_reserveVerifier != address(0), "BondToken: reserveVerifier is zero address");
        require(_admin != address(0), "BondToken: admin is zero address");

        bondId = _bondId;
        maxSupply = _maxSupply;
        registry = BondAssetRegistry(_registry);
        identity = InvestorIdentity(_identity);
        reserveVerifier = ReserveVerifier(_reserveVerifier);

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(TOKEN_ADMIN_ROLE, _admin);
        _grantRole(MINTER_ROLE, _admin);
        _grantRole(BURNER_ROLE, _admin);
    }

    function decimals() public pure override returns (uint8) {
        return 0;
    }

    function mint(address to, uint256 amount)
        external
        onlyRole(MINTER_ROLE)
        nonReentrant
    {
        require(to != address(0), "BondToken: mint to zero address");
        require(amount > 0, "BondToken: amount must be > 0");
        require(!transfersPaused, "BondToken: transfers paused");

        require(registry.isBondApproved(bondId), "BondToken: bond not approved");
        require(reserveVerifier.isReserveVerified(bondId), "BondToken: reserves not verified");
        require(identity.isApproved(to), "BondToken: recipient not approved investor");
        require(totalSupply() + amount <= maxSupply, "BondToken: would exceed max supply");

        _mint(to, amount);
        emit TokensMinted(to, amount, msg.sender);
    }

    function burn(address from, uint256 amount)
        external
        onlyRole(BURNER_ROLE)
        nonReentrant
    {
        require(from != address(0), "BondToken: burn from zero address");
        require(amount > 0, "BondToken: amount must be > 0");
        require(balanceOf(from) >= amount, "BondToken: insufficient balance");

        _burn(from, amount);
        emit TokensBurned(from, amount, msg.sender);
    }

    // Transfer restrictions

    function transfer(address to, uint256 amount) public override returns (bool) {
        require(!transfersPaused, "BondToken: transfers paused");

        require(
            identity.isApproved(to) || trustedContracts[to],
            "BondToken: recipient not approved investor"
        );

        return super.transfer(to, amount);
    }

    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        require(!transfersPaused, "BondToken: transfers paused");

        require(
            identity.isApproved(to) || trustedContracts[to],
            "BondToken: recipient not approved investor"
        );

        return super.transferFrom(from, to, amount);
    }

    // Admin

    function setTrustedContract(address contractAddress, bool trusted)
        external
        onlyRole(TOKEN_ADMIN_ROLE)
    {
        require(contractAddress != address(0), "BondToken: zero contract address");

        trustedContracts[contractAddress] = trusted;

        emit TrustedContractUpdated(contractAddress, trusted);
    }

    function pauseTransfers() external onlyRole(TOKEN_ADMIN_ROLE) {
        transfersPaused = true;
        emit TransfersPaused(msg.sender);
    }

    function unpauseTransfers() external onlyRole(TOKEN_ADMIN_ROLE) {
        transfersPaused = false;
        emit TransfersUnpaused(msg.sender);
    }
}
