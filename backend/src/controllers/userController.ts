import { Request, Response } from 'express';
import User from '../models/User';
import Exam from '../models/Exam';
import { AuthRequest } from '../middleware/auth';
import AchievementService from '../services/achievementService';

// 获取用户列表 (管理员权限)
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, role, institution, search } = req.query;

    // 构建查询条件
    const query: any = {};
    if (role) query.role = role;
    if (institution) query.institution = institution;
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .populate('institution', 'name')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: Number(page),
          pageSize: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      error: error.message
    });
  }
};

// 获取用户详情
export const getUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;
    const currentUserRole = req.user?.role;

    // 检查权限：管理员可以查看所有用户，普通用户只能查看自己
    if (id !== currentUserId && !['admin', 'super_admin'].includes(currentUserRole || '')) {
      return res.status(403).json({
        success: false,
        message: '没有权限查看此用户信息'
      });
    }

    const user = await User.findById(id)
      .select('-password')
      .populate('institution', 'name type');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 获取用户的考试统计
    const examStats = await Exam.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: null,
          totalExams: { $sum: 1 },
          completedExams: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          averageScore: { $avg: { $ifNull: ['$result.score', 0] } },
          passedExams: { $sum: { $cond: [{ $eq: ['$result.passed', true] }, 1, 0] } }
        }
      }
    ]);

    const stats = examStats[0] || {
      totalExams: 0,
      completedExams: 0,
      averageScore: 0,
      passedExams: 0
    };

    res.json({
      success: true,
      data: {
        user,
        examStats: stats
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取用户详情失败',
      error: error.message
    });
  }
};

// 更新用户信息 (管理员权限)
export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { username, email, role, isActive, grade, classInfo, institution } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      {
        username,
        email,
        role,
        isActive,
        grade,
        classInfo,
        institution
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: user
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '更新用户信息失败',
      error: error.message
    });
  }
};

// 删除用户 (管理员权限)
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // 软删除：将用户设为非活跃状态
    const user = await User.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      message: '用户已删除',
      data: user
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '删除用户失败',
      error: error.message
    });
  }
};

// 获取用户统计信息
export const getUserStats = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.user?.id;
    const { userId } = req.query;

    // 确定要查询的用户ID
    const targetUserId = userId || currentUserId;

    // 检查权限
    if (targetUserId !== currentUserId && !['admin', 'super_admin'].includes(req.user?.role || '')) {
      return res.status(403).json({
        success: false,
        message: '没有权限查看此用户统计'
      });
    }

    const user = await User.findById(targetUserId).select('learningStats points achievements');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 获取详细的考试统计
    const examStats = await Exam.aggregate([
      { $match: { user: user._id, status: 'completed' } },
      {
        $group: {
          _id: '$examType',
          count: { $sum: 1 },
          averageScore: { $avg: '$result.score' },
          totalTime: { $sum: '$result.totalTime' }
        }
      }
    ]);

    // 获取最近的活动
    const recentExams = await Exam.find({ user: targetUserId, status: 'completed' })
      .sort({ completedAt: -1 })
      .limit(10)
      .select('title result.score result.passed completedAt examType')
      .populate('user', 'username');

    // 计算准确率趋势（最近10次考试）
    const accuracyTrend = recentExams.map(exam => ({
      date: exam.completedAt,
      score: exam.result.score,
      passed: exam.result.passed
    }));

    res.json({
      success: true,
      data: {
        basicStats: user.learningStats,
        points: user.points,
        achievements: user.achievements,
        examStatsByType: examStats,
        recentActivity: recentExams,
        accuracyTrend
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取用户统计失败',
      error: error.message
    });
  }
};

// 重置用户密码 (管理员权限)
export const resetUserPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const bcrypt = require('bcryptjs');
    
    // 生成新的临时密码
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    const user = await User.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      message: '密码重置成功',
      data: {
        tempPassword,
        user
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '重置密码失败',
      error: error.message
    });
  }
};

// 批量操作用户
export const batchUpdateUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { userIds, operation, data } = req.body;

    let result;
    switch (operation) {
      case 'activate':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { isActive: true }
        );
        break;
      case 'deactivate':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { isActive: false }
        );
        break;
      case 'updateRole':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { role: data.role }
        );
        break;
      case 'updateInstitution':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { institution: data.institution }
        );
        break;
      default:
        return res.status(400).json({
          success: false,
          message: '不支持的操作类型'
        });
    }

    res.json({
      success: true,
      message: `批量操作成功，影响了 ${result.modifiedCount} 个用户`,
      data: result
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '批量操作失败',
      error: error.message
    });
  }
};

// 更新学习统计（内部使用，同时触发成就检查）
export const updateLearningStats = async (userId: string, updateData: any, eventData: any = {}) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 更新学习统计
    if (updateData.questionsAnswered) {
      user.learningStats.totalQuestions += updateData.questionsAnswered;
    }
    if (updateData.correctAnswers) {
      user.learningStats.correctAnswers += updateData.correctAnswers;
    }
    if (updateData.timeSpent) {
      user.learningStats.totalTime += updateData.timeSpent;
    }
    if (updateData.examCompleted) {
      user.learningStats.totalExams += 1;
      if (updateData.examPassed) {
        user.learningStats.passedExams += 1;
      }
    }

    // 重新计算正确率
    if (user.learningStats.totalQuestions > 0) {
      user.learningStats.accuracy = (user.learningStats.correctAnswers / user.learningStats.totalQuestions) * 100;
    }

    // 更新连续登录天数
    if (updateData.loginToday) {
      const today = new Date();
      const lastLogin = user.learningStats.lastLoginDate;
      const daysDiff = Math.floor((today.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        // 连续登录
        user.learningStats.continuousLoginDays += 1;
      } else if (daysDiff > 1) {
        // 断续了，重新开始
        user.learningStats.continuousLoginDays = 1;
      }
      // daysDiff === 0 表示今天已经登录过了，不需要更新
      
      user.learningStats.lastLoginDate = today;
    }

    await user.save();

    // 触发成就检查
    const earnedAchievements = await AchievementService.checkUserAchievements(userId, eventData);
    
    return {
      user,
      earnedAchievements
    };
  } catch (error) {
    console.error('更新学习统计失败:', error);
    throw error;
  }
}; 