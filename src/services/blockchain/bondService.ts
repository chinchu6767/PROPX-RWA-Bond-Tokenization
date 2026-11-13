import { ethers, JsonRpcSigner, BrowserProvider } from 'ethers';
import { Bond, BondStatus, ReserveReport } from '../../types';
import { getBondRegistryContract, getReserveVerifierContract, getBondTokenContract, getPaymentTokenContract } from './contracts';
import { CONTRACT_ADDRESSES } from '../../data/constants';

function rawToBond(r: any): Bond {
  return {
    bondId:          r.bondId,
    name:            r.name,
    description:     r.description,
    issuer:          r.issuer,
    faceValue:       BigInt(r.faceValue),
    couponRateBps:   BigInt(r.couponRateBps),
    maturityDate:    BigInt(r.maturityDate),
    tokenPrice:      BigInt(r.tokenPrice),
    totalSupply:     BigInt(r.totalSupply),
    availableSupply: BigInt(r.availableSupply),
    issuedSupply:    BigInt(r.issuedSupply),
    status:          Number(r.status) as BondStatus,
    registeredAt:    BigInt(r.registeredAt),
    approvedAt:      BigInt(r.approvedAt),
    updatedAt:       BigInt(r.updatedAt),
    rejectionReason: r.rejectionReason,
  };
}

export async function getAllBonds(signerOrProvider: JsonRpcSigner | BrowserProvider): Promise<Bond[]> {
  const contract = getBondRegistryContract(signerOrProvider);
  const total    = await contract.totalBonds();
  if (Number(total) === 0) return [];
  const raws = await contract.getBondsPaginated(0, total);
  return raws.map(rawToBond);
}

export async function getBond(signerOrProvider: JsonRpcSigner | BrowserProvider, bondId: string): Promise<Bond> {
  const contract = getBondRegistryContract(signerOrProvider);
  return rawToBond(await contract.getBond(bondId));
}

export async function registerBond(
  signer: JsonRpcSigner,
  params: {
    bondId: string; name: string; description: string;
    faceValue: bigint; couponRateBps: number; maturityDate: number;
    tokenPrice: bigint; totalSupply: number;
  }
) {
  const contract = getBondRegistryContract(signer);
  const tx = await contract.registerBond(
    params.bondId, params.name, params.description,
    params.faceValue, params.couponRateBps, params.maturityDate,
    params.tokenPrice, params.totalSupply
  );
  return tx.wait();
}

export async function approveBond(signer: JsonRpcSigner, bondId: string) {
  const contract = getBondRegistryContract(signer);
  const tx = await contract.approveBond(bondId);
  return tx.wait();
}

export async function rejectBond(signer: JsonRpcSigner, bondId: string, reason: string) {
  const contract = getBondRegistryContract(signer);
  const tx = await contract.rejectBond(bondId, reason);
  return tx.wait();
}

export async function getReserveReport(
  signerOrProvider: JsonRpcSigner | BrowserProvider,
  bondId: string
): Promise<ReserveReport> {
  const contract = getReserveVerifierContract(signerOrProvider);
  const r = await contract.getReport(bondId);
  return {
    bondId:           r.bondId,
    reportedReserve:  BigInt(r.reportedReserve),
    issuanceValue:    BigInt(r.issuanceValue),
    coverageRatioBps: BigInt(r.coverageRatioBps),
    isSufficient:     r.isSufficient,
    reportedAt:       BigInt(r.reportedAt),
    reportedBy:       r.reportedBy,
    isVerified:       r.isVerified,
  };
}

export async function reportReserve(
  signer: JsonRpcSigner,
  bondId: string,
  reportedReserve: bigint,
  issuanceValue: bigint
) {
  const contract = getReserveVerifierContract(signer);
  const tx = await contract.reportReserve(bondId, reportedReserve, issuanceValue);
  return tx.wait();
}

export async function verifyReserve(signer: JsonRpcSigner, bondId: string) {
  const contract = getReserveVerifierContract(signer);
  const tx = await contract.verifyReserve(bondId);
  return tx.wait();
}

export async function mintTokens(signer: JsonRpcSigner, toAddress: string, amount: number) {
  const contract = getBondTokenContract(signer);
  const tx = await contract.mint(toAddress, amount);
  return tx.wait();
}

export async function getTokenBalance(
  signerOrProvider: JsonRpcSigner | BrowserProvider,
  address: string
): Promise<bigint> {
  const contract = getBondTokenContract(signerOrProvider);
  return BigInt(await contract.balanceOf(address));
}

export async function getPaymentBalance(
  signerOrProvider: JsonRpcSigner | BrowserProvider,
  address: string
): Promise<bigint> {
  const contract = getPaymentTokenContract(signerOrProvider);
  return BigInt(await contract.balanceOf(address));
}

export async function requestFaucet(signer: JsonRpcSigner, amount: bigint) {
  const contract = getPaymentTokenContract(signer);
  const tx = await contract.faucet(amount);
  return tx.wait();
}

export async function approvePaymentSpend(
  signer: JsonRpcSigner,
  spender: string,
  amount: bigint
) {
  const contract = getPaymentTokenContract(signer);
  const tx = await contract.approve(spender, amount);
  return tx.wait();
}

export async function approveBondTokenSpend(
  signer: JsonRpcSigner,
  spender: string,
  amount: bigint
) {
  const contract = getBondTokenContract(signer);
  const tx = await contract.approve(spender, amount);
  return tx.wait();
}

