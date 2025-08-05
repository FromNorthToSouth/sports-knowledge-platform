import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
  getClassStudents,
  addStudentToClass,
  removeStudentFromClass,
  getClassStats,
  batchOperations,
  exportClassData,
  searchUsers,
  updateStudentInClass,
  batchAddStudents
} from '../controllers/classController';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticate);

// 获取班级列表
router.get('/', getClasses);

// 获取单个班级详情
router.get('/:id', getClass);

// 创建班级 (教师和管理员)
router.post('/', 
  authorize('teacher', 'admin', 'super_admin'), 
  createClass
);

// 更新班级信息 (班级老师和管理员)
router.put('/:id', updateClass);

// 删除班级 (仅管理员)
router.delete('/:id', 
  authorize('admin', 'super_admin'), 
  deleteClass
);

// 获取班级学生列表
router.get('/:id/students', getClassStudents);

// 添加学生到班级 (班级老师和管理员)
router.post('/:id/students', addStudentToClass);

// 从班级移除学生 (班级老师和管理员)
router.delete('/:id/students/:studentId', removeStudentFromClass);

// 更新班级中的学生信息 (班级老师和管理员)
router.put('/:id/students/:studentId', updateStudentInClass);

// 搜索用户 (用于添加学生)
router.get('/search/users', 
  authorize('teacher', 'admin', 'super_admin'), 
  searchUsers
);

// 批量添加学生到班级 (班级老师和管理员)
router.post('/:id/students/batch', batchAddStudents);

// 获取班级统计信息
router.get('/:id/stats', getClassStats);

// 获取班级学习进度
router.get('/:id/progress', async (req: any, res) => {
  try {
    const { id } = req.params;
    const { subject, category, timeRange = '30d' } = req.query;

    // 这里应该实现获取班级学习进度的逻辑
    // 暂时返回模拟数据
    const progressData = {
      classId: id,
      overall: {
        totalStudents: 25,
        activeStudents: 22,
        averageProgress: 75.5,
        completionRate: 88
      },
      bySubject: [
        { subject: '足球', progress: 80, students: 25 },
        { subject: '篮球', progress: 72, students: 23 },
        { subject: '排球', progress: 68, students: 20 }
      ],
      byDifficulty: [
        { difficulty: 'easy', completion: 95 },
        { difficulty: 'medium', completion: 75 },
        { difficulty: 'hard', completion: 45 }
      ],
      timeline: [
        { date: '2024-01-01', progress: 60 },
        { date: '2024-01-08', progress: 65 },
        { date: '2024-01-15', progress: 72 },
        { date: '2024-01-22', progress: 75.5 }
      ]
    };

    res.json({
      success: true,
      data: progressData
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取学习进度失败',
      error: error.message
    });
  }
});

// 获取班级考试记录
router.get('/:id/exams', async (req: any, res) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 10, status, dateRange } = req.query;

    // 这里应该从考试系统获取数据
    // 暂时返回模拟数据
    const exams = [
      {
        id: '1',
        title: '足球基础知识测试',
        type: 'exam',
        status: 'completed',
        startTime: '2024-01-15T10:00:00Z',
        endTime: '2024-01-15T11:30:00Z',
        duration: 90,
        participantCount: 23,
        averageScore: 82.5,
        passRate: 87
      },
      {
        id: '2',
        title: '篮球技能评估',
        type: 'assessment',
        status: 'active',
        startTime: '2024-01-20T14:00:00Z',
        endTime: '2024-01-20T15:00:00Z',
        duration: 60,
        participantCount: 18,
        averageScore: null,
        passRate: null
      }
    ];

    res.json({
      success: true,
      data: {
        exams,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(pageSize),
          total: exams.length,
          totalPages: Math.ceil(exams.length / parseInt(pageSize))
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取考试记录失败',
      error: error.message
    });
  }
});

