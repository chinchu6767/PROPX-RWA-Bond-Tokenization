// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./BondToken.sol";
import "./InvestorIdentity.sol";
import "./BondAssetRegistry.sol";

/**
 * @title CouponManager
 * @author Propx Protocol
 * @notice Handles coupon (interest) distributions and bond maturity redemption.
 *
 * @dev Coupon Distribution Flow:
 *      1. Admin/Issuer calls fundCouponPeriod() — provides mINR equal to
 *         (couponPerToken × totalTokenSupply) and specifies an optional claim deadline.
 *      2. Each approved token holder calls claimCoupon(periodId) to receive their share.
 *      3. Claim = balanceOf(investor) × couponPerToken.
 *      4. Duplicate claims for the same period are blocked.
 *
 * @dev Redemption Flow (at or after maturity):
 *      1. Issuer pre-funds the redemption pool via fundRedemptionPool().
 *      2. Each investor calls redeemBond(amount) — tokens are burned and
 *         face value (tokenPrice × amount) is paid in mINR.
 *      3. Early redemption is blocked.
 *
 * @dev Annual coupon example (illustrative):
 *      Face value = ₹1,00,00,000 | Total supply = 10,000 | Coupon rate = 8%
 *      Annual coupon pool = ₹80,00,000 (₹8,000 per 100-token holding)
 *      couponPerToken = ₹800 (in mINR wei = 800 * 10^18)
 */
