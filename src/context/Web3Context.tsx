
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode
} from 'react';

import { ethers, BrowserProvider, JsonRpcSigner } from 'ethers';
import { TARGET_CHAIN_ID } from '../data/constants';
import { WalletState } from '../types';

interface Web3ContextType {
  wallet: WalletState;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
  error: string | null;
}

const Web3Context = createContext<Web3ContextType | null>(null);

export function Web3Provider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnected: false,
    isCorrectNetwork: false
  });

  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateWallet = useCallback(async (eth: BrowserProvider) => {
    try {
      const sg = await eth.getSigner();
      const addr = await sg.getAddress();
      const network = await eth.getNetwork();
      const chainId = Number(network.chainId);

      setProvider(eth);
      setSigner(sg);

      setWallet({
        address: addr,
        chainId,
        isConnected: true,
        isCorrectNetwork: chainId === TARGET_CHAIN_ID
      });

      setError(null);
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) return;

    eth.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
      if (accounts.length > 0) {
        const p = new ethers.BrowserProvider(eth);
        updateWallet(p);
      }
    });

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        updateWallet(new ethers.BrowserProvider(eth));
      }
    };

    const handleChainChanged = () => {
      updateWallet(new ethers.BrowserProvider(eth));
    };

    eth.on('accountsChanged', handleAccountsChanged);
    eth.on('chainChanged', handleChainChanged);

    return () => {
      eth.removeListener?.('accountsChanged', handleAccountsChanged);
      eth.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [updateWallet]);

  const connect = async () => {
    setError(null);

    const eth = (window as any).ethereum;

    if (!eth) {
      setError('MetaMask not found. Please install MetaMask.');
      return;
    }

    try {
      await eth.request({ method: 'eth_requestAccounts' });
      const p = new ethers.BrowserProvider(eth);
      await updateWallet(p);
    } catch (e: any) {
      setError(e.message ?? 'Connection rejected');
    }
  };

  const disconnect = () => {
    setWallet({
      address: null,
      chainId: null,
      isConnected: false,
      isCorrectNetwork: false
    });

    setProvider(null);
    setSigner(null);
  };

  const switchNetwork = async () => {
    const eth = (window as any).ethereum;

    if (!eth) {
      setError('MetaMask not found.');
      return;
    }

    const hardhatChainId = '0x7a69';

    try {
      setError(null);

      try {
        await eth.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: hardhatChainId }]
        });
      } catch (e: any) {
        if (e.code !== 4902) throw e;

        await eth.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: hardhatChainId,
            chainName: 'Hardhat Local',
            rpcUrls: ['http://127.0.0.1:8545'],
            nativeCurrency: {
              name: 'Ether',
              symbol: 'ETH',
              decimals: 18
            }
          }]
        });

        await eth.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: hardhatChainId }]
        });
      }

      await updateWallet(new ethers.BrowserProvider(eth));

    } catch (e: any) {
      setError(e.message || 'Network switch failed.');
    }
  };

  return (
    <Web3Context.Provider
      value={{
        wallet,
        provider,
        signer,
        connect,
        disconnect,
        switchNetwork,
        error
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const ctx = useContext(Web3Context);

  if (!ctx) {
    throw new Error('useWeb3 must be used inside Web3Provider');
  }

  return ctx;
}
