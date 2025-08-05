import mongoose, { Schema, Document } from 'mongoose';

// 通知接口
export interface INotification extends Document {
  title: string;
  content: string;
  type: 'system' | 'assignment' | 'exam' | 'grade' | 'announcement' | 'achievement' | 'reminder' | 'warning';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  senderId?: string;
  senderName?: string;
  senderType: 'system' | 'user' | 'admin';
  recipients: Array<{
    userId: string;
    username: string;
    readAt?: Date;
    acknowledged?: boolean;
    acknowledgedAt?: Date;
    deliveryStatus: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
    deliveryChannels: Array<{
      channel: 'web' | 'email' | 'sms' | 'push';
      status: 'pending' | 'sent' | 'delivered' | 'failed';
      sentAt?: Date;
      deliveredAt?: Date;
      error?: string;
    }>;
  }>;
  targetAudience: {
    type: 'all' | 'role' | 'institution' | 'class' | 'user' | 'custom';
    criteria?: {
      roles?: string[];
      institutionIds?: string[];
      classIds?: string[];
      userIds?: string[];
      tags?: string[];
      conditions?: any;
    };
  };
  schedule: {
    sendAt?: Date;
    expiresAt?: Date;
    recurring?: {
      enabled: boolean;
      pattern: 'daily' | 'weekly' | 'monthly' | 'custom';
      interval?: number;
      endDate?: Date;
      daysOfWeek?: number[];
      monthDay?: number;
    };
  };
  channels: {
    web: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  settings: {
    requireAcknowledgment: boolean;
    allowReply: boolean;
    trackOpening: boolean;
    autoExpire: boolean;
    silent: boolean;
  };
  attachments?: Array<{
    type: 'file' | 'link' | 'image';
    title: string;
    url: string;
    fileId?: string;
    size?: number;
  }>;
  actions?: Array<{
    id: string;
    label: string;
    type: 'link' | 'api' | 'download';
    url?: string;
    method?: string;
    data?: any;
    style: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  }>;
  statistics: {
    totalRecipients: number;
    sentCount: number;
    deliveredCount: number;
    readCount: number;
    acknowledgedCount: number;
    failedCount: number;
    openRate: number;
    responseRate: number;
  };
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled' | 'expired';
  metadata: {
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    sentAt?: Date;
    templateId?: string;
    batchId?: string;
    source?: {
      module: string;
      action: string;
      resourceId?: string;
    };
  };
}

// 通知模板接口
export interface INotificationTemplate extends Document {
  name: string;
  description: string;
  category: string;
  type: 'system' | 'assignment' | 'exam' | 'grade' | 'announcement' | 'achievement' | 'reminder' | 'warning';
  template: {
    title: string;
    content: string;
    variables: Array<{
      name: string;
      type: 'string' | 'number' | 'date' | 'boolean' | 'object';
      required: boolean;
      defaultValue?: any;
      description?: string;
    }>;
  };
  channels: {
    web: {
      enabled: boolean;
      template?: string;
    };
    email: {
      enabled: boolean;
      subject?: string;
      template?: string;
      htmlTemplate?: string;
    };
    sms: {
      enabled: boolean;
      template?: string;
    };
    push: {
      enabled: boolean;
      template?: string;
      icon?: string;
    };
  };
  settings: {
    requireAcknowledgment: boolean;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    autoExpire: boolean;
    expiryHours?: number;
  };
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// 通知订阅设置接口
export interface INotificationSubscription extends Document {
  userId: string;
  preferences: {
    web: {
      enabled: boolean;
      types: string[];
      quiet: {
        enabled: boolean;
        startTime?: string;
        endTime?: string;
      };
    };
    email: {
      enabled: boolean;
      types: string[];
      frequency: 'immediate' | 'daily' | 'weekly' | 'never';
      digest: boolean;
      digestTime?: string;
    };
    sms: {
      enabled: boolean;
      types: string[];
      urgent: boolean;
    };
    push: {
      enabled: boolean;
      types: string[];
      sound: boolean;
      vibration: boolean;
    };
  };
  filters: Array<{
    type: string;
    criteria: any;
    action: 'allow' | 'block';
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// 通知数据模型
const NotificationSchema = new Schema<INotification>({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['system', 'assignment', 'exam', 'grade', 'announcement', 'achievement', 'reminder', 'warning'], 
    required: true 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  category: { type: String, required: true },
  senderId: { type: String },
  senderName: { type: String },
  senderType: { 
    type: String, 
    enum: ['system', 'user', 'admin'], 
    default: 'system' 
  },
  recipients: [{
    userId: { type: String, required: true },
    username: { type: String, required: true },
    readAt: { type: Date },
    acknowledged: { type: Boolean, default: false },
    acknowledgedAt: { type: Date },
    deliveryStatus: { 
      type: String, 
      enum: ['pending', 'sent', 'delivered', 'failed', 'read'], 
      default: 'pending' 
    },
    deliveryChannels: [{
      channel: { 
        type: String, 
        enum: ['web', 'email', 'sms', 'push'], 
        required: true 
      },
      status: { 
        type: String, 
        enum: ['pending', 'sent', 'delivered', 'failed'], 
        default: 'pending' 
      },
      sentAt: { type: Date },
      deliveredAt: { type: Date },
      error: { type: String }
    }]
  }],
  targetAudience: {
    type: { 
      type: String, 
      enum: ['all', 'role', 'institution', 'class', 'user', 'custom'], 
      required: true 
    },
    criteria: {
      roles: [{ type: String }],
      institutionIds: [{ type: String }],
      classIds: [{ type: String }],
      userIds: [{ type: String }],
      tags: [{ type: String }],
      conditions: { type: Schema.Types.Mixed }
    }
  },
  schedule: {
    sendAt: { type: Date },
    expiresAt: { type: Date },
    recurring: {
      enabled: { type: Boolean, default: false },
      pattern: { 
        type: String, 
        enum: ['daily', 'weekly', 'monthly', 'custom'] 
      },
      interval: { type: Number, min: 1 },
      endDate: { type: Date },
      daysOfWeek: [{ type: Number, min: 0, max: 6 }],
      monthDay: { type: Number, min: 1, max: 31 }
    }
  },
  channels: {
    web: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: false }
  },
  settings: {
    requireAcknowledgment: { type: Boolean, default: false },
    allowReply: { type: Boolean, default: false },
    trackOpening: { type: Boolean, default: true },
    autoExpire: { type: Boolean, default: false },
    silent: { type: Boolean, default: false }
  },
  attachments: [{
    type: { 
      type: String, 
      enum: ['file', 'link', 'image'], 
      required: true 
    },
    title: { type: String, required: true },
    url: { type: String, required: true },
    fileId: { type: String },
    size: { type: Number }
  }],
  actions: [{
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['link', 'api', 'download'], 
      required: true 
    },
    url: { type: String },
    method: { type: String },
    data: { type: Schema.Types.Mixed },
    style: { 
      type: String, 
      enum: ['primary', 'secondary', 'success', 'warning', 'danger'], 
      default: 'primary' 
    }
  }],
  statistics: {
    totalRecipients: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    deliveredCount: { type: Number, default: 0 },
    readCount: { type: Number, default: 0 },
    acknowledgedCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    openRate: { type: Number, default: 0 },
    responseRate: { type: Number, default: 0 }
  },
  status: { 
    type: String, 
    enum: ['draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled', 'expired'], 
    default: 'draft' 
  },
  metadata: {
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    sentAt: { type: Date },
    templateId: { type: String },
    batchId: { type: String },
    source: {
      module: { type: String },
      action: { type: String },
      resourceId: { type: String }
    }
  }
});

// 通知模板数据模型
const NotificationTemplateSchema = new Schema<INotificationTemplate>({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['system', 'assignment', 'exam', 'grade', 'announcement', 'achievement', 'reminder', 'warning'], 
    required: true 
  },
  template: {
    title: { type: String, required: true },
    content: { type: String, required: true },
    variables: [{
      name: { type: String, required: true },
      type: { 
        type: String, 
        enum: ['string', 'number', 'date', 'boolean', 'object'], 
        required: true 
      },
      required: { type: Boolean, default: false },
      defaultValue: { type: Schema.Types.Mixed },
      description: { type: String }
    }]
  },
  channels: {
    web: {
      enabled: { type: Boolean, default: true },
      template: { type: String }
    },
    email: {
      enabled: { type: Boolean, default: false },
      subject: { type: String },
      template: { type: String },
      htmlTemplate: { type: String }
    },
    sms: {
      enabled: { type: Boolean, default: false },
      template: { type: String }
    },
    push: {
      enabled: { type: Boolean, default: false },
      template: { type: String },
      icon: { type: String }
    }
  },
  settings: {
    requireAcknowledgment: { type: Boolean, default: false },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'urgent'], 
      default: 'medium' 
    },
    autoExpire: { type: Boolean, default: false },
    expiryHours: { type: Number, min: 1, max: 8760 }
  },
  isActive: { type: Boolean, default: true },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 通知订阅设置数据模型
const NotificationSubscriptionSchema = new Schema<INotificationSubscription>({
  userId: { type: String, required: true, unique: true },
  preferences: {
    web: {
      enabled: { type: Boolean, default: true },
      types: [{ type: String }],
      quiet: {
        enabled: { type: Boolean, default: false },
        startTime: { type: String },
        endTime: { type: String }
      }
    },
    email: {
      enabled: { type: Boolean, default: true },
      types: [{ type: String }],
      frequency: { 
        type: String, 
        enum: ['immediate', 'daily', 'weekly', 'never'], 
        default: 'immediate' 
      },
      digest: { type: Boolean, default: false },
      digestTime: { type: String, default: '08:00' }
    },
    sms: {
      enabled: { type: Boolean, default: false },
      types: [{ type: String }],
      urgent: { type: Boolean, default: true }
    },
    push: {
      enabled: { type: Boolean, default: true },
      types: [{ type: String }],
      sound: { type: Boolean, default: true },
      vibration: { type: Boolean, default: true }
    }
  },
  filters: [{
    type: { type: String, required: true },
    criteria: { type: Schema.Types.Mixed, required: true },
    action: { 
      type: String, 
      enum: ['allow', 'block'], 
      required: true 
    }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 添加索引
NotificationSchema.index({ status: 1, 'schedule.sendAt': 1 });
NotificationSchema.index({ 'recipients.userId': 1, status: 1 });
NotificationSchema.index({ type: 1, priority: 1 });
NotificationSchema.index({ 'metadata.createdAt': -1 });
NotificationSchema.index({ 'targetAudience.criteria.roles': 1 });
NotificationSchema.index({ 'targetAudience.criteria.institutionIds': 1 });
NotificationSchema.index({ 'targetAudience.criteria.classIds': 1 });

NotificationTemplateSchema.index({ type: 1, category: 1 });
NotificationTemplateSchema.index({ isActive: 1 });

NotificationSubscriptionSchema.index({ userId: 1 });

// 中间件
NotificationSchema.pre('save', function(next) {
  this.metadata.updatedAt = new Date();
  
  // 更新统计信息
  this.statistics.totalRecipients = this.recipients.length;
  this.statistics.sentCount = this.recipients.reduce((count, r) => 
    r.deliveryStatus !== 'pending' ? count + 1 : count, 0
  );
  this.statistics.deliveredCount = this.recipients.reduce((count, r) => 
    r.deliveryStatus === 'delivered' || r.deliveryStatus === 'read' ? count + 1 : count, 0
  );
  this.statistics.readCount = this.recipients.reduce((count, r) => 
    r.deliveryStatus === 'read' ? count + 1 : count, 0
  );
  this.statistics.acknowledgedCount = this.recipients.filter(r => r.acknowledged).length;
  this.statistics.failedCount = this.recipients.reduce((count, r) => 
    r.deliveryStatus === 'failed' ? count + 1 : count, 0
  );
  
  // 计算比率
  if (this.statistics.totalRecipients > 0) {
    this.statistics.openRate = (this.statistics.readCount / this.statistics.totalRecipients) * 100;
    this.statistics.responseRate = (this.statistics.acknowledgedCount / this.statistics.totalRecipients) * 100;
  }
  
  next();
});

NotificationTemplateSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

NotificationSubscriptionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 导出模型
export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
export const NotificationTemplate = mongoose.model<INotificationTemplate>('NotificationTemplate', NotificationTemplateSchema);
export const NotificationSubscription = mongoose.model<INotificationSubscription>('NotificationSubscription', NotificationSubscriptionSchema);

export default Notification; 