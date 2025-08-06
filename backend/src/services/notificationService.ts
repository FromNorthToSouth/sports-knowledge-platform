import { Notification, NotificationTemplate, NotificationSubscription, INotification } from '../models/Notification';
import User from '../models/User';
import { Class } from '../models/Class';
// import emailService from './emailService';
// import websocketService from './websocketService';
// import smsService from './smsService';

interface NotificationData {
  title: string;
  content: string;
  type: 'system' | 'assignment' | 'exam' | 'grade' | 'announcement' | 'achievement' | 'reminder' | 'warning';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  senderId?: string;
  senderName?: string;
  recipients?: Array<{
    userId: string;
    role?: string;
    username?: string;
  }>;
  targetAudience: {
    type: 'all' | 'role' | 'institution' | 'class' | 'user' | 'custom';
    criteria?: any;
  };
  channels?: {
    web?: boolean;
    email?: boolean;
    sms?: boolean;
    push?: boolean;
  };
  schedule?: {
    sendAt?: Date;
    expiresAt?: Date;
  };
  settings?: {
    requireAcknowledgment?: boolean;
    allowReply?: boolean;
    trackOpening?: boolean;
    autoExpire?: boolean;
    silent?: boolean;
  };
  attachments?: Array<{
    type: 'file' | 'link' | 'image';
    title: string;
    url: string;
    fileId?: string;
  }>;
  actions?: Array<{
    id: string;
    label: string;
    type: 'link' | 'api' | 'download';
    url?: string;
    method?: string;
    data?: any;
    style?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  }>;
  templateId?: string;
  variables?: any;
  metadata?: any;
}

class NotificationService {
  // 创建通知
  async createNotification(data: NotificationData, createdBy: string): Promise<INotification> {
    try {
      // 如果使用模板，先处理模板
      let notificationData = { ...data };
      
      if (data.templateId && data.variables) {
        const template = await NotificationTemplate.findById(data.templateId);
        if (template) {
          notificationData = this.processTemplate(template, data.variables);
        }
      }

      // 获取目标用户列表
      const recipients = await this.getRecipients(data.targetAudience);

      // 创建通知
      const notification = new Notification({
        title: notificationData.title,
        content: notificationData.content,
        type: notificationData.type,
        priority: notificationData.priority || 'medium',
        category: notificationData.category,
        senderId: notificationData.senderId,
        senderName: notificationData.senderName,
        senderType: notificationData.senderId ? 'user' : 'system',
        recipients: recipients.map(user => ({
          userId: user.id,
          username: user.username,
          deliveryStatus: 'pending',
          deliveryChannels: this.getDeliveryChannels(notificationData.channels || { web: true })
        })),
        targetAudience: data.targetAudience,
        schedule: {
          sendAt: data.schedule?.sendAt || new Date(),
          expiresAt: data.schedule?.expiresAt
        },
        channels: {
          web: data.channels?.web ?? true,
          email: data.channels?.email ?? false,
          sms: data.channels?.sms ?? false,
          push: data.channels?.push ?? false
        },
        settings: {
          requireAcknowledgment: data.settings?.requireAcknowledgment ?? false,
          allowReply: data.settings?.allowReply ?? false,
          trackOpening: data.settings?.trackOpening ?? true,
          autoExpire: data.settings?.autoExpire ?? false,
          silent: data.settings?.silent ?? false
        },
        attachments: data.attachments || [],
        actions: data.actions || [],
        status: data.schedule?.sendAt && data.schedule.sendAt > new Date() ? 'scheduled' : 'draft',
        metadata: {
          createdBy,
          createdAt: new Date(),
          updatedAt: new Date(),
          templateId: data.templateId
        }
      });

      const savedNotification = await notification.save();

      // 如果是立即发送，开始发送流程
      if (!data.schedule?.sendAt || data.schedule.sendAt <= new Date()) {
        await this.sendNotification(savedNotification._id.toString());
      }

      return savedNotification;
    } catch (error) {
      console.error('创建通知失败:', error);
      throw error;
    }
  }

