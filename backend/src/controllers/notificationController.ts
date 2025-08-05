import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Notification, NotificationTemplate, NotificationSubscription } from '../models/Notification';
import notificationService from '../services/notificationService';
import mongoose from 'mongoose';

// 创建通知
export const createNotification = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      content,
      type,
      priority,
      category,
      targetAudience,
      channels,
      schedule,
      settings,
      attachments,
      actions,
      templateId,
      variables
    } = req.body;

    // 验证必填字段
    if (!title || !content || !type || !category || !targetAudience) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段'
      });
    }

    // 权限检查：只有管理员和教师可以创建通知
    if (req.user?.role === 'student') {
      return res.status(403).json({
        success: false,
        message: '学生无权创建通知'
      });
    }

    const notificationData = {
      title,
      content,
      type,
      priority,
      category,
      senderId: req.user?.id,
      senderName: req.user?.username,
      targetAudience,
      channels,
      schedule,
      settings,
      attachments,
      actions,
      templateId,
      variables
    };

    const notification = await notificationService.createNotification(
      notificationData,
      req.user?.id || ''
    );

    res.status(201).json({
      success: true,
      data: notification,
      message: '通知创建成功'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '创建通知失败',
      error: error.message
    });
  }
};

// 获取通知列表
export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      type,
      priority,
      status,
      senderId,
      startDate,
      endDate
    } = req.query;

    const query: any = {};
    
    // 根据用户角色过滤
    if (req.user?.role === 'student') {
      query['recipients.userId'] = req.user.id;
    } else if (req.user?.role === 'teacher') {
      query.$or = [
        { 'metadata.createdBy': req.user.id },
        { 'recipients.userId': req.user.id }
      ];
    }
    // 管理员可以看到所有通知

    // 添加过滤条件
    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (status) query.status = status;
    if (senderId) query.senderId = senderId;

    if (startDate || endDate) {
      query['metadata.createdAt'] = {};
      if (startDate) query['metadata.createdAt'].$gte = new Date(startDate as string);
      if (endDate) query['metadata.createdAt'].$lte = new Date(endDate as string);
    }

    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    const limit = parseInt(pageSize as string);

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ 'metadata.createdAt': -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          current: parseInt(page as string),
          pageSize: limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取通知列表失败',
      error: error.message
    });
  }
};

// 获取单个通知详情
export const getNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的通知ID'
      });
    }

    const notification = await Notification.findById(id).lean();

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在'
      });
    }

    // 权限检查
    const canAccess = req.user?.role === 'admin' ||
                     req.user?.role === 'super_admin' ||
                     notification.metadata.createdBy === req.user?.id ||
                     notification.recipients.some(r => r.userId === req.user?.id);

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: '无权访问此通知'
      });
    }

    res.json({
      success: true,
      data: notification
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取通知详情失败',
      error: error.message
    });
  }
};

// 更新通知
export const updateNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的通知ID'
      });
    }

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在'
      });
    }

    // 权限检查：只有创建者和管理员可以更新
    const canUpdate = req.user?.role === 'admin' ||
                     req.user?.role === 'super_admin' ||
                     notification.metadata.createdBy === req.user?.id;

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: '无权修改此通知'
      });
    }

    // 检查通知状态：已发送的通知不能修改内容
    if (notification.status === 'sent' || notification.status === 'sending') {
      const allowedFields = ['status']; // 只允许修改状态
      const hasDisallowedUpdates = Object.keys(updates).some(key => !allowedFields.includes(key));
      
      if (hasDisallowedUpdates) {
        return res.status(400).json({
          success: false,
          message: '已发送的通知不能修改内容'
        });
      }
    }

    // 更新元数据
    updates['metadata.updatedAt'] = new Date();
    updates['metadata.lastModifiedBy'] = req.user?.id;

    const updatedNotification = await Notification.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedNotification,
      message: '通知更新成功'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '更新通知失败',
      error: error.message
    });
  }
};

// 删除通知
export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的通知ID'
      });
    }

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在'
      });
    }

    // 权限检查：只有创建者和管理员可以删除
    const canDelete = req.user?.role === 'admin' ||
                     req.user?.role === 'super_admin' ||
                     notification.metadata.createdBy === req.user?.id;

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: '无权删除此通知'
      });
    }

    await Notification.findByIdAndDelete(id);

    res.json({
      success: true,
      message: '通知删除成功'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '删除通知失败',
      error: error.message
    });
  }
};

// 发送通知
export const sendNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的通知ID'
      });
    }

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: '通知不存在'
      });
    }

    // 权限检查
    const canSend = req.user?.role === 'admin' ||
                   req.user?.role === 'super_admin' ||
                   notification.metadata.createdBy === req.user?.id;

    if (!canSend) {
      return res.status(403).json({
        success: false,
        message: '无权发送此通知'
      });
    }

    // 检查通知状态
    if (notification.status !== 'draft' && notification.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: '通知状态不允许发送'
      });
    }

    await notificationService.sendNotification(id);

    res.json({
      success: true,
      message: '通知发送成功'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '发送通知失败',
      error: error.message
    });
  }
};

// 获取用户通知
export const getUserNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      type,
      unreadOnly = false
    } = req.query;

    const result = await notificationService.getUserNotifications(
      req.user?.id || '',
      {
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
        type: type as string,
        unreadOnly: unreadOnly === 'true'
      }
    );

    res.json({
      success: true,
      data: {
        notifications: result.notifications,
        pagination: {
          current: parseInt(page as string),
          pageSize: parseInt(pageSize as string),
          total: result.total,
          totalPages: Math.ceil(result.total / parseInt(pageSize as string))
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取用户通知失败',
      error: error.message
    });
  }
};

