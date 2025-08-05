import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Achievement, UserAchievement, IAchievement, IUserAchievement } from '../models/Achievement';
import { AchievementService } from '../services/achievementService';
import User from '../models/User';
import mongoose from 'mongoose';

// 获取用户成就列表
export const getUserAchievements = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { category, status, page = 1, pageSize = 20 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }

    // 构建查询条件
    const achievementQuery: any = { isActive: true };
    if (category) {
      achievementQuery.category = category;
    }

    const userAchievementQuery: any = { user: userId };
    if (status) {
      if (status === 'completed') {
        userAchievementQuery.isCompleted = true;
      } else if (status === 'in_progress') {
        userAchievementQuery.isCompleted = false;
        userAchievementQuery.progress = { $gt: 0 };
      } else if (status === 'not_started') {
        // 需要特殊处理未开始的成就
      }
    }

    // 获取所有活跃成就
    const allAchievements = await Achievement.find(achievementQuery)
      .sort({ category: 1, points: 1 })
      .lean();

    // 获取用户成就进度
    const userAchievements = await UserAchievement.find({ user: userId })
      .populate('achievement')
      .lean();

    // 创建用户成就映射
    const userAchievementMap = new Map();
    userAchievements.forEach(ua => {
      const achievementId = (ua.achievement as any)._id.toString();
      userAchievementMap.set(achievementId, ua);
    });

    // 合并数据
    const achievementsWithProgress = allAchievements.map(achievement => {
      const userAchievement = userAchievementMap.get(achievement._id.toString());
      
      return {
        ...achievement,
        userProgress: userAchievement ? {
          progress: userAchievement.progress,
          maxProgress: userAchievement.maxProgress,
          isCompleted: userAchievement.isCompleted,
          completedAt: userAchievement.completedAt,
          progressPercentage: Math.round((userAchievement.progress / userAchievement.maxProgress) * 100)
        } : {
          progress: 0,
          maxProgress: achievement.conditions.target,
          isCompleted: false,
          completedAt: null,
          progressPercentage: 0
        }
      };
    });

    // 根据状态过滤
    let filteredAchievements = achievementsWithProgress;
    if (status === 'completed') {
      filteredAchievements = achievementsWithProgress.filter(a => a.userProgress.isCompleted);
    } else if (status === 'in_progress') {
      filteredAchievements = achievementsWithProgress.filter(a => 
        !a.userProgress.isCompleted && a.userProgress.progress > 0
      );
    } else if (status === 'not_started') {
      filteredAchievements = achievementsWithProgress.filter(a => 
        !a.userProgress.isCompleted && a.userProgress.progress === 0
      );
    }

    // 分页
    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    const paginatedAchievements = filteredAchievements.slice(skip, skip + parseInt(pageSize as string));

    res.json({
      success: true,
      data: {
        achievements: paginatedAchievements,
        pagination: {
          current: parseInt(page as string),
          pageSize: parseInt(pageSize as string),
          total: filteredAchievements.length,
          totalPages: Math.ceil(filteredAchievements.length / parseInt(pageSize as string))
        }
      }
    });
  } catch (error: any) {
    console.error('获取用户成就列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取成就列表失败',
      error: error.message
    });
  }
};

// 获取所有成就列表（包括未获得的成就）
export const getAllAchievements = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { category } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }

    // 构建查询条件
    const achievementQuery: any = { isActive: true };
    if (category && category !== 'all') {
      achievementQuery.category = category;
    }

    // 获取所有活跃成就
    const allAchievements = await Achievement.find(achievementQuery)
      .sort({ category: 1, points: 1 })
      .lean();

    // 获取用户成就进度
    const userAchievements = await UserAchievement.find({ user: userId })
      .lean();

    // 创建用户成就映射
    const userAchievementMap = new Map();
    userAchievements.forEach(ua => {
      userAchievementMap.set(ua.achievement.toString(), ua);
    });

    // 合并所有成就数据，包括未获得的
    const combinedAchievements = allAchievements.map(achievement => {
      const userAchievement = userAchievementMap.get(achievement._id.toString());
      
      return {
        ...achievement,
        // 用户成就进度信息
        isCompleted: userAchievement?.isCompleted || false,
        progress: userAchievement?.progress || 0,
        completedAt: userAchievement?.completedAt || null,
        isNotified: userAchievement?.isNotified || false,
        // 计算进度百分比
        progressPercentage: userAchievement ? 
          Math.round((userAchievement.progress / achievement.conditions.target) * 100) : 0,
        // 成就状态
        status: userAchievement?.isCompleted ? 'completed' : 
                (userAchievement?.progress > 0 ? 'in_progress' : 'not_started')
      };
    });

    res.json({
      success: true,
      data: combinedAchievements
    });

  } catch (error: any) {
    console.error('获取所有成就失败:', error);
    res.status(500).json({
      success: false,
      message: '获取所有成就失败',
      error: error.message
    });
  }
};