  // 发送通知
  async sendNotification(notificationId: string): Promise<void> {
    try {
      const notification = await Notification.findById(notificationId);
      if (!notification) {
        throw new Error('通知不存在');
      }

      if (notification.status !== 'draft' && notification.status !== 'scheduled') {
        throw new Error('通知状态不允许发送');
      }

      // 更新状态为发送中
      notification.status = 'sending';
      notification.metadata.sentAt = new Date();
      await notification.save();

      // 并行发送到不同渠道
      const sendPromises = [];

      for (const recipient of notification.recipients) {
        // 获取用户通知偏好
        const subscription = await this.getUserSubscription(recipient.userId);
        
        for (const channel of recipient.deliveryChannels) {
          if (this.shouldSendToChannel(notification, channel.channel, subscription)) {
            sendPromises.push(
              this.sendToChannel(notification, recipient, channel)
                .catch(error => {
                  console.error(`发送到 ${channel.channel} 失败:`, error);
                  channel.status = 'failed';
                  channel.error = error.message;
                })
            );
          }
        }
      }

      // 等待所有发送完成
      await Promise.allSettled(sendPromises);

      // 更新通知状态
      const hasFailures = notification.recipients.some(r => 
        r.deliveryChannels.some(c => c.status === 'failed')
      );
      
      notification.status = hasFailures ? 'failed' : 'sent';
      await notification.save();

    } catch (error: any) {
      console.error('发送通知失败:', error);
      throw error;
    }
  }

  // 批量发送通知
  async sendBulkNotification(data: {
    recipients: Array<{ userId: string; role?: string }>;
    title: string;
    content: string;
    type: 'system' | 'assignment' | 'exam' | 'grade' | 'announcement' | 'achievement' | 'reminder' | 'warning';
    priority?: 'low' | 'medium' | 'high';
    category?: string;
    targetAudience?: {
      type: 'all' | 'role' | 'institution' | 'class' | 'user' | 'custom';
      criteria?: any;
    };
    metadata?: any;
    channels?: Array<'in_app' | 'email' | 'sms' | 'push'>;
  }): Promise<void> {
    try {
      const defaultChannels = data.channels || ['in_app', 'email'];
      
      // 创建批量通知
      const notification = await this.createNotification({
        title: data.title,
        content: data.content,
        type: data.type,
        priority: data.priority || 'medium',
        category: data.category || 'system',
        targetAudience: data.targetAudience || { type: 'custom' },
        recipients: data.recipients.map(recipient => ({
          userId: recipient.userId,
          role: recipient.role || 'student',
          deliveryChannels: defaultChannels.map(channel => ({
            channel,
            status: 'pending' as const
          }))
        })),
        metadata: data.metadata || {},
        schedule: {
          sendAt: new Date() // 立即发送
        }
      }, 'system');

      // 立即发送通知
      await this.sendNotification(notification._id.toString());
    } catch (error: any) {
      console.error('批量发送通知失败:', error);
      throw error;
    }
  }

  // 发送到指定渠道
  private async sendToChannel(
    notification: INotification, 
    recipient: any, 
    channel: any
  ): Promise<void> {
    try {
      channel.status = 'sending';
      channel.sentAt = new Date();

             switch (channel.channel) {
         case 'web':
           // TODO: 实现WebSocket实时通知
           console.log(`发送Web通知给用户 ${recipient.userId}: ${notification.title}`);
           break;

         case 'email':
           // TODO: 实现邮件通知
           console.log(`发送邮件通知给用户 ${recipient.userId}: ${notification.title}`);
           break;

         case 'sms':
           // TODO: 实现短信通知
           console.log(`发送短信通知给用户 ${recipient.userId}: ${notification.title}`);
           break;

         case 'push':
           // TODO: 实现推送通知
           console.log('推送通知功能待实现');
           break;

         default:
           throw new Error(`不支持的通知渠道: ${channel.channel}`);
       }

      channel.status = 'delivered';
      channel.deliveredAt = new Date();
      recipient.deliveryStatus = 'delivered';
      
         } catch (error: any) {
       channel.status = 'failed';
       channel.error = error.message;
       throw error;
     }
  }

