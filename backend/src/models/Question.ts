import mongoose, { Document, Schema } from 'mongoose';

export interface IOption {
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface IQuestion extends Document {
  title: string;
  content: string;
  type: 'single_choice' | 'multiple_choice' | 'true_false' | 'case_analysis' | 'fill_blank';
  
  // 题目选项（适用于选择题）
  options: IOption[];
  
  // 正确答案
  correctAnswer: string | string[];
  
  // 题目解析
  explanation: string;
  
  // 分类和标签
  category: {
    sport: string; // 运动类型：足球、篮球、田径等
    knowledgeType: string; // 知识类型：规则、技术、历史等
    subCategory?: string; // 子分类：如足球->规则->越位规则
  };
  
  tags: string[]; // 标签：如"奥运会历史"、"裁判手势"
  
  // 难度等级
  difficulty: 'easy' | 'medium' | 'hard';
  
  // 多媒体支持
  media: {
    images?: string[];
    videos?: string[];
    audio?: string[];
  };
  
  // 题目统计
  stats: {
    totalAttempts: number;
    correctAttempts: number;
    accuracy: number;
    averageTime: number; // 平均答题时间（秒）
  };
  
  // 题目状态
  status: 'draft' | 'published' | 'archived';
  
  // 创建者信息
  creator: mongoose.Types.ObjectId;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  
  // AI生成相关
  isAIGenerated: boolean;
  aiPrompt?: string;
  
  // 版本控制
  version: number;
  parentQuestion?: mongoose.Types.ObjectId;
  
  createdAt: Date;
  updatedAt: Date;
}

const OptionSchema = new Schema({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  explanation: { type: String }
});

const QuestionSchema: Schema = new Schema({
  title: { type: String, required: true, maxlength: 200 },
  content: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['single_choice', 'multiple_choice', 'true_false', 'case_analysis', 'fill_blank'],
    required: true 
  },
  
  options: [OptionSchema],
  correctAnswer: { type: Schema.Types.Mixed, required: true },
  explanation: { type: String, required: true },
  
  category: {
    sport: { type: String, required: true },
    knowledgeType: { type: String, required: true },
    subCategory: { type: String }
  },
  
  tags: [{ type: String }],
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  
  media: {
    images: [{ type: String }],
    videos: [{ type: String }],
    audio: [{ type: String }]
  },
  
  stats: {
    totalAttempts: { type: Number, default: 0 },
    correctAttempts: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    averageTime: { type: Number, default: 0 }
  },
  
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  
  isAIGenerated: { type: Boolean, default: false },
  aiPrompt: { type: String },
  
  version: { type: Number, default: 1 },
  parentQuestion: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' }
}, {
  timestamps: true
});

// 索引
QuestionSchema.index({ 'category.sport': 1 });
QuestionSchema.index({ 'category.knowledgeType': 1 });
QuestionSchema.index({ difficulty: 1 });
QuestionSchema.index({ tags: 1 });
QuestionSchema.index({ status: 1 });
QuestionSchema.index({ creator: 1 });
QuestionSchema.index({ 'stats.accuracy': -1 });
QuestionSchema.index({ createdAt: -1 });

// 复合索引
QuestionSchema.index({ 
  'category.sport': 1, 
  difficulty: 1, 
  status: 1 
});

export default mongoose.model<IQuestion>('Question', QuestionSchema); 