// 获取成就统计
export const getAchievementStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }

    // 获取用户信息
    const user = await User.findById(userId).select('points').lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 统计所有成就
    const totalAchievements = await Achievement.countDocuments({ isActive: true });

    // 统计用户成就
    const userAchievementStats = await UserAchievement.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          completed: {
            $sum: { $cond: [{ $eq: ['$isCompleted', true] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $and: [{ $eq: ['$isCompleted', false] }, { $gt: ['$progress', 0] }] }, 1, 0] }
          },
          totalProgress: { $sum: '$progress' },
          totalMaxProgress: { $sum: '$maxProgress' }
        }
      }
    ]);

    const stats = userAchievementStats[0] || {
      completed: 0,
      inProgress: 0,
      totalProgress: 0,
      totalMaxProgress: 0
    };

    // 按类别统计
    const categoryStats = await UserAchievement.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId) } },
      {
        $lookup: {
          from: 'achievements',
          localField: 'achievement',
          foreignField: '_id',
          as: 'achievementInfo'
        }
      },
      { $unwind: '$achievementInfo' },
      {
        $group: {
          _id: '$achievementInfo.category',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$isCompleted', true] }, 1, 0] }
          },
          points: {
            $sum: { $cond: [{ $eq: ['$isCompleted', true] }, '$achievementInfo.points', 0] }
          }
        }
      }
    ]);

    // 按稀有度统计
    const rarityStats = await UserAchievement.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId), isCompleted: true } },
      {
        $lookup: {
          from: 'achievements',
          localField: 'achievement',
          foreignField: '_id',
          as: 'achievementInfo'
        }
      },
      { $unwind: '$achievementInfo' },
      {
        $group: {
          _id: '$achievementInfo.rarity',
          count: { $sum: 1 },
          points: { $sum: '$achievementInfo.points' }
        }
      }
    ]);

    // 最近获得的成就
    const recentAchievements = await UserAchievement.find({
      user: userId,
      isCompleted: true,
      completedAt: { $exists: true }
    })
      .populate('achievement', 'title description icon category rarity points')
      .sort({ completedAt: -1 })
      .limit(5)
      .lean();

    // 计算整体进度
    const overallProgress = stats.totalMaxProgress > 0 
      ? Math.round((stats.totalProgress / stats.totalMaxProgress) * 100)
      : 0;

    const completionRate = totalAchievements > 0
      ? Math.round((stats.completed / totalAchievements) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalPoints: user.points,
          totalAchievements,
          completedAchievements: stats.completed,
          inProgressAchievements: stats.inProgress,
          notStartedAchievements: totalAchievements - stats.completed - stats.inProgress,
          completionRate,
          overallProgress
        },
        categoryStats,
        rarityStats,
        recentAchievements,
        milestones: {
          nextMilestone: getNextMilestone(stats.completed),
          progress: stats.completed
        }
      }
    });
  } catch (error: any) {
    console.error('获取成就统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取成就统计失败',
      error: error.message
    });
  }
};

// 获取最近获得的成就
export const getRecentAchievements = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { limit = 10 } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }

    const recentAchievements = await UserAchievement.find({
      user: userId,
      isCompleted: true,
      completedAt: { $exists: true }
    })
      .populate('achievement', 'title description icon category rarity points')
      .sort({ completedAt: -1 })
      .limit(parseInt(limit as string))
      .lean();

    // 格式化数据
    const formattedAchievements = recentAchievements.map(ua => ({
      id: ua._id,
      achievement: ua.achievement,
      completedAt: ua.completedAt,
      progress: ua.progress,
      maxProgress: ua.maxProgress,
      timeSinceCompletion: getTimeSinceCompletion(ua.completedAt!)
    }));

    res.json({
      success: true,
      data: {
        achievements: formattedAchievements,
        count: formattedAchievements.length
      }
    });
  } catch (error: any) {
    console.error('获取最近成就失败:', error);
    res.status(500).json({
      success: false,
      message: '获取最近成就失败',
      error: error.message
    });
  }
};

