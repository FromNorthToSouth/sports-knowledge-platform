import express from 'express';
import { register, login, getProfile, updateProfile, changePassword } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// 用户注册
router.post('/register', register);

// 用户登录
router.post('/login', login);

// 获取当前用户信息 (需要认证)
router.get('/profile', authenticate, getProfile);

// 更新用户信息 (需要认证)
router.put('/profile', authenticate, updateProfile);

// 修改密码 (需要认证)
router.put('/change-password', authenticate, changePassword);

export default router; 