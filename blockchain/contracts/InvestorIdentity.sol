// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title InvestorIdentity
 * @author Propx Protocol
 * @notice Manages permissioned investor eligibility for the Propx platform.
 *
 * @dev PRIVACY NOTICE:
 *      This contract does NOT store any personally identifiable information (PII)
 *      such as Aadhaar numbers, PAN details, passport numbers, or identity documents.
 *      Only wallet addresses and eligibility status are stored on-chain.
 *      Actual KYC verification is performed off-chain by a regulated KYC provider.
 *      An optional cryptographic reference hash may link the off-chain attestation
 *      to this on-chain record — this hash does not reveal any personal data.
 *
 * @dev PROTOTYPE NOTICE:
 *      KYC in this prototype is simulated. An admin approves investors manually.
 *      In production, integrate a compliant KYC oracle or attestation service.
 */
contract InvestorIdentity is AccessControl {
    bytes32 public constant KYC_ADMIN_ROLE   = keccak256("KYC_ADMIN_ROLE");
    bytes32 public constant KYC_ORACLE_ROLE  = keccak256("KYC_ORACLE_ROLE");

    /// @notice Investor verification status
    enum InvestorStatus {
        None,       // 0: Not registered
        Pending,    // 1: Registered, awaiting verification
        Approved,   // 2: KYC approved, eligible to invest
        Rejected,   // 3: KYC rejected
        Suspended   // 4: Previously approved, now suspended
    }

    /// @notice On-chain investor record (no PII stored)
    struct InvestorRecord {
        InvestorStatus status;
        uint256 registeredAt;
        uint256 approvedAt;
        uint256 updatedAt;
        bytes32 kycReferenceHash; // Off-chain KYC reference (not PII, just a pointer)
        string  rejectionReason;  // Human-readable, no PII
    }

    mapping(address => InvestorRecord) private _investors;
    address[] private _investorList;

    uint256 public totalRegistered;
    uint256 public totalApproved;
    uint256 public totalRejected;
    uint256 public totalSuspended;

    // ─── Events ──────────────────────────────────────────────────────────────
    event InvestorRegistered(address indexed investor, uint256 timestamp);
    event InvestorApproved(address indexed investor, address indexed approvedBy, uint256 timestamp);
    event InvestorRejected(address indexed investor, address indexed rejectedBy, string reason, uint256 timestamp);
    event InvestorSuspended(address indexed investor, address indexed suspendedBy, string reason, uint256 timestamp);
    event InvestorReinstated(address indexed investor, address indexed reinstatedBy, uint256 timestamp);
    event KycReferenceUpdated(address indexed investor, bytes32 referenceHash);

    // ─── Constructor ─────────────────────────────────────────────────────────
    constructor(address admin) {
        require(admin != address(0), "InvestorIdentity: admin is zero address");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(KYC_ADMIN_ROLE,     admin);
        _grantRole(KYC_ORACLE_ROLE,    admin);
    }

    // ─── Investor Self-Registration ──────────────────────────────────────────

    /**
     * @notice Register your wallet address for KYC review. No PII is submitted on-chain.
     */
    function registerInvestor() external {
        require(
            _investors[msg.sender].status == InvestorStatus.None,
            "InvestorIdentity: already registered"
        );
        _investors[msg.sender] = InvestorRecord({
            status:           InvestorStatus.Pending,
            registeredAt:     block.timestamp,
            approvedAt:       0,
            updatedAt:        block.timestamp,
            kycReferenceHash: bytes32(0),
            rejectionReason:  ""
        });
        _investorList.push(msg.sender);
        totalRegistered++;
        emit InvestorRegistered(msg.sender, block.timestamp);
    }

    // ─── Admin Operations ────────────────────────────────────────────────────

    /**
     * @notice Approve an investor after off-chain KYC passes.
     * @param investor         Wallet to approve
     * @param kycReferenceHash Optional hash of off-chain KYC record (no PII)
     */
    function approveInvestor(address investor, bytes32 kycReferenceHash)
        external
        onlyRole(KYC_ADMIN_ROLE)
    {
        require(investor != address(0), "InvestorIdentity: zero address");
        InvestorRecord storage r = _investors[investor];
        require(
            r.status == InvestorStatus.Pending || r.status == InvestorStatus.Rejected,
            "InvestorIdentity: not in pending/rejected state"
        );
        r.status           = InvestorStatus.Approved;
        r.approvedAt       = block.timestamp;
        r.updatedAt        = block.timestamp;
        r.kycReferenceHash = kycReferenceHash;
        r.rejectionReason  = "";
        totalApproved++;
        emit InvestorApproved(investor, msg.sender, block.timestamp);
        if (kycReferenceHash != bytes32(0)) {
            emit KycReferenceUpdated(investor, kycReferenceHash);
        }
    }

    /**
     * @notice Reject an investor's KYC application.
     * @param investor Wallet to reject
     * @param reason   Rejection reason (no PII)
     */
    function rejectInvestor(address investor, string calldata reason)
        external
        onlyRole(KYC_ADMIN_ROLE)
    {
        require(investor != address(0), "InvestorIdentity: zero address");
        InvestorRecord storage r = _investors[investor];
        require(r.status == InvestorStatus.Pending, "InvestorIdentity: not pending");
        r.status          = InvestorStatus.Rejected;
        r.updatedAt       = block.timestamp;
        r.rejectionReason = reason;
        totalRejected++;
        emit InvestorRejected(investor, msg.sender, reason, block.timestamp);
    }

    /**
     * @notice Suspend a previously approved investor.
     */
    function suspendInvestor(address investor, string calldata reason)
        external
        onlyRole(KYC_ADMIN_ROLE)
    {
        require(investor != address(0), "InvestorIdentity: zero address");
        InvestorRecord storage r = _investors[investor];
        require(r.status == InvestorStatus.Approved, "InvestorIdentity: not approved");
        r.status          = InvestorStatus.Suspended;
        r.updatedAt       = block.timestamp;
        r.rejectionReason = reason;
        totalSuspended++;
        if (totalApproved > 0) totalApproved--;
        emit InvestorSuspended(investor, msg.sender, reason, block.timestamp);
    }

    /**
     * @notice Reinstate a suspended investor.
     */
    function reinstateInvestor(address investor) external onlyRole(KYC_ADMIN_ROLE) {
        require(investor != address(0), "InvestorIdentity: zero address");
        InvestorRecord storage r = _investors[investor];
        require(r.status == InvestorStatus.Suspended, "InvestorIdentity: not suspended");
        r.status    = InvestorStatus.Approved;
        r.updatedAt = block.timestamp;
        totalApproved++;
        if (totalSuspended > 0) totalSuspended--;
        emit InvestorReinstated(investor, msg.sender, block.timestamp);
    }

    // ─── View Functions ──────────────────────────────────────────────────────

    function isApproved(address investor) external view returns (bool) {
        return _investors[investor].status == InvestorStatus.Approved;
    }

    function getInvestorRecord(address investor) external view returns (InvestorRecord memory) {
        return _investors[investor];
    }

    function getInvestorStatus(address investor) external view returns (InvestorStatus) {
        return _investors[investor].status;
    }

    function getInvestors(uint256 offset, uint256 limit) external view returns (address[] memory) {
        uint256 total = _investorList.length;
        if (offset >= total) return new address[](0);
        uint256 end = offset + limit > total ? total : offset + limit;
        address[] memory result = new address[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = _investorList[i];
        }
        return result;
    }

    function totalInvestors() external view returns (uint256) {
        return _investorList.length;
    }
}

