import React from 'react';
import { BondStatus, BondStatusLabel } from '../types';

const colorMap: Record<BondStatus, string> = {
  [BondStatus.None]:      'bg-gray-700 text-gray-300',
  [BondStatus.Pending]:   'bg-amber-900/50 text-amber-300 border border-amber-700',
  [BondStatus.Approved]:  'bg-green-900/50 text-green-300 border border-green-700',
  [BondStatus.Rejected]:  'bg-red-900/50  text-red-300  border border-red-700',
  [BondStatus.Matured]:   'bg-blue-900/50 text-blue-300 border border-blue-700',
  [BondStatus.Cancelled]: 'bg-gray-800    text-gray-400',
};

export function BondStatusBadge({ status }: { status: BondStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[status]}`}>
      {BondStatusLabel[status]}
    </span>
  );
}

import { InvestorStatus, InvestorStatusLabel } from '../types';

const investorColorMap: Record<InvestorStatus, string> = {
  [InvestorStatus.None]:      'bg-gray-700 text-gray-300',
  [InvestorStatus.Pending]:   'bg-amber-900/50 text-amber-300 border border-amber-700',
  [InvestorStatus.Approved]:  'bg-green-900/50 text-green-300 border border-green-700',
  [InvestorStatus.Rejected]:  'bg-red-900/50  text-red-300  border border-red-700',
  [InvestorStatus.Suspended]: 'bg-orange-900/50 text-orange-300 border border-orange-700',
};

export function InvestorStatusBadge({ status }: { status: InvestorStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${investorColorMap[status]}`}>
      {InvestorStatusLabel[status]}
    </span>
  );
}

