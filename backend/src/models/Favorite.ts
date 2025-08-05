import mongoose, { Document, Schema } from 'mongoose';

export interface IFavorite extends Document {
  user: mongoose.Types.ObjectId;
  question: mongoose.Types.ObjectId;
  createdAt: Date;
}

const FavoriteSchema: Schema = new Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  question: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Question', 
    required: true 
  }
}, {
  timestamps: true
});

// 复合索引，确保用户不能重复收藏同一题目
FavoriteSchema.index({ user: 1, question: 1 }, { unique: true });

export default mongoose.model<IFavorite>('Favorite', FavoriteSchema); 