import { Request, Response } from 'express';
import User from '../models/User';
import Question from '../models/Question';
import Exam from '../models/Exam';
import Institution from '../models/Institution';
import { AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

// 获取系统统计数据 (管理员权限)
export const getSystemStats = async (req: AuthRequest, res: Response) => {
  try {
    // 基础统计数据
    const [totalUsers, totalQuestions, totalExams, totalInstitutions] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Question.countDocuments({ status: 'published' }),
      Exam.countDocuments(),
      Institution.countDocuments()
    ]);

    // 活跃用户统计 (最近30天有活动的用户)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeUsers = await User.countDocuments({
      isActive: true,
      'learningStats.lastLoginDate': { $gte: thirtyDaysAgo }
    });

    // 今日新增用户
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayNewUsers = await User.countDocuments({
      createdAt: { $gte: todayStart }
    });

    // 本月完成考试数
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthlyCompletedExams = await Exam.countDocuments({
      status: 'completed',
      completedAt: { $gte: monthStart }
    });

    // 用户角色分布
    const userRoleDistribution = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // 题目难度分布
    const questionDifficultyDistribution = await Question.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$difficulty', count: { $sum: 1 } } }
    ]);

    // 题目分类分布
    const questionCategoryDistribution = await Question.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // 最近7天的用户注册趋势
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const userRegistrationTrend = await User.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // 最近7天的考试完成趋势
    const examCompletionTrend = await Exam.aggregate([
      { $match: { status: 'completed', completedAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$completedAt' },
            month: { $month: '$completedAt' },
            day: { $dayOfMonth: '$completedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalQuestions,
          totalExams,
          totalInstitutions,
          activeUsers,
          todayNewUsers,
          monthlyCompletedExams
        },
        distribution: {
          userRoles: userRoleDistribution,
          questionDifficulty: questionDifficultyDistribution,
          questionCategory: questionCategoryDistribution
        },
        trends: {
          userRegistration: userRegistrationTrend,
          examCompletion: examCompletionTrend
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取系统统计失败',
      error: error.message
    });
  }
};

// 获取学习统计数据
export const getLearningStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { timeRange = '30d' } = req.query;

    // 计算时间范围
    let startDate = new Date();
    switch (timeRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // 个人学习统计
    const user = await User.findById(userId).select('learningStats points achievements abilityProfile');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 时间范围内的考试统计
    const examStats = await Exam.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          status: 'completed',
          completedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalExams: { $sum: 1 },
          averageScore: { $avg: '$result.score' },
          totalTime: { $sum: '$result.totalTime' },
          passedExams: { $sum: { $cond: [{ $eq: ['$result.passed', true] }, 1, 0] } },
          highestScore: { $max: '$result.score' }
        }
      }
    ]);

    const stats = examStats[0] || {
      totalExams: 0,
      averageScore: 0,
      totalTime: 0,
      passedExams: 0,
      highestScore: 0
    };

    // 学习进度按分类统计
    const categoryProgress = await Exam.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          status: 'completed',
          completedAt: { $gte: startDate }
        }
      },
      {
        $lookup: {
          from: 'questions',
          localField: 'answers.questionId',
          foreignField: '_id',
          as: 'questionDetails'
        }
      },
      { $unwind: '$questionDetails' },
      {
        $group: {
          _id: '$questionDetails.category',
          totalQuestions: { $sum: 1 },
          correctAnswers: {
            $sum: {
              $cond: [
                { $eq: ['$answers.isCorrect', true] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          category: '$_id',
          accuracy: {
            $multiply: [
              { $divide: ['$correctAnswers', '$totalQuestions'] },
              100
            ]
          },
          totalQuestions: 1,
          correctAnswers: 1
        }
      }
    ]);

    // 学习时间趋势 (最近7天)
    const timeTrend = await Exam.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          status: 'completed',
          completedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$completedAt' },
            month: { $month: '$completedAt' },
            day: { $dayOfMonth: '$completedAt' }
          },
          totalTime: { $sum: '$result.totalTime' },
          examCount: { $sum: 1 },
          averageScore: { $avg: '$result.score' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // 错题分析
    const wrongAnswers = await Exam.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          status: 'completed',
          completedAt: { $gte: startDate }
        }
      },
      { $unwind: '$answers' },
      { $match: { 'answers.isCorrect': false } },
      {
        $lookup: {
          from: 'questions',
          localField: 'answers.questionId',
          foreignField: '_id',
          as: 'question'
        }
      },
      { $unwind: '$question' },
      {
        $group: {
          _id: {
            category: '$question.category',
            difficulty: '$question.difficulty'
          },
          count: { $sum: 1 },
          questions: { $push: '$question' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        userStats: user.learningStats,
        points: user.points,
        achievements: user.achievements,
        abilityProfile: user.abilityProfile,
        periodStats: stats,
        categoryProgress,
        timeTrend,
        weaknessAnalysis: wrongAnswers
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取学习统计失败',
      error: error.message
    });
  }
};