// 手动检查成就进度
export const checkAchievements = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }

    // 调用成就服务检查进度
    const earnedAchievements = await AchievementService.checkUserAchievements(userId);

    res.json({
      success: true,
      data: {
        message: '成就检查完成',
        earnedAchievements: earnedAchievements ? earnedAchievements.map(ea => ({
          achievement: ea.achievement,
          isNew: true,
          completedAt: ea.userAchievement.completedAt
        })) : [],
        count: earnedAchievements ? earnedAchievements.length : 0
      }
    });
  } catch (error: any) {
    console.error('检查成就进度失败:', error);
    res.status(500).json({
      success: false,
      message: '检查成就进度失败',
      error: error.message
    });
  }
};

// 标记成就通知已读
export const markAchievementNotified = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { achievementId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(achievementId)) {
      return res.status(400).json({
        success: false,
        message: '成就ID无效'
      });
    }

    const userAchievement = await UserAchievement.findOne({
      user: userId,
      achievement: achievementId
    });

    if (!userAchievement) {
      return res.status(404).json({
        success: false,
        message: '用户成就记录不存在'
      });
    }

    userAchievement.notified = true;
    await userAchievement.save();

    res.json({
      success: true,
      message: '成就通知已标记为已读'
    });
  } catch (error: any) {
    console.error('标记成就通知失败:', error);
    res.status(500).json({
      success: false,
      message: '标记成就通知失败',
      error: error.message
    });
  }
};

// 初始化默认成就 (管理员功能)
export const initializeAchievements = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    await AchievementService.initializeDefaultAchievements();

    res.json({
      success: true,
      message: '默认成就初始化完成'
    });
  } catch (error: any) {
    console.error('初始化成就失败:', error);
    res.status(500).json({
      success: false,
      message: '初始化成就失败',
      error: error.message
    });
  }
};

// 获取成就排行榜
export const getAchievementLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const { category, timeRange = 'all_time', limit = 50 } = req.query;

    let dateFilter = {};
    if (timeRange === 'weekly') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      dateFilter = { completedAt: { $gte: weekAgo } };
    } else if (timeRange === 'monthly') {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      dateFilter = { completedAt: { $gte: monthAgo } };
    }

    const pipeline: any[] = [
      { $match: { isCompleted: true, ...dateFilter } },
      {
        $lookup: {
          from: 'achievements',
          localField: 'achievement',
          foreignField: '_id',
          as: 'achievementInfo'
        }
      },
      { $unwind: '$achievementInfo' }
    ];

    if (category) {
      pipeline.push({ $match: { 'achievementInfo.category': category } });
    }

    pipeline.push(
      {
        $group: {
          _id: '$user',
          totalPoints: { $sum: '$achievementInfo.points' },
          achievementCount: { $sum: 1 },
          latestAchievement: { $max: '$completedAt' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          userId: '$_id',
          username: '$userInfo.username',
          avatar: '$userInfo.avatar',
          totalPoints: 1,
          achievementCount: 1,
          latestAchievement: 1
        }
      },
      { $sort: { totalPoints: -1, achievementCount: -1 } },
      { $limit: parseInt(limit as string) }
    );

    const leaderboard = await UserAchievement.aggregate(pipeline);

    res.json({
      success: true,
      data: {
        leaderboard: leaderboard.map((item, index) => ({
          rank: index + 1,
          ...item
        })),
        timeRange,
        category: category || 'all'
      }
    });
  } catch (error: any) {
    console.error('获取成就排行榜失败:', error);
    res.status(500).json({
      success: false,
      message: '获取成就排行榜失败',
      error: error.message
    });
  }
};

// 辅助函数
function getNextMilestone(currentCount: number): { target: number; name: string } {
  const milestones = [
    { target: 5, name: '成就新手' },
    { target: 10, name: '成就爱好者' },
    { target: 25, name: '成就达人' },
    { target: 50, name: '成就专家' },
    { target: 100, name: '成就大师' }
  ];

  for (const milestone of milestones) {
    if (currentCount < milestone.target) {
      return milestone;
    }
  }

  return { target: Math.ceil(currentCount / 50) * 50 + 50, name: '成就传奇' };
}

function getTimeSinceCompletion(completedAt: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - completedAt.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 30) return `${diffDays}天前`;
  
  return completedAt.toLocaleDateString('zh-CN');
} 