// 标记通知为已读
export const markNotificationAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的通知ID'
      });
    }

    await notificationService.markAsRead(id, req.user?.id || '');

    res.json({
      success: true,
      message: '通知已标记为已读'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '标记通知失败',
      error: error.message
    });
  }
};

// 确认通知
export const acknowledgeNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的通知ID'
      });
    }

    await notificationService.acknowledgeNotification(id, req.user?.id || '');

    res.json({
      success: true,
      message: '通知已确认'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '确认通知失败',
      error: error.message
    });
  }
};

// 获取未读通知数量
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const count = await notificationService.getUnreadCount(req.user?.id || '');

    res.json({
      success: true,
      data: { count }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取未读通知数量失败',
      error: error.message
    });
  }
};

// 批量标记为已读
export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    await notificationService.markAllAsRead(req.user?.id || '');

    res.json({
      success: true,
      message: '所有通知已标记为已读'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '批量标记失败',
      error: error.message
    });
  }
};

// 获取通知模板列表
export const getNotificationTemplates = async (req: AuthRequest, res: Response) => {
  try {
    const { type, category, isActive } = req.query;

    const query: any = {};
    if (type) query.type = type;
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const templates = await NotificationTemplate.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: templates
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取通知模板失败',
      error: error.message
    });
  }
};

// 创建通知模板
export const createNotificationTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const templateData = req.body;

    // 权限检查：只有管理员可以创建模板
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: '只有管理员可以创建通知模板'
      });
    }

    const template = new NotificationTemplate({
      ...templateData,
      createdBy: req.user?.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const savedTemplate = await template.save();

    res.status(201).json({
      success: true,
      data: savedTemplate,
      message: '通知模板创建成功'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '创建通知模板失败',
      error: error.message
    });
  }
};

// 获取用户通知偏好设置
export const getNotificationPreferences = async (req: AuthRequest, res: Response) => {
  try {
    let subscription = await NotificationSubscription.findOne({
      userId: req.user?.id
    }).lean();

    if (!subscription) {
      // 创建默认设置
      subscription = {
        userId: req.user?.id || '',
        preferences: {
          web: { enabled: true, types: [] },
          email: { enabled: true, types: [], frequency: 'immediate' },
          sms: { enabled: false, types: [], urgent: true },
          push: { enabled: true, types: [], sound: true, vibration: true }
        },
        filters: [],
        createdAt: new Date(),
        updatedAt: new Date()
      } as any;
    }

    res.json({
      success: true,
      data: subscription
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取通知偏好失败',
      error: error.message
    });
  }
};

// 更新用户通知偏好设置
export const updateNotificationPreferences = async (req: AuthRequest, res: Response) => {
  try {
    const { preferences, filters } = req.body;

    const subscription = await NotificationSubscription.findOneAndUpdate(
      { userId: req.user?.id },
      {
        userId: req.user?.id,
        preferences,
        filters,
        updatedAt: new Date()
      },
      { 
        new: true, 
        upsert: true,
        setDefaultsOnInsert: true 
      }
    );

    res.json({
      success: true,
      data: subscription,
      message: '通知偏好更新成功'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '更新通知偏好失败',
      error: error.message
    });
  }
};

// 获取通知统计
export const getNotificationStats = async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    // 权限检查：只有管理员可以查看统计
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: '只有管理员可以查看通知统计'
      });
    }

    const matchQuery: any = {};
    if (startDate || endDate) {
      matchQuery['metadata.createdAt'] = {};
      if (startDate) matchQuery['metadata.createdAt'].$gte = new Date(startDate as string);
      if (endDate) matchQuery['metadata.createdAt'].$lte = new Date(endDate as string);
    }

    const stats = await Notification.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalNotifications: { $sum: 1 },
          totalRecipients: { $sum: '$statistics.totalRecipients' },
          totalSent: { $sum: '$statistics.sentCount' },
          totalDelivered: { $sum: '$statistics.deliveredCount' },
          totalRead: { $sum: '$statistics.readCount' },
          totalAcknowledged: { $sum: '$statistics.acknowledgedCount' },
          totalFailed: { $sum: '$statistics.failedCount' },
          byType: {
            $push: {
              type: '$type',
              count: 1,
              recipients: '$statistics.totalRecipients'
            }
          },
          byPriority: {
            $push: {
              priority: '$priority',
              count: 1
            }
          },
          byStatus: {
            $push: {
              status: '$status',
              count: 1
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        totalNotifications: 0,
        totalRecipients: 0,
        totalSent: 0,
        totalDelivered: 0,
        totalRead: 0,
        totalAcknowledged: 0,
        totalFailed: 0,
        byType: [],
        byPriority: [],
        byStatus: []
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取通知统计失败',
      error: error.message
    });
  }
};

// 批量操作
export const batchOperations = async (req: AuthRequest, res: Response) => {
  try {
    const { action, notificationIds } = req.body;

    // 权限检查：只有管理员可以批量操作
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: '只有管理员可以进行批量操作'
      });
    }

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要操作的通知ID列表'
      });
    }

    let result;
    switch (action) {
      case 'delete':
        result = await Notification.deleteMany({ _id: { $in: notificationIds } });
        break;
      case 'cancel':
        result = await Notification.updateMany(
          { _id: { $in: notificationIds }, status: { $in: ['draft', 'scheduled'] } },
          { $set: { status: 'cancelled', 'metadata.updatedAt': new Date() } }
        );
        break;
      default:
        return res.status(400).json({
          success: false,
          message: `不支持的操作: ${action}`
        });
    }

         res.json({
       success: true,
       data: {
         affected: 'modifiedCount' in result ? result.modifiedCount : result.deletedCount,
         message: `批量${action}操作完成`
       }
     });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '批量操作失败',
      error: error.message
    });
  }
}; 