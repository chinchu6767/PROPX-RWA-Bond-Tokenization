import { JsonRpcSigner, BrowserProvider } from 'ethers';
import { CouponPeriod } from '../../types';
import { getCouponManagerContract, getPaymentTokenContract } from './contracts';
import { CONTRACT_ADDRESSES } from '../../data/constants';

function rawToPeriod(r: any): CouponPeriod {
  return {
    periodId:          BigInt(r.periodId),
    bondId:            r.bondId,
    couponPerToken:    BigInt(r.couponPerToken),
    totalFunded:       BigInt(r.totalFunded),
    totalClaimed:      BigInt(r.totalClaimed),
    snapshotTimestamp: BigInt(r.snapshotTimestamp),
    claimDeadline:     BigInt(r.claimDeadline),
    isActive:          r.isActive,
  };
}

export async function getAllCouponPeriods(
  signerOrProvider: JsonRpcSigner | BrowserProvider
): Promise<CouponPeriod[]> {
  const contract = getCouponManagerContract(signerOrProvider);
  const ids      = await contract.getAllPeriodIds();
  if (ids.length === 0) return [];
  const periods = await Promise.all(
    ids.map((id: bigint) => contract.getCouponPeriod(id))
  );
  return periods.map(rawToPeriod);
}

export async function getClaimableAmount(
  signerOrProvider: JsonRpcSigner | BrowserProvider,
  investor: string,
  periodId: bigint
): Promise<bigint> {
  const contract = getCouponManagerContract(signerOrProvider);
  return BigInt(await contract.getClaimableAmount(investor, periodId));
}

export async function hasClaimed(
  signerOrProvider: JsonRpcSigner | BrowserProvider,
  investor: string,
  periodId: bigint
): Promise<boolean> {
  const contract = getCouponManagerContract(signerOrProvider);
  return contract.hasClaimed(investor, periodId);
}

export async function hasRedeemed(
  signerOrProvider: JsonRpcSigner | BrowserProvider,
  investor: string
): Promise<boolean> {
  const contract = getCouponManagerContract(signerOrProvider);
  return contract.hasRedeemed(investor);
}

export async function claimCoupon(signer: JsonRpcSigner, periodId: bigint) {
  const contract = getCouponManagerContract(signer);
  const tx = await contract.claimCoupon(periodId);
  return tx.wait();
}

export async function redeemBond(signer: JsonRpcSigner, amount: number) {
  const contract = getCouponManagerContract(signer);
  const tx = await contract.redeemBond(amount);
  return tx.wait();
}

export async function fundCouponPeriod(
  signer: JsonRpcSigner,
  couponPerToken: bigint,
  totalTokens: number,
  claimDeadline: number = 0
) {
  const couponManagerAddr = CONTRACT_ADDRESSES.CouponManager;
  const totalFunded       = couponPerToken * BigInt(totalTokens);

  // Approve coupon manager to spend payment tokens
  const paymentContract = getPaymentTokenContract(signer);
  const approveTx = await paymentContract.approve(couponManagerAddr, totalFunded);
  await approveTx.wait();

  const contract = getCouponManagerContract(signer);
  const tx = await contract.fundCouponPeriod(couponPerToken, claimDeadline);
  return tx.wait();
}

export async function fundRedemptionPool(signer: JsonRpcSigner, amount: bigint) {
  const couponManagerAddr = CONTRACT_ADDRESSES.CouponManager;
  const paymentContract = getPaymentTokenContract(signer);
  const approveTx = await paymentContract.approve(couponManagerAddr, amount);
  await approveTx.wait();

  const contract = getCouponManagerContract(signer);
  const tx = await contract.fundRedemptionPool(amount);
  return tx.wait();
}

export async function getTotalCouponsReceived(
  signerOrProvider: JsonRpcSigner | BrowserProvider,
  investor: string
): Promise<bigint> {
  const contract = getCouponManagerContract(signerOrProvider);
  return BigInt(await contract.totalCouponsReceived(investor));
}

export async function getCouponManagerBalance(
  signerOrProvider: JsonRpcSigner | BrowserProvider
): Promise<bigint> {
  const contract = getCouponManagerContract(signerOrProvider);
  return BigInt(await contract.getContractBalance());
}

