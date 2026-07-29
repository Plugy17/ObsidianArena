// ============================================
// Obsidian Arena — Web3 / TON Service (Stub)
// ============================================

import type { WalletConnection, ExchangeRate } from '../types';

// TODO: Replace with actual TON contract addresses
export const CONTRACTS = {
  OBSIDIAN_JETTON: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  OBSIDIAN_JETTON_WALLET: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  MARKET_CONTRACT: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
  GUILD_CONTRACT: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
} as const;

export class Web3Service {
  private static instance: Web3Service;
  private connection: WalletConnection | null = null;

  private constructor() {}

  public static getInstance(): Web3Service {
    if (!Web3Service.instance) {
      Web3Service.instance = new Web3Service();
    }
    return Web3Service.instance;
  }

  // --- Wallet Connection ---
  getConnection(): WalletConnection | null {
    return this.connection;
  }

  setConnection(connection: WalletConnection): void {
    this.connection = connection;
    console.log('[Web3] Wallet connected:', connection.address);
  }

  disconnect(): void {
    this.connection = null;
    console.log('[Web3] Wallet disconnected');
  }

  async getBalance(address: string): Promise<{ obsidian: number; gram: number }> {
    // TODO: Implement with TON API
    console.log('[Web3] getBalance called:', address);
    return { obsidian: 0, gram: 0 };
  }

  // --- Token Operations ---
  async buyObsidian(gramAmount: number): Promise<string | null> {
    if (!this.connection?.isConnected) {
      console.error('[Web3] Wallet not connected');
      return null;
    }
    // TODO: Implement TON transaction to exchange GRAM -> Obsidian
    console.log('[Web3] buyObsidian called:', gramAmount);
    return 'tx-' + Date.now();
  }

  async sellObsidian(obsidianAmount: number): Promise<string | null> {
    if (!this.connection?.isConnected) {
      console.error('[Web3] Wallet not connected');
      return null;
    }
    // TODO: Implement TON transaction to exchange Obsidian -> GRAM
    console.log('[Web3] sellObsidian called:', obsidianAmount);
    return 'tx-' + Date.now();
  }

  async transferObsidian(
    toAddress: string,
    amount: number
  ): Promise<string | null> {
    if (!this.connection?.isConnected) {
      console.error('[Web3] Wallet not connected');
      return null;
    }
    // TODO: Implement TON jetton transfer
    console.log('[Web3] transferObsidian called:', toAddress, amount);
    return 'tx-' + Date.now();
  }

  // --- Exchange Rate ---
  async getExchangeRate(): Promise<ExchangeRate> {
    // TODO: Fetch from TON API or DEX
    console.log('[Web3] getExchangeRate called');
    return {
      from: 'gram',
      to: 'obsidian',
      rate: 1.0,
      timestamp: new Date().toISOString(),
    };
  }

  // --- Transaction History ---
  async getTransactionHistory(address: string): Promise<any[]> {
    // TODO: Implement with TON API
    console.log('[Web3] getTransactionHistory called:', address);
    return [];
  }

  // --- NFT Operations ---
  async getNFTInventory(address: string): Promise<any[]> {
    // TODO: Implement with TON API
    console.log('[Web3] getNFTInventory called:', address);
    return [];
  }
}

export default Web3Service.getInstance();
