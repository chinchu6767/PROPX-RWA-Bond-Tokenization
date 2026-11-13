import { ethers, JsonRpcSigner, BrowserProvider } from 'ethers';
import { InvestorRecord, InvestorStatus } from '../../types';
import { getInvestorIdentityContract } from './contracts';

export async function getInvestorStatus(
  signerOrProvider: JsonRpcSigner | BrowserProvider,
  address: string
): Promise<InvestorStatus> {
  const contract = getInvestorIdentityContract(signerOrProvider);
  const status   = await contract.getInvestorStatus(address);
  return Number(status) as InvestorStatus;
}

export async function getInvestorRecord(
  signerOrProvider: JsonRpcSigner | BrowserProvider,
  address: string
): Promise<InvestorRecord> {
  const contract = getInvestorIdentityContract(signerOrProvider);
  const r        = await contract.getInvestorRecord(address);
  return {
    status:           Number(r.status),
    registeredAt:     BigInt(r.registeredAt),
    approvedAt:       BigInt(r.approvedAt),
    updatedAt:        BigInt(r.updatedAt),
    kycReferenceHash: r.kycReferenceHash,
    rejectionReason:  r.rejectionReason,
  };
}

export async function registerInvestor(signer: JsonRpcSigner) {
  const contract = getInvestorIdentityContract(signer);
  const tx       = await contract.registerInvestor();
  return tx.wait();
}

export async function approveInvestor(signer: JsonRpcSigner, investorAddress: string) {
  const contract = getInvestorIdentityContract(signer);
  const tx       = await contract.approveInvestor(investorAddress, ethers.ZeroHash);
  return tx.wait();
}

export async function rejectInvestor(signer: JsonRpcSigner, investorAddress: string, reason: string) {
  const contract = getInvestorIdentityContract(signer);
  const tx       = await contract.rejectInvestor(investorAddress, reason);
  return tx.wait();
}

export async function suspendInvestor(signer: JsonRpcSigner, investorAddress: string, reason: string) {
  const contract = getInvestorIdentityContract(signer);
  const tx       = await contract.suspendInvestor(investorAddress, reason);
  return tx.wait();
}

export async function getAllInvestors(
  signerOrProvider: JsonRpcSigner | BrowserProvider
): Promise<string[]> {
  const contract = getInvestorIdentityContract(signerOrProvider);
  const total    = await contract.totalInvestors();
  if (Number(total) === 0) return [];
  return contract.getInvestors(0, total);
}