  // 获取目标用户列表
  private async getRecipients(targetAudience: any): Promise<any[]> {
    let users: any[] = [];

    switch (targetAudience.type) {
      case 'all':
        users = await User.find({ status: 'active' }).select('_id username email').lean();
        break;

      case 'role':
        if (targetAudience.criteria?.roles) {
          users = await User.find({
            role: { $in: targetAudience.criteria.roles },
            status: 'active'
          }).select('_id username email').lean();
        }
        break;

      case 'institution':
        if (targetAudience.criteria?.institutionIds) {
          users = await User.find({
            institutionId: { $in: targetAudience.criteria.institutionIds },
            status: 'active'
          }).select('_id username email').lean();
        }
        break;

      case 'class':
        if (targetAudience.criteria?.classIds) {
          const classes = await Class.find({
            _id: { $in: targetAudience.criteria.classIds }
          }).select('students').lean();
          
          const userIds = classes.flatMap(cls => 
            cls.students.map(s => s.userId)
          );
          
          users = await User.find({
            _id: { $in: userIds },
            status: 'active'
          }).select('_id username email').lean();
        }
        break;

      case 'user':
        if (targetAudience.criteria?.userIds) {
          users = await User.find({
            _id: { $in: targetAudience.criteria.userIds },
            status: 'active'
          }).select('_id username email').lean();
        }
        break;

      case 'custom':
        // 实现自定义条件查询
        if (targetAudience.criteria?.conditions) {
          users = await User.find({
            ...targetAudience.criteria.conditions,
            status: 'active'
          }).select('_id username email').lean();
        }
        break;

      default:
        throw new Error(`不支持的目标受众类型: ${targetAudience.type}`);
    }

    return users.map(user => ({
      id: user._id.toString(),
      username: user.username,
      email: user.email
    }));
  }

  // 获取用户通知订阅设置
  private async getUserSubscription(userId: string): Promise<any> {
    let subscription = await NotificationSubscription.findOne({ userId });
    
    if (!subscription) {
      // 创建默认订阅设置
      subscription = new NotificationSubscription({
        userId,
        preferences: {
          web: { enabled: true, types: [] },
          email: { enabled: true, types: [], frequency: 'immediate' },
          sms: { enabled: false, types: [], urgent: true },
          push: { enabled: true, types: [], sound: true, vibration: true }
        },
        filters: []
      });
      await subscription.save();
    }
    
    return subscription;
  }

  // 检查是否应该发送到指定渠道
  private shouldSendToChannel(
    notification: INotification, 
    channel: string, 
    subscription: any
  ): boolean {
    const channelPrefs = subscription.preferences[channel];
    
    if (!channelPrefs || !channelPrefs.enabled) {
      return false;
    }

    // 检查通知类型过滤
    if (channelPrefs.types && channelPrefs.types.length > 0) {
      if (!channelPrefs.types.includes(notification.type)) {
        return false;
      }
    }

    // 检查紧急通知
    if (channel === 'sms' && channelPrefs.urgent) {
      return notification.priority === 'urgent';
    }

    // 检查静默时间
    if (channel === 'web' && channelPrefs.quiet?.enabled) {
      const now = new Date();
      const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                         now.getMinutes().toString().padStart(2, '0');
      
      if (channelPrefs.quiet.startTime && channelPrefs.quiet.endTime) {
        if (currentTime >= channelPrefs.quiet.startTime && 
            currentTime <= channelPrefs.quiet.endTime) {
          return false;
        }
      }
    }

    return true;
  }

  // 获取传递渠道配置
  private getDeliveryChannels(channels: any): any[] {
    const deliveryChannels = [];
    
    if (channels.web) deliveryChannels.push({ channel: 'web', status: 'pending' });
    if (channels.email) deliveryChannels.push({ channel: 'email', status: 'pending' });
    if (channels.sms) deliveryChannels.push({ channel: 'sms', status: 'pending' });
    if (channels.push) deliveryChannels.push({ channel: 'push', status: 'pending' });
    
    return deliveryChannels;
  }

  // 处理模板
  private processTemplate(template: any, variables: any): any {
    let title = template.template.title;
    let content = template.template.content;

    // 替换变量
    template.template.variables.forEach((variable: any) => {
      const value = variables[variable.name] || variable.defaultValue || '';
      const placeholder = `{{${variable.name}}}`;
      
      title = title.replace(new RegExp(placeholder, 'g'), value);
      content = content.replace(new RegExp(placeholder, 'g'), value);
    });

    return {
      title,
      content,
      type: template.type,
      priority: template.settings.priority,
      channels: {
        web: template.channels.web.enabled,
        email: template.channels.email.enabled,
        sms: template.channels.sms.enabled,
        push: template.channels.push.enabled
      },
      settings: template.settings
    };
  }

