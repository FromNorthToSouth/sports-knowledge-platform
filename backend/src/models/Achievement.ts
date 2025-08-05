import mongoose, { Document, Schema } from 'mongoose';

// 成就定义接口
export interface IAchievement extends Document {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'learning' | 'streak' | 'accuracy' | 'time' | 'quiz' | 'exam' | 'social' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number; // 获得成就奖励的积分
  
  // 成就条件
  conditions: {
    type: 'count' | 'streak' | 'percentage' | 'time' | 'custom';
    target: number; // 目标值
    metric: string; // 指标名称，如 'questions_answered', 'login_days', 'accuracy'
    timeframe?: string; // 时间范围，如 'daily', 'weekly', 'monthly', 'all_time'
  };
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 用户成就关联接口
export interface IUserAchievement extends Document {
  user: mongoose.Types.ObjectId;
  achievement: mongoose.Types.ObjectId;
  progress: number; // 当前进度
  maxProgress: number; // 完成所需的最大进度
  isCompleted: boolean;
  completedAt?: Date;
  notified: boolean; // 是否已通知用户
  createdAt: Date;
}

// 成就定义Schema
const AchievementSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['learning', 'streak', 'accuracy', 'time', 'quiz', 'exam', 'social', 'special'],
    required: true 
  },
  rarity: { 
    type: String, 
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  points: { type: Number, default: 0 },
  
  conditions: {
    type: { 
      type: String, 
      enum: ['count', 'streak', 'percentage', 'time', 'custom'],
      required: true 
    },
    target: { type: Number, required: true },
    metric: { type: String, required: true },
    timeframe: { 
      type: String, 
      enum: ['daily', 'weekly', 'monthly', 'all_time'],
      default: 'all_time'
    }
  },
  
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// 用户成就关联Schema
const UserAchievementSchema: Schema = new Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  achievement: { type: mongoose.Schema.Types.ObjectId, ref: 'Achievement', required: true },
  progress: { type: Number, default: 0 },
  maxProgress: { type: Number, required: true },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },
  notified: { type: Boolean, default: false }
}, {
  timestamps: true
});

// 索引
AchievementSchema.index({ id: 1 });
AchievementSchema.index({ category: 1, rarity: 1 });
UserAchievementSchema.index({ user: 1, achievement: 1 }, { unique: true });
UserAchievementSchema.index({ user: 1, isCompleted: 1 });

export const Achievement = mongoose.model<IAchievement>('Achievement', AchievementSchema);
export const UserAchievement = mongoose.model<IUserAchievement>('UserAchievement', UserAchievementSchema);

export default { Achievement, UserAchievement }; 