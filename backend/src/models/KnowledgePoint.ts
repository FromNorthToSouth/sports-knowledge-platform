import mongoose, { Schema, Document } from 'mongoose';

// 知识点接口
export interface IKnowledgePoint extends Document {
  title: string;
  content: string;
  summary: string;
  knowledgeBaseId: string;
  parentId?: string;
  level: number;
  order: number;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // 学习预估时间（分钟）
  
  // 内容结构
  sections: Array<{
    id: string;
    type: 'text' | 'image' | 'video' | 'audio' | 'interactive' | 'quiz' | 'exercise';
    title: string;
    content: string;
    metadata: {
      duration?: number;
      fileSize?: number;
      format?: string;
      url?: string;
      options?: any; // 用于交互式内容或测验选项
    };
    order: number;
  }>;

  // 媒体文件
  mediaFiles: Array<{
    id: string;
    type: 'image' | 'video' | 'audio' | 'document';
    title: string;
    description?: string;
    url: string;
    fileId: string;
    size: number;
    format: string;
    thumbnail?: string;
    duration?: number; // 对于音视频文件
    metadata: any;
  }>;

  // 关联关系
  prerequisites: string[]; // 前置知识点ID
  related: string[]; // 相关知识点ID
  children: string[]; // 子知识点ID

  // 学习目标和评估
  objectives: Array<{
    id: string;
    description: string;
    type: 'knowledge' | 'skill' | 'application';
    assessmentCriteria?: string;
  }>;

  exercises: Array<{
    id: string;
    type: 'choice' | 'essay' | 'practice' | 'project';
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    points: number;
    timeLimit?: number;
    content: any; // 具体练习内容
  }>;

  // 版本控制
  version: {
    current: string;
    history: Array<{
      version: string;
      authorId: string;
      authorName: string;
      timestamp: Date;
      changeLog: string;
      changes: Array<{
        field: string;
        oldValue: any;
        newValue: any;
      }>;
    }>;
  };

  // 协作编辑
  collaboration: {
    isLocked: boolean;
    lockedBy?: string;
    lockedAt?: Date;
    lockDuration?: number;
    currentEditors: Array<{
      userId: string;
      username: string;
      joinedAt: Date;
      section?: string; // 正在编辑的部分
    }>;
    pendingChanges: Array<{
      userId: string;
      section: string;
      changes: any;
      timestamp: Date;
      status: 'pending' | 'applied' | 'rejected';
    }>;
  };

  // 质量评估
  quality: {
    completeness: number; // 0-100
    accuracy: number; // 0-100
    clarity: number; // 0-100
    upToDate: number; // 0-100
    overallScore: number; // 0-100
    lastAssessed: Date;
    assessedBy: string;
    issues: Array<{
      type: 'content' | 'format' | 'media' | 'accuracy';
      description: string;
      severity: 'low' | 'medium' | 'high';
      reportedBy: string;
      reportedAt: Date;
      status: 'open' | 'in_progress' | 'resolved';
    }>;
  };

  // 使用统计
  statistics: {
    views: number;
    uniqueViews: number;
    completions: number;
    averageTimeSpent: number;
    rating: number;
    ratingCount: number;
    difficulty: number; // 用户反馈的实际难度
    lastViewed: Date;
    popularityScore: number;
  };

  // 状态管理
  status: 'draft' | 'review' | 'published' | 'archived' | 'deprecated';
  visibility: 'public' | 'private' | 'institution' | 'course';
  
  // 权限设置
  permissions: {
    read: string[]; // 用户ID或角色
    write: string[];
    admin: string[];
  };

  // 自动化功能
  automation: {
    autoUpdate: boolean;
    syncSources: Array<{
      type: 'external_api' | 'document' | 'database';
      url: string;
      syncField: string;
      lastSync: Date;
      status: 'active' | 'inactive' | 'error';
    }>;
    aiSuggestions: Array<{
      type: 'content' | 'structure' | 'media' | 'exercises';
      suggestion: string;
      confidence: number;
      timestamp: Date;
      status: 'pending' | 'accepted' | 'rejected';
    }>;
  };

