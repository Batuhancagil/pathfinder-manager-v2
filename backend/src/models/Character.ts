import mongoose, { Document, Schema } from 'mongoose';

export interface ICharacter extends Document {
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

const CharacterSchema = new Schema<ICharacter>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  } as any,
  name: {
    type: String,
    required: true,
    trim: true
  },
  class: {
    type: String,
    required: true,
    trim: true
  },
  level: {
    type: Number,
    required: true,
    min: 1,
    max: 20
  },
  race: {
    type: String,
    required: true,
    trim: true
  },
  alignment: {
    type: String,
    required: true,
    trim: true
  },
  background: {
    type: String,
    required: true,
    trim: true
  },
  
  // Basic Stats
  strength: {
    type: Number,
    required: true,
    min: 1,
    max: 30
  },
  dexterity: {
    type: Number,
    required: true,
    min: 1,
    max: 30
  },
  constitution: {
    type: Number,
    required: true,
    min: 1,
    max: 30
  },
  intelligence: {
    type: Number,
    required: true,
    min: 1,
    max: 30
  },
  wisdom: {
    type: Number,
    required: true,
    min: 1,
    max: 30
  },
  charisma: {
    type: Number,
    required: true,
    min: 1,
    max: 30
  },
  
  // Calculated Stats
  hitPoints: {
    type: Number,
    required: true,
    min: 1
  },
  armorClass: {
    type: Number,
    required: true,
    min: 0
  },
  speed: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Skills
  skills: {
    type: Map,
    of: {
      value: Number,
      proficient: Boolean
    },
    default: {}
  },
  
  // Equipment
  equipment: [{
    type: String,
    trim: true
  }],
  
  // Spells
  spells: [{
    level: {
      type: Number,
      min: 0,
      max: 9
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    }
  }],
  
  // Other
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

export default mongoose.model<ICharacter>('Character', CharacterSchema);
