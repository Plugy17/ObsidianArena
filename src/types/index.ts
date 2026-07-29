// ============================================
// Obsidian Arena — TypeScript Type Definitions
// ============================================

// --- User & Auth ---
export interface User {
  id: string;
  telegramId: number;
  username: string;
  firstName: string;
  lastName?: string;
  avatarUrl?: string;
  walletAddress?: string;
  obsidianBalance: number;
  gramBalance?: number;
  level: number;
  experience: number;
  selectedCharacterId?: string;
  guildId?: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface WalletConnection {
  address: string;
  isConnected: boolean;
  chain: 'ton' | 'testton';
}

// --- Character ---
export type CharacterRole = 'tank' | 'damage' | 'support';
export type CharacterRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Character {
  id: string;
  name: string;
  role: CharacterRole;
  rarity: CharacterRarity;
  level: number;
  maxLevel: number;
  experience: number;
  attack: number;
  defense: number;
  speed: number;
  health: number;
  maxHealth: number;
  abilities: Ability[];
  equippedItems: Item[];
  imageUrl: string;
  description: string;
  isSelected: boolean;
}

export interface Ability {
  id: string;
  name: string;
  description: string;
  damage: number;
  cooldown: number;
  manaCost: number;
  icon: string;
  rarity: CharacterRarity;
}

// --- Items & Inventory ---
export type ItemType = 'weapon' | 'armor' | 'accessory' | 'consumable' | 'material';
export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: ItemRarity;
  description: string;
  stats: ItemStats;
  imageUrl: string;
  quantity: number;
  isEquipped: boolean;
  characterId?: string;
  craftingRecipe?: CraftingRecipe;
  sellPrice: number;
  isNFT?: boolean;
  tokenId?: string;
}

export interface ItemStats {
  attack?: number;
  defense?: number;
  speed?: number;
  health?: number;
  critChance?: number;
  critDamage?: number;
  mana?: number;
}

export interface CraftingRecipe {
  materials: { itemId: string; quantity: number }[];
  resultItemId: string;
  resultQuantity: number;
  craftingTime: number; // seconds
}

// --- Market / Economy ---
export interface MarketOrder {
  id: string;
  type: 'buy' | 'sell';
  token: 'obsidian' | 'gram';
  amount: number;
  price: number;
  pricePerUnit: number;
  creatorId: string;
  createdAt: string;
  expiresAt?: string;
  status: 'active' | 'completed' | 'cancelled';
}

export interface ExchangeRate {
  from: 'obsidian' | 'gram';
  to: 'obsidian' | 'gram';
  rate: number;
  timestamp: string;
}

// --- Guilds ---
export interface Guild {
  id: string;
  name: string;
  tag: string;
  description: string;
  level: number;
  memberCount: number;
  maxMembers: number;
  experience: number;
  joinFee: number; // in Obsidian
  leaderId: string;
  memberIds: string[];
  createdAt: string;
  isJoined: boolean;
}

export interface GuildMember {
  userId: string;
  username: string;
  firstName: string;
  role: 'leader' | 'officer' | 'member';
  joinedAt: string;
  contribution: number;
}

// --- Game State ---
export type GameState = 'idle' | 'loading' | 'in_match' | 'waiting';
export type TabType = 'arena' | 'inventory' | 'market' | 'guilds';

export interface GameConfig {
  matchmakingTimeout: number;
  maxInventorySlots: number;
  dailyLoginBonus: number;
  referralBonus: number;
  minGuildJoinFee: number;
  maxGuildJoinFee: number;
}

// --- API Response ---
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
