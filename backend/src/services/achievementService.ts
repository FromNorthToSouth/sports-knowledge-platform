import { Achievement, UserAchievement, IAchievement, IUserAchievement } from '../models/Achievement';
import User from '../models/User';
import mongoose from 'mongoose';

export class AchievementService {
  
  // 初始化默认成就
  static async initializeDefaultAchievements() {
    const defaultAchievements = [
      // 学习类成就
      {
        id: 'first_question',
        title: '学习新手',
        description: '完成第一道题目',
        icon: '🎯',
        category: 'learning',
        rarity: 'common',
        points: 10,
        conditions: {
          type: 'count',
          target: 1,
          metric: 'questions_answered'
        }
      },
      {
        id: 'hundred_questions',
        title: '百题达人',
        description: '累计答题100道',
        icon: '📚',
        category: 'learning',
        rarity: 'rare',
        points: 50,
        conditions: {
          type: 'count',
          target: 100,
          metric: 'questions_answered'
        }
      },
      {
        id: 'thousand_questions',
        title: '千题大师',
        description: '累计答题1000道',
        icon: '🏆',
        category: 'learning',
        rarity: 'epic',
        points: 200,
        conditions: {
          type: 'count',
          target: 1000,
          metric: 'questions_answered'
        }
      },
      
      // 连续学习成就
      {
        id: 'streak_3_days',
        title: '坚持学习',
        description: '连续学习3天',
        icon: '🔥',
        category: 'streak',
        rarity: 'common',
        points: 20,
        conditions: {
          type: 'streak',
          target: 3,
          metric: 'login_days'
        }
      },
      {
        id: 'streak_7_days',
        title: '一周达人',
        description: '连续学习7天',
        icon: '⚡',
        category: 'streak',
        rarity: 'rare',
        points: 50,
        conditions: {
          type: 'streak',
          target: 7,
          metric: 'login_days'
        }
      },
      {
        id: 'streak_30_days',
        title: '月度专家',
        description: '连续学习30天',
        icon: '💫',
        category: 'streak',
        rarity: 'epic',
        points: 200,
        conditions: {
          type: 'streak',
          target: 30,
          metric: 'login_days'
        }
      },
      
      // 准确率成就
      {
        id: 'accuracy_80',
        title: '准确射手',
        description: '单次练习正确率达到80%',
        icon: '🎯',
        category: 'accuracy',
        rarity: 'common',
        points: 30,
        conditions: {
          type: 'percentage',
          target: 80,
          metric: 'single_session_accuracy'
        }
      },
      {
        id: 'accuracy_90',
        title: '神射手',
        description: '单次练习正确率达到90%',
        icon: '🏹',
        category: 'accuracy',
        rarity: 'rare',
        points: 60,
        conditions: {
          type: 'percentage',
          target: 90,
          metric: 'single_session_accuracy'
        }
      },
      {
        id: 'perfect_score',
        title: '完美表现',
        description: '单次练习获得100%正确率',
        icon: '💯',
        category: 'accuracy',
        rarity: 'epic',
        points: 100,
        conditions: {
          type: 'percentage',
          target: 100,
          metric: 'single_session_accuracy'
        }
      },
      
      // 考试成就
      {
        id: 'first_exam',
        title: '考试初体验',
        description: '完成第一次考试',
        icon: '📝',
        category: 'exam',
        rarity: 'common',
        points: 25,
        conditions: {
          type: 'count',
          target: 1,
          metric: 'exams_completed'
        }
      },
      {
        id: 'exam_master',
        title: '考试达人',
        description: '通过10次考试',
        icon: '🎓',
        category: 'exam',
        rarity: 'rare',
        points: 100,
        conditions: {
          type: 'count',
          target: 10,
          metric: 'exams_passed'
        }
      },
      
      // 时间成就
      {
        id: 'study_hour',
        title: '勤奋学者',
        description: '累计学习1小时',
        icon: '⏰',
        category: 'time',
        rarity: 'common',
        points: 15,
        conditions: {
          type: 'time',
          target: 60, // 分钟
          metric: 'total_study_time'
        }
      },
      {
        id: 'study_10_hours',
        title: '时间管理大师',
        description: '累计学习10小时',
        icon: '⏳',
        category: 'time',
        rarity: 'rare',
        points: 75,
        conditions: {
          type: 'time',
          target: 600, // 分钟
          metric: 'total_study_time'
        }
      }
    ];

    for (const achievementData of defaultAchievements) {
      const existingAchievement = await Achievement.findOne({ id: achievementData.id });
      if (!existingAchievement) {
        await Achievement.create(achievementData);
        console.log(`Created achievement: ${achievementData.title}`);
      }
    }
  }

  // 检查用户的成就进度
  static async checkUserAchievements(userId: string, eventData: any = {}) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      const achievements = await Achievement.find({ isActive: true });
      const earnedAchievements = [];

