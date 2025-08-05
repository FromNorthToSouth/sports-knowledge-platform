import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getUserStats,
  resetUserPassword,
  batchUpdateUsers
} from '../controllers/userController';

const router = express.Router();

// 用户管理路由 (管理员权限)
router.get('/', authenticate, authorize('admin', 'super_admin'), getUsers);                    // 获取用户列表
router.get('/stats', authenticate, getUserStats);                                              // 获取用户统计 (自己或管理员)
router.get('/:id', authenticate, getUser);                                                     // 获取用户详情
router.put('/:id', authenticate, authorize('admin', 'super_admin'), updateUser);              // 更新用户信息
router.delete('/:id', authenticate, authorize('admin', 'super_admin'), deleteUser);           // 删除用户
router.post('/:id/reset-password', authenticate, authorize('admin', 'super_admin'), resetUserPassword); // 重置密码
router.post('/batch', authenticate, authorize('admin', 'super_admin'), batchUpdateUsers);     // 批量操作

export default router; 