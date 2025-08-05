import mongoose, { Document, Schema } from 'mongoose';

// 知识库模型
export interface IKnowledgeBase extends Document {
  title: string;
  description: string;
  cover?: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  status: 'draft' | 'published' | 'archived';
  isPublic: boolean;
  tags: string[];
  
  // 作者信息
  author: mongoose.Types.ObjectId;
  
  // 权限控制
  allowedInstitutions?: mongoose.Types.ObjectId[];
  collaborators?: mongoose.Types.ObjectId[]; // 协作者
  
  // 媒体内容
  contents: {
    type: 'document' | 'video' | 'audio' | '3d_animation' | 'image' | 'presentation';
    fileId: string; // 文件ID，关联到文件服务
    filename: string;
    originalName: string;
    title: string; // 内容标题
    description?: string; // 内容描述
    url: string; // 文件访问URL
    thumbnailUrl?: string; // 缩略图URL
    size: number; // 文件大小
    uploadedAt: Date;
    order: number; // 显示顺序
    tags: string[]; // 内容标签
    isRequired: boolean; // 是否为必修内容
    estimatedDuration?: number; // 预计学习时长（分钟）
    metadata?: {
      // 视频/音频相关
      duration?: number;
      bitrate?: number;
      format?: string;
      // 图片相关
      width?: number;
      height?: number;
      // 文档相关
      pageCount?: number;
      // 3D动画相关
      frameCount?: number;
      fps?: number;
    };
  }[];
  
  // 统计数据
  stats: {
    knowledgePoints: number;
    resources: number;
    learners: number;
    completionRate: number;
    avgRating: number;
    totalViews: number;
    totalContentSize: number; // 总内容大小（字节）
    totalContentDuration: number; // 总内容时长（分钟）
  };
  
  // 配置选项
  settings: {
    autoPublish: boolean; // 自动发布新增内容
    allowComments: boolean; // 允许评论
    requireApproval: boolean; // 需要审核
    trackProgress: boolean; // 跟踪学习进度
    allowDownload: boolean; // 允许下载内容
    maxFileSize: number; // 最大文件大小限制（MB）
  };
  
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeBaseSchema: Schema = new Schema({
  title: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 200,
    index: true
  },
  description: { 
    type: String, 
    required: true,
    maxlength: 2000
  },
  cover: { 
    type: String 
  },
  category: { 
    type: String, 
    required: true,
    index: true
  },
  level: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true,
    index: true
  },
  status: { 
    type: String, 
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true
  },
  isPublic: { 
    type: Boolean, 
    default: true,
    index: true
  },
  tags: [{ 
    type: String, 
    trim: true,
    maxlength: 50
  }],
  
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  
  allowedInstitutions: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Institution' 
  }],
  collaborators: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  
  // 媒体内容
  contents: [{
    type: {
      type: String,
      enum: ['document', 'video', 'audio', '3d_animation', 'image', 'presentation'],
      required: true
    },
    fileId: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true,
      maxlength: 200
    },
    description: {
      type: String,
      maxlength: 1000
    },
    url: {
      type: String,
      required: true
    },
    thumbnailUrl: {
      type: String
    },
    size: {
      type: Number,
      required: true,
      min: 0
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    order: {
      type: Number,
      default: 0,
      min: 0
    },
    tags: [{
      type: String,
      trim: true,
      maxlength: 50
    }],
    isRequired: {
      type: Boolean,
      default: false
    },
    estimatedDuration: {
      type: Number,
      min: 0
    },
    metadata: {
      duration: { type: Number, min: 0 },
      bitrate: { type: Number, min: 0 },
      format: { type: String, maxlength: 50 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
      pageCount: { type: Number, min: 0 },
      frameCount: { type: Number, min: 0 },
      fps: { type: Number, min: 0 }
    }
  }],
  
  stats: {
    knowledgePoints: { type: Number, default: 0, min: 0 },
    resources: { type: Number, default: 0, min: 0 },
    learners: { type: Number, default: 0, min: 0 },
    completionRate: { type: Number, default: 0, min: 0, max: 100 },
    avgRating: { type: Number, default: 0, min: 0, max: 5 },
    totalViews: { type: Number, default: 0, min: 0 },
    totalContentSize: { type: Number, default: 0, min: 0 },
    totalContentDuration: { type: Number, default: 0, min: 0 }
  },
  
  settings: {
    autoPublish: { type: Boolean, default: false },
    allowComments: { type: Boolean, default: true },
    requireApproval: { type: Boolean, default: true },
    trackProgress: { type: Boolean, default: true },
    allowDownload: { type: Boolean, default: true },
    maxFileSize: { type: Number, default: 100 } // 默认100MB
  }
}, {
  timestamps: true
});

