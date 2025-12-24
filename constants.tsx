
import React from 'react';
import { World, InventoryItem } from './types';

export const INITIAL_WORLDS: World[] = [
  {
    id: '1',
    name: 'Mega Continente',
    seed: '84729103',
    type: 'standard',
    difficulty: 'normal',
    lastPlayed: '12/10/2023',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=300&h=200'
  }
];

export const BLOCKS: InventoryItem[] = [
  { id: 'grass', name: 'Grama', type: 'block', icon: 'grass', color: '#4d7c0f', count: 64 },
  { id: 'dirt', name: 'Terra', type: 'block', icon: 'view_in_ar', color: '#8b5a2b', count: 64 },
  { id: 'stone', name: 'Pedra', type: 'block', icon: 'texture', color: '#44403c', count: 64 },
  { id: 'snow', name: 'Neve', type: 'block', icon: 'ac_unit', color: '#ffffff', count: 64 },
  { id: 'water', name: 'Água', type: 'block', icon: 'waves', color: '#0ea5e9', count: 64 },
  { id: 'sand', name: 'Areia', type: 'block', icon: 'grain', color: '#eab308', count: 64 },
  { id: 'wood', name: 'Madeira', type: 'block', icon: 'table_rows', color: '#422006', count: 64 },
  { id: 'leaf', name: 'Folha', type: 'block', icon: 'forest', color: '#166534', count: 64 },
  { id: 'cactus', name: 'Cacto', type: 'block', icon: 'potted_plant', color: '#15803d', count: 64 },
];