  // 标记通知为已读
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      await Notification.updateOne(
        { 
          _id: notificationId, 
          'recipients.userId': userId 
        },
        { 
          $set: { 
            'recipients.$.readAt': new Date(),
            'recipients.$.deliveryStatus': 'read'
          }
        }
      );
    } catch (error) {
      console.error('标记通知已读失败:', error);
      throw error;
    }
  }

  // 确认通知
  async acknowledgeNotification(notificationId: string, userId: string): Promise<void> {
    try {
      await Notification.updateOne(
        { 
          _id: notificationId, 
          'recipients.userId': userId 
        },
        { 
          $set: { 
            'recipients.$.acknowledged': true,
            'recipients.$.acknowledgedAt': new Date()
          }
        }
      );
    } catch (error) {
      console.error('确认通知失败:', error);
      throw error;
    }
  }

  // 获取用户通知
  async getUserNotifications(
    userId: string, 
    options: {
      page?: number;
      pageSize?: number;
      type?: string;
      status?: string;
      unreadOnly?: boolean;
    } = {}
  ): Promise<{ notifications: any[]; total: number }> {
    try {
      const { page = 1, pageSize = 20, type, status, unreadOnly } = options;
      
      const query: any = {
        'recipients.userId': userId,
        status: { $in: ['sent', 'delivered'] }
      };

      if (type) {
        query.type = type;
      }

      if (unreadOnly) {
        query['recipients.readAt'] = { $exists: false };
      }

      const skip = (page - 1) * pageSize;

      const [notifications, total] = await Promise.all([
        Notification.find(query)
          .sort({ 'metadata.createdAt': -1 })
          .skip(skip)
          .limit(pageSize)
          .lean(),
        Notification.countDocuments(query)
      ]);

      // 过滤出当前用户的接收信息
      const processedNotifications = notifications.map(notification => {
        const userRecipient = notification.recipients.find(
          (r: any) => r.userId === userId
        );
        
        return {
          id: notification._id,
          title: notification.title,
          content: notification.content,
          type: notification.type,
          priority: notification.priority,
          category: notification.category,
          senderName: notification.senderName,
          attachments: notification.attachments,
          actions: notification.actions,
          createdAt: notification.metadata.createdAt,
          readAt: userRecipient?.readAt,
          acknowledged: userRecipient?.acknowledged || false,
          deliveryStatus: userRecipient?.deliveryStatus
        };
      });

      return {
        notifications: processedNotifications,
        total
      };
    } catch (error) {
      console.error('获取用户通知失败:', error);
      throw error;
    }
  }

  // 获取未读通知数量
  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await Notification.countDocuments({
        'recipients.userId': userId,
        'recipients.readAt': { $exists: false },
        status: { $in: ['sent', 'delivered'] }
      });
    } catch (error) {
      console.error('获取未读通知数量失败:', error);
      throw error;
    }
  }

  // 批量标记为已读
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await Notification.updateMany(
        { 
          'recipients.userId': userId,
          'recipients.readAt': { $exists: false }
        },
        { 
          $set: { 
            'recipients.$.readAt': new Date(),
            'recipients.$.deliveryStatus': 'read'
          }
        }
      );
    } catch (error) {
      console.error('批量标记已读失败:', error);
      throw error;
    }
  }

  // 处理定时通知
  async processScheduledNotifications(): Promise<void> {
    try {
      const scheduledNotifications = await Notification.find({
        status: 'scheduled',
        'schedule.sendAt': { $lte: new Date() }
      });

      for (const notification of scheduledNotifications) {
        await this.sendNotification(notification._id.toString());
      }
    } catch (error) {
      console.error('处理定时通知失败:', error);
    }
  }

  // 清理过期通知
  async cleanupExpiredNotifications(): Promise<number> {
    try {
      const result = await Notification.deleteMany({
        $or: [
          { 
            'schedule.expiresAt': { $lt: new Date() },
            'settings.autoExpire': true
          },
          {
            status: 'sent',
            'metadata.createdAt': { 
              $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30天前
            }
          }
        ]
      });

      return result.deletedCount || 0;
    } catch (error) {
      console.error('清理过期通知失败:', error);
      return 0;
    }
  }
}

const notificationService = new NotificationService();
export { notificationService as NotificationService };
export default notificationService; 