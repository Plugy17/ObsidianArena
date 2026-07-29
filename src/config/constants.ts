// ============================================
// Obsidian Arena — Game Constants & Config
// ============================================

import type { GameConfig } from '../types';

// --- TON Connect Configuration ---
export const TON_CONNECT_MANIFEST = {
  url: 'https://obsidianarena.com/',
  name: 'Obsidian Arena',
  description: 'Фэнтезийная MOBA-арена с блокчейн-экономикой на базе TON',
  logo: 'https://obsidianarena.com/logo.png',
  bridge: 'https://tonapi.io/bridge',
  about: {
    name: 'Obsidian Arena',
    description:
      'Играй в фэнтезийную арену, развивай персонажей, торгуй Obsidian и сражайся в гильдейских битвах.',
    picture: 'https://obsidianarena.com/logo.png',
  },
  terms: {
    use: 'https://obsidianarena.com/terms',
    privacy: 'https://obsidianarena.com/privacy',
  },
  devices: {
    desktop: {
      bridge: 'https://tonapi.io/bridge',
      about: {
        name: 'Obsidian Arena',
        description:
          'Играй в фэнтезийную арену, развивай персонажей, торгуй Obsidian и сражайся в гильдейских битвах.',
        picture: 'https://obsidianarena.com/logo.png',
      },
      terms: {
        use: 'https://obsidianarena.com/terms',
        privacy: 'https://obsidianarena.com/privacy',
      },
    },
    mobile: {
      bridge: 'https://tonapi.io/bridge',
      about: {
        name: 'Obsidian Arena',
        description:
          'Играй в фэнтезийную арену, развивай персонажей, торгуй Obsidian и сражайся в гильдейских битвах.',
        picture: 'https://obsidianarena.com/logo.png',
      },
      terms: {
        use: 'https://obsidianarena.com/terms',
        privacy: 'https://obsidianarena.com/privacy',
      },
    },
  },
};

// --- Game Configuration ---
export const GAME_CONFIG: GameConfig = {
  matchmakingTimeout: 30,
  maxInventorySlots: 50,
  dailyLoginBonus: 50,
  referralBonus: 100,
  minGuildJoinFee: 100,
  maxGuildJoinFee: 10000,
};

// --- Token Constants ---
export const TOKENS = {
  OBSIDIAN: {
    name: 'Obsidian',
    symbol: 'OBS',
    decimals: 9,
    icon: '💎',
  },
  GRAM: {
    name: 'GRAM',
    symbol: 'GRAM',
    decimals: 9,
    icon: '💰',
  },
} as const;

// --- Rarity Colors & Labels ---
export const RARITY_CONFIG = {
  common: {
    label: 'Обычный',
    color: '#9ca3af',
    bgColor: 'rgba(156, 163, 175, 0.15)',
    borderColor: 'rgba(156, 163, 175, 0.3)',
    gradient: 'from-gray-400 to-gray-500',
  },
  rare: {
    label: 'Редкий',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    gradient: 'from-blue-400 to-blue-500',
  },
  epic: {
    label: 'Эпический',
    color: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.15)',
    borderColor: 'rgba(168, 85, 247, 0.3)',
    gradient: 'from-purple-400 to-purple-500',
  },
  legendary: {
    label: 'Легендарный',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    gradient: 'from-amber-400 to-amber-500',
  },
  mythic: {
    label: 'Мифический',
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.15)',
    borderColor: 'rgba(236, 72, 153, 0.3)',
    gradient: 'from-pink-400 to-pink-500',
  },
} as const;

// --- Character Roles ---
export const ROLE_CONFIG = {
  tank: {
    label: 'Танк',
    icon: '🛡️',
    color: '#3b82f6',
  },
  damage: {
    label: 'Урон',
    icon: '⚔️',
    color: '#ef4444',
  },
  support: {
    label: 'Поддержка',
    icon: '✨',
    color: '#a855f7',
  },
} as const;

// --- Navigation Tabs ---
export const NAVIGATION_TABS = [
  { id: 'arena', label: 'Арена', icon: 'sword', emoji: '⚔️' },
  { id: 'inventory', label: 'Инвентарь', icon: 'backpack', emoji: '🎒' },
  { id: 'market', label: 'Маркет', icon: 'shopping-cart', emoji: '🏪' },
  { id: 'guilds', label: 'Гильдии', icon: 'shield', emoji: '🏰' },
] as const;

