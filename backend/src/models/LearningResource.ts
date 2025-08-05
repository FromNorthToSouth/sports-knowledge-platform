import mongoose, { Document, Schema } from 'mongoose';

// 学习资源模型
export interface ILearningResource extends Document {
  title: string;
  description: string;
  type: 'video' | 'audio' | 'document' | 'image';
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration?: number; // 持续时间（分钟）
  fileSize: number; // 文件大小（MB）
  fileUrl: string; // 文件存储路径
  thumbnailUrl?: string; // 缩略图路径
  originalFileName: string; // 原始文件名
  mimeType: string; // 文件MIME类型
  tags: string[];
  
  // 作者信息
  author: mongoose.Types.ObjectId;
  
  // 状态管理
  status: 'draft' | 'pending' | 'published' | 'rejected';
  
  // 审核信息
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewComment?: string;
  
  // 统计数据
  stats: {
    views: number;
    likes: number;
    favorites: number;
    downloads: number;
    rating: number;
    ratingCount: number;
  };
  
  // 元数据
  metadata?: {
    resolution?: string; // 视频分辨率
    bitrate?: number; // 比特率
    sampleRate?: number; // 音频采样率
    pageCount?: number; // 文档页数
    dimensions?: { // 图片尺寸
      width: number;
      height: number;
    };
  };
  
  // 权限控制
  isPublic: boolean;
  allowedInstitutions?: mongoose.Types.ObjectId[]; // 限制访问的机构
  
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LearningResourceSchema: Schema = new Schema({
  title: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 200
  },
  description: { 
    type: String, 
    required: true,
    maxlength: 2000
  },
  type: { 
    type: String, 
    enum: ['video', 'audio', 'document', 'image'],
    required: true 
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
  duration: { 
    type: Number, 
    min: 0,
    max: 600 // 最大10小时
  },
  fileSize: { 
    type: Number, 
    required: true,
    min: 0
  },
  fileUrl: { 
    type: String, 
    required: true 
  },
  thumbnailUrl: { 
    type: String 
  },
  originalFileName: { 
    type: String, 
    required: true 
  },
  mimeType: { 
    type: String, 
    required: true 
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
  
  status: { 
    type: String, 
    enum: ['draft', 'pending', 'published', 'rejected'],
    default: 'draft',
    index: true
  },
  
  reviewedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  reviewedAt: { 
    type: Date 
  },
  reviewComment: { 
    type: String,
    maxlength: 500
  },
  
  stats: {
    views: { type: Number, default: 0, min: 0 },
    likes: { type: Number, default: 0, min: 0 },
    favorites: { type: Number, default: 0, min: 0 },
    downloads: { type: Number, default: 0, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 }
  },
  
  metadata: {
    resolution: { type: String },
    bitrate: { type: Number, min: 0 },
    sampleRate: { type: Number, min: 0 },
    pageCount: { type: Number, min: 0 },
    dimensions: {
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 }
    }
  },
  
  isPublic: { 
    type: Boolean, 
    default: true,
    index: true
  },
  allowedInstitutions: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Institution' 
  }],
  
  publishedAt: { 
    type: Date 
  }
}, {
  timestamps: true
});

// 索引
LearningResourceSchema.index({ type: 1, category: 1, level: 1 });
LearningResourceSchema.index({ status: 1, createdAt: -1 });
LearningResourceSchema.index({ author: 1, status: 1 });
LearningResourceSchema.index({ 'stats.views': -1 });
LearningResourceSchema.index({ 'stats.rating': -1 });
LearningResourceSchema.index({ publishedAt: -1 });
LearningResourceSchema.index({ tags: 1 });

// 文本搜索索引
LearningResourceSchema.index({ 
  title: 'text', 
  description: 'text', 
  tags: 'text' 
});

// 用户互动模型（点赞、收藏、评分）
export interface IResourceInteraction extends Document {
  user: mongoose.Types.ObjectId;
  resource: mongoose.Types.ObjectId;
  type: 'like' | 'favorite' | 'rating' | 'view';
  value?: number; // 用于评分
  createdAt: Date;
}

const ResourceInteractionSchema: Schema = new Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  resource: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'LearningResource', 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['like', 'favorite', 'rating', 'view'],
    required: true 
  },
  value: { 
    type: Number, 
    min: 1, 
    max: 5 
  }
}, {
  timestamps: true
});

// 联合索引确保用户对同一资源的同一类型操作唯一
ResourceInteractionSchema.index({ user: 1, resource: 1, type: 1 }, { unique: true });
ResourceInteractionSchema.index({ resource: 1, type: 1, createdAt: -1 });

// 学习记录模型
export interface ILearningRecord extends Document {
  user: mongoose.Types.ObjectId;
  resource: mongoose.Types.ObjectId;
  
  // 学习进度
  progress: number; // 0-100
  duration: number; // 实际学习时长（分钟）
  completedAt?: Date;
  
  // 学习状态
  status: 'in_progress' | 'completed' | 'paused';
  
  // 学习数据
  startedAt: Date;
  lastAccessedAt: Date;
  accessCount: number;
  
  // 学习笔记
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const LearningRecordSchema: Schema = new Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  resource: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'LearningResource', 
    required: true 
  },
  
  progress: { 
    type: Number, 
    default: 0, 
    min: 0, 
    max: 100 
  },
  duration: { 
    type: Number, 
    default: 0, 
    min: 0 
  },
  completedAt: { 
    type: Date 
  },
  
  status: { 
    type: String, 
    enum: ['in_progress', 'completed', 'paused'],
    default: 'in_progress'
  },
  
  startedAt: { 
    type: Date, 
    default: Date.now 
  },
  lastAccessedAt: { 
    type: Date, 
    default: Date.now 
  },
  accessCount: { 
    type: Number, 
    default: 1, 
    min: 1 
  },
  
  notes: { 
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// 索引
LearningRecordSchema.index({ user: 1, resource: 1 }, { unique: true });
LearningRecordSchema.index({ user: 1, status: 1, lastAccessedAt: -1 });
LearningRecordSchema.index({ resource: 1, status: 1 });

// 资源分类模型
export interface IResourceCategory extends Document {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  parentCategory?: mongoose.Types.ObjectId;
  isActive: boolean;
  sortOrder: number;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ResourceCategorySchema: Schema = new Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    maxlength: 50
  },
  description: { 
    type: String,
    maxlength: 200
  },
  icon: { 
    type: String 
  },
  color: { 
    type: String 
  },
  parentCategory: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ResourceCategory' 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  sortOrder: { 
    type: Number, 
    default: 0 
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
ResourceCategorySchema.index({ isActive: 1, sortOrder: 1 });
ResourceCategorySchema.index({ parentCategory: 1 });

export const LearningResource = mongoose.model<ILearningResource>('LearningResource', LearningResourceSchema);
export const ResourceInteraction = mongoose.model<IResourceInteraction>('ResourceInteraction', ResourceInteractionSchema);
export const LearningRecord = mongoose.model<ILearningRecord>('LearningRecord', LearningRecordSchema);
export const ResourceCategory = mongoose.model<IResourceCategory>('ResourceCategory', ResourceCategorySchema); 