// ============================================
// Obsidian Arena — User State Context
// ============================================

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import type {
  User,
  Character,
  Item,
  Guild,
  TabType,
  GameState,
} from '../types';
import { MOCK_CHARACTERS, MOCK_ITEMS, MOCK_GUILDS } from '../config/constants';
import firebaseService from '../services/firebase';
import { useGameStore } from '../store/gameStore';

// --- User Context Type ---
export interface UserContextType {
  // User data
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  updateUser: (data: Partial<User>) => void;
  updateBalance: (amount: number, currency: 'obsidian' | 'gram') => void;

  // Characters
  characters: Character[];
  selectedCharacter: Character | null;
  selectCharacter: (characterId: string) => void;
  addCharacter: (character: Character) => void;

  // Inventory
  inventory: Item[];
  filteredInventory: Item[];
  inventoryFilter: string;
  setInventoryFilter: (filter: string) => void;
  equipItem: (itemId: string) => void;
  sellItem: (itemId: string) => void;

  // Guilds
  guilds: Guild[];
  joinedGuild: Guild | null;
  joinGuild: (guildId: string) => Promise<boolean>;

  // Game state
  gameState: GameState;
  setGameState: (state: GameState) => void;

  // Navigation
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// --- Hook for consuming User context ---
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// --- Mock user for development ---
const MOCK_USER: User = {
  id: 'user-1',
  telegramId: 123456789,
  username: 'obsidian_warrior',
  firstName: 'Александр',
  lastName: 'Игроков',
  avatarUrl: 'https://placehold.co/100x100/8a2be2/ffffff?text=AW',
  walletAddress: 'EQAbCdEfGhIjKlMnOpQrStUvWxYz1234567890',
  obsidianBalance: 1250.5,
  gramBalance: 3.2,
  level: 15,
  experience: 2450,
  selectedCharacterId: 'char-1',
  guildId: 'guild-2',
  createdAt: '2024-01-10T00:00:00Z',
  lastLoginAt: new Date().toISOString(),
};

// --- User Provider ---
export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // --- User State ---
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // --- Characters ---
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null
  );

  // --- Inventory ---
  const [inventory, setInventory] = useState<Item[]>([]);
  const [inventoryFilter, setInventoryFilter] = useState<string>('all');

  // --- Guilds ---
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [joinedGuild, setJoinedGuild] = useState<Guild | null>(null);

  // --- Game State ---
  const [gameState, setGameState] = useState<GameState>('idle');

  // --- Navigation ---
  const [activeTab, setActiveTab] = useState<TabType>('arena');

  // --- Initialize user data ---
  useEffect(() => {
    const initializeUser = async () => {
      setIsLoading(true);

      // In production, fetch from Firebase:
      // const dbUser = await firebaseService.getUser(telegramId);
      // if (dbUser) {
      //   setUser(dbUser);
      // } else {
      //   const newUser = await firebaseService.createUser({...});
      //   setUser(newUser);
      // }

      // For development, use mock data
      await new Promise((resolve) => setTimeout(resolve, 500));
      setUser(MOCK_USER);
      setCharacters(MOCK_CHARACTERS);
      setInventory(MOCK_ITEMS);
      setGuilds(MOCK_GUILDS);

      const selected = MOCK_CHARACTERS.find((c) => c.isSelected) ?? null;
      setSelectedCharacter(selected);

      const joined = MOCK_GUILDS.find((g) => g.isJoined) ?? null;
      setJoinedGuild(joined);

      setIsInitialized(true);
      setIsLoading(false);

      // Sync balance with Zustand game store
      useGameStore.getState().setObsidianBalance(MOCK_USER.obsidianBalance);
      useGameStore.getState().setGramBalance(MOCK_USER.gramBalance || 0);
    };

    initializeUser();
  }, []);

  // --- Filtered Inventory ---
  const filteredInventory = inventory.filter((item) => {
    if (inventoryFilter === 'all') return true;
    if (inventoryFilter === 'equipped') return item.isEquipped;
    if (inventoryFilter === 'nft') return item.isNFT;
    return item.rarity === inventoryFilter;
  });

  // --- Update User ---
  const updateUser = useCallback((data: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      firebaseService.updateUser(prev.telegramId, data);
      return updated;
    });
  }, []);

  // --- Update Balance ---
  const updateBalance = useCallback(
    (amount: number, currency: 'obsidian' | 'gram') => {
      setUser((prev) => {
        if (!prev) return null;
        const updated = {
          ...prev,
          obsidianBalance:
            currency === 'obsidian'
              ? prev.obsidianBalance + amount
              : prev.obsidianBalance,
          gramBalance:
            currency === 'gram'
              ? (prev.gramBalance || 0) + amount
              : prev.gramBalance,
        };
        firebaseService.updateUserBalance(prev.telegramId, amount, currency);

        // Sync with Zustand game store
        if (currency === 'obsidian') {
          useGameStore.getState().updateObsidianBalance(amount);
        } else {
          useGameStore.getState().updateGramBalance(amount);
        }

        return updated;
      });
    },
    []
  );

  // --- Select Character ---
  const selectCharacter = useCallback(
    (characterId: string) => {
      setCharacters((prev) =>
        prev.map((c) => ({
          ...c,
          isSelected: c.id === characterId,
        }))
      );
      const character = characters.find((c) => c.id === characterId) ?? null;
      setSelectedCharacter(character);

      if (user) {
        updateUser({ selectedCharacterId: characterId });
      }
    },
    [characters, user, updateUser]
  );

  // --- Add Character ---
  const addCharacter = useCallback((character: Character) => {
    setCharacters((prev) => [...prev, character]);
  }, []);

  // --- Equip Item ---
  const equipItem = useCallback((itemId: string) => {
    setInventory((prev) =>
      prev.map((item) => ({
        ...item,
        isEquipped: item.id === itemId ? !item.isEquipped : item.isEquipped,
      }))
    );
  }, []);

  // --- Sell Item ---
  const sellItem = useCallback(
    (itemId: string) => {
      const item = inventory.find((i) => i.id === itemId);
      if (!item) return;

      setInventory((prev) =>
        prev
          .map((i) =>
            i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
          )
          .filter((i) => i.quantity > 0)
      );

      updateBalance(item.sellPrice, 'obsidian');
    },
    [inventory, updateBalance]
  );

  // --- Join Guild ---
  const joinGuild = useCallback(
    async (guildId: string): Promise<boolean> => {
      const guild = guilds.find((g) => g.id === guildId);
      if (!guild || !user) return false;

      if (user.obsidianBalance < guild.joinFee) {
        return false;
      }

      const success = await firebaseService.joinGuild(
        user.telegramId,
        guildId
      );
      if (success) {
        setGuilds((prev) =>
          prev.map((g) =>
            g.id === guildId
              ? {
                  ...g,
                  isJoined: true,
                  memberCount: g.memberCount + 1,
                }
              : g
          )
        );
        setJoinedGuild(guild);
        updateBalance(-guild.joinFee, 'obsidian');
        updateUser({ guildId: guildId });
      }
      return success;
    },
    [guilds, user, updateBalance, updateUser]
  );

  const value: UserContextType = {
    user,
    isLoading,
    isInitialized,
    updateUser,
    updateBalance,
    characters,
    selectedCharacter,
    selectCharacter,
    addCharacter,
    inventory,
    filteredInventory,
    inventoryFilter,
    setInventoryFilter,
    equipItem,
    sellItem,
    guilds,
    joinedGuild,
    joinGuild,
    gameState,
    setGameState,
    activeTab,
    setActiveTab,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};