// --- Mock Data for Development ---
export const MOCK_CHARACTERS = [
  {
    id: 'char-1',
    name: 'Заряза',
    role: 'damage' as const,
    rarity: 'legendary' as const,
    level: 15,
    maxLevel: 30,
    experience: 2450,
    attack: 85,
    defense: 42,
    speed: 78,
    health: 1200,
    maxHealth: 1200,
    abilities: [],
    equippedItems: [],
    imageUrl: 'https://placehold.co/300x400/8a2be2/ffffff?text=Заряза',
    description: 'Мастер лезвия, чередующий высокий урон с маневрами.',
    isSelected: true,
  },
  {
    id: 'char-2',
    name: 'Бронебой',
    role: 'tank' as const,
    rarity: 'epic' as const,
    level: 12,
    maxLevel: 30,
    experience: 1800,
    attack: 55,
    defense: 92,
    speed: 35,
    health: 2800,
    maxHealth: 2800,
    abilities: [],
    equippedItems: [],
    imageUrl: 'https://placehold.co/300x400/3b82f6/ffffff?text=Бронебой',
    description: 'Непробиваемый щит, поглощающий урон для союзников.',
    isSelected: false,
  },
  {
    id: 'char-3',
    name: 'Лунная Стихия',
    role: 'support' as const,
    rarity: 'rare' as const,
    level: 10,
    maxLevel: 30,
    experience: 950,
    attack: 45,
    defense: 38,
    speed: 65,
    health: 950,
    maxHealth: 950,
    abilities: [],
    equippedItems: [],
    imageUrl: 'https://placehold.co/300x400/a855f7/ffffff?text=Луна',
    description: 'Целительница, усиливающая союзников и исцеляющая раны.',
    isSelected: false,
  },
];

export const MOCK_ITEMS = [
  {
    id: 'item-1',
    name: 'Клинок Пустоты',
    type: 'weapon' as const,
    rarity: 'legendary' as const,
    description: 'Оружие, forged from obsidian shards of the void.',
    stats: { attack: 45, critChance: 15, critDamage: 30 },
    imageUrl: 'https://placehold.co/80x80/8a2be2/ffffff?text=⚔️',
    quantity: 1,
    isEquipped: true,
    sellPrice: 5000,
    isNFT: true,
    tokenId: 'nft-001',
  },
  {
    id: 'item-2',
    name: 'Доспехи Стража',
    type: 'armor' as const,
    rarity: 'epic' as const,
    description: 'Прочные доспехи, поглощающие урон.',
    stats: { defense: 38, health: 200 },
    imageUrl: 'https://placehold.co/80x80/a855f7/ffffff?text=🛡️',
    quantity: 1,
    isEquipped: false,
    sellPrice: 2500,
    isNFT: false,
  },
  {
    id: 'item-3',
    name: 'Амулет Скорости',
    type: 'accessory' as const,
    rarity: 'rare' as const,
    description: 'Увеличивает скорость и маневренность.',
    stats: { speed: 25, critChance: 8 },
    imageUrl: 'https://placehold.co/80x80/3b82f6/ffffff?text=💎',
    quantity: 3,
    isEquipped: false,
    sellPrice: 800,
    isNFT: false,
  },
  {
    id: 'item-4',
    name: 'Зелье Лечения',
    type: 'consumable' as const,
    rarity: 'common' as const,
    description: 'Восстанавливает 30% здоровья.',
    stats: { health: 500 },
    imageUrl: 'https://placehold.co/80x80/9ca3af/ffffff?text=🧪',
    quantity: 12,
    isEquipped: false,
    sellPrice: 50,
    isNFT: false,
  },
  {
    id: 'item-5',
    name: 'Кристалл Пыла',
    type: 'material' as const,
    rarity: 'epic' as const,
    description: 'Редкий материал для крафта эпических предметов.',
    stats: {},
    imageUrl: 'https://placehold.co/80x80/f59e0b/ffffff?text=🔥',
    quantity: 5,
    isEquipped: false,
    sellPrice: 1200,
    isNFT: false,
  },
  {
    id: 'item-6',
    name: 'Меч Пламени',
    type: 'weapon' as const,
    rarity: 'rare' as const,
    description: 'Огненный меч с оглушающей способностью.',
    stats: { attack: 32, critDamage: 20 },
    imageUrl: 'https://placehold.co/80x80/f97316/ffffff?text=🔥',
    quantity: 1,
    isEquipped: false,
    sellPrice: 1800,
    isNFT: false,
  },
];

export const MOCK_GUILDS = [
  {
    id: 'guild-1',
    name: 'Огненный Кремний',
    tag: 'FIRE',
    description: 'Гильдия огненных магов и воинов.',
    level: 8,
    memberCount: 42,
    maxMembers: 50,
    experience: 12500,
    joinFee: 500,
    leaderId: 'user-1',
    memberIds: ['user-1', 'user-2', 'user-3'],
    createdAt: '2024-01-15T00:00:00Z',
    isJoined: false,
  },
  {
    id: 'guild-2',
    name: 'Лунный Союз',
    tag: 'MOON',
    description: 'Алая гильдия лучников и поддержки.',
    level: 12,
    memberCount: 48,
    maxMembers: 50,
    experience: 28000,
    joinFee: 1200,
    leaderId: 'user-4',
    memberIds: ['user-4', 'user-5'],
    createdAt: '2024-02-20T00:00:00Z',
    isJoined: true,
  },
  {
    id: 'guild-3',
    name: 'Тень Вечера',
    tag: 'SHDW',
    description: 'Таинственная гильдия ассасинов.',
    level: 5,
    memberCount: 18,
    maxMembers: 50,
    experience: 4200,
    joinFee: 200,
    leaderId: 'user-6',
    memberIds: ['user-6'],
    createdAt: '2024-03-10T00:00:00Z',
    isJoined: false,
  },
];
