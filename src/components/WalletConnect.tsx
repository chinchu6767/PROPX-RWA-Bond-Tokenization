import React from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Wallet, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { formatAddress, SUPPORTED_NETWORKS, TARGET_CHAIN_ID } from '../data/constants';

export default function WalletConnect() {
  const { wallet, connect, disconnect, switchNetwork, error } = useWeb3();

  if (!wallet.isConnected) {
    return (
      <div className="flex items-center gap-3">
        {error && (
          <span className="text-red-400 text-sm flex items-center gap-1">
            <AlertCircle size={14} /> {error}
          </span>
        )}
        <button
          onClick={connect}
          className="flex items-center gap-2 bg-propx-600 hover:bg-propx-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Wallet size={18} />
          Connect MetaMask
        </button>
      </div>
    );
  }

  const networkName = wallet.chainId ? (SUPPORTED_NETWORKS[wallet.chainId]?.name ?? `Chain ${wallet.chainId}`) : 'Unknown';

  return (
    <div className="flex items-center gap-3">
      {!wallet.isCorrectNetwork ? (
        <button
          onClick={switchNetwork}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
        >
          <AlertCircle size={14} />
          Switch to {SUPPORTED_NETWORKS[TARGET_CHAIN_ID]?.name}
        </button>
      ) : (
        <span className="flex items-center gap-1 text-green-400 text-sm">
          <CheckCircle size={14} />
          {networkName}
        </span>
      )}

      <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-gray-200 text-sm font-mono">
          {formatAddress(wallet.address!)}
        </span>
        <button
          onClick={disconnect}
          className="text-gray-500 hover:text-red-400 text-xs ml-1"
          title="Disconnect"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

