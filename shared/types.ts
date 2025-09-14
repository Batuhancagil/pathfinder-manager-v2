// Shared types between frontend and backend

export interface User {
  _id: string;
  email: string;
  password: string;
  role: 'admin' | 'player';
  createdAt: Date;
  updatedAt: Date;
}

export interface Character {
  _id: string;
  userId: string;
  name: string;
  class: string;
  level: number;
  race: string;
  alignment: string;
  background: string;
  
  // Basic Stats
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  
  // Calculated Stats
  hitPoints: number;
  armorClass: number;
  speed: number;
  
  // Skills
  skills: {
    [key: string]: {
      value: number;
      proficient: boolean;
    };
  };
  
  // Equipment
  equipment: string[];
  
  // Spells
  spells: {
    level: number;
    name: string;
    description: string;
  }[];
  
  // Other
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  _id: string;
  dmId: string;
  name: string;
  description: string;
  maxPlayers: number;
  players: string[]; // Character IDs
  status: 'waiting' | 'active' | 'ended';
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  _id: string;
  sessionId: string;
  userId: string;
  characterId?: string;
  message: string;
  timestamp: Date;
}

export interface DiceRoll {
  _id: string;
  sessionId: string;
  userId: string;
  characterId?: string;
  diceType: string; // "d20", "d12", "d10", "d8", "d6", "d4"
  result: number;
  modifier: number;
  total: number;
  timestamp: Date;
}

export interface InitiativeEntry {
  _id: string;
  sessionId: string;
  characterId: string;
  initiative: number;
  isActive: boolean;
  order: number;
}
