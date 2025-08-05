import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getStudentProgress,
  getStudentDetailProgress,
  getClassProgress,
  trackLearningProgress,
  getProgressAnalytics
} from '../controllers/progressController';

const router = express.Router();

// 所有路由都需要身份验证
router.use(authenticate);

// 学生进度管理路由
router.get('/students', authorize('teacher', 'admin', 'super_admin'), getStudentProgress);
router.get('/student/:studentId', getStudentDetailProgress);
router.get('/class/:classId', authorize('teacher', 'admin', 'super_admin'), getClassProgress);
router.post('/track', trackLearningProgress);
router.get('/analytics', authorize('teacher', 'admin', 'super_admin'), getProgressAnalytics);

// 个人学习进度路由
router.get('/my-progress', async (req: any, res) => {
  // 重定向到学生详细进度，但使用当前用户ID
  req.params.studentId = req.user.id;
  return getStudentDetailProgress(req, res);
});

// 班级进度概览（供学生查看自己班级整体情况）
router.get('/my-class-overview', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    
    // 查找学生所在的班级
    const Class = require('../models/Class').Class;
    const userClasses = await Class.find({
      'students.userId': userId,
      'students.status': 'active'
    }).select('_id name description').lean();

    if (userClasses.length === 0) {
      return res.json({
        success: true,
        data: {
          classes: [],
          message: '您还没有加入任何班级'
        }
      });
    }

    // 获取每个班级的基本统计信息（不包含详细个人信息）
    const classesWithStats = await Promise.all(
      userClasses.map(async (classInfo: any) => {
        const totalStudents = await Class.findById(classInfo._id)
          .select('students')
          .lean();
        
        return {
          classId: classInfo._id,
          className: classInfo.name,
          description: classInfo.description,
          totalStudents: totalStudents?.students?.length || 0,
          myProgress: `您可以查看班级 ${classInfo.name} 的整体学习情况`
        };
      })
    );

    res.json({
      success: true,
      data: {
        classes: classesWithStats,
        message: '您的班级概览信息'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取班级概览失败',
      error: error.message
    });
  }
});

// 学习记录历史
router.get('/learning-history', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const { page = 1, pageSize = 20, knowledgeBaseId, status } = req.query;

    const KnowledgeProgress = require('../models/KnowledgeBase').KnowledgeProgress;
    
    // 构建查询条件
    const query: any = { user: userId };
    if (knowledgeBaseId) {
      query.knowledgeBase = knowledgeBaseId;
    }
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);

    const [progressHistory, total] = await Promise.all([
      KnowledgeProgress.find(query)
        .populate('knowledgeBase', 'title description')
        .populate('knowledgePoint', 'title difficulty category')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(pageSize as string))
        .lean(),
      KnowledgeProgress.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        history: progressHistory,
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
      message: '获取学习历史失败',
      error: error.message
    });
  }
});

// 学习统计摘要
router.get('/summary', async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const { timeRange = '30d' } = req.query;

    const KnowledgeProgress = require('../models/KnowledgeBase').KnowledgeProgress;
    
    // 时间过滤
    let dateFilter = {};
    if (timeRange === '7d') {
      dateFilter = { updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } };
    } else if (timeRange === '30d') {
      dateFilter = { updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } };
    }

    const stats = await KnowledgeProgress.aggregate([
      { $match: { user: userId, ...dateFilter } },
      {
        $group: {
          _id: null,
          totalTopics: { $sum: 1 },
          completedTopics: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          inProgressTopics: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
          },
          totalTime: { $sum: '$totalTime' },
          averageProgress: { $avg: '$progress' },
          averageScore: {
            $avg: { $cond: [{ $ne: ['$score', null] }, '$score', null] }
          }
        }
      }
    ]);

    const summary = stats[0] || {
      totalTopics: 0,
      completedTopics: 0,
      inProgressTopics: 0,
      totalTime: 0,
      averageProgress: 0,
      averageScore: 0
    };

    // 计算完成率
    summary.completionRate = summary.totalTopics > 0 
      ? Math.round((summary.completedTopics / summary.totalTopics) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        timeRange,
        summary: {
          ...summary,
          averageProgress: Math.round(summary.averageProgress || 0),
          averageScore: Math.round(summary.averageScore || 0)
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取学习统计失败',
      error: error.message
    });
  }
});

export default router; 