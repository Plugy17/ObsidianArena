// ============================================
// Obsidian Arena — TON Connect Hook
// ============================================

import { useTonConnectUI, type SendTransactionRequest } from '@tonconnect/ui-react';

export interface TransactionData {
  to: string;
  value: number; // nanoTON
  payload?: string;
}

export const useTonConnect = () => {
  const [tonConnectUI] = useTonConnectUI();

  const connected = !!tonConnectUI?.account;
  const address = tonConnectUI?.account?.address;

  const connect = async () => {
    try {
      await tonConnectUI?.openModal();
    } catch (e) {
      console.error('TON connect error:', e);
    }
  };

  const disconnect = async () => {
    try {
      await tonConnectUI?.disconnect();
    } catch (e) {
      console.error('TON disconnect error:', e);
    }
  };

  const sendTransaction = async (data: TransactionData): Promise<string | null> => {
    if (!connected) {
      console.error('Wallet not connected');
      return null;
    }
    try {
      const tx: SendTransactionRequest = {
        validUntil: Math.floor(Date.now() / 1000) + 300, // 5 min
        messages: [
          {
            address: data.to,
            amount: String(data.value),
            payload: data.payload,
          },
        ],
      };
      const result = await tonConnectUI?.sendTransaction(tx);
      return result?.boc || null;
    } catch (e) {
      console.error('Transaction error:', e);
      return null;
    }
  };

  return {
    connected,
    address,
    connect,
    disconnect,
    sendTransaction,
  };
};
