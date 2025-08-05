import mongoose, { Schema, Document } from 'mongoose';

// 考试发布接口
export interface IExamPublication extends Document {
  title: string;
  description?: string;
  creator: mongoose.Types.ObjectId;
  
  // 考试配置
  examConfig: {
    timeLimit: number;          // 考试时长（分钟）
    questionCount: number;      // 题目数量
    passingScore: number;       // 及格分数
    allowReview: boolean;       // 允许复查
    randomOrder: boolean;       // 随机排序
    showScore: boolean;         // 显示分数
    allowRetake: boolean;       // 允许重考
    maxAttempts: number;        // 最大尝试次数
  };
  
  // 题目列表
  questions: mongoose.Types.ObjectId[];
  
  // 目标受众
  targetAudience: {
    type: 'class' | 'grade' | 'institution' | 'specific' | 'all';
    classIds: mongoose.Types.ObjectId[];
    gradeIds: string[];
    institutionIds: mongoose.Types.ObjectId[];
    specificUsers: mongoose.Types.ObjectId[];
  };
  
  // 考试安排
  schedule: {
    startTime: Date;            // 开始时间
    endTime: Date;              // 结束时间
    duration: number;           // 持续时间（分钟）
    timezone: string;           // 时区
  };
  
  // 评分设置
  grading: {
    passingScore: number;       // 及格分数
    scoreWeight: number;        // 分数权重
    gradingCriteria: 'percentage' | 'points' | 'letter';
    showScore: boolean;         // 显示分数
    showAnswers: boolean;       // 显示答案
    showAnalysis: boolean;      // 显示分析
  };
  
  // 自动组卷设置
  autoGeneration: {
    enabled: boolean;
    criteria?: {
      questionCount: number;
      difficulty: string[];
      categories: string[];
      knowledgeTypes: string[];
      questionTypes: string[];
      balanceStrategy: 'balanced' | 'category_balanced' | 'difficulty_focused' | 'weakness_focused' | 'random';
      useAI: boolean;
    };
    generatedAt?: Date;
  };
  
  // 状态
  status: 'draft' | 'published' | 'active' | 'ended' | 'cancelled';
  
  // 统计数据
  statistics: {
    totalParticipants: number;
    completedCount: number;
    averageScore: number;
    passRate: number;
    avgCompletionTime: number;
  };
  
  // 额外设置
  settings: {
    allowLateSubmission: boolean;
    lateSubmissionPenalty: number;  // 迟交惩罚（百分比）
    proctoring: boolean;            // 是否启用监考
    cameraRequired: boolean;        // 是否需要摄像头
    fullScreenMode: boolean;        // 全屏模式
    preventCopyPaste: boolean;      // 防止复制粘贴
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// 考试发布数据模型
const ExamPublicationSchema = new Schema<IExamPublication>({
  title: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 200
  },
  description: { 
    type: String, 
    trim: true,
    maxlength: 1000
  },
  creator: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  
  examConfig: {
    timeLimit: { type: Number, required: true, min: 5, max: 300 },
    questionCount: { type: Number, required: true, min: 1, max: 200 },
    passingScore: { type: Number, required: true, min: 0, max: 100 },
    allowReview: { type: Boolean, default: true },
    randomOrder: { type: Boolean, default: false },
    showScore: { type: Boolean, default: true },
    allowRetake: { type: Boolean, default: false },
    maxAttempts: { type: Number, default: 1, min: 1, max: 10 }
  },
  
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  }],
  
