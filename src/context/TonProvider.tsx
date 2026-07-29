// ============================================
// Obsidian Arena — TON Connect Provider
// ============================================

import { createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import {
  TonConnectUIProvider,
  useTonConnectUI,
  useTonWallet,
} from '@tonconnect/ui-react';
import type { WalletConnection } from '../types';
import Web3Service from '../services/web3';
import { useGameStore } from '../store/gameStore';

// --- TON Context ---
interface TonContextType {
  wallet: ReturnType<typeof useTonWallet>;
  tonConnectUI: ReturnType<typeof useTonConnectUI>[0];
  isConnected: boolean;
  address: string | null;
  connection: WalletConnection | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const TonContext = createContext<TonContextType | undefined>(undefined);

// --- Hook for consuming TON context ---
export const useTon = (): TonContextType => {
  const context = useContext(TonContext);
  if (!context) {
    throw new Error('useTon must be used within a TonProvider');
  }
  return context;
};

// --- Inner provider component that uses TON hooks ---
const TonInnerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();

  const isConnected = !!wallet;
  const address = wallet?.account?.address ?? null;

  const connection: WalletConnection | null = isConnected
    ? {
        address: address!,
        isConnected: true,
        chain: wallet.account.chain as 'ton' | 'testton',
      }
    : null;

  // Sync with Web3Service
  useEffect(() => {
    if (connection) {
      Web3Service.setConnection(connection);
    } else {
      Web3Service.disconnect();
    }
  }, [connection]);

  // Sync wallet address with Zustand game store
  useEffect(() => {
    if (address) {
      useGameStore.getState().setTonWallet(address);
      useGameStore.getState().setIsWalletConnected(true);
    } else {
      useGameStore.getState().setTonWallet('');
      useGameStore.getState().setIsWalletConnected(false);
    }
  }, [address]);

  const connect = async (): Promise<void> => {
    if (!isConnected) {
      await tonConnectUI.connectWallet();
    }
  };

  const disconnect = (): void => {
    tonConnectUI.disconnect();
    Web3Service.disconnect();
  };

  return (
    <TonContext.Provider
      value={{
        wallet,
        tonConnectUI,
        isConnected,
        address,
        connection,
        connect,
        disconnect,
      }}
    >
      {children}
    </TonContext.Provider>
  );
};

// --- TON Provider wrapper (wraps with TonConnectUIProvider) ---
interface TonProviderProps {
  children: ReactNode;
  manifestUrl?: string;
}

export const TonProvider: React.FC<TonProviderProps> = ({
  children,
  manifestUrl = '/tonconnect-manifest.json',
}) => {
  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <TonInnerProvider>{children}</TonInnerProvider>
    </TonConnectUIProvider>
  );
};
