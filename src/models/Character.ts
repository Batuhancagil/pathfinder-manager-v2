import mongoose, { Document, Schema } from 'mongoose';

export interface ICharacter extends Document {
  name: string;
  pdfUrl: string;
  pdfFileName: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const CharacterSchema = new Schema<ICharacter>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  pdfUrl: {
    type: String,
    required: true
  },
  pdfFileName: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.models.Character || mongoose.model<ICharacter>('Character', CharacterSchema);