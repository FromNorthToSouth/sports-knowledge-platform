import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  phone?: string;
  avatar?: string;
  role: 'student' | 'teacher' | 'admin' | 'super_admin' | 'content_manager' | 'institution_admin';
  institution?: mongoose.Types.ObjectId;
  grade?: string;
  classInfo?: string;
  
  // 学习统计
  learningStats: {
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
    totalTime: number; // 学习总时长（分钟）
    totalExams: number; // 总考试次数
    passedExams: number; // 通过的考试次数
    continuousLoginDays: number;
    lastLoginDate: Date;
  };
  
  // 个人设置
  settings: {
    notifications: boolean;
    difficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
    preferredSports: string[];
  };
  
  // 能力画像
  abilityProfile: {
    sportsKnowledge: number; // 0-100
    rulesUnderstanding: number;
    technicalSkills: number;
    historyKnowledge: number;
    judgeAbility: number;
    safetyAwareness: number;
  };
  
  // 积分和成就
  points: number;
  achievements: string[];
  
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true, minlength: 2, maxlength: 20 },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  phone: { type: String },
  avatar: { type: String },
  role: { 
    type: String, 
    enum: ['student', 'teacher', 'admin', 'super_admin', 'content_manager', 'institution_admin'],
    default: 'student' 
  },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  grade: { type: String },
  classInfo: { type: String },
  
  learningStats: {
    totalQuestions: { type: Number, default: 0 },
    correctAnswers: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    totalTime: { type: Number, default: 0 },
    totalExams: { type: Number, default: 0 },
    passedExams: { type: Number, default: 0 },
    continuousLoginDays: { type: Number, default: 0 },
    lastLoginDate: { type: Date, default: Date.now }
  },
  
  settings: {
    notifications: { type: Boolean, default: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard', 'adaptive'], default: 'adaptive' },
    preferredSports: [{ type: String }]
  },
  
  abilityProfile: {
    sportsKnowledge: { type: Number, default: 0, min: 0, max: 100 },
    rulesUnderstanding: { type: Number, default: 0, min: 0, max: 100 },
    technicalSkills: { type: Number, default: 0, min: 0, max: 100 },
    historyKnowledge: { type: Number, default: 0, min: 0, max: 100 },
    judgeAbility: { type: Number, default: 0, min: 0, max: 100 },
    safetyAwareness: { type: Number, default: 0, min: 0, max: 100 }
  },
  
  points: { type: Number, default: 0 },
  achievements: [{ type: String }],
  
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// 索引
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ institution: 1 });

export default mongoose.model<IUser>('User', UserSchema); 