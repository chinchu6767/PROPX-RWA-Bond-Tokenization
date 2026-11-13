
import { ethers, Contract, JsonRpcSigner, BrowserProvider } from 'ethers';
import { CONTRACT_ADDRESSES } from '../../data/constants';

// ─── Minimal ABIs ────────────────────────────────────────────────────────────

export const INVESTOR_IDENTITY_ABI = [
  'function registerInvestor() external',
  'function approveInvestor(address investor, bytes32 kycReferenceHash) external',
  'function rejectInvestor(address investor, string calldata reason) external',
  'function suspendInvestor(address investor, string calldata reason) external',
  'function reinstateInvestor(address investor) external',
  'function isApproved(address investor) external view returns (bool)',
  'function getInvestorStatus(address investor) external view returns (uint8)',
  'function getInvestorRecord(address investor) external view returns (tuple(uint8 status, uint256 registeredAt, uint256 approvedAt, uint256 updatedAt, bytes32 kycReferenceHash, string rejectionReason))',
  'function getInvestors(uint256 offset, uint256 limit) external view returns (address[])',
  'function totalInvestors() external view returns (uint256)',
  'event InvestorRegistered(address indexed investor, uint256 timestamp)',
  'event InvestorApproved(address indexed investor, address indexed approvedBy, uint256 timestamp)',
  'event InvestorRejected(address indexed investor, address indexed rejectedBy, string reason, uint256 timestamp)',
];

export const BOND_REGISTRY_ABI = [
  'function registerBond(string bondId, string name, string description, uint256 faceValue, uint256 couponRateBps, uint256 maturityDate, uint256 tokenPrice, uint256 totalSupply) external',
  'function approveBond(string bondId) external',
  'function rejectBond(string bondId, string reason) external',
  'function markMatured(string bondId) external',
  'function getBond(string bondId) external view returns (tuple(string bondId, string name, string description, address issuer, uint256 faceValue, uint256 couponRateBps, uint256 maturityDate, uint256 tokenPrice, uint256 totalSupply, uint256 availableSupply, uint256 issuedSupply, uint8 status, uint256 registeredAt, uint256 approvedAt, uint256 updatedAt, string rejectionReason))',
  'function getBondStatus(string bondId) external view returns (uint8)',
  'function isBondApproved(string bondId) external view returns (bool)',
  'function getAllBondIds() external view returns (string[])',
  'function getBondsPaginated(uint256 offset, uint256 limit) external view returns (tuple(string bondId, string name, string description, address issuer, uint256 faceValue, uint256 couponRateBps, uint256 maturityDate, uint256 tokenPrice, uint256 totalSupply, uint256 availableSupply, uint256 issuedSupply, uint8 status, uint256 registeredAt, uint256 approvedAt, uint256 updatedAt, string rejectionReason)[])',
  'function getIssuerBonds(address issuer) external view returns (string[])',
  'function totalBonds() external view returns (uint256)',
  'event BondRegistered(string indexed bondId, string name, address indexed issuer, uint256 faceValue, uint256 totalSupply, uint256 timestamp)',
  'event BondApproved(string indexed bondId, address indexed approvedBy, uint256 timestamp)',
];

export const RESERVE_VERIFIER_ABI = [
  'function reportReserve(string bondId, uint256 reportedReserve, uint256 issuanceValue) external',
  'function verifyReserve(string bondId) external',
  'function getReport(string bondId) external view returns (tuple(string bondId, uint256 reportedReserve, uint256 issuanceValue, uint256 coverageRatioBps, bool isSufficient, uint256 reportedAt, address reportedBy, bool isVerified))',
  'function isReserveVerified(string bondId) external view returns (bool)',
  'function isMintingEligible(string bondId) external view returns (bool eligible, string reason)',
  'function getCoverageRatio(string bondId) external view returns (uint256)',
  'event ReserveReported(string indexed bondId, uint256 reportedReserve, uint256 issuanceValue, uint256 coverageRatioBps, bool isSufficient, address indexed reportedBy, uint256 timestamp)',
  'event ReserveVerified(string indexed bondId, address indexed verifiedBy, uint256 timestamp)',
];

export const BOND_TOKEN_ABI = [
  'function mint(address to, uint256 amount) external',
  'function burn(address from, uint256 amount) external',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function transferFrom(address from, address to, uint256 amount) external returns (bool)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function totalSupply() external view returns (uint256)',
  'function maxSupply() external view returns (uint256)',
  'function bondId() external view returns (string)',
  'function decimals() external view returns (uint8)',
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function pauseTransfers() external',
  'function unpauseTransfers() external',
  'function transfersPaused() external view returns (bool)',
];

