import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getInstitutions,
  getInstitution,
  createInstitution,
  updateInstitution,
  deleteInstitution,
  getInstitutionUsers,
  addUserToInstitution,
  removeUserFromInstitution,
  getInstitutionStats,
  batchOperations,
  getInstitutionsForRegistration
} from '../controllers/institutionController';
import { Institution } from '../models/Institution';
import { Class } from '../models/Class';

const router = express.Router();

// 基础路由
router.get('/', getInstitutions);                                    // 获取机构列表
router.get('/for-registration', getInstitutionsForRegistration);     // 专为注册页面提供的简化学校列表
router.post('/', authenticate, authorize('admin', 'super_admin'), createInstitution);  // 创建机构
router.get('/:id', authenticate, getInstitution);                   // 获取单个机构详情
router.put('/:id', authenticate, authorize('admin', 'super_admin'), updateInstitution); // 更新机构信息
router.delete('/:id', authenticate, authorize('super_admin'), deleteInstitution);       // 删除机构

// 用户管理路由
router.get('/:id/users', authenticate, authorize('admin', 'super_admin'), getInstitutionUsers);     // 获取机构用户列表
router.post('/:id/users', authenticate, authorize('admin', 'super_admin'), addUserToInstitution);   // 添加用户到机构
router.delete('/:id/users/:userId', authenticate, authorize('admin', 'super_admin'), removeUserFromInstitution); // 从机构移除用户

// 统计信息路由
router.get('/:id/stats', authenticate, authorize('admin', 'super_admin'), getInstitutionStats);     // 获取机构统计信息

// 批量操作路由
router.post('/batch', authenticate, authorize('admin', 'super_admin'), batchOperations);            // 批量操作

// 机构设置管理
router.put('/:id/settings', authenticate, authorize('admin', 'super_admin'), async (req: any, res) => {
  try {
    const { id } = req.params;
    const { settings } = req.body;
    
    const institution = await Institution.findById(id);
    if (!institution) {
      return res.status(404).json({
        success: false,
        message: '机构不存在'
      });
    }

    institution.settings = { ...institution.settings, ...settings };
    institution.updatedAt = new Date();
    await institution.save();

    res.json({
      success: true,
      data: institution,
      message: '机构设置更新成功'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '更新机构设置失败',
      error: error.message
    });
  }
});

// 获取机构可用功能
router.get('/:id/features', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    
    const institution = await Institution.findById(id).select('settings.enabledFeatures').lean();
    if (!institution) {
      return res.status(404).json({
        success: false,
        message: '机构不存在'
      });
    }

    const allFeatures = [
      { key: 'basic', name: '基础功能', description: '题库、练习、考试' },
      { key: 'analytics', name: '数据分析', description: '学习分析、统计报告' },
      { key: 'collaboration', name: '协作功能', description: '讨论、分享、评论' },
      { key: 'ai_features', name: 'AI功能', description: 'AI生成题目、智能推荐' },
      { key: 'video_learning', name: '视频学习', description: '视频播放、进度跟踪' },
      { key: 'mobile_app', name: '移动应用', description: '移动端APP访问' },
      { key: 'api_access', name: 'API访问', description: '第三方集成API' },
      { key: 'white_label', name: '品牌定制', description: '自定义品牌和主题' }
    ];

    const enabledFeatures = institution.settings?.enabledFeatures || ['basic'];

    const features = allFeatures.map(feature => ({
      ...feature,
      enabled: enabledFeatures.includes(feature.key)
    }));

    res.json({
      success: true,
      data: {
        features,
        totalEnabled: enabledFeatures.length
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取机构功能失败',
      error: error.message
    });
  }
});

// 获取机构班级列表
router.get('/:id/classes', authenticate, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 20, status, keyword } = req.query;
    
    // 构建查询条件
    const query: any = { institutionId: id };
    if (status) {
      query.status = status;
    }
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);

    const [classes, total] = await Promise.all([
      Class.find(query)
        .populate('teacherId', 'username email')
        .select('name description grade status createdAt students')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(pageSize as string))
        .lean(),
      Class.countDocuments(query)
    ]);

    // 添加学生数量统计
    const classesWithStats = classes.map((cls: any) => ({
      ...cls,
      studentCount: cls.students?.length || 0
    }));

    res.json({
      success: true,
      data: {
        classes: classesWithStats,
        pagination: {
          current: parseInt(page as string),
          pageSize: parseInt(pageSize as string),
          total,
          totalPages: Math.ceil(total / parseInt(pageSize as string))
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取机构班级失败',
      error: error.message
    });
  }
});

// 机构数据导出
router.get('/:id/export/:type', authenticate, authorize('admin', 'super_admin'), async (req: any, res) => {
  try {
    const { id, type } = req.params;
    const { format = 'json' } = req.query;

    if (!['users', 'classes', 'all'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: '不支持的导出类型'
      });
    }

    if (!['json', 'csv', 'excel'].includes(format)) {
      return res.status(400).json({
        success: false,
        message: '不支持的导出格式'
      });
    }

    // 这里应该实现具体的数据导出逻辑
    const exportData = {
      institutionId: id,
      type,
      format,
      exportTime: new Date(),
      downloadUrl: `/api/institutions/${id}/downloads/${type}_${Date.now()}.${format}`,
      message: '导出任务已创建，请稍后下载'
    };

    res.json({
      success: true,
      data: exportData
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '导出数据失败',
      error: error.message
    });
  }
});

export default router; 