import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  addFavorite,
  removeFavorite,
  getFavorites,
  checkFavorite,
  getFavoriteStats
} from '../controllers/favoriteController';

const router = express.Router();

// 收藏相关路由
router.post('/', authenticate, addFavorite);                    // 添加收藏
router.delete('/:questionId', authenticate, removeFavorite);    // 取消收藏
router.get('/', authenticate, getFavorites);                   // 获取收藏列表
router.get('/stats', authenticate, getFavoriteStats);          // 获取收藏统计
router.get('/check/:questionId', authenticate, checkFavorite); // 检查收藏状态

export default router; 