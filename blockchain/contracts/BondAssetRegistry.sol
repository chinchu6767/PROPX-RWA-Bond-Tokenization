// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title BondAssetRegistry
 * @author Propx Protocol
 * @notice Registers and manages real-world bond information on-chain.
 *         Each bond must be approved by an admin before tokens can be issued.
 *
 * @dev PROTOTYPE NOTICE:
 *      Bond data is self-reported by issuers. The protocol does not independently
 *      verify the existence of the underlying real-world bond instrument.
 *      Reserve verification is handled separately by ReserveVerifier.sol.
 */
contract BondAssetRegistry is AccessControl {
    bytes32 public constant REGISTRY_ADMIN_ROLE = keccak256("REGISTRY_ADMIN_ROLE");
    bytes32 public constant ISSUER_ROLE         = keccak256("ISSUER_ROLE");

    enum BondStatus {
        None,       // 0: Does not exist
        Pending,    // 1: Registered, awaiting admin approval
        Approved,   // 2: Approved – tokens may be issued
        Rejected,   // 3: Rejected by admin
        Matured,    // 4: Bond has reached maturity
        Cancelled   // 5: Cancelled
    }

    struct Bond {
        string   bondId;
        string   name;
        string   description;
        address  issuer;
        uint256  faceValue;       // Total face value in mINR (18 decimals)
        uint256  couponRateBps;   // Annual coupon rate in basis points (800 = 8%)
        uint256  maturityDate;    // Unix timestamp of maturity
        uint256  tokenPrice;      // Price per token in mINR (18 decimals)
        uint256  totalSupply;     // Total tokens to issue
        uint256  availableSupply; // Tokens not yet minted
        uint256  issuedSupply;    // Tokens already minted
        BondStatus status;
        uint256  registeredAt;
        uint256  approvedAt;
        uint256  updatedAt;
        string   rejectionReason;
    }

    mapping(string => Bond)        private _bonds;
    string[]                       private _bondIds;
    mapping(address => string[])   private _issuerBonds;

    uint256 public totalBondsRegistered;
    uint256 public totalBondsApproved;

    // ─── Events ──────────────────────────────────────────────────────────────
    event BondRegistered(string indexed bondId, string name, address indexed issuer, uint256 faceValue, uint256 totalSupply, uint256 timestamp);
    event BondApproved(string indexed bondId, address indexed approvedBy, uint256 timestamp);
    event BondRejected(string indexed bondId, address indexed rejectedBy, string reason, uint256 timestamp);
    event BondMatured(string indexed bondId, uint256 timestamp);
    event BondCancelled(string indexed bondId, address indexed cancelledBy, uint256 timestamp);
    event BondSupplyUpdated(string indexed bondId, uint256 issuedSupply, uint256 availableSupply);

    // ─── Constructor ─────────────────────────────────────────────────────────
    constructor(address admin) {
        require(admin != address(0), "BondAssetRegistry: admin is zero address");
        _grantRole(DEFAULT_ADMIN_ROLE,  admin);
        _grantRole(REGISTRY_ADMIN_ROLE, admin);
        _grantRole(ISSUER_ROLE,         admin);
    }

    // ─── Bond Registration ───────────────────────────────────────────────────

    /**
     * @notice Register a new bond for review.
     * @param bondId        Unique bond identifier (e.g. "BOND001")
     * @param name          Bond name
     * @param description   Bond description
     * @param faceValue     Total face value in mINR wei (18 decimals)
     * @param couponRateBps Annual coupon rate in basis points (800 = 8%)
     * @param maturityDate  Unix timestamp of maturity (must be future)
     * @param tokenPrice    Price per token in mINR wei
     * @param totalSupply_  Total number of tokens to issue
     */
    function registerBond(
        string calldata bondId,
        string calldata name,
        string calldata description,
        uint256 faceValue,
        uint256 couponRateBps,
        uint256 maturityDate,
        uint256 tokenPrice,
        uint256 totalSupply_
    ) external onlyRole(ISSUER_ROLE) {
        require(bytes(bondId).length > 0,                           "BondAssetRegistry: empty bondId");
        require(bytes(name).length > 0,                             "BondAssetRegistry: empty name");
        require(_bonds[bondId].status == BondStatus.None,           "BondAssetRegistry: bondId already exists");
        require(faceValue > 0,                                      "BondAssetRegistry: faceValue must be > 0");
        require(couponRateBps <= 10_000,                            "BondAssetRegistry: coupon rate > 100%");
        require(maturityDate > block.timestamp,                     "BondAssetRegistry: maturity must be future");
        require(tokenPrice > 0,                                     "BondAssetRegistry: tokenPrice must be > 0");
        require(totalSupply_ > 0,                                   "BondAssetRegistry: totalSupply must be > 0");
        require(faceValue == tokenPrice * totalSupply_,             "BondAssetRegistry: faceValue != tokenPrice * totalSupply");

        _bonds[bondId] = Bond({
            bondId:          bondId,
            name:            name,
            description:     description,
            issuer:          msg.sender,
            faceValue:       faceValue,
            couponRateBps:   couponRateBps,
            maturityDate:    maturityDate,
            tokenPrice:      tokenPrice,
            totalSupply:     totalSupply_,
            availableSupply: totalSupply_,
            issuedSupply:    0,
            status:          BondStatus.Pending,
            registeredAt:    block.timestamp,
            approvedAt:      0,
            updatedAt:       block.timestamp,
            rejectionReason: ""
        });
        _bondIds.push(bondId);
        _issuerBonds[msg.sender].push(bondId);
        totalBondsRegistered++;

        emit BondRegistered(bondId, name, msg.sender, faceValue, totalSupply_, block.timestamp);
    }

    // ─── Admin Operations ────────────────────────────────────────────────────

    function approveBond(string calldata bondId) external onlyRole(REGISTRY_ADMIN_ROLE) {
        Bond storage b = _bonds[bondId];
        require(b.status == BondStatus.Pending, "BondAssetRegistry: bond not pending");
        b.status     = BondStatus.Approved;
        b.approvedAt = block.timestamp;
        b.updatedAt  = block.timestamp;
        totalBondsApproved++;
        emit BondApproved(bondId, msg.sender, block.timestamp);
    }

    function rejectBond(string calldata bondId, string calldata reason) external onlyRole(REGISTRY_ADMIN_ROLE) {
        Bond storage b = _bonds[bondId];
        require(b.status == BondStatus.Pending, "BondAssetRegistry: bond not pending");
        b.status          = BondStatus.Rejected;
        b.updatedAt       = block.timestamp;
        b.rejectionReason = reason;
        emit BondRejected(bondId, msg.sender, reason, block.timestamp);
    }

    function markMatured(string calldata bondId) external onlyRole(REGISTRY_ADMIN_ROLE) {
        Bond storage b = _bonds[bondId];
        require(b.status == BondStatus.Approved,          "BondAssetRegistry: bond not approved");
        require(block.timestamp >= b.maturityDate,         "BondAssetRegistry: bond not yet matured");
        b.status    = BondStatus.Matured;
        b.updatedAt = block.timestamp;
        emit BondMatured(bondId, block.timestamp);
    }

    function updateSupply(string calldata bondId, uint256 newIssuedSupply) external onlyRole(REGISTRY_ADMIN_ROLE) {
        Bond storage b = _bonds[bondId];
        require(b.status == BondStatus.Approved,                "BondAssetRegistry: bond not approved");
        require(newIssuedSupply <= b.totalSupply,               "BondAssetRegistry: exceeds total supply");
        b.issuedSupply    = newIssuedSupply;
        b.availableSupply = b.totalSupply - newIssuedSupply;
        emit BondSupplyUpdated(bondId, newIssuedSupply, b.availableSupply);
    }

    // ─── View Functions ──────────────────────────────────────────────────────

    function getBond(string calldata bondId) external view returns (Bond memory) {
        require(_bonds[bondId].status != BondStatus.None, "BondAssetRegistry: bond not found");
        return _bonds[bondId];
    }

    function getBondStatus(string calldata bondId) external view returns (BondStatus) {
        return _bonds[bondId].status;
    }

    function isBondApproved(string calldata bondId) external view returns (bool) {
        return _bonds[bondId].status == BondStatus.Approved;
    }

    function getBondIssuer(string calldata bondId) external view returns (address) {
        return _bonds[bondId].issuer;
    }

    function getBondMaturityDate(string calldata bondId) external view returns (uint256) {
        return _bonds[bondId].maturityDate;
    }

    function getBondTokenPrice(string calldata bondId) external view returns (uint256) {
        return _bonds[bondId].tokenPrice;
    }

    function getAllBondIds() external view returns (string[] memory) {
        return _bondIds;
    }

    function getBondsPaginated(uint256 offset, uint256 limit) external view returns (Bond[] memory) {
        uint256 total = _bondIds.length;
        if (offset >= total) return new Bond[](0);
        uint256 end = offset + limit > total ? total : offset + limit;
        Bond[] memory result = new Bond[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = _bonds[_bondIds[i]];
        }
        return result;
    }

    function getIssuerBonds(address issuer) external view returns (string[] memory) {
        return _issuerBonds[issuer];
    }

    function totalBonds() external view returns (uint256) {
        return _bondIds.length;
    }
}

