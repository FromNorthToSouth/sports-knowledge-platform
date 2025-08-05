import mongoose, { Document, Schema } from 'mongoose';

export interface IExamAnswer {
  questionId: mongoose.Types.ObjectId;
  userAnswer: string | string[];
  isCorrect: boolean;
  timeSpent: number; // 答题时间（秒）
  submittedAt: Date;
}

export interface IExam extends Document {
  title: string;
  description?: string;
  
  // 考试配置
  config: {
    timeLimit: number; // 考试时长（分钟）
    questionCount: number;
    passingScore: number; // 及格分数
    allowReview: boolean; // 是否允许查看答案
    randomOrder: boolean; // 题目随机顺序
  };
  
  // 题目筛选条件
  questionFilter: {
    sports?: string[];
    knowledgeTypes?: string[];
    difficulty?: string[];
    tags?: string[];
  };
  
  // 参与用户
  user: mongoose.Types.ObjectId;
  
  // 考试状态
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  
  // 开始和结束时间
  startedAt?: Date;
  completedAt?: Date;
  
  // 答题记录
  answers: IExamAnswer[];
  
  // 考试结果
  result: {
    score: number; // 得分
    accuracy: number; // 正确率
    totalTime: number; // 总用时（分钟）
    passed: boolean; // 是否通过
    rank?: number; // 排名（如果是竞赛）
  };
  
  // 能力分析
  abilityAnalysis: {
    sportsKnowledge: number;
    rulesUnderstanding: number;
    technicalSkills: number;
    historyKnowledge: number;
    judgeAbility: number;
    safetyAwareness: number;
  };
  
  // 错题分析
  weaknessAnalysis: {
    categories: string[];
    tags: string[];
    difficulties: string[];
  };
  
  // 考试类型
  examType: 'practice' | 'mock_exam' | 'competition' | 'assessment';
  
  createdAt: Date;
  updatedAt: Date;
}

const ExamAnswerSchema = new Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  userAnswer: { type: Schema.Types.Mixed, required: true },
  isCorrect: { type: Boolean, required: true },
  timeSpent: { type: Number, required: true },
  submittedAt: { type: Date, required: true }
});

const ExamSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  
  config: {
    timeLimit: { type: Number, required: true },
    questionCount: { type: Number, required: true },
    passingScore: { type: Number, default: 60 },
    allowReview: { type: Boolean, default: true },
    randomOrder: { type: Boolean, default: true }
  },
  
  questionFilter: {
    sports: [{ type: String }],
    knowledgeTypes: [{ type: String }],
    difficulty: [{ type: String }],
    tags: [{ type: String }]
  },
  
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  status: { 
    type: String, 
    enum: ['not_started', 'in_progress', 'completed', 'abandoned'],
    default: 'not_started' 
  },
  
  startedAt: { type: Date },
  completedAt: { type: Date },
  
  answers: [ExamAnswerSchema],
  
  result: {
    score: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },
    totalTime: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    rank: { type: Number }
  },
  
  abilityAnalysis: {
    sportsKnowledge: { type: Number, default: 0 },
    rulesUnderstanding: { type: Number, default: 0 },
    technicalSkills: { type: Number, default: 0 },
    historyKnowledge: { type: Number, default: 0 },
    judgeAbility: { type: Number, default: 0 },
    safetyAwareness: { type: Number, default: 0 }
  },
  
  weaknessAnalysis: {
    categories: [{ type: String }],
    tags: [{ type: String }],
    difficulties: [{ type: String }]
  },
  
  examType: { 
    type: String, 
    enum: ['practice', 'mock_exam', 'competition', 'assessment'],
    default: 'practice' 
  }
}, {
  timestamps: true
});

// 索引
ExamSchema.index({ user: 1 });
ExamSchema.index({ status: 1 });
ExamSchema.index({ examType: 1 });
ExamSchema.index({ createdAt: -1 });
ExamSchema.index({ 'result.score': -1 });
ExamSchema.index({ user: 1, examType: 1, status: 1 });

export default mongoose.model<IExam>('Exam', ExamSchema); 