import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import User from '../models/User';
import Institution from '../models/Institution';
import { AuthRequest } from '../middleware/auth';

// 生成JWT token
const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET || 'default_secret';
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
};

// 用户注册
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, phone, role, institution: institutionId, grade, classInfo } = req.body;

    // 检查用户是否已存在
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名或邮箱已存在'
      });
    }

    // 验证机构ID（必需）
    if (!institutionId) {
      return res.status(400).json({
        success: false,
        message: '请选择您的学校'
      });
    }

    const institution = await Institution.findById(institutionId);
    if (!institution || institution.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: '无效的学校选择'
      });
    }

    // 加密密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 创建用户
    const user = new User({
      username,
      email,
      password: hashedPassword,
      phone,
      role: role || 'student',
      institution: institutionId, // 使用机构ID
      grade,
      classInfo,
      learningStats: {
        totalQuestions: 0,
        correctAnswers: 0,
        accuracy: 0,
        totalTime: 0,
        continuousLoginDays: 0,
        lastLoginDate: new Date()
      }
    });

    await user.save();

    // 生成JWT token
    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          institution: institution?.name
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误，注册失败'
    });
  }
};

// 用户登录
export const login = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const loginField = username || email; // 支持用户名或邮箱登录

    // 查找用户 (支持用户名或邮箱)
    const user = await User.findOne({
      $or: [{ email: loginField }, { username: loginField }]
    }).populate('institution');
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: '用户名/邮箱或密码错误'
      });
    }

    // 检查用户是否活跃
    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: '账户已被禁用，请联系管理员'
      });
    }

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: '用户名/邮箱或密码错误'
      });
    }

    // 更新登录统计
    const now = new Date();
    const lastLogin = user.learningStats.lastLoginDate;
    const daysDiff = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      user.learningStats.continuousLoginDays += 1;
    } else if (daysDiff > 1) {
      user.learningStats.continuousLoginDays = 1;
    }
    
    user.learningStats.lastLoginDate = now;
    await user.save();

    // 生成token
    const token = generateToken(user._id.toString());

    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          institution: user.institution,
          learningStats: user.learningStats,
          abilityProfile: user.abilityProfile,
          points: user.points
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器错误，登录失败'
    });
  }
};

// 获取当前用户信息
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?._id).populate('institution').select('-password');
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
};

// 更新用户信息
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { username, phone, avatar, preferredSports, notifications } = req.body;
    
    const user = await User.findById(req.user?._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 更新允许修改的字段
    if (username) user.username = username;
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;
    if (preferredSports) user.settings.preferredSports = preferredSports;
    if (notifications !== undefined) user.settings.notifications = notifications;

    await user.save();

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: { user: user.toObject({ transform: (doc, ret) => { delete ret.password; return ret; } }) }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新用户信息失败'
    });
  }
};

// 修改密码
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user?._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 验证当前密码
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: '当前密码错误'
      });
    }

    // 加密新密码
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '修改密码失败'
    });
  }
}; 