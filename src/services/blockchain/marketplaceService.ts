import { JsonRpcSigner, BrowserProvider } from 'ethers';
import { Listing, Trade } from '../../types';
import { getBondMarketplaceContract, getPaymentTokenContract, getBondTokenContract } from './contracts';
import { CONTRACT_ADDRESSES } from '../../data/constants';

function rawToListing(r: any): Listing {
  return {
    listingId:         BigInt(r.listingId),
    seller:            r.seller,
    bondTokenAddress:  r.bondTokenAddress,
    bondId:            r.bondId,
    quantity:          BigInt(r.quantity),
    remainingQuantity: BigInt(r.remainingQuantity),
    pricePerToken:     BigInt(r.pricePerToken),
    createdAt:         BigInt(r.createdAt),
    expiresAt:         BigInt(r.expiresAt),
    status:            Number(r.status),
  };
}

function rawToTrade(r: any): Trade {
  return {
    tradeId:       BigInt(r.tradeId),
    listingId:     BigInt(r.listingId),
    buyer:         r.buyer,
    seller:        r.seller,
    bondId:        r.bondId,
    quantity:      BigInt(r.quantity),
    pricePerToken: BigInt(r.pricePerToken),
    totalCost:     BigInt(r.totalCost),
    timestamp:     BigInt(r.timestamp),
  };
}

export async function getActiveListings(
  signerOrProvider: JsonRpcSigner | BrowserProvider
): Promise<Listing[]> {
  const contract = getBondMarketplaceContract(signerOrProvider);
  const ids      = await contract.getActiveListings();
  const listings = await Promise.all(
    ids.map((id: bigint) => contract.getListing(id))
  );
  return listings.map(rawToListing);
}

export async function getAllListings(
  signerOrProvider: JsonRpcSigner | BrowserProvider
): Promise<Listing[]> {
  const contract = getBondMarketplaceContract(signerOrProvider);
  const ids      = await contract.getAllListingIds();
  if (ids.length === 0) return [];
  const listings = await Promise.all(
    ids.map((id: bigint) => contract.getListing(id))
  );
  return listings.map(rawToListing);
}

export async function getSellerListings(
  signerOrProvider: JsonRpcSigner | BrowserProvider,
  seller: string
): Promise<Listing[]> {
  const contract = getBondMarketplaceContract(signerOrProvider);
  const ids      = await contract.getSellerListings(seller);
  if (ids.length === 0) return [];
  const listings = await Promise.all(
    ids.map((id: bigint) => contract.getListing(id))
  );
  return listings.map(rawToListing);
}

export async function getBuyerTrades(
  signerOrProvider: JsonRpcSigner | BrowserProvider,
  buyer: string
): Promise<Trade[]> {
  const contract = getBondMarketplaceContract(signerOrProvider);
  const ids      = await contract.getBuyerTrades(buyer);
  if (ids.length === 0) return [];
  const trades = await Promise.all(
    ids.map((id: bigint) => contract.getTrade(id))
  );
  return trades.map(rawToTrade);
}

export async function createListing(
  signer: JsonRpcSigner,
  bondTokenAddress: string,
  bondId: string,
  quantity: number,
  pricePerToken: bigint,
  durationSeconds: number
) {
  const marketAddr = CONTRACT_ADDRESSES.BondMarketplace;
  // Approve marketplace to spend bond tokens
  const tokenContract = getBondTokenContract(signer);
  const approveTx = await tokenContract.approve(marketAddr, quantity);
  await approveTx.wait();

  const contract = getBondMarketplaceContract(signer);
  const tx = await contract.createListing(bondTokenAddress, bondId, quantity, pricePerToken, durationSeconds);
  return tx.wait();
}

export async function purchaseTokens(
  signer: JsonRpcSigner,
  listingId: bigint,
  quantity: number,
  totalCost: bigint
) {
  const marketAddr = CONTRACT_ADDRESSES.BondMarketplace;
  // Approve marketplace to spend payment tokens
  const paymentContract = getPaymentTokenContract(signer);
  const approveTx = await paymentContract.approve(marketAddr, totalCost);
  await approveTx.wait();

  const contract = getBondMarketplaceContract(signer);
  const tx = await contract.purchaseTokens(listingId, quantity);
  return tx.wait();
}

export async function cancelListing(signer: JsonRpcSigner, listingId: bigint) {
  const contract = getBondMarketplaceContract(signer);
  const tx = await contract.cancelListing(listingId);
  return tx.wait();
}