  // 元数据
  metadata: {
    authorId: string;
    authorName: string;
    reviewers: Array<{
      userId: string;
      username: string;
      reviewDate: Date;
      status: 'approved' | 'changes_requested' | 'rejected';
      comments: string;
    }>;
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date;
    lastModifiedBy: string;
    modificationReason?: string;
    
    // SEO和搜索优化
    searchKeywords: string[];
    searchBoost: number;
    indexedAt?: Date;
    
    // 多语言支持
    language: string;
    translations: Array<{
      language: string;
      translatorId: string;
      translatedAt: Date;
      status: 'in_progress' | 'completed' | 'outdated';
    }>;
  };
}

// 学习路径接口 (扩展版)
export interface IExtendedLearningPath extends Document {
  name: string;
  description: string;
  knowledgeBaseId: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  estimatedDuration: number; // 小时
  
  // 路径结构
  steps: Array<{
    id: string;
    knowledgePointId: string;
    title: string;
    description: string;
    type: 'required' | 'optional' | 'alternative';
    order: number;
    estimatedTime: number;
    prerequisites: string[];
    
    // 完成条件
    completionCriteria: {
      readTime: number; // 最少阅读时间
      exerciseScore: number; // 练习分数要求
      quizScore: number; // 测验分数要求
      customCriteria?: any;
    };
  }>;

  // 个性化设置
  adaptiveSettings: {
    adjustDifficulty: boolean;
    skipKnownContent: boolean;
    recommendSimilar: boolean;
    trackProgress: boolean;
  };

  // 统计数据
  statistics: {
    enrollments: number;
    completions: number;
    averageCompletionTime: number;
    completionRate: number;
    rating: number;
    ratingCount: number;
    dropOffPoints: Array<{
      stepId: string;
      dropOffRate: number;
    }>;
  };

  // 标签和分类
  tags: string[];
  category: string;
  targetAudience: string[];
  
  // 状态和权限
  status: 'draft' | 'published' | 'archived';
  visibility: 'public' | 'private' | 'institution';
  isTemplate: boolean;
  
  // 创建信息
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt: Date;
}

// 知识图谱关系接口
export interface IKnowledgeRelation extends Document {
  sourceId: string;
  targetId: string;
  relationType: 'prerequisite' | 'related' | 'similar' | 'extends' | 'implements' | 'example' | 'application';
  strength: number; // 关系强度 0-1
  confidence: number; // 置信度 0-1
  
  // 关系元数据
  metadata: {
    createdBy: 'user' | 'system' | 'ai';
    creatorId?: string;
    algorithm?: string; // 对于自动创建的关系
    evidence?: Array<{
      type: 'content_similarity' | 'user_behavior' | 'expert_annotation' | 'citation';
      score: number;
      details: any;
    }>;
  };

  // 验证信息
  validation: {
    isVerified: boolean;
    verifiedBy?: string;
    verifiedAt?: Date;
    userFeedback: Array<{
      userId: string;
      feedback: 'helpful' | 'not_helpful' | 'incorrect';
      timestamp: Date;
    }>;
  };

  createdAt: Date;
  updatedAt: Date;
}

