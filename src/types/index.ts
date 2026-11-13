// ─── Bond Types ──────────────────────────────────────────────────────────────

export enum BondStatus {
  None      = 0,
  Pending   = 1,
  Approved  = 2,
  Rejected  = 3,
  Matured   = 4,
  Cancelled = 5,
}

export const BondStatusLabel: Record<BondStatus, string> = {
  [BondStatus.None]:      'None',
  [BondStatus.Pending]:   'Pending',
  [BondStatus.Approved]:  'Approved',
  [BondStatus.Rejected]:  'Rejected',
  [BondStatus.Matured]:   'Matured',
  [BondStatus.Cancelled]: 'Cancelled',
};

export interface Bond {
  bondId:          string;
  name:            string;
  description:     string;
  issuer:          string;
  faceValue:       bigint;
  couponRateBps:   bigint;
  maturityDate:    bigint;
  tokenPrice:      bigint;
  totalSupply:     bigint;
  availableSupply: bigint;
  issuedSupply:    bigint;
  status:          BondStatus;
  registeredAt:    bigint;
  approvedAt:      bigint;
  updatedAt:       bigint;
  rejectionReason: string;
}

// ─── Investor Types ──────────────────────────────────────────────────────────

export enum InvestorStatus {
  None      = 0,
  Pending   = 1,
  Approved  = 2,
  Rejected  = 3,
  Suspended = 4,
}

export const InvestorStatusLabel: Record<InvestorStatus, string> = {
  [InvestorStatus.None]:      'Not Registered',
  [InvestorStatus.Pending]:   'Pending Review',
  [InvestorStatus.Approved]:  'KYC Approved',
  [InvestorStatus.Rejected]:  'Rejected',
  [InvestorStatus.Suspended]: 'Suspended',
};

export interface InvestorRecord {
  status:           InvestorStatus;
  registeredAt:     bigint;
  approvedAt:       bigint;
  updatedAt:        bigint;
  kycReferenceHash: string;
  rejectionReason:  string;
}

// ─── Reserve Types ───────────────────────────────────────────────────────────

export interface ReserveReport {
  bondId:           string;
  reportedReserve:  bigint;
  issuanceValue:    bigint;
  coverageRatioBps: bigint;
  isSufficient:     boolean;
  reportedAt:       bigint;
  reportedBy:       string;
  isVerified:       boolean;
}

// ─── Marketplace Types ───────────────────────────────────────────────────────

export enum ListingStatus {
  Active    = 0,
  Filled    = 1,
  Cancelled = 2,
  Expired   = 3,
}

export interface Listing {
  listingId:         bigint;
  seller:            string;
  bondTokenAddress:  string;
  bondId:            string;
  quantity:          bigint;
  remainingQuantity: bigint;
  pricePerToken:     bigint;
  createdAt:         bigint;
  expiresAt:         bigint;
  status:            ListingStatus;
}

export interface Trade {
  tradeId:       bigint;
  listingId:     bigint;
  buyer:         string;
  seller:        string;
  bondId:        string;
  quantity:      bigint;
  pricePerToken: bigint;
  totalCost:     bigint;
  timestamp:     bigint;
}

// ─── Coupon Types ────────────────────────────────────────────────────────────

export interface CouponPeriod {
  periodId:          bigint;
  bondId:            string;
  couponPerToken:    bigint;
  totalFunded:       bigint;
  totalClaimed:      bigint;
  snapshotTimestamp: bigint;
  claimDeadline:     bigint;
  isActive:          boolean;
}

// ─── Wallet / Web3 ──────────────────────────────────────────────────────────

export interface WalletState {
  address:    string | null;
  chainId:    number | null;
  isConnected: boolean;
  isCorrectNetwork: boolean;
}

export interface TxReceipt {
  hash:        string;
  blockNumber: number;
  status:      number;
}

// ─── UI helpers ──────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id:      string;
  type:    ToastType;
  message: string;
}

