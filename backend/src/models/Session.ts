import mongoose, { Document, Schema } from 'mongoose';

export interface ISession extends Document {
  dmId: string;
  name: string;
  description: string;
  maxPlayers: number;
  players: string[]; // Character IDs
  status: 'waiting' | 'active' | 'ended';
  createdAt: Date;
  updatedAt: Date;
}

const SessionSchema = new Schema<ISession>({
  dmId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  } as any,
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  maxPlayers: {
    type: Number,
    required: true,
    min: 1,
    max: 8,
    default: 8
  },
  players: [{
    type: Schema.Types.ObjectId,
    ref: 'Character'
  } as any],
  status: {
    type: String,
    enum: ['waiting', 'active', 'ended'],
    default: 'waiting'
  }
}, {
  timestamps: true
});

export default mongoose.model<ISession>('Session', SessionSchema);
