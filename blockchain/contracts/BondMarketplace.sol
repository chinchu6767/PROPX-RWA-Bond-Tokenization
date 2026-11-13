// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./BondToken.sol";
import "./InvestorIdentity.sol";
import "./BondAssetRegistry.sol";

/**
 * @title BondMarketplace
 * @author Propx Protocol
 * @notice Secondary marketplace for buying and selling bond tokens between approved investors.
 *
 * @dev Flow:
 *      1. Seller approves marketplace to spend their BondTokens.
 *      2. Seller calls createListing() — tokens are escrowed in this contract.
 *      3. Buyer approves marketplace to spend their mINR payment tokens.
 *      4. Buyer calls purchaseTokens() — payment flows to seller (minus platform fee),
 *         bond tokens flow to buyer.
 *      5. Seller may cancel an active listing to retrieve escrowed tokens.
 *
 * @dev PROTOTYPE NOTICE:
 *      Payment is in MockPaymentToken (mINR). Not real INR or any regulated currency.
 *      A 0.5% platform fee is charged on each trade (configurable by admin, max 5%).
 */
contract BondMarketplace is AccessControl, ReentrancyGuard {
    bytes32 public constant MARKETPLACE_ADMIN_ROLE = keccak256("MARKETPLACE_ADMIN_ROLE");

    enum ListingStatus { Active, Filled, Cancelled, Expired }

    struct Listing {
        uint256       listingId;
        address       seller;
        address       bondTokenAddress;
        string        bondId;
        uint256       quantity;
        uint256       remainingQuantity;
        uint256       pricePerToken;    // mINR wei per token
        uint256       createdAt;
        uint256       expiresAt;
        ListingStatus status;
    }

    struct Trade {
        uint256 tradeId;
        uint256 listingId;
        address buyer;
        address seller;
        string  bondId;
        uint256 quantity;
        uint256 pricePerToken;
        uint256 totalCost;
        uint256 timestamp;
    }

    IERC20            public immutable paymentToken;
    InvestorIdentity  public immutable identity;
    BondAssetRegistry public immutable registry;

    uint256 private _nextListingId;
    uint256 private _nextTradeId;

    uint256 public platformFeeBps; // default 50 = 0.5%
    address public feeRecipient;

    mapping(uint256 => Listing) private _listings;
    mapping(uint256 => Trade)   private _trades;
    uint256[]                   private _activeListingIds;
    uint256[]                   private _allListingIds;
    mapping(address => uint256[]) private _sellerListings;
    mapping(address => uint256[]) private _buyerTrades;

    // ─── Events ──────────────────────────────────────────────────────────────
    event ListingCreated(uint256 indexed listingId, address indexed seller, string bondId, uint256 quantity, uint256 pricePerToken, uint256 expiresAt);
    event TokensPurchased(uint256 indexed tradeId, uint256 indexed listingId, address indexed buyer, address seller, string bondId, uint256 quantity, uint256 totalCost);
    event ListingCancelled(uint256 indexed listingId, address indexed by);
    event PlatformFeeUpdated(uint256 newFeeBps);

    // ─── Constructor ─────────────────────────────────────────────────────────
    constructor(
        address _paymentToken,
        address _identity,
        address _registry,
        address _admin
    ) {
        require(_paymentToken != address(0), "BondMarketplace: payment token is zero");
        require(_identity     != address(0), "BondMarketplace: identity is zero");
        require(_registry     != address(0), "BondMarketplace: registry is zero");
        require(_admin        != address(0), "BondMarketplace: admin is zero");

        paymentToken   = IERC20(_paymentToken);
        identity       = InvestorIdentity(_identity);
        registry       = BondAssetRegistry(_registry);
        platformFeeBps = 50;   // 0.5%
        feeRecipient   = _admin;

        _grantRole(DEFAULT_ADMIN_ROLE,       _admin);
        _grantRole(MARKETPLACE_ADMIN_ROLE,   _admin);
    }

    // ─── Listing ─────────────────────────────────────────────────────────────

    /**
     * @notice Create a sell listing. Tokens are escrowed in this contract.
     * @param bondTokenAddress  Address of BondToken contract
     * @param bondId            Bond identifier
     * @param quantity          Number of tokens to sell
     * @param pricePerToken     Price per token in mINR wei
     * @param duration          Duration in seconds (max 90 days)
     */
    function createListing(
        address bondTokenAddress,
        string calldata bondId,
        uint256 quantity,
        uint256 pricePerToken,
        uint256 duration
    ) external nonReentrant returns (uint256) {
        require(identity.isApproved(msg.sender),    "BondMarketplace: seller not approved");
        require(bondTokenAddress != address(0),     "BondMarketplace: token address zero");
        require(quantity > 0,                       "BondMarketplace: quantity must be > 0");
        require(pricePerToken > 0,                  "BondMarketplace: price must be > 0");
        require(duration > 0 && duration <= 90 days,"BondMarketplace: invalid duration");

        // Bond must be active
        require(
            registry.getBondStatus(bondId) == BondAssetRegistry.BondStatus.Approved,
            "BondMarketplace: bond not active"
        );

        BondToken bt = BondToken(bondTokenAddress);
        require(bt.balanceOf(msg.sender) >= quantity, "BondMarketplace: insufficient token balance");

        // Escrow tokens
        require(
            bt.transferFrom(msg.sender, address(this), quantity),
            "BondMarketplace: token escrow failed"
        );

        uint256 listingId = _nextListingId++;
        uint256 expiresAt = block.timestamp + duration;

        _listings[listingId] = Listing({
            listingId:         listingId,
            seller:            msg.sender,
            bondTokenAddress:  bondTokenAddress,
            bondId:            bondId,
            quantity:          quantity,
            remainingQuantity: quantity,
            pricePerToken:     pricePerToken,
            createdAt:         block.timestamp,
            expiresAt:         expiresAt,
            status:            ListingStatus.Active
        });

        _allListingIds.push(listingId);
        _activeListingIds.push(listingId);
        _sellerListings[msg.sender].push(listingId);

        emit ListingCreated(listingId, msg.sender, bondId, quantity, pricePerToken, expiresAt);
        return listingId;
    }

    // ─── Purchasing ──────────────────────────────────────────────────────────

    /**
     * @notice Purchase tokens from an active listing.
     * @param listingId Listing to buy from
     * @param quantity  Number of tokens to buy
     */
    function purchaseTokens(uint256 listingId, uint256 quantity) external nonReentrant {
        require(identity.isApproved(msg.sender), "BondMarketplace: buyer not approved");

        Listing storage l = _listings[listingId];
        require(l.status == ListingStatus.Active,            "BondMarketplace: listing not active");
        require(block.timestamp <= l.expiresAt,              "BondMarketplace: listing expired");
        require(quantity > 0 && quantity <= l.remainingQuantity, "BondMarketplace: invalid quantity");
        require(msg.sender != l.seller,                      "BondMarketplace: cannot buy own listing");

        uint256 totalCost      = l.pricePerToken * quantity;
        uint256 platformFee    = (totalCost * platformFeeBps) / 10_000;
        uint256 sellerProceeds = totalCost - platformFee;

        // Pull payment from buyer
        require(
            paymentToken.transferFrom(msg.sender, address(this), totalCost),
            "BondMarketplace: payment transfer failed"
        );

        // Pay seller
        require(paymentToken.transfer(l.seller, sellerProceeds), "BondMarketplace: seller payment failed");

        // Pay platform fee
        if (platformFee > 0) {
            require(paymentToken.transfer(feeRecipient, platformFee), "BondMarketplace: fee transfer failed");
        }

        // Deliver bond tokens to buyer
        BondToken bt = BondToken(l.bondTokenAddress);
        require(bt.transfer(msg.sender, quantity), "BondMarketplace: token delivery failed");

        // Update listing
        l.remainingQuantity -= quantity;
        if (l.remainingQuantity == 0) {
            l.status = ListingStatus.Filled;
            _removeActiveListing(listingId);
        }

        // Record trade
        uint256 tradeId = _nextTradeId++;
        _trades[tradeId] = Trade({
            tradeId:      tradeId,
            listingId:    listingId,
            buyer:        msg.sender,
            seller:       l.seller,
            bondId:       l.bondId,
            quantity:     quantity,
            pricePerToken:l.pricePerToken,
            totalCost:    totalCost,
            timestamp:    block.timestamp
        });
        _buyerTrades[msg.sender].push(tradeId);

        emit TokensPurchased(tradeId, listingId, msg.sender, l.seller, l.bondId, quantity, totalCost);
    }

    // ─── Cancellation ────────────────────────────────────────────────────────

    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage l = _listings[listingId];
        require(l.status == ListingStatus.Active, "BondMarketplace: not active");
        require(
            msg.sender == l.seller || hasRole(MARKETPLACE_ADMIN_ROLE, msg.sender),
            "BondMarketplace: not authorised"
        );
        l.status = ListingStatus.Cancelled;
        _removeActiveListing(listingId);

        // Return escrowed tokens to seller
        BondToken bt = BondToken(l.bondTokenAddress);
        require(bt.transfer(l.seller, l.remainingQuantity), "BondMarketplace: return failed");

        emit ListingCancelled(listingId, msg.sender);
    }

    // ─── Admin ───────────────────────────────────────────────────────────────

    function setPlatformFee(uint256 feeBps) external onlyRole(MARKETPLACE_ADMIN_ROLE) {
        require(feeBps <= 500, "BondMarketplace: fee too high (max 5%)");
        platformFeeBps = feeBps;
        emit PlatformFeeUpdated(feeBps);
    }

    function setFeeRecipient(address recipient) external onlyRole(MARKETPLACE_ADMIN_ROLE) {
        require(recipient != address(0), "BondMarketplace: zero address");
        feeRecipient = recipient;
    }

    // ─── View Functions ──────────────────────────────────────────────────────

    function getListing(uint256 listingId) external view returns (Listing memory) { return _listings[listingId]; }
    function getTrade(uint256 tradeId) external view returns (Trade memory)       { return _trades[tradeId]; }
    function getActiveListings() external view returns (uint256[] memory)         { return _activeListingIds; }
    function getAllListingIds() external view returns (uint256[] memory)           { return _allListingIds; }
    function getSellerListings(address seller) external view returns (uint256[] memory) { return _sellerListings[seller]; }
    function getBuyerTrades(address buyer) external view returns (uint256[] memory)     { return _buyerTrades[buyer]; }
    function totalListings() external view returns (uint256) { return _nextListingId; }
    function totalTrades() external view returns (uint256)   { return _nextTradeId; }

    // ─── Internal ────────────────────────────────────────────────────────────

    function _removeActiveListing(uint256 listingId) internal {
        uint256 len = _activeListingIds.length;
        for (uint256 i = 0; i < len; i++) {
            if (_activeListingIds[i] == listingId) {
                _activeListingIds[i] = _activeListingIds[len - 1];
                _activeListingIds.pop();
                break;
            }
        }
    }
}