// 索引
KnowledgeBaseSchema.index({ author: 1, status: 1 });
KnowledgeBaseSchema.index({ category: 1, level: 1, isPublic: 1 });
KnowledgeBaseSchema.index({ tags: 1 });
KnowledgeBaseSchema.index({ 'stats.avgRating': -1 });
KnowledgeBaseSchema.index({ createdAt: -1 });

// 文本搜索索引
KnowledgeBaseSchema.index({ 
  title: 'text', 
  description: 'text', 
  tags: 'text' 
});

// 知识点模型
export interface IKnowledgePoint extends Document {
  knowledgeBase: mongoose.Types.ObjectId;
  title: string;
  description: string;
  content: string; // 详细内容
  type: 'concept' | 'skill' | 'practice' | 'assessment';
  
  // 层级结构
  parentId?: mongoose.Types.ObjectId;
  order: number; // 排序
  level: number; // 层级深度
  
  // 关联资源
  resources: mongoose.Types.ObjectId[]; // 关联的学习资源
  
  // 学习要求
  prerequisites: mongoose.Types.ObjectId[]; // 前置知识点
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // 预计学习时间（分钟）
  
  // 学习目标
  objectives: string[]; // 学习目标
  keywords: string[]; // 关键词
  
  // 状态管理
  status: 'draft' | 'published' | 'archived';
  
  // 统计数据
  stats: {
    learners: number;
    completions: number;
    avgScore: number;
    avgTime: number; // 平均学习时间
  };
  
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgePointSchema: Schema = new Schema({
  knowledgeBase: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'KnowledgeBase', 
    required: true,
    index: true
  },
  title: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 200
  },
  description: { 
    type: String, 
    required: true,
    maxlength: 1000
  },
  content: { 
    type: String, 
    required: true,
    maxlength: 10000
  },
  type: { 
    type: String, 
    enum: ['concept', 'skill', 'practice', 'assessment'],
    required: true,
    index: true
  },
  
  parentId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'KnowledgePoint' 
  },
  order: { 
    type: Number, 
    default: 0,
    index: true
  },
  level: { 
    type: Number, 
    default: 1, 
    min: 1, 
    max: 10 
  },
  
  resources: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'LearningResource' 
  }],
  
  prerequisites: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'KnowledgePoint' 
  }],
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'],
    required: true,
    index: true
  },
  estimatedTime: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 600 
  },
  
  objectives: [{ 
    type: String, 
    maxlength: 200 
  }],
  keywords: [{ 
    type: String, 
    trim: true, 
    maxlength: 50 
  }],
  
  status: { 
    type: String, 
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true
  },
  
  stats: {
    learners: { type: Number, default: 0, min: 0 },
    completions: { type: Number, default: 0, min: 0 },
    avgScore: { type: Number, default: 0, min: 0, max: 100 },
    avgTime: { type: Number, default: 0, min: 0 }
  },
  
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, {
  timestamps: true
});

// 索引
KnowledgePointSchema.index({ knowledgeBase: 1, order: 1 });
KnowledgePointSchema.index({ knowledgeBase: 1, parentId: 1 });
KnowledgePointSchema.index({ type: 1, difficulty: 1 });
KnowledgePointSchema.index({ prerequisites: 1 });

// 学习路径模型
export interface ILearningPath extends Document {
  knowledgeBase: mongoose.Types.ObjectId;
  title: string;
  description: string;
  
  // 路径构成
  knowledgePoints: {
    pointId: mongoose.Types.ObjectId;
    order: number;
    isOptional: boolean; // 是否可选
    estimatedTime: number;
  }[];
  
  // 路径属性
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number; // 总预计时间（分钟）
  
  // 前置条件和目标
  prerequisites: mongoose.Types.ObjectId[]; // 前置知识点或路径
  objectives: string[]; // 学习目标
  
