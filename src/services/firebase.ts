// ============================================
// Obsidian Arena — Firebase Service (Stub)
// ============================================

import type { User, Guild, Item, Character } from '../types';

// TODO: Replace with actual Firebase configuration

// In production, initialize Firebase app:
// import { initializeApp } from 'firebase/app';
// import { getFirestore } from 'firebase/firestore';
// import { getAuth } from 'firebase/auth';
// const app = initializeApp(FIREBASE_CONFIG);
// export const db = getFirestore(app);
// export const auth = getAuth(app);

export class FirebaseService {
  private static instance: FirebaseService;

  private constructor() {}

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  // --- User Services ---
  async getUser(telegramId: number): Promise<User | null> {
    // TODO: Implement with Firestore
    // const doc = await getDoc(doc(db, 'users', String(telegramId)));
    // return doc.exists() ? doc.data() as User : null;
    console.log('[Firebase] getUser called with telegramId:', telegramId);
    return null;
  }

  async createUser(userData: Partial<User>): Promise<User> {
    // TODO: Implement with Firestore
    console.log('[Firebase] createUser called with:', userData);
    return {
      id: `user-${Date.now()}`,
      telegramId: userData.telegramId || 0,
      username: userData.username || 'player',
      firstName: userData.firstName || 'Player',
      lastName: userData.lastName,
      avatarUrl: userData.avatarUrl,
      walletAddress: userData.walletAddress,
      obsidianBalance: userData.obsidianBalance || 0,
      level: 1,
      experience: 0,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    } as User;
  }

  async updateUser(telegramId: number, data: Partial<User>): Promise<void> {
    // TODO: Implement with Firestore
    console.log('[Firebase] updateUser called:', telegramId, data);
  }

  async updateUserBalance(
    telegramId: number,
    amount: number,
    currency: 'obsidian' | 'gram'
  ): Promise<void> {
    // TODO: Implement with Firestore transaction
    console.log('[Firebase] updateUserBalance:', telegramId, amount, currency);
  }

  // --- Guild Services ---
  async getGuilds(): Promise<Guild[]> {
    // TODO: Implement with Firestore
    console.log('[Firebase] getGuilds called');
    return [];
  }

  async getGuild(guildId: string): Promise<Guild | null> {
    // TODO: Implement with Firestore
    console.log('[Firebase] getGuild called:', guildId);
    return null;
  }

  async joinGuild(telegramId: number, guildId: string): Promise<boolean> {
    // TODO: Implement with Firestore transaction
    console.log('[Firebase] joinGuild called:', telegramId, guildId);
    return true;
  }

  async createGuild(
    leaderId: number,
    guildData: Partial<Guild>
  ): Promise<Guild> {
    // TODO: Implement with Firestore
    console.log('[Firebase] createGuild called:', leaderId, guildData);
    return {
      id: `guild-${Date.now()}`,
      name: guildData.name || 'Новая Гильдия',
      tag: guildData.tag || 'NEW',
      description: guildData.description || '',
      level: 1,
      memberCount: 1,
      maxMembers: 50,
      experience: 0,
      joinFee: guildData.joinFee || 0,
      leaderId: String(leaderId),
      memberIds: [String(leaderId)],
      createdAt: new Date().toISOString(),
      isJoined: true,
    } as Guild;
  }

  // --- Inventory Services ---
  async getUserItems(telegramId: number): Promise<Item[]> {
    // TODO: Implement with Firestore
    console.log('[Firebase] getUserItems called:', telegramId);
    return [];
  }

  async getUserCharacters(telegramId: number): Promise<Character[]> {
    // TODO: Implement with Firestore
    console.log('[Firebase] getUserCharacters called:', telegramId);
    return [];
  }

  // --- Market Services ---
  async getMarketOrders(): Promise<any[]> {
    // TODO: Implement with Firestore
    console.log('[Firebase] getMarketOrders called');
    return [];
  }

  async createMarketOrder(
    telegramId: number,
    orderData: any
  ): Promise<any> {
    // TODO: Implement with Firestore
    console.log('[Firebase] createMarketOrder called:', telegramId, orderData);
    return null;
  }
}

export default FirebaseService.getInstance();
