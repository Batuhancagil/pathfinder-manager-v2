import mongoose, { Document, Schema } from 'mongoose';

export interface IPlayer {
  userId: string;
  characterId?: string;
  characterName?: string;
  joinedAt: Date;
  isOnline: boolean;
  lastSeen: Date;
}

export interface IChatMessage {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: Date;
  type: 'chat' | 'roll' | 'system';
}

export interface IInitiativeEntry {
  characterId: string;
  characterName: string;
  initiative: number;
  isActive: boolean;
}

export interface ISession extends Document {
  title: string;
  description?: string;
  sessionKey: string;
  creatorId: string; // Session oluşturan kişi (admin)
  creatorName: string;
  dmId?: string; // DM atanmış mı?
  dmName?: string;
  players: IPlayer[];
  maxPlayers: number;
  isActive: boolean;
  isPublic: boolean;
  chatMessages: IChatMessage[];
  initiativeOrder: IInitiativeEntry[];
  currentTurn?: string; // characterId of current turn
  createdAt: Date;
  updatedAt: Date;
}

const PlayerSchema = new Schema<IPlayer>({
  userId: {
    type: String,
    required: true
  },
  characterId: {
    type: String
  },
  characterName: {
    type: String
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  isOnline: {
    type: Boolean,
    default: true
  },
  lastSeen: {
    type: Date,
    default: Date.now
  }
});

const ChatMessageSchema = new Schema<IChatMessage>({
  id: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['chat', 'roll', 'system'],
    default: 'chat'
  }
});

const InitiativeEntrySchema = new Schema<IInitiativeEntry>({
  characterId: {
    type: String,
    required: true
  },
  characterName: {
    type: String,
    required: true
  },
  initiative: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

const SessionSchema = new Schema<ISession>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  sessionKey: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  creatorId: {
    type: String,
    required: true
  },
  creatorName: {
    type: String,
    required: true
  },
  dmId: {
    type: String
  },
  dmName: {
    type: String
  },
  players: [PlayerSchema],
  maxPlayers: {
    type: Number,
    default: 6
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  chatMessages: [ChatMessageSchema],
  initiativeOrder: [InitiativeEntrySchema],
  currentTurn: {
    type: String
  }
}, {
  timestamps: true
});

// Index for faster session key lookups
SessionSchema.index({ sessionKey: 1 });

export default mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);