  // 状态管理
  status: 'draft' | 'published' | 'archived';
  isDefault: boolean; // 是否为默认路径
  
  // 统计数据
  stats: {
    learners: number;
    completions: number;
    avgCompletionTime: number;
    avgRating: number;
  };
  
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LearningPathSchema: Schema = new Schema({
  knowledgeBase: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'KnowledgeBase', 
    required: true,
    index: true
  },
  title: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 200
  },
  description: { 
    type: String, 
    required: true,
    maxlength: 1000
  },
  
  knowledgePoints: [{
    pointId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'KnowledgePoint', 
      required: true 
    },
    order: { 
      type: Number, 
      required: true 
    },
    isOptional: { 
      type: Boolean, 
      default: false 
    },
    estimatedTime: { 
      type: Number, 
      required: true 
    }
  }],
  
  difficulty: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true,
    index: true
  },
  estimatedDuration: { 
    type: Number, 
    required: true, 
    min: 1 
  },
  
  prerequisites: [{ 
    type: mongoose.Schema.Types.ObjectId 
  }],
  objectives: [{ 
    type: String, 
    maxlength: 200 
  }],
  
  status: { 
    type: String, 
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true
  },
  isDefault: { 
    type: Boolean, 
    default: false 
  },
  
  stats: {
    learners: { type: Number, default: 0, min: 0 },
    completions: { type: Number, default: 0, min: 0 },
    avgCompletionTime: { type: Number, default: 0, min: 0 },
    avgRating: { type: Number, default: 0, min: 0, max: 5 }
  },
  
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  }
}, {
  timestamps: true
});

// 索引
LearningPathSchema.index({ knowledgeBase: 1, isDefault: -1 });
LearningPathSchema.index({ difficulty: 1, status: 1 });

// 学习进度模型
export interface IKnowledgeProgress extends Document {
  user: mongoose.Types.ObjectId;
  knowledgeBase: mongoose.Types.ObjectId;
  knowledgePoint?: mongoose.Types.ObjectId;
  learningPath?: mongoose.Types.ObjectId;
  
  // 进度数据
  progress: number; // 0-100
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  
  // 学习数据
  startedAt?: Date;
  completedAt?: Date;
  totalTime: number; // 总学习时间（分钟）
  score?: number; // 得分（如果有评估）
  
  // 学习记录
  sessions: {
    startedAt: Date;
    endedAt: Date;
    duration: number; // 分钟
    progress: number; // 本次学习后的进度
  }[];
  
  // 笔记和标记
  notes: string;
  bookmarks: number[]; // 书签位置
  
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeProgressSchema: Schema = new Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  knowledgeBase: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'KnowledgeBase', 
    required: true,
    index: true
  },
  knowledgePoint: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'KnowledgePoint' 
  },
  learningPath: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'LearningPath' 
  },
  
  progress: { 
    type: Number, 
    default: 0, 
    min: 0, 
    max: 100 
  },
  status: { 
    type: String, 
    enum: ['not_started', 'in_progress', 'completed', 'skipped'],
    default: 'not_started',
    index: true
  },
  
  startedAt: { 
    type: Date 
  },
  completedAt: { 
    type: Date 
  },
  totalTime: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  score: { 
    type: Number, 
    min: 0, 
    max: 100 
  },
  
  sessions: [{
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, required: true },
    duration: { type: Number, required: true },
    progress: { type: Number, required: true }
  }],
  
  notes: { 
    type: String,
    maxlength: 5000
  },
  bookmarks: [{ 
    type: Number 
  }]
}, {
  timestamps: true
});

// 索引
KnowledgeProgressSchema.index({ user: 1, knowledgeBase: 1, knowledgePoint: 1 }, { unique: true });
KnowledgeProgressSchema.index({ user: 1, status: 1, updatedAt: -1 });
KnowledgeProgressSchema.index({ knowledgeBase: 1, status: 1 });

export const KnowledgeBase = mongoose.model<IKnowledgeBase>('KnowledgeBase', KnowledgeBaseSchema);
export const LearningPath = mongoose.model<ILearningPath>('LearningPath', LearningPathSchema);
export const KnowledgeProgress = mongoose.model<IKnowledgeProgress>('KnowledgeProgress', KnowledgeProgressSchema); 