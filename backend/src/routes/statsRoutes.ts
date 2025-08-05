import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getSystemStats,
  getLearningStats,
  getQuestionStats,
  getLeaderboard
} from '../controllers/statsController';

const router = express.Router();

// 统计相关路由
router.get('/system', authenticate, authorize('admin', 'super_admin'), getSystemStats);     // 系统统计 (管理员)
router.get('/learning', authenticate, getLearningStats);                                    // 个人学习统计
router.get('/questions', authenticate, getQuestionStats);                                   // 题目统计
router.get('/leaderboard', authenticate, getLeaderboard);                                   // 排行榜

export default router; 