// 创建班级考试
router.post('/:id/exams', 
  authorize('teacher', 'admin', 'super_admin'),
  async (req: any, res) => {
    try {
      const { id } = req.params;
      const examData = req.body;

      // 这里应该调用考试系统的API来创建考试
      // 暂时返回成功响应
      const newExam = {
        id: Date.now().toString(),
        classId: id,
        createdBy: req.user.id,
        createdAt: new Date(),
        ...examData
      };

      res.status(201).json({
        success: true,
        data: newExam,
        message: '班级考试创建成功'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: '创建班级考试失败',
        error: error.message
      });
    }
  }
);

// 获取班级作业列表
router.get('/:id/assignments', async (req: any, res) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 10, status, dueDate } = req.query;

    // 这里应该从数据库获取作业数据
    // 暂时返回模拟数据
    const assignments = [
      {
        id: '1',
        title: '足球规则理解练习',
        description: '完成20道关于足球规则的练习题',
        type: 'practice',
        status: 'active',
        dueDate: '2024-01-25T23:59:59Z',
        submissionCount: 18,
        totalStudents: 25,
        averageScore: 78.5
      }
    ];

    res.json({
      success: true,
      data: {
        assignments,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(pageSize),
          total: assignments.length,
          totalPages: Math.ceil(assignments.length / parseInt(pageSize))
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取作业列表失败',
      error: error.message
    });
  }
});

// 创建班级作业
router.post('/:id/assignments',
  authorize('teacher', 'admin', 'super_admin'),
  async (req: any, res) => {
    try {
      const { id } = req.params;
      const assignmentData = req.body;

      // 这里应该保存到数据库
      const newAssignment = {
        id: Date.now().toString(),
        classId: id,
        createdBy: req.user.id,
        createdAt: new Date(),
        ...assignmentData
      };

      res.status(201).json({
        success: true,
        data: newAssignment,
        message: '作业创建成功'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: '创建作业失败',
        error: error.message
      });
    }
  }
);

// 获取班级公告
router.get('/:id/announcements', async (req: any, res) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 10, type } = req.query;

    // 这里应该从数据库获取公告数据
    // 暂时返回模拟数据
    const announcements = [
      {
        id: '1',
        title: '下周足球实践课安排',
        content: '下周二的足球实践课将在操场进行，请同学们准备好运动服和足球鞋。',
        type: 'general',
        priority: 'medium',
        publishDate: '2024-01-18T10:00:00Z',
        readCount: 20,
        totalStudents: 25
      }
    ];

    res.json({
      success: true,
      data: {
        announcements,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(pageSize),
          total: announcements.length,
          totalPages: Math.ceil(announcements.length / parseInt(pageSize))
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取公告失败',
      error: error.message
    });
  }
});

// 发布班级公告
router.post('/:id/announcements',
  authorize('teacher', 'admin', 'super_admin'),
  async (req: any, res) => {
    try {
      const { id } = req.params;
      const announcementData = req.body;

      // 这里应该保存到数据库
      const newAnnouncement = {
        id: Date.now().toString(),
        classId: id,
        createdBy: req.user.id,
        createdAt: new Date(),
        ...announcementData
      };

      res.status(201).json({
        success: true,
        data: newAnnouncement,
        message: '公告发布成功'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: '发布公告失败',
        error: error.message
      });
    }
  }
);

// 批量操作 (仅管理员)
router.post('/batch', 
  authorize('admin', 'super_admin'), 
  batchOperations
);

// 导出班级数据
router.get('/:id/export/:type', exportClassData);

// 复制班级
router.post('/:id/duplicate', 
  authorize('teacher', 'admin', 'super_admin'),
  async (req: any, res) => {
    try {
      const { id } = req.params;
      const { name, includeStudents = false, includeSettings = true } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: '请提供新班级名称'
        });
      }

      // 这里应该实现复制班级的逻辑
      const duplicatedClass = {
        id: Date.now().toString(),
        name,
        originalClassId: id,
        includeStudents,
        includeSettings,
        createdBy: req.user.id,
        createdAt: new Date()
      };

      res.status(201).json({
        success: true,
        data: duplicatedClass,
        message: '班级复制成功'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: '复制班级失败',
        error: error.message
      });
    }
  }
);

export default router; 