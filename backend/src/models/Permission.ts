import mongoose, { Document, Schema } from 'mongoose';

// 权限模型
export interface IPermission extends Document {
  name: string;
  code: string;
  module: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PermissionSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  module: { type: String, required: true }, // 模块：user_management, question_management, data_analysis, etc.
  description: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// 角色模型（支持动态权限组）
export interface IRole extends Document {
  name: string;
  code: string;
  description: string;
  permissions: mongoose.Types.ObjectId[];
  isSystem: boolean; // 是否为系统预设角色
  institution?: mongoose.Types.ObjectId; // 机构自定义角色
  restrictions: {
    maxUsers?: number;
    questionDifficultyLimit?: string[]; // 如只能审核简单题目
    moduleAccess?: string[];
  };
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema: Schema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }],
  isSystem: { type: Boolean, default: false },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution' },
  restrictions: {
    maxUsers: { type: Number },
    questionDifficultyLimit: [{ type: String, enum: ['easy', 'medium', 'hard'] }],
    moduleAccess: [{ type: String }]
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// 用户角色关联模型
export interface IUserRole extends Document {
  user: mongoose.Types.ObjectId;
  role: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  assignedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserRoleSchema: Schema = new Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// 操作日志模型
export interface IOperationLog extends Document {
  user: mongoose.Types.ObjectId;
  action: string;
  module: string;
  target: {
    type: string; // 'user', 'question', 'exam', etc.
    id: mongoose.Types.ObjectId;
    name?: string;
  };
  details: any;
  ip: string;
  userAgent: string;
  result: 'success' | 'failed';
  errorMessage?: string;
  createdAt: Date;
}

const OperationLogSchema: Schema = new Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // create, update, delete, login, etc.
  module: { type: String, required: true }, // user_management, question_management, etc.
  target: {
    type: { type: String, required: true },
    id: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String }
  },
  details: { type: mongoose.Schema.Types.Mixed },
  ip: { type: String, required: true },
  userAgent: { type: String, required: true },
  result: { type: String, enum: ['success', 'failed'], required: true },
  errorMessage: { type: String }
}, {
  timestamps: true
});

// 用户反馈模型
export interface IFeedback extends Document {
  user: mongoose.Types.ObjectId;
  type: 'question_error' | 'suggestion' | 'bug_report' | 'feature_request';
  title: string;
  content: string;
  relatedItem?: {
    type: string;
    id: mongoose.Types.ObjectId;
  };
  status: 'pending' | 'processing' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: mongoose.Types.ObjectId;
  response?: string;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema: Schema = new Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['question_error', 'suggestion', 'bug_report', 'feature_request'],
    required: true 
  },
  title: { type: String, required: true, maxlength: 200 },
  content: { type: String, required: true, maxlength: 2000 },
  relatedItem: {
    type: { type: String },
    id: { type: mongoose.Schema.Types.ObjectId }
  },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'resolved', 'rejected'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  response: { type: String, maxlength: 1000 },
  attachments: [{ type: String }]
}, {
  timestamps: true
});

// 索引
PermissionSchema.index({ module: 1, isActive: 1 });
RoleSchema.index({ institution: 1, isActive: 1 });
UserRoleSchema.index({ user: 1, isActive: 1 });
OperationLogSchema.index({ user: 1, createdAt: -1 });
OperationLogSchema.index({ module: 1, action: 1, createdAt: -1 });
FeedbackSchema.index({ user: 1, status: 1, createdAt: -1 });
FeedbackSchema.index({ type: 1, status: 1, priority: 1 });

export const Permission = mongoose.model<IPermission>('Permission', PermissionSchema);
export const Role = mongoose.model<IRole>('Role', RoleSchema);
export const UserRole = mongoose.model<IUserRole>('UserRole', UserRoleSchema);
export const OperationLog = mongoose.model<IOperationLog>('OperationLog', OperationLogSchema);
export const Feedback = mongoose.model<IFeedback>('Feedback', FeedbackSchema); 