// Sample bond data matching smart contract values
// Face value: ₹1,00,00,000 | 10,000 tokens | ₹1,000 per token | 8% coupon | 3-year maturity

export const SAMPLE_BOND = {
  bondId:        'BOND001',
  name:          'Government Infrastructure Bond',
  issuer:        'Propx Infrastructure Finance',
  description:   '3-year government infrastructure bond for highway and port development across India. Backed by sovereign guarantee and infrastructure revenue streams.',
  faceValueINR:  10_000_000,   // ₹1 crore
  couponRate:    8,            // 8% annual
  maturityYears: 3,
  totalTokens:   10_000,
  tokenPriceINR: 1_000,       // ₹1,000 per token
  minInvestment: 1,           // 1 token minimum
  riskLevel:     'Moderate',
  rating:        'AA',
  currency:      'INR',
};

// Example investor scenario
export const EXAMPLE_INVESTOR = {
  tokens:       100,
  investmentINR: 100_000,     // 100 × ₹1,000
  annualCoupon:  8_000,       // 8% of ₹1,00,000
  totalOver3Yrs: 24_000,      // ₹8,000 × 3
  redeemAmount:  100_000,     // at maturity
};

// Network config
export const SUPPORTED_NETWORKS: Record<number, { name: string; explorer: string }> = {
  31337:    { name: 'Hardhat Localhost', explorer: '' },
  11155111: { name: 'Sepolia Testnet',  explorer: 'https://sepolia.etherscan.io' },
};

export const TARGET_CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || '31337');

// Contract addresses from env (populated after deployment)
export const CONTRACT_ADDRESSES = {
  MockPaymentToken: import.meta.env.VITE_MOCK_PAYMENT_TOKEN || '',
  InvestorIdentity: import.meta.env.VITE_INVESTOR_IDENTITY  || '',
  BondAssetRegistry:import.meta.env.VITE_BOND_ASSET_REGISTRY|| '',
  ReserveVerifier:  import.meta.env.VITE_RESERVE_VERIFIER   || '',
  BondToken:        import.meta.env.VITE_BOND_TOKEN         || '',
  BondMarketplace:  import.meta.env.VITE_BOND_MARKETPLACE   || '',
  CouponManager:    import.meta.env.VITE_COUPON_MANAGER     || '',
};

export function formatINR(wei: bigint, decimals = 18): string {
  const ether = Number(wei) / 10 ** decimals;
  return new Intl.NumberFormat('en-IN', {
    style:    'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(ether);
}

export function formatAddress(addr: string): string {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function formatDate(ts: bigint): string {
  return new Date(Number(ts) * 1000).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function explorerTxLink(hash: string, chainId: number): string {
  const net = SUPPORTED_NETWORKS[chainId];
  if (!net?.explorer) return '';
  return `${net.explorer}/tx/${hash}`;
}