contract CouponManager is AccessControl, ReentrancyGuard {
    bytes32 public constant COUPON_ADMIN_ROLE  = keccak256("COUPON_ADMIN_ROLE");
    bytes32 public constant ISSUER_ADMIN_ROLE  = keccak256("ISSUER_ADMIN_ROLE");

    struct CouponPeriod {
        uint256 periodId;
        string  bondId;
        uint256 couponPerToken;   // mINR per token (18 decimals)
        uint256 totalFunded;      // Total mINR deposited
        uint256 totalClaimed;     // Total mINR claimed so far
        uint256 snapshotTimestamp;
        uint256 claimDeadline;    // 0 = no deadline
        bool    isActive;
    }

    struct RedemptionRecord {
        address investor;
        string  bondId;
        uint256 tokensBurned;
        uint256 redemptionAmount;
        uint256 timestamp;
    }

    IERC20            public immutable paymentToken;
    BondToken         public immutable bondToken;
    InvestorIdentity  public immutable identity;
    BondAssetRegistry public immutable registry;
    string public bondId;

    uint256 private _nextPeriodId;

    mapping(uint256 => CouponPeriod)              private _periods;
    uint256[]                                     private _periodIds;
    mapping(address => mapping(uint256 => bool))  private _claimed;
    mapping(address => uint256)                   public totalCouponsReceived;

    RedemptionRecord[] private _redemptions;
    mapping(address => bool) public hasRedeemed;

    // ─── Events ──────────────────────────────────────────────────────────────
    event CouponPeriodFunded(uint256 indexed periodId, string bondId, uint256 couponPerToken, uint256 totalFunded, uint256 snapshotTimestamp);
    event CouponClaimed(uint256 indexed periodId, address indexed investor, uint256 amount, uint256 timestamp);
    event BondRedeemed(address indexed investor, string bondId, uint256 tokensBurned, uint256 redemptionAmount, uint256 timestamp);
    event RedemptionPoolFunded(address indexed by, uint256 amount, uint256 timestamp);

    // ─── Constructor ─────────────────────────────────────────────────────────
    constructor(
        string memory _bondId,
        address _paymentToken,
        address _bondToken,
        address _identity,
        address _registry,
        address _admin
    ) {
        require(bytes(_bondId).length > 0,  "CouponManager: empty bondId");
        require(_paymentToken != address(0),"CouponManager: payment token zero");
        require(_bondToken    != address(0),"CouponManager: bond token zero");
        require(_identity     != address(0),"CouponManager: identity zero");
        require(_registry     != address(0),"CouponManager: registry zero");
        require(_admin        != address(0),"CouponManager: admin zero");

        bondId       = _bondId;
        paymentToken = IERC20(_paymentToken);
        bondToken    = BondToken(_bondToken);
        identity     = InvestorIdentity(_identity);
        registry     = BondAssetRegistry(_registry);

        _grantRole(DEFAULT_ADMIN_ROLE,  _admin);
        _grantRole(COUPON_ADMIN_ROLE,   _admin);
        _grantRole(ISSUER_ADMIN_ROLE,   _admin);
    }

    // ─── Coupon Distribution ─────────────────────────────────────────────────

    /**
     * @notice Issuer/admin funds a coupon distribution period.
     *         Must first approve this contract to spend (couponPerToken × totalSupply) mINR.
     * @param couponPerToken Amount per token in mINR wei
     * @param claimDeadline  Unix deadline for claims (0 = no deadline)
     */
    function fundCouponPeriod(uint256 couponPerToken, uint256 claimDeadline)
        external
        onlyRole(ISSUER_ADMIN_ROLE)
        nonReentrant
    {
        require(couponPerToken > 0, "CouponManager: coupon must be > 0");
        uint256 supply = bondToken.totalSupply();
        require(supply > 0, "CouponManager: no tokens issued yet");
        uint256 totalFunded = couponPerToken * supply;

        require(
            paymentToken.transferFrom(msg.sender, address(this), totalFunded),
            "CouponManager: payment pull failed"
        );

        uint256 periodId = _nextPeriodId++;
        _periods[periodId] = CouponPeriod({
            periodId:          periodId,
            bondId:            bondId,
            couponPerToken:    couponPerToken,
            totalFunded:       totalFunded,
            totalClaimed:      0,
            snapshotTimestamp: block.timestamp,
            claimDeadline:     claimDeadline,
            isActive:          true
        });
        _periodIds.push(periodId);

        emit CouponPeriodFunded(periodId, bondId, couponPerToken, totalFunded, block.timestamp);
    }

    /**
     * @notice Investor claims their coupon for a period.
     * @param periodId The coupon period to claim
     */
    function claimCoupon(uint256 periodId) external nonReentrant {
        require(identity.isApproved(msg.sender),  "CouponManager: not approved investor");
        require(!_claimed[msg.sender][periodId],  "CouponManager: already claimed");

        CouponPeriod storage p = _periods[periodId];
        require(p.isActive,                       "CouponManager: period not active");
        require(
            p.claimDeadline == 0 || block.timestamp <= p.claimDeadline,
            "CouponManager: claim deadline passed"
        );

        uint256 balance = bondToken.balanceOf(msg.sender);
        require(balance > 0, "CouponManager: no tokens held");

        uint256 claimAmount = balance * p.couponPerToken;
        require(
            p.totalClaimed + claimAmount <= p.totalFunded,
            "CouponManager: coupon pool exhausted"
        );

        _claimed[msg.sender][periodId] = true;
        p.totalClaimed += claimAmount;
        totalCouponsReceived[msg.sender] += claimAmount;

        require(
            paymentToken.transfer(msg.sender, claimAmount),
            "CouponManager: coupon transfer failed"
        );

        emit CouponClaimed(periodId, msg.sender, claimAmount, block.timestamp);
    }

    // ─── Redemption ──────────────────────────────────────────────────────────

    /**
     * @notice Redeem bond tokens at or after maturity.
     *         Tokens are burned and face value (tokenPrice × amount) paid in mINR.
     * @param amount Number of tokens to redeem
     */
    function redeemBond(uint256 amount) external nonReentrant {
        require(identity.isApproved(msg.sender), "CouponManager: not approved investor");
        require(amount > 0,                       "CouponManager: amount must be > 0");
        require(!hasRedeemed[msg.sender],         "CouponManager: already redeemed");

        uint256 maturityDate = registry.getBondMaturityDate(bondId);
        require(block.timestamp >= maturityDate,  "CouponManager: bond not yet matured");
        require(bondToken.balanceOf(msg.sender) >= amount, "CouponManager: insufficient tokens");

        uint256 tokenPrice = registry.getBondTokenPrice(bondId);
        uint256 redemptionAmount = tokenPrice * amount;

        hasRedeemed[msg.sender] = true;

        // Burn tokens (CouponManager must have BURNER_ROLE on BondToken)
        bondToken.burn(msg.sender, amount);

        require(
            paymentToken.transfer(msg.sender, redemptionAmount),
            "CouponManager: redemption payment failed"
        );

        _redemptions.push(RedemptionRecord({
            investor:         msg.sender,
            bondId:           bondId,
            tokensBurned:     amount,
            redemptionAmount: redemptionAmount,
            timestamp:        block.timestamp
        }));

        emit BondRedeemed(msg.sender, bondId, amount, redemptionAmount, block.timestamp);
    }

    // ─── Admin ───────────────────────────────────────────────────────────────

    /**
     * @notice Issuer pre-funds the redemption pool before maturity.
     */
    function fundRedemptionPool(uint256 amount) external onlyRole(ISSUER_ADMIN_ROLE) nonReentrant {
        require(amount > 0, "CouponManager: amount must be > 0");
        require(
            paymentToken.transferFrom(msg.sender, address(this), amount),
            "CouponManager: transfer failed"
        );
        emit RedemptionPoolFunded(msg.sender, amount, block.timestamp);
    }

    function deactivatePeriod(uint256 periodId) external onlyRole(COUPON_ADMIN_ROLE) {
        _periods[periodId].isActive = false;
    }

    // ─── View Functions ──────────────────────────────────────────────────────

    function getCouponPeriod(uint256 periodId) external view returns (CouponPeriod memory) {
        return _periods[periodId];
    }

    function getAllPeriodIds() external view returns (uint256[] memory) { return _periodIds; }

    function hasClaimed(address investor, uint256 periodId) external view returns (bool) {
        return _claimed[investor][periodId];
    }

    function getClaimableAmount(address investor, uint256 periodId) external view returns (uint256) {
        if (_claimed[investor][periodId]) return 0;
        CouponPeriod storage p = _periods[periodId];
        if (!p.isActive) return 0;
        return bondToken.balanceOf(investor) * p.couponPerToken;
    }

    function totalPeriods() external view returns (uint256) { return _nextPeriodId; }

    function getRedemptions() external view returns (RedemptionRecord[] memory) { return _redemptions; }

    function getContractBalance() external view returns (uint256) {
        return paymentToken.balanceOf(address(this));
    }
}