      for (const achievement of achievements) {
        const userAchievement = await UserAchievement.findOne({
          user: userId,
          achievement: achievement._id
        });

        // 如果已经完成，跳过
        if (userAchievement?.isCompleted) continue;

        const progress = await this.calculateProgress(user, achievement, eventData);
        const maxProgress = achievement.conditions.target;

        if (!userAchievement) {
          // 创建新的用户成就记录
          await UserAchievement.create({
            user: userId,
            achievement: achievement._id,
            progress,
            maxProgress,
            isCompleted: progress >= maxProgress,
            completedAt: progress >= maxProgress ? new Date() : undefined
          });
        } else {
          // 更新现有记录
          userAchievement.progress = progress;
          userAchievement.maxProgress = maxProgress;
          
          if (progress >= maxProgress && !userAchievement.isCompleted) {
            userAchievement.isCompleted = true;
            userAchievement.completedAt = new Date();
            
            // 奖励积分
            user.points += achievement.points;
            await user.save();
            
            earnedAchievements.push({
              achievement,
              userAchievement
            });
          }
          
          await userAchievement.save();
        }
      }

      return earnedAchievements;
    } catch (error) {
      console.error('检查用户成就时出错:', error);
      return [];
    }
  }

  // 计算成就进度
  private static async calculateProgress(user: any, achievement: IAchievement, eventData: any = {}) {
    const { conditions } = achievement;
    
    switch (conditions.metric) {
      case 'questions_answered':
        return user.learningStats.totalQuestions;
      
      case 'login_days':
        if (conditions.type === 'streak') {
          return user.learningStats.continuousLoginDays;
        }
        return user.learningStats.continuousLoginDays;
      
      case 'single_session_accuracy':
        return eventData.sessionAccuracy || 0;
      
      case 'exams_completed':
        return user.learningStats.totalExams;
      
      case 'exams_passed':
        return user.learningStats.passedExams;
      
      case 'total_study_time':
        return user.learningStats.totalTime;
      
      default:
        return 0;
    }
  }

  // 获取用户成就列表
  static async getUserAchievements(userId: string) {
    const userAchievements = await UserAchievement
      .find({ user: userId })
      .populate('achievement')
      .sort({ completedAt: -1, createdAt: -1 });

    return userAchievements.map((ua: any) => {
      const achievement = ua.achievement;
      return {
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        category: achievement.category,
        rarity: achievement.rarity,
        points: achievement.points,
        progress: ua.progress,
        maxProgress: ua.maxProgress,
        isCompleted: ua.isCompleted,
        completedAt: ua.completedAt,
        earnedAt: ua.completedAt // 兼容前端字段名
      };
    });
  }

  // 获取成就统计
  static async getAchievementStats(userId: string) {
    const userAchievements: any[] = await UserAchievement.find({ user: userId }).populate('achievement');
    
    const total = userAchievements.length;
    const completed = userAchievements.filter(ua => ua.isCompleted).length;
    const byRarity = {
      common: userAchievements.filter(ua => ua.isCompleted && ua.achievement.rarity === 'common').length,
      rare: userAchievements.filter(ua => ua.isCompleted && ua.achievement.rarity === 'rare').length,
      epic: userAchievements.filter(ua => ua.isCompleted && ua.achievement.rarity === 'epic').length,
      legendary: userAchievements.filter(ua => ua.isCompleted && ua.achievement.rarity === 'legendary').length
    };
    const totalPoints = userAchievements
      .filter(ua => ua.isCompleted)
      .reduce((sum, ua) => sum + ua.achievement.points, 0);

    return {
      total,
      completed,
      byRarity,
      totalPoints,
      completionRate: total > 0 ? (completed / total * 100).toFixed(1) : 0
    };
  }

  // 获取最近获得的成就
  static async getRecentAchievements(userId: string, limit: number = 5) {
    const recentAchievements: any[] = await UserAchievement
      .find({ 
        user: userId, 
        isCompleted: true,
        completedAt: { $exists: true }
      })
      .populate('achievement')
      .sort({ completedAt: -1 })
      .limit(limit);

    return recentAchievements.map(ua => ({
      id: ua.achievement.id,
      title: ua.achievement.title,
      description: ua.achievement.description,
      icon: ua.achievement.icon,
      rarity: ua.achievement.rarity,
      points: ua.achievement.points,
      completedAt: ua.completedAt
    }));
  }

  // 标记成就通知已读
  static async markAchievementNotified(userId: string, achievementId: string) {
    const achievement = await Achievement.findOne({ id: achievementId });
    if (achievement) {
      await UserAchievement.updateOne(
        { 
          user: userId, 
          achievement: achievement._id
        },
        { notified: true }
      );
    }
  }
}

export default AchievementService; 