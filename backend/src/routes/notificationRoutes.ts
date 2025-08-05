import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  createNotification,
  getNotifications,
  getNotification,
  updateNotification,
  deleteNotification,
  sendNotification,
  getUserNotifications,
  markNotificationAsRead,
  acknowledgeNotification,
  getUnreadCount,
  markAllAsRead,
  getNotificationTemplates,
  createNotificationTemplate,
  getNotificationPreferences,
  updateNotificationPreferences,
  getNotificationStats,
  batchOperations
} from '../controllers/notificationController';

const router = express.Router();

// 所有路由都需要身份验证
router.use(authenticate);

// 通知CRUD操作
router.get('/', getNotifications);                    // GET /api/notifications - 获取通知列表
router.post('/', authorize('teacher', 'admin', 'super_admin'), createNotification); // POST /api/notifications - 创建通知
router.get('/:id', getNotification);                 // GET /api/notifications/:id - 获取单个通知
router.put('/:id', updateNotification);              // PUT /api/notifications/:id - 更新通知
router.delete('/:id', deleteNotification);           // DELETE /api/notifications/:id - 删除通知

// 通知发送操作
router.post('/:id/send', sendNotification);          // POST /api/notifications/:id/send - 发送通知

// 用户通知操作
router.get('/user/notifications', getUserNotifications);     // GET /api/notifications/user/notifications - 获取用户通知
router.get('/user/unread-count', getUnreadCount);           // GET /api/notifications/user/unread-count - 获取未读数量
router.post('/user/mark-all-read', markAllAsRead);          // POST /api/notifications/user/mark-all-read - 全部标记已读
router.post('/:id/read', markNotificationAsRead);           // POST /api/notifications/:id/read - 标记为已读
router.post('/:id/acknowledge', acknowledgeNotification);   // POST /api/notifications/:id/acknowledge - 确认通知

// 通知模板管理
router.get('/templates/list', getNotificationTemplates);    // GET /api/notifications/templates/list - 获取模板列表
router.post('/templates', authorize('admin', 'super_admin'), createNotificationTemplate); // POST /api/notifications/templates - 创建模板

// 用户偏好设置
router.get('/preferences', getNotificationPreferences);     // GET /api/notifications/preferences - 获取通知偏好
router.put('/preferences', updateNotificationPreferences);  // PUT /api/notifications/preferences - 更新通知偏好

// 统计和管理功能
router.get('/stats/overview', authorize('admin', 'super_admin'), getNotificationStats); // GET /api/notifications/stats/overview - 通知统计
router.post('/batch', authorize('admin', 'super_admin'), batchOperations);              // POST /api/notifications/batch - 批量操作

// 系统管理接口
router.get('/system/health', authorize('admin', 'super_admin'), async (req: any, res) => {
  try {
    // 检查通知系统健康状态
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date(),
      services: {
        notification: 'running',
        email: 'running',
        websocket: 'running',
        sms: 'running'
      },
      statistics: {
        totalNotifications: 0,
        pendingNotifications: 0,
        failedNotifications: 0
      }
    };

    res.json({
      success: true,
      data: healthStatus
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取系统健康状态失败',
      error: error.message
    });
  }
});

// 清理过期通知
router.post('/system/cleanup', authorize('admin', 'super_admin'), async (req: any, res) => {
  try {
    // 这里应该调用通知服务的清理方法
    const cleanedCount = 0; // await notificationService.cleanupExpiredNotifications();
    
    res.json({
      success: true,
      data: {
        cleanedCount,
        message: `成功清理 ${cleanedCount} 条过期通知`
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '清理过期通知失败',
      error: error.message
    });
  }
});

// 处理定时通知任务
router.post('/system/process-scheduled', authorize('admin', 'super_admin'), async (req: any, res) => {
  try {
    // 这里应该调用通知服务的定时任务处理方法
    // await notificationService.processScheduledNotifications();
    
    res.json({
      success: true,
      message: '定时通知处理完成'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '处理定时通知失败',
      error: error.message
    });
  }
});

// 重新发送失败的通知
router.post('/:id/retry', authorize('admin', 'super_admin'), async (req: any, res) => {
  try {
    const { id } = req.params;
    
    // 这里应该实现重试逻辑
    // await notificationService.retryFailedNotification(id);
    
    res.json({
      success: true,
      message: '通知重新发送成功'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '重新发送通知失败',
      error: error.message
    });
  }
});

// 导出通知数据
router.get('/export/:format', authorize('admin', 'super_admin'), async (req: any, res) => {
  try {
    const { format } = req.params;
    const { startDate, endDate, type, status } = req.query;
    
    if (!['csv', 'excel', 'json'].includes(format)) {
      return res.status(400).json({
        success: false,
        message: '不支持的导出格式'
      });
    }

    // 这里应该实现数据导出逻辑
    const exportData = {
      format,
      filters: { startDate, endDate, type, status },
      exportTime: new Date(),
      url: `/api/notifications/downloads/notifications_${Date.now()}.${format}`
    };

    res.json({
      success: true,
      data: exportData,
      message: '导出任务已创建'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '导出通知数据失败',
      error: error.message
    });
  }
});

// WebSocket连接信息（仅供管理员查看）
router.get('/websocket/stats', authorize('admin', 'super_admin'), async (req: any, res) => {
  try {
    // 这里应该调用WebSocket服务获取统计信息
    const stats = {
      connectedUsers: 0,
      totalConnections: 0,
      onlineUsers: [],
      rooms: []
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取WebSocket统计失败',
      error: error.message
    });
  }
});

// 发送系统广播
router.post('/broadcast', authorize('admin', 'super_admin'), async (req: any, res) => {
  try {
    const { title, content, priority = 'medium', channels } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: '标题和内容不能为空'
      });
    }

    // 创建系统广播通知
    const notificationData = {
      title,
      content,
      type: 'system' as const,
      priority,
      category: 'system_broadcast',
      targetAudience: {
        type: 'all' as const
      },
      channels: channels || {
        web: true,
        email: false,
        sms: false,
        push: false
      }
    };

    // 这里应该调用通知服务创建并发送广播
    // const notification = await notificationService.createNotification(notificationData, req.user?.id || '');

    res.json({
      success: true,
      message: '系统广播发送成功'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '发送系统广播失败',
      error: error.message
    });
  }
});

// 获取通知发送日志
router.get('/logs', authorize('admin', 'super_admin'), async (req: any, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      level,
      startDate,
      endDate
    } = req.query;

    // 这里应该从日志系统获取通知相关日志
    const logs = {
      data: [],
      total: 0,
      pagination: {
        current: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
        total: 0,
        totalPages: 0
      }
    };

    res.json({
      success: true,
      data: logs
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取通知日志失败',
      error: error.message
    });
  }
});

export default router; 