// 知识点数据模型
const KnowledgePointSchema = new Schema<IKnowledgePoint>({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  summary: { type: String, required: true, maxlength: 500 },
  knowledgeBaseId: { type: String, required: true, index: true },
  parentId: { type: String, index: true },
  level: { type: Number, required: true, min: 0, max: 10 },
  order: { type: Number, required: true, default: 0 },
  category: { type: String, required: true, index: true },
  tags: [{ type: String, trim: true, lowercase: true }],
  difficulty: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced'], 
    required: true,
    index: true
  },
  estimatedTime: { type: Number, required: true, min: 1 },

  sections: [{
    id: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['text', 'image', 'video', 'audio', 'interactive', 'quiz', 'exercise'], 
      required: true 
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    metadata: {
      duration: { type: Number },
      fileSize: { type: Number },
      format: { type: String },
      url: { type: String },
      options: { type: Schema.Types.Mixed }
    },
    order: { type: Number, required: true }
  }],

  mediaFiles: [{
    id: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['image', 'video', 'audio', 'document'], 
      required: true 
    },
    title: { type: String, required: true },
    description: { type: String },
    url: { type: String, required: true },
    fileId: { type: String, required: true },
    size: { type: Number, required: true },
    format: { type: String, required: true },
    thumbnail: { type: String },
    duration: { type: Number },
    metadata: { type: Schema.Types.Mixed }
  }],

  prerequisites: [{ type: String, index: true }],
  related: [{ type: String, index: true }],
  children: [{ type: String, index: true }],

  objectives: [{
    id: { type: String, required: true },
    description: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['knowledge', 'skill', 'application'], 
      required: true 
    },
    assessmentCriteria: { type: String }
  }],

  exercises: [{
    id: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['choice', 'essay', 'practice', 'project'], 
      required: true 
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: { 
      type: String, 
      enum: ['easy', 'medium', 'hard'], 
      required: true 
    },
    points: { type: Number, required: true, min: 0 },
    timeLimit: { type: Number, min: 1 },
    content: { type: Schema.Types.Mixed, required: true }
  }],

  version: {
    current: { type: String, required: true, default: '1.0' },
    history: [{
      version: { type: String, required: true },
      authorId: { type: String, required: true },
      authorName: { type: String, required: true },
      timestamp: { type: Date, required: true },
      changeLog: { type: String, required: true },
      changes: [{
        field: { type: String, required: true },
        oldValue: { type: Schema.Types.Mixed },
        newValue: { type: Schema.Types.Mixed }
      }]
    }]
  },

  collaboration: {
    isLocked: { type: Boolean, default: false },
    lockedBy: { type: String },
    lockedAt: { type: Date },
    lockDuration: { type: Number, default: 30 }, // 分钟
    currentEditors: [{
      userId: { type: String, required: true },
      username: { type: String, required: true },
      joinedAt: { type: Date, required: true, default: Date.now },
      section: { type: String }
    }],
    pendingChanges: [{
      userId: { type: String, required: true },
      section: { type: String, required: true },
      changes: { type: Schema.Types.Mixed, required: true },
      timestamp: { type: Date, required: true, default: Date.now },
      status: { 
        type: String, 
        enum: ['pending', 'applied', 'rejected'], 
        default: 'pending' 
      }
    }]
  },

  quality: {
    completeness: { type: Number, min: 0, max: 100, default: 0 },
    accuracy: { type: Number, min: 0, max: 100, default: 0 },
    clarity: { type: Number, min: 0, max: 100, default: 0 },
    upToDate: { type: Number, min: 0, max: 100, default: 0 },
    overallScore: { type: Number, min: 0, max: 100, default: 0 },
    lastAssessed: { type: Date },
    assessedBy: { type: String },
    issues: [{
      type: { 
        type: String, 
        enum: ['content', 'format', 'media', 'accuracy'], 
        required: true 
      },
      description: { type: String, required: true },
      severity: { 
        type: String, 
        enum: ['low', 'medium', 'high'], 
        required: true 
      },
      reportedBy: { type: String, required: true },
      reportedAt: { type: Date, required: true, default: Date.now },
      status: { 
        type: String, 
        enum: ['open', 'in_progress', 'resolved'], 
        default: 'open' 
      }
    }]
  },

  statistics: {
    views: { type: Number, default: 0 },
    uniqueViews: { type: Number, default: 0 },
    completions: { type: Number, default: 0 },
    averageTimeSpent: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    difficulty: { type: Number, default: 0, min: 0, max: 5 },
    lastViewed: { type: Date },
    popularityScore: { type: Number, default: 0 }
  },

  status: { 
    type: String, 
    enum: ['draft', 'review', 'published', 'archived', 'deprecated'], 
    default: 'draft',
    index: true
  },
  visibility: { 
    type: String, 
    enum: ['public', 'private', 'institution', 'course'], 
    default: 'private',
    index: true
  },

  permissions: {
    read: [{ type: String }],
    write: [{ type: String }],
    admin: [{ type: String }]
  },

  automation: {
    autoUpdate: { type: Boolean, default: false },
    syncSources: [{
      type: { 
        type: String, 
        enum: ['external_api', 'document', 'database'], 
        required: true 
      },
      url: { type: String, required: true },
      syncField: { type: String, required: true },
      lastSync: { type: Date },
      status: { 
        type: String, 
        enum: ['active', 'inactive', 'error'], 
        default: 'active' 
      }
    }],
    aiSuggestions: [{
      type: { 
        type: String, 
        enum: ['content', 'structure', 'media', 'exercises'], 
        required: true 
      },
      suggestion: { type: String, required: true },
      confidence: { type: Number, min: 0, max: 1, required: true },
      timestamp: { type: Date, required: true, default: Date.now },
      status: { 
        type: String, 
        enum: ['pending', 'accepted', 'rejected'], 
        default: 'pending' 
      }
    }]
  },

  metadata: {
    authorId: { type: String, required: true, index: true },
    authorName: { type: String, required: true },
    reviewers: [{
      userId: { type: String, required: true },
      username: { type: String, required: true },
      reviewDate: { type: Date, required: true },
      status: { 
        type: String, 
        enum: ['approved', 'changes_requested', 'rejected'], 
        required: true 
      },
      comments: { type: String, required: true }
    }],
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now },
    publishedAt: { type: Date },
    lastModifiedBy: { type: String, required: true },
    modificationReason: { type: String },
    
    searchKeywords: [{ type: String, lowercase: true }],
    searchBoost: { type: Number, default: 1.0, min: 0, max: 10 },
    indexedAt: { type: Date },
    
    language: { type: String, default: 'zh-CN' },
    translations: [{
      language: { type: String, required: true },
      translatorId: { type: String, required: true },
      translatedAt: { type: Date, required: true },
      status: { 
        type: String, 
        enum: ['in_progress', 'completed', 'outdated'], 
        required: true 
      }
    }]
  }
});

