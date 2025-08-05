import express from 'express';
import {
  getQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  reviewQuestion,
  generateQuestion,
  generateMultipleQuestions,
  importQuestions,
  getQuestionStats,
  checkAIServiceStatus,
  debugQuestions
} from '../controllers/questionController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// 获取题目列表 (所有用户)
router.get('/', authenticate, getQuestions);

// 获取题目统计信息 (管理员)
router.get('/stats', authenticate, authorize('admin', 'content_manager', 'super_admin'), getQuestionStats);

// 数据库诊断 (开发调试用)
router.get('/debug/all', authenticate, debugQuestions);

// 获取单个题目详情
router.get('/:id', authenticate, getQuestion);

// 创建题目 (需要认证)
router.post('/', authenticate, createQuestion);

// AI服务状态检查 (教师及以上权限)
router.get('/ai-status', authenticate, authorize('teacher', 'admin', 'content_manager', 'super_admin'), checkAIServiceStatus);

// AI生成题目 (教师及以上权限)
router.post('/generate', authenticate, authorize('teacher', 'admin', 'content_manager', 'super_admin'), generateQuestion);

// 批量AI生成题目 (内容管理员及以上权限)
router.post('/generate/batch', authenticate, authorize('content_manager', 'admin', 'super_admin'), generateMultipleQuestions);

// 批量导入题目 (内容管理员及以上权限)
router.post('/import', authenticate, authorize('content_manager', 'admin', 'super_admin'), importQuestions);

// 更新题目
router.put('/:id', authenticate, updateQuestion);

// 审核题目 (内容管理员及以上权限)
router.put('/:id/review', authenticate, authorize('content_manager', 'admin', 'super_admin'), reviewQuestion);

// 删除题目
router.delete('/:id', authenticate, deleteQuestion);

export default router; 