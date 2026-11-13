// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ReserveVerifier
 * @author Propx Protocol
 * @notice Verifies that a bond has sufficient reported reserves before tokens can be issued.
 *
 * @dev PROTOTYPE DISCLAIMER:
 *      This contract implements a MOCK reserve attestation mechanism.
 *      Reserve values are self-reported by an authorised oracle/admin role.
 *      This contract does NOT independently prove the existence of real-world assets.
 *
 *      In production, integrate a Chainlink Proof of Reserve oracle, a regulated
 *      custodian attestation service, or an equivalent trust-minimised mechanism.
 *
 *      Reserve Coverage Ratio:
 *         coverageRatioBps = (reportedReserve * 10_000) / issuanceValue
 *      A ratio >= 10_000 (100%) means reserves are considered sufficient.
 *
 *      Stale reports: Reports older than MAX_REPORT_AGE (7 days) are rejected.
 */
contract ReserveVerifier is AccessControl {
    bytes32 public constant RESERVE_ADMIN_ROLE = keccak256("RESERVE_ADMIN_ROLE");
    bytes32 public constant ORACLE_ROLE        = keccak256("ORACLE_ROLE");

    uint256 public constant MIN_COVERAGE_BPS = 10_000; // 100%
    uint256 public constant MAX_REPORT_AGE   = 7 days;

    struct ReserveReport {
        string  bondId;
        uint256 reportedReserve;    // Reported reserve in mINR (18 decimals)
        uint256 issuanceValue;      // Total token issuance value in mINR
        uint256 coverageRatioBps;   // reportedReserve * 10000 / issuanceValue
        bool    isSufficient;       // coverageRatioBps >= MIN_COVERAGE_BPS
        uint256 reportedAt;
        address reportedBy;
        bool    isVerified;         // Admin has explicitly verified
    }

    mapping(string => ReserveReport) private _reports;
    string[]                         private _reportedBondIds;

    // ─── Events ──────────────────────────────────────────────────────────────
    event ReserveReported(
        string indexed bondId,
        uint256 reportedReserve,
        uint256 issuanceValue,
        uint256 coverageRatioBps,
        bool isSufficient,
        address indexed reportedBy,
        uint256 timestamp
    );
    event ReserveVerified(string indexed bondId, address indexed verifiedBy, uint256 timestamp);

    // ─── Constructor ─────────────────────────────────────────────────────────
    constructor(address admin) {
        require(admin != address(0), "ReserveVerifier: admin is zero address");
        _grantRole(DEFAULT_ADMIN_ROLE,  admin);
        _grantRole(RESERVE_ADMIN_ROLE,  admin);
        _grantRole(ORACLE_ROLE,         admin);
    }

    // ─── Report Submission ───────────────────────────────────────────────────

    /**
     * @notice Submit or update a reserve report for a bond.
     * @param bondId          Bond identifier
     * @param reportedReserve Reported reserve value in mINR (18 decimals)
     * @param issuanceValue   Total value being tokenized in mINR (18 decimals)
     */
    function reportReserve(
        string calldata bondId,
        uint256 reportedReserve,
        uint256 issuanceValue
    ) external onlyRole(ORACLE_ROLE) {
        require(bytes(bondId).length > 0,  "ReserveVerifier: empty bondId");
        require(reportedReserve > 0,       "ReserveVerifier: reserve must be > 0");
        require(issuanceValue > 0,         "ReserveVerifier: issuance value must be > 0");

        uint256 coverage = (reportedReserve * 10_000) / issuanceValue;
        bool sufficient  = coverage >= MIN_COVERAGE_BPS;
        bool isNew       = bytes(_reports[bondId].bondId).length == 0;

        _reports[bondId] = ReserveReport({
            bondId:           bondId,
            reportedReserve:  reportedReserve,
            issuanceValue:    issuanceValue,
            coverageRatioBps: coverage,
            isSufficient:     sufficient,
            reportedAt:       block.timestamp,
            reportedBy:       msg.sender,
            isVerified:       false
        });

        if (isNew) _reportedBondIds.push(bondId);

        emit ReserveReported(bondId, reportedReserve, issuanceValue, coverage, sufficient, msg.sender, block.timestamp);
    }

    /**
     * @notice Admin explicitly verifies a reserve report (after off-chain review).
     */
    function verifyReserve(string calldata bondId) external onlyRole(RESERVE_ADMIN_ROLE) {
        ReserveReport storage r = _reports[bondId];
        require(bytes(r.bondId).length > 0,         "ReserveVerifier: no report for bond");
        require(r.isSufficient,                     "ReserveVerifier: coverage insufficient");
        require(!_isStale(r.reportedAt),            "ReserveVerifier: report is stale");
        r.isVerified = true;
        emit ReserveVerified(bondId, msg.sender, block.timestamp);
    }

    // ─── Eligibility Check ───────────────────────────────────────────────────

    /**
     * @notice Check whether minting is currently permitted for this bond.
     * @return eligible True if all checks pass
     * @return reason   Human-readable reason if not eligible
     */
    function isMintingEligible(string calldata bondId)
        external
        view
        returns (bool eligible, string memory reason)
    {
        ReserveReport storage r = _reports[bondId];
        if (bytes(r.bondId).length == 0)  return (false, "No reserve report submitted");
        if (!r.isSufficient)              return (false, "Reserve coverage below 100%");
        if (_isStale(r.reportedAt))       return (false, "Reserve report is stale (>7 days)");
        if (!r.isVerified)                return (false, "Reserve not yet verified by admin");
        return (true, "Reserve verified");
    }

    // ─── View Functions ──────────────────────────────────────────────────────

    function getReport(string calldata bondId) external view returns (ReserveReport memory) {
        return _reports[bondId];
    }

    function isReserveVerified(string calldata bondId) external view returns (bool) {
        ReserveReport storage r = _reports[bondId];
        return r.isVerified && r.isSufficient && !_isStale(r.reportedAt);
    }

    function getCoverageRatio(string calldata bondId) external view returns (uint256) {
        return _reports[bondId].coverageRatioBps;
    }

    function getAllReportedBondIds() external view returns (string[] memory) {
        return _reportedBondIds;
    }

    function _isStale(uint256 reportedAt) internal view returns (bool) {
        return block.timestamp > reportedAt + MAX_REPORT_AGE;
    }
}