// 获取题目统计数据
export const getQuestionStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // 基础题目统计
    const questionStats = await Question.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // 题目难度分布
    const difficultyStats = await Question.aggregate([
      { $match: { status: 'published' } },
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 }
        }
      }
    ]);

    // 题目分类分布
    const categoryStats = await Question.aggregate([
      { $match: { status: 'published' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // 题目答题统计
    const answerStats = await Question.aggregate([
      { $match: { status: 'published' } },
      {
        $project: {
          title: 1,
          category: 1,
          difficulty: 1,
          answeredCount: { $ifNull: ['$statistics.answeredCount', 0] },
          correctCount: { $ifNull: ['$statistics.correctCount', 0] },
          accuracy: {
            $cond: [
              { $gt: ['$statistics.answeredCount', 0] },
              {
                $multiply: [
                  { $divide: ['$statistics.correctCount', '$statistics.answeredCount'] },
                  100
                ]
              },
              0
            ]
          }
        }
      },
      { $sort: { answeredCount: -1 } },
      { $limit: 20 }
    ]);

    let myQuestionStats = null;
    if (userRole && ['teacher', 'content_manager', 'admin', 'super_admin'].includes(userRole)) {
      // 我创建的题目统计
      myQuestionStats = await Question.aggregate([
        { $match: { creator: new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);
    }

    res.json({
      success: true,
      data: {
        overview: questionStats,
        difficultyDistribution: difficultyStats,
        categoryDistribution: categoryStats,
        popularQuestions: answerStats,
        myQuestions: myQuestionStats
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取题目统计失败',
      error: error.message
    });
  }
};

// 获取排行榜数据
export const getLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const { type = 'points', timeRange = 'all', limit = 20 } = req.query;

    let matchCondition: any = { isActive: true };

    // 时间范围过滤
    if (timeRange !== 'all') {
      const startDate = new Date();
      switch (timeRange) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setDate(startDate.getDate() - 30);
          break;
      }
      matchCondition['learningStats.lastLoginDate'] = { $gte: startDate };
    }

    let sortField: any;
    switch (type) {
      case 'points':
        sortField = { points: -1 };
        break;
      case 'accuracy':
        sortField = { 'learningStats.accuracy': -1 };
        break;
      case 'totalQuestions':
        sortField = { 'learningStats.totalQuestions': -1 };
        break;
      case 'totalTime':
        sortField = { 'learningStats.totalTime': -1 };
        break;
      default:
        sortField = { points: -1 };
    }

    const leaderboard = await User.find(matchCondition)
      .select('username avatar points learningStats role institution')
      .populate('institution', 'name')
      .sort(sortField)
      .limit(Number(limit));

    // 添加排名
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      rank: index + 1,
      user: {
        id: user._id,
        username: user.username,
        avatar: user.avatar,
        role: user.role,
        institution: user.institution
      },
      stats: {
        points: user.points,
        ...user.learningStats
      }
    }));

    res.json({
      success: true,
      data: rankedLeaderboard
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取排行榜失败',
      error: error.message
    });
  }
}; 