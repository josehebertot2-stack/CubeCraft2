
export enum GameState {
  MENU = 'MENU',
  WORLD_SELECT = 'WORLD_SELECT',
  PLAYING = 'PLAYING',
  INVENTORY = 'INVENTORY',
  SETTINGS = 'SETTINGS',
  MULTIPLAYER = 'MULTIPLAYER',
  ACHIEVEMENTS = 'ACHIEVEMENTS'
}

export interface World {
  id: string;
  name: string;
  seed: string;
  type: 'standard' | 'flat';
  difficulty: 'peaceful' | 'easy' | 'normal' | 'hard';
  lastPlayed: string;
  thumbnail?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'block' | 'item';
  icon: string;
  color: string;
  count: number;
}