// 学习路径数据模型
const LearningPathSchema = new Schema<IExtendedLearningPath>({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  knowledgeBaseId: { type: String, required: true, index: true },
  difficulty: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced', 'mixed'], 
    required: true 
  },
  estimatedDuration: { type: Number, required: true, min: 1 },

  steps: [{
    id: { type: String, required: true },
    knowledgePointId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['required', 'optional', 'alternative'], 
      required: true 
    },
    order: { type: Number, required: true },
    estimatedTime: { type: Number, required: true, min: 1 },
    prerequisites: [{ type: String }],
    
    completionCriteria: {
      readTime: { type: Number, required: true, min: 0 },
      exerciseScore: { type: Number, required: true, min: 0, max: 100 },
      quizScore: { type: Number, required: true, min: 0, max: 100 },
      customCriteria: { type: Schema.Types.Mixed }
    }
  }],

  adaptiveSettings: {
    adjustDifficulty: { type: Boolean, default: true },
    skipKnownContent: { type: Boolean, default: false },
    recommendSimilar: { type: Boolean, default: true },
    trackProgress: { type: Boolean, default: true }
  },

  statistics: {
    enrollments: { type: Number, default: 0 },
    completions: { type: Number, default: 0 },
    averageCompletionTime: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    dropOffPoints: [{
      stepId: { type: String, required: true },
      dropOffRate: { type: Number, required: true, min: 0, max: 100 }
    }]
  },

  tags: [{ type: String, trim: true, lowercase: true }],
  category: { type: String, required: true },
  targetAudience: [{ type: String }],
  
  status: { 
    type: String, 
    enum: ['draft', 'published', 'archived'], 
    default: 'draft' 
  },
  visibility: { 
    type: String, 
    enum: ['public', 'private', 'institution'], 
    default: 'private' 
  },
  isTemplate: { type: Boolean, default: false },
  
  authorId: { type: String, required: true },
  authorName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 知识关系数据模型