  targetAudience: {
    type: { 
      type: String, 
      enum: ['class', 'grade', 'institution', 'specific', 'all'],
      required: true
    },
    classIds: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Class' 
    }],
    gradeIds: [{ type: String }],
    institutionIds: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Institution' 
    }],
    specificUsers: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    }]
  },
  
  schedule: {
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    duration: { type: Number, required: true, min: 5 },
    timezone: { type: String, default: 'Asia/Shanghai' }
  },
  
  grading: {
    passingScore: { type: Number, required: true, min: 0, max: 100 },
    scoreWeight: { type: Number, default: 100, min: 1, max: 100 },
    gradingCriteria: { 
      type: String, 
      enum: ['percentage', 'points', 'letter'],
      default: 'percentage'
    },
    showScore: { type: Boolean, default: true },
    showAnswers: { type: Boolean, default: false },
    showAnalysis: { type: Boolean, default: false }
  },
  
  autoGeneration: {
    enabled: { type: Boolean, default: false },
    criteria: {
      questionCount: { type: Number, min: 1, max: 200 },
      difficulty: [{ type: String, enum: ['easy', 'medium', 'hard'] }],
      categories: [{ type: String }],
      knowledgeTypes: [{ type: String }],
      questionTypes: [{ type: String, enum: ['single_choice', 'multiple_choice', 'true_false', 'fill_blank', 'essay'] }],
      balanceStrategy: { 
        type: String, 
        enum: ['balanced', 'category_balanced', 'difficulty_focused', 'weakness_focused', 'random'],
        default: 'balanced'
      },
      useAI: { type: Boolean, default: false }
    },
    generatedAt: { type: Date }
  },
  
  status: { 
    type: String, 
    enum: ['draft', 'published', 'active', 'ended', 'cancelled'],
    default: 'draft',
    index: true
  },
  
  statistics: {
    totalParticipants: { type: Number, default: 0, min: 0 },
    completedCount: { type: Number, default: 0, min: 0 },
    averageScore: { type: Number, default: 0, min: 0, max: 100 },
    passRate: { type: Number, default: 0, min: 0, max: 100 },
    avgCompletionTime: { type: Number, default: 0, min: 0 }
  },
  
  settings: {
    allowLateSubmission: { type: Boolean, default: false },
    lateSubmissionPenalty: { type: Number, default: 0, min: 0, max: 100 },
    proctoring: { type: Boolean, default: false },
    cameraRequired: { type: Boolean, default: false },
    fullScreenMode: { type: Boolean, default: false },
    preventCopyPaste: { type: Boolean, default: false }
  }
}, {
  timestamps: true
});

// 索引
ExamPublicationSchema.index({ creator: 1, status: 1 });
ExamPublicationSchema.index({ status: 1, 'schedule.startTime': 1 });
ExamPublicationSchema.index({ 'targetAudience.type': 1 });
ExamPublicationSchema.index({ createdAt: -1 });

// 虚拟字段：是否已开始
ExamPublicationSchema.virtual('isStarted').get(function() {
  return new Date() >= this.schedule.startTime;
});

// 虚拟字段：是否已结束  
ExamPublicationSchema.virtual('isEnded').get(function() {
  return new Date() >= this.schedule.endTime;
});

// 虚拟字段：是否进行中
ExamPublicationSchema.virtual('isActive').get(function() {
  const now = new Date();
  return now >= this.schedule.startTime && now <= this.schedule.endTime;
});

// 虚拟字段：剩余时间（分钟）
ExamPublicationSchema.virtual('timeRemaining').get(function() {
  const now = new Date();
  if (now >= this.schedule.endTime) return 0;
  if (now < this.schedule.startTime) return Math.ceil((this.schedule.startTime.getTime() - now.getTime()) / (1000 * 60));
  return Math.ceil((this.schedule.endTime.getTime() - now.getTime()) / (1000 * 60));
});

// 实例方法：更新统计数据
ExamPublicationSchema.methods.updateStatistics = async function() {
  const Exam = mongoose.model('Exam');
  const examInstances = await Exam.find({ publicationId: this._id });
  
  this.statistics.totalParticipants = examInstances.length;
  this.statistics.completedCount = examInstances.filter((e: any) => e.status === 'completed').length;
  
  const completedExams = examInstances.filter((e: any) => e.result?.score !== undefined);
  if (completedExams.length > 0) {
    this.statistics.averageScore = completedExams.reduce((sum: number, e: any) => sum + e.result.score, 0) / completedExams.length;
    this.statistics.passRate = (completedExams.filter((e: any) => e.result.score >= this.grading.passingScore).length / completedExams.length) * 100;
    this.statistics.avgCompletionTime = completedExams.reduce((sum: number, e: any) => sum + (e.result.totalTime || 0), 0) / completedExams.length;
  }
  
  await this.save();
};

// 静态方法：获取活跃考试
ExamPublicationSchema.statics.getActiveExams = function() {
  const now = new Date();
  return this.find({
    status: 'published',
    'schedule.startTime': { $lte: now },
    'schedule.endTime': { $gte: now }
  });
};

// 静态方法：获取即将开始的考试
ExamPublicationSchema.statics.getUpcomingExams = function(withinHours = 24) {
  const now = new Date();
  const futureTime = new Date(now.getTime() + withinHours * 60 * 60 * 1000);
  
  return this.find({
    status: 'published',
    'schedule.startTime': { 
      $gte: now,
      $lte: futureTime
    }
  });
};

const ExamPublication = mongoose.model<IExamPublication>('ExamPublication', ExamPublicationSchema);

export default ExamPublication; 