export const BOND_MARKETPLACE_ABI = [
  'function createListing(address bondTokenAddress, string bondId, uint256 quantity, uint256 pricePerToken, uint256 duration) external returns (uint256)',
  'function purchaseTokens(uint256 listingId, uint256 quantity) external',
  'function cancelListing(uint256 listingId) external',
  'function getListing(uint256 listingId) external view returns (tuple(uint256 listingId, address seller, address bondTokenAddress, string bondId, uint256 quantity, uint256 remainingQuantity, uint256 pricePerToken, uint256 createdAt, uint256 expiresAt, uint8 status))',
  'function getTrade(uint256 tradeId) external view returns (tuple(uint256 tradeId, uint256 listingId, address buyer, address seller, string bondId, uint256 quantity, uint256 pricePerToken, uint256 totalCost, uint256 timestamp))',
  'function getActiveListings() external view returns (uint256[])',
  'function getAllListingIds() external view returns (uint256[])',
  'function getSellerListings(address seller) external view returns (uint256[])',
  'function getBuyerTrades(address buyer) external view returns (uint256[])',
  'function totalListings() external view returns (uint256)',
  'function totalTrades() external view returns (uint256)',
  'function platformFeeBps() external view returns (uint256)',
  'event ListingCreated(uint256 indexed listingId, address indexed seller, string bondId, uint256 quantity, uint256 pricePerToken, uint256 expiresAt)',
  'event TokensPurchased(uint256 indexed tradeId, uint256 indexed listingId, address indexed buyer, address seller, string bondId, uint256 quantity, uint256 totalCost)',
];

export const COUPON_MANAGER_ABI = [
  'function fundCouponPeriod(uint256 couponPerToken, uint256 claimDeadline) external',
  'function claimCoupon(uint256 periodId) external',
  'function redeemBond(uint256 amount) external',
  'function fundRedemptionPool(uint256 amount) external',
  'function getCouponPeriod(uint256 periodId) external view returns (tuple(uint256 periodId, string bondId, uint256 couponPerToken, uint256 totalFunded, uint256 totalClaimed, uint256 snapshotTimestamp, uint256 claimDeadline, bool isActive))',
  'function getAllPeriodIds() external view returns (uint256[])',
  'function hasClaimed(address investor, uint256 periodId) external view returns (bool)',
  'function getClaimableAmount(address investor, uint256 periodId) external view returns (uint256)',
  'function totalCouponsReceived(address investor) external view returns (uint256)',
  'function hasRedeemed(address investor) external view returns (bool)',
  'function getContractBalance() external view returns (uint256)',
  'function totalPeriods() external view returns (uint256)',
  'event CouponPeriodFunded(uint256 indexed periodId, string bondId, uint256 couponPerToken, uint256 totalFunded, uint256 snapshotTimestamp)',
  'event CouponClaimed(uint256 indexed periodId, address indexed investor, uint256 amount, uint256 timestamp)',
  'event BondRedeemed(address indexed investor, string bondId, uint256 tokensBurned, uint256 redemptionAmount, uint256 timestamp)',
];

export const MOCK_PAYMENT_TOKEN_ABI = [
  'function faucet(uint256 amount) external',
  'function mint(address to, uint256 amount) external',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function transfer(address to, uint256 amount) external returns (bool)',
  'function totalSupply() external view returns (uint256)',
  'function name() external view returns (string)',
  'function symbol() external view returns (string)',
  'function decimals() external view returns (uint8)',
];

// ─── Contract factory helpers ────────────────────────────────────────────────

export function getContract(
  address: string,
  abi: string[],
  signerOrProvider: JsonRpcSigner | BrowserProvider | ethers.Provider
): Contract {
  return new ethers.Contract(address, abi, signerOrProvider);
}

export function getInvestorIdentityContract(
  signerOrProvider: JsonRpcSigner | BrowserProvider
) {
  return getContract(CONTRACT_ADDRESSES.InvestorIdentity, INVESTOR_IDENTITY_ABI, signerOrProvider);
}

export function getBondRegistryContract(
  signerOrProvider: JsonRpcSigner | BrowserProvider
) {
  return getContract(CONTRACT_ADDRESSES.BondAssetRegistry, BOND_REGISTRY_ABI, signerOrProvider);
}

export function getReserveVerifierContract(
  signerOrProvider: JsonRpcSigner | BrowserProvider
) {
  return getContract(CONTRACT_ADDRESSES.ReserveVerifier, RESERVE_VERIFIER_ABI, signerOrProvider);
}

export function getBondTokenContract(
  signerOrProvider: JsonRpcSigner | BrowserProvider
) {
  return getContract(CONTRACT_ADDRESSES.BondToken, BOND_TOKEN_ABI, signerOrProvider);
}

export function getBondMarketplaceContract(
  signerOrProvider: JsonRpcSigner | BrowserProvider
) {
  return getContract(CONTRACT_ADDRESSES.BondMarketplace, BOND_MARKETPLACE_ABI, signerOrProvider);
}

export function getCouponManagerContract(
  signerOrProvider: JsonRpcSigner | BrowserProvider
) {
  return getContract(CONTRACT_ADDRESSES.CouponManager, COUPON_MANAGER_ABI, signerOrProvider);
}

export function getPaymentTokenContract(
  signerOrProvider: JsonRpcSigner | BrowserProvider
) {
  return getContract(CONTRACT_ADDRESSES.MockPaymentToken, MOCK_PAYMENT_TOKEN_ABI, signerOrProvider);
}

export function contractsDeployed(): boolean {
  return Object.values(CONTRACT_ADDRESSES).every(
    (addr) => addr && addr.length === 42
  );
}
