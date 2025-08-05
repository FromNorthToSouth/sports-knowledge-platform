import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getUserAchievements,
  getAllAchievements,
  getAchievementStats,
  getRecentAchievements,
  checkAchievements,
  markAchievementNotified,
  initializeAchievements,
  getAchievementLeaderboard
} from '../controllers/achievementController';

const router = express.Router();

// 用户成就相关路由
router.get('/', authenticate, getUserAchievements);                    // 获取用户成就列表
router.get('/all', authenticate, getAllAchievements);                  // 获取所有成就列表
router.get('/stats', authenticate, getAchievementStats);               // 获取成就统计
router.get('/recent', authenticate, getRecentAchievements);            // 获取最近获得的成就
router.get('/leaderboard', authenticate, getAchievementLeaderboard);   // 获取成就排行榜
router.post('/check', authenticate, checkAchievements);                // 手动检查成就进度
router.put('/notify/:achievementId', authenticate, markAchievementNotified);  // 标记成就通知已读

// 管理员路由
router.post('/initialize', authenticate, initializeAchievements);      // 初始化默认成就

export default router; 