const KnowledgeRelationSchema = new Schema<IKnowledgeRelation>({
  sourceId: { type: String, required: true, index: true },
  targetId: { type: String, required: true, index: true },
  relationType: { 
    type: String, 
    enum: ['prerequisite', 'related', 'similar', 'extends', 'implements', 'example', 'application'], 
    required: true,
    index: true
  },
  strength: { type: Number, required: true, min: 0, max: 1 },
  confidence: { type: Number, required: true, min: 0, max: 1 },

  metadata: {
    createdBy: { 
      type: String, 
      enum: ['user', 'system', 'ai'], 
      required: true 
    },
    creatorId: { type: String },
    algorithm: { type: String },
    evidence: [{
      type: { 
        type: String, 
        enum: ['content_similarity', 'user_behavior', 'expert_annotation', 'citation'], 
        required: true 
      },
      score: { type: Number, required: true, min: 0, max: 1 },
      details: { type: Schema.Types.Mixed }
    }]
  },

  validation: {
    isVerified: { type: Boolean, default: false },
    verifiedBy: { type: String },
    verifiedAt: { type: Date },
    userFeedback: [{
      userId: { type: String, required: true },
      feedback: { 
        type: String, 
        enum: ['helpful', 'not_helpful', 'incorrect'], 
        required: true 
      },
      timestamp: { type: Date, required: true, default: Date.now }
    }]
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 添加复合索引
KnowledgePointSchema.index({ knowledgeBaseId: 1, status: 1 });
KnowledgePointSchema.index({ 'metadata.authorId': 1, 'metadata.createdAt': -1 });
KnowledgePointSchema.index({ tags: 1, difficulty: 1 });
KnowledgePointSchema.index({ category: 1, level: 1 });
KnowledgePointSchema.index({ 'statistics.popularityScore': -1 });
KnowledgePointSchema.index({ 'metadata.searchKeywords': 'text', title: 'text', content: 'text' });

LearningPathSchema.index({ knowledgeBaseId: 1, status: 1 });
LearningPathSchema.index({ authorId: 1, createdAt: -1 });
LearningPathSchema.index({ tags: 1, difficulty: 1 });

KnowledgeRelationSchema.index({ sourceId: 1, relationType: 1 });
KnowledgeRelationSchema.index({ targetId: 1, relationType: 1 });
KnowledgeRelationSchema.index({ sourceId: 1, targetId: 1 }, { unique: true });

// 中间件
KnowledgePointSchema.pre('save', function(next) {
  this.metadata.updatedAt = new Date();
  
  // 更新版本历史
  if (this.isModified() && !this.isNew) {
    const changes: Array<{
      field: string;
      oldValue: any;
      newValue: any;
    }> = [];
    const modifiedPaths = this.modifiedPaths();
    
    modifiedPaths.forEach(path => {
      if (path !== 'metadata.updatedAt' && path !== 'version.history') {
        changes.push({
          field: path,
          oldValue: null, // 简化处理，实际项目中可考虑使用其他方法获取原值
          newValue: this.get(path)
        });
      }
    });

    if (changes.length > 0) {
      this.version.history.push({
        version: this.version.current,
        authorId: this.metadata.lastModifiedBy,
        authorName: this.metadata.authorName,
        timestamp: new Date(),
        changeLog: this.metadata.modificationReason || '更新内容',
        changes
      });
    }
  }
  
  // 计算质量分数
  if (this.isModified('quality')) {
    const { completeness, accuracy, clarity, upToDate } = this.quality;
    this.quality.overallScore = Math.round((completeness + accuracy + clarity + upToDate) / 4);
  }
  
  next();
});

LearningPathSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // 计算完成率
  if (this.statistics.enrollments > 0) {
    this.statistics.completionRate = (this.statistics.completions / this.statistics.enrollments) * 100;
  }
  
  next();
});

KnowledgeRelationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 导出模型
export const KnowledgePoint = mongoose.model<IKnowledgePoint>('KnowledgePoint', KnowledgePointSchema);
export const KnowledgeRelation = mongoose.model<IKnowledgeRelation>('KnowledgeRelation', KnowledgeRelationSchema);

export default KnowledgePoint; 