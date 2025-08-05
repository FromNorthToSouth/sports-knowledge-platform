import mongoose, { Schema, Document } from 'mongoose';

// 机构接口
export interface IInstitution extends Document {
  name: string;
  type: 'university' | 'high_school' | 'middle_school' | 'primary_school' | 'training_center' | 'other';
  description: string;
  address?: {
    country: string;
    province: string;
    city: string;
    district: string;
    street: string;
    postalCode: string;
  };
  contact: {
    phone?: string;
    email?: string;
    website?: string;
    wechat?: string;
    qq?: string;
  };
  
  // 机构设置
  settings: {
    maxUsers: number;
    maxClasses: number;
    maxStorage: number; // MB
    enabledFeatures: string[];
    customization: {
      logo?: string;
      primaryColor?: string;
      theme?: string;
      customCSS?: string;
    };
    permissions: {
      allowSelfRegistration: boolean;
      requireApproval: boolean;
      allowGuestAccess: boolean;
      defaultUserRole: 'student' | 'teacher';
    };
    notification: {
      emailEnabled: boolean;
      smsEnabled: boolean;
      pushEnabled: boolean;
      defaultLanguage: string;
    };
  };

  // 管理员用户
  adminUsers: mongoose.Types.ObjectId[];
  
  // 状态管理
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  
  // 统计信息
  statistics: {
    totalUsers: number;
    totalClasses: number;
    totalQuestions: number;
    storageUsed: number; // MB
    lastActivityAt: Date;
  };

  // 创建信息
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  
  // 订阅信息 (如果是付费服务)
  subscription?: {
    plan: 'free' | 'basic' | 'premium' | 'enterprise';
    startDate: Date;
    endDate: Date;
    status: 'active' | 'expired' | 'cancelled';
    features: string[];
  };
}

// 机构数据模型
const InstitutionSchema = new Schema<IInstitution>({
  name: { 
    type: String, 
    required: true, 
    trim: true,
    unique: true,
    maxlength: 100
  },
  type: { 
    type: String, 
    enum: ['university', 'high_school', 'middle_school', 'primary_school', 'training_center', 'other'],
    required: true,
    index: true
  },
  description: { 
    type: String, 
    default: '',
    maxlength: 500
  },
  
  address: {
    country: { type: String, default: '中国' },
    province: { type: String, default: '' },
    city: { type: String, default: '' },
    district: { type: String, default: '' },
    street: { type: String, default: '' },
    postalCode: { type: String, default: '' }
  },
  
  contact: {
    phone: { type: String, trim: true },
    email: { 
      type: String, 
      trim: true, 
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, '请输入有效的邮箱地址']
    },
    website: { type: String, trim: true },
    wechat: { type: String, trim: true },
    qq: { type: String, trim: true }
  },
  
  settings: {
    maxUsers: { 
      type: Number, 
      default: 1000,
      min: 10,
      max: 100000
    },
    maxClasses: { 
      type: Number, 
      default: 100,
      min: 1,
      max: 10000
    },
    maxStorage: { 
      type: Number, 
      default: 1024, // 1GB
      min: 100,
      max: 102400 // 100GB
    },
    enabledFeatures: [{
      type: String,
      enum: ['basic', 'analytics', 'collaboration', 'ai_features', 'video_learning', 'mobile_app', 'api_access', 'white_label']
    }],
    customization: {
      logo: { type: String, default: '' },
      primaryColor: { type: String, default: '#1890ff' },
      theme: { 
        type: String, 
        enum: ['default', 'dark', 'blue', 'green', 'purple'],
        default: 'default'
      },
      customCSS: { type: String, default: '' }
    },
    permissions: {
      allowSelfRegistration: { type: Boolean, default: true },
      requireApproval: { type: Boolean, default: false },
      allowGuestAccess: { type: Boolean, default: false },
      defaultUserRole: { 
        type: String, 
        enum: ['student', 'teacher'],
        default: 'student'
      }
    },
    notification: {
      emailEnabled: { type: Boolean, default: true },
      smsEnabled: { type: Boolean, default: false },
      pushEnabled: { type: Boolean, default: true },
      defaultLanguage: { type: String, default: 'zh-CN' }
    }
  },

  adminUsers: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    index: true
  }],
  
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'suspended', 'pending'],
    default: 'active',
    index: true
  },
  
  statistics: {
    totalUsers: { type: Number, default: 0, min: 0 },
    totalClasses: { type: Number, default: 0, min: 0 },
    totalQuestions: { type: Number, default: 0, min: 0 },
    storageUsed: { type: Number, default: 0, min: 0 },
    lastActivityAt: { type: Date, default: Date.now }
  },

  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true,
    index: true
  },

  subscription: {
    plan: { 
      type: String, 
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    startDate: { type: Date },
    endDate: { type: Date },
    status: { 
      type: String, 
      enum: ['active', 'expired', 'cancelled'],
      default: 'active'
    },
    features: [{ type: String }]
  }
}, {
  timestamps: true
});

// 索引
InstitutionSchema.index({ name: 1 });
InstitutionSchema.index({ type: 1, status: 1 });
InstitutionSchema.index({ createdBy: 1, createdAt: -1 });
InstitutionSchema.index({ 'contact.email': 1 });
InstitutionSchema.index({ 'settings.enabledFeatures': 1 });

// 中间件
InstitutionSchema.pre('save', function(next) {
  // 确保至少包含基础功能
  if (!this.settings.enabledFeatures.includes('basic')) {
    this.settings.enabledFeatures.unshift('basic');
  }
  
  // 更新统计信息的最后活动时间
  this.statistics.lastActivityAt = new Date();
  
  next();
});

// 静态方法
InstitutionSchema.statics.getActiveInstitutions = function() {
  return this.find({ status: 'active' }).populate('adminUsers', 'username email');
};

InstitutionSchema.statics.getInstitutionsByType = function(type: string) {
  return this.find({ type, status: 'active' });
};

// 实例方法
InstitutionSchema.methods.addAdminUser = async function(userId: mongoose.Types.ObjectId) {
  if (!this.adminUsers.includes(userId)) {
    this.adminUsers.push(userId);
    await this.save();
  }
};

InstitutionSchema.methods.removeAdminUser = async function(userId: mongoose.Types.ObjectId) {
  this.adminUsers = this.adminUsers.filter((id: mongoose.Types.ObjectId) => !id.equals(userId));
  await this.save();
};

InstitutionSchema.methods.updateStatistics = async function() {
  const User = mongoose.model('User');
  const Class = mongoose.model('Class');
  
  const [totalUsers, totalClasses] = await Promise.all([
    User.countDocuments({ institution: this._id }),
    Class.countDocuments({ institutionId: this._id })
  ]);

  this.statistics.totalUsers = totalUsers;
  this.statistics.totalClasses = totalClasses;
  this.statistics.lastActivityAt = new Date();
  
  await this.save();
};

// 虚拟字段
InstitutionSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

InstitutionSchema.virtual('displayName').get(function() {
  return `${this.name} (${this.type})`;
});

// 导出模型
export const Institution = mongoose.model<IInstitution>('Institution', InstitutionSchema);

export default Institution; 