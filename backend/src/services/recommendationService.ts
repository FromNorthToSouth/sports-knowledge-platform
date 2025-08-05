import Question from '../models/Question';
import User from '../models/User';
import Exam from '../models/Exam';
import { LearningPath, KnowledgeProgress } from '../models/KnowledgeBase';
import { KnowledgePoint } from '../models/KnowledgePoint';
import mongoose from 'mongoose';

// 推荐配置接口
interface RecommendationConfig {
  count: number;
  difficulty?: string[];
  categories?: string[];
  excludeAnswered?: boolean;
  focusWeakness?: boolean;
  reviewMode?: boolean;
}

// 推荐结果接口
interface RecommendationResult {
  question: any;
  reason: string;
  score: number;
  type: 'weakness' | 'progressive' | 'review' | 'new' | 'similar';
}

// 用户学习状态分析接口
interface UserLearningProfile {
  totalQuestions: number;
  accuracy: number;
  weakCategories: string[];
  strongCategories: string[];
  preferredDifficulty: string;
  recentTopics: string[];
  incorrectQuestions: string[];
  masteredTopics: string[];
}

class RecommendationService {
  
  /**
   * 根据学习状态智能推荐题目
   */
  async getSmartQuestionRecommendations(
    userId: string, 
    config: RecommendationConfig = { count: 10 }
  ): Promise<RecommendationResult[]> {
    
    try {
      // 1. 分析用户学习状态
      const userProfile = await this.analyzeUserLearningProfile(userId);
      
      // 2. 获取各类推荐题目
      const recommendations: RecommendationResult[] = [];
      
      // 2.1 薄弱环节强化题目 (40%)
      if (config.focusWeakness !== false) {
        const weaknessQuestions = await this.getWeaknessReinforcementQuestions(
          userId, 
          userProfile, 
          Math.ceil(config.count * 0.4)
        );
        recommendations.push(...weaknessQuestions);
      }
      
      // 2.2 渐进式难度题目 (30%)
      const progressiveQuestions = await this.getProgressiveDifficultyQuestions(
        userId, 
        userProfile, 
        Math.ceil(config.count * 0.3)
      );
      recommendations.push(...progressiveQuestions);
      
      // 2.3 复习巩固题目 (20%)
      if (config.reviewMode !== false) {
        const reviewQuestions = await this.getReviewQuestions(
          userId, 
          userProfile, 
          Math.ceil(config.count * 0.2)
        );
        recommendations.push(...reviewQuestions);
      }
      
      // 2.4 探索新领域题目 (10%)
      const explorationQuestions = await this.getExplorationQuestions(
        userId, 
        userProfile, 
        Math.ceil(config.count * 0.1)
      );
      recommendations.push(...explorationQuestions);
      
      // 3. 去重、排序并返回指定数量
      const uniqueRecommendations = this.deduplicateAndSort(recommendations);
      return uniqueRecommendations.slice(0, config.count);
      
    } catch (error) {
      console.error('智能推荐题目失败:', error);
      // 降级到简单推荐
      return await this.getSimpleRecommendations(userId, config);
    }
  }

  /**
   * 分析用户学习状态
   */
  private async analyzeUserLearningProfile(userId: string): Promise<UserLearningProfile> {
    try {
      // 获取用户基本信息
      const user = await User.findById(userId).lean();
      if (!user) {
        throw new Error('用户不存在');
      }

      // 分析用户考试历史
      const recentExams = await Exam.find({ 
        user: userId,
        status: 'completed'
      })
      .sort({ completedAt: -1 })
      .limit(20)
      .populate('answers.questionId', 'category tags difficulty')
      .lean();

      // 统计答题情况
      let totalQuestions = 0;
      let correctAnswers = 0;
      const categoryStats: { [key: string]: { total: number; correct: number } } = {};
      const incorrectQuestions: string[] = [];
      const recentTopics: string[] = [];

      recentExams.forEach(exam => {
        exam.answers.forEach(answer => {
          totalQuestions++;
          
          const question = answer.questionId as any;
          if (!question) return;

          // 统计分类表现
          const categoryKey = `${question.category?.sport || '未分类'}-${question.category?.knowledgeType || '基础'}`;
          if (!categoryStats[categoryKey]) {
            categoryStats[categoryKey] = { total: 0, correct: 0 };
          }
          categoryStats[categoryKey].total++;

          if (answer.isCorrect) {
            correctAnswers++;
            categoryStats[categoryKey].correct++;
          } else {
            incorrectQuestions.push(answer.questionId.toString());
          }

          // 记录最近话题
          if (question.tags && question.tags.length > 0) {
            recentTopics.push(...question.tags);
          }
        });
      });

      // 分析强弱分类
      const weakCategories: string[] = [];
      const strongCategories: string[] = [];
      const masteredTopics: string[] = [];

      Object.entries(categoryStats).forEach(([category, stats]) => {
        const accuracy = stats.total > 0 ? stats.correct / stats.total : 0;
        if (accuracy < 0.6) {
          weakCategories.push(category);
        } else if (accuracy > 0.8) {
          strongCategories.push(category);
          masteredTopics.push(category);
        }
      });

      // 推断偏好难度
      const accuracy = totalQuestions > 0 ? correctAnswers / totalQuestions : 0;
      let preferredDifficulty = 'medium';
      if (accuracy > 0.8) {
        preferredDifficulty = 'hard';
      } else if (accuracy < 0.5) {
        preferredDifficulty = 'easy';
      }

      return {
        totalQuestions,
        accuracy,
        weakCategories: weakCategories.slice(0, 5),
        strongCategories: strongCategories.slice(0, 5),
        preferredDifficulty,
        recentTopics: [...new Set(recentTopics)].slice(0, 10),
        incorrectQuestions: [...new Set(incorrectQuestions)],
        masteredTopics: masteredTopics.slice(0, 8)
      };

    } catch (error) {
      console.error('分析用户学习状态失败:', error);
      // 返回默认配置
      return {
        totalQuestions: 0,
        accuracy: 0,
        weakCategories: [],
        strongCategories: [],
        preferredDifficulty: 'medium',
        recentTopics: [],
        incorrectQuestions: [],
        masteredTopics: []
      };
    }
  }

  /**
   * 获取薄弱环节强化题目
   */
  private async getWeaknessReinforcementQuestions(
    userId: string, 
    profile: UserLearningProfile, 
    count: number
  ): Promise<RecommendationResult[]> {
    
    if (profile.weakCategories.length === 0) {
      return [];
    }

    try {
      // 构建查询条件：针对薄弱分类
      const categoryConditions = profile.weakCategories.map(category => {
        const [sport, knowledgeType] = category.split('-');
        return {
          'category.sport': sport,
          'category.knowledgeType': knowledgeType
        };
      });

      const questions = await Question.find({
        $or: categoryConditions,
        status: 'published',
        difficulty: { $in: ['easy', 'medium'] }, // 薄弱环节从简单题开始
        _id: { $nin: profile.incorrectQuestions.map(id => new mongoose.Types.ObjectId(id)) }
      })
      .limit(count * 2)
      .lean();

      return questions.slice(0, count).map(question => ({
        question,
        reason: '针对薄弱环节的强化练习',
        score: 0.9,
        type: 'weakness' as const
      }));

    } catch (error) {
      console.error('获取薄弱环节题目失败:', error);
      return [];
    }
  }

  /**
   * 获取渐进式难度题目
   */
  private async getProgressiveDifficultyQuestions(
    userId: string, 
    profile: UserLearningProfile, 
    count: number
  ): Promise<RecommendationResult[]> {
    
    try {
      // 根据用户当前水平推荐适当难度
      let targetDifficulties = ['medium'];
      
      if (profile.accuracy > 0.7) {
        targetDifficulties = ['medium', 'hard'];
      } else if (profile.accuracy < 0.4) {
        targetDifficulties = ['easy', 'medium'];
      }

      const questions = await Question.find({
        status: 'published',
        difficulty: { $in: targetDifficulties },
        _id: { $nin: profile.incorrectQuestions.map(id => new mongoose.Types.ObjectId(id)) }
      })
      .limit(count)
      .lean();

      return questions.map(question => ({
        question,
        reason: '根据当前水平推荐的渐进式题目',
        score: 0.8,
        type: 'progressive' as const
      }));

    } catch (error) {
      console.error('获取渐进式题目失败:', error);
      return [];
    }
  }

  /**
   * 获取复习巩固题目
   */
  private async getReviewQuestions(
    userId: string, 
    profile: UserLearningProfile, 
    count: number
  ): Promise<RecommendationResult[]> {
    
    if (profile.recentTopics.length === 0) {
      return [];
    }

    try {
      const questions = await Question.find({
        status: 'published',
        tags: { $in: profile.recentTopics },
        difficulty: profile.preferredDifficulty,
        _id: { $nin: profile.incorrectQuestions.map(id => new mongoose.Types.ObjectId(id)) }
      })
      .limit(count)
      .lean();

      return questions.map(question => ({
        question,
        reason: '基于最近学习内容的复习题目',
        score: 0.7,
        type: 'review' as const
      }));

    } catch (error) {
      console.error('获取复习题目失败:', error);
      return [];
    }
  }

  /**
   * 获取探索新领域题目
   */
  private async getExplorationQuestions(
    userId: string, 
    profile: UserLearningProfile, 
    count: number
  ): Promise<RecommendationResult[]> {
    
    try {
      // 避开已掌握的主题，探索新领域
      const avoidCategories = profile.masteredTopics.map(topic => {
        const [sport, knowledgeType] = topic.split('-');
        return {
          'category.sport': { $ne: sport },
          'category.knowledgeType': { $ne: knowledgeType }
        };
      });

      const questions = await Question.find({
        status: 'published',
        difficulty: 'easy', // 新领域从简单开始
        $and: avoidCategories.length > 0 ? avoidCategories : [{}],
        _id: { $nin: profile.incorrectQuestions.map(id => new mongoose.Types.ObjectId(id)) }
      })
      .limit(count)
      .lean();

      return questions.map(question => ({
        question,
        reason: '探索新知识领域',
        score: 0.6,
        type: 'new' as const
      }));

    } catch (error) {
      console.error('获取探索题目失败:', error);
      return [];
    }
  }

  /**
   * 简单推荐（降级方案）
   */
  private async getSimpleRecommendations(
    userId: string, 
    config: RecommendationConfig
  ): Promise<RecommendationResult[]> {
    
    try {
      const user = await User.findById(userId).lean();
      if (!user) return [];

      // 根据用户正确率推荐难度
      const accuracy = user.learningStats?.accuracy || 0;
      let difficulty = 'medium';
      if (accuracy > 0.8) difficulty = 'hard';
      else if (accuracy < 0.5) difficulty = 'easy';

      const questions = await Question.find({
        status: 'published',
        difficulty: config.difficulty || difficulty
      })
      .limit(config.count)
      .lean();

      return questions.map(question => ({
        question,
        reason: '基于整体表现的推荐',
        score: 0.5,
        type: 'similar' as const
      }));

    } catch (error) {
      console.error('简单推荐失败:', error);
      return [];
    }
  }

  /**
   * 去重并排序推荐结果
   */
  private deduplicateAndSort(recommendations: RecommendationResult[]): RecommendationResult[] {
    const seen = new Set<string>();
    const uniqueRecommendations: RecommendationResult[] = [];

    for (const rec of recommendations) {
      const questionId = rec.question._id.toString();
      if (!seen.has(questionId)) {
        seen.add(questionId);
        uniqueRecommendations.push(rec);
      }
    }

    // 按推荐分数降序排序
    return uniqueRecommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * 获取个性化组卷推荐
   */
  async getPersonalizedExamQuestions(
    userId: string,
    examConfig: {
      questionCount: number;
      difficulty?: string[];
      categories?: string[];
      timeLimit?: number;
      focusWeakness?: boolean;
    }
  ): Promise<{
    questions: any[];
    distribution: {
      weakness: number;
      progressive: number;
      review: number;
      exploration: number;
    };
    reasoning: string;
  }> {
    
    try {
      const profile = await this.analyzeUserLearningProfile(userId);
      
      // 智能分配题目类型比例
      const distribution = this.calculateQuestionDistribution(profile, examConfig);
      
      // 获取各类型题目
      const questions: any[] = [];
      
      if (distribution.weakness > 0) {
        const weaknessQuestions = await this.getWeaknessReinforcementQuestions(
          userId, profile, distribution.weakness
        );
        questions.push(...weaknessQuestions.map(r => r.question));
      }
      
      if (distribution.progressive > 0) {
        const progressiveQuestions = await this.getProgressiveDifficultyQuestions(
          userId, profile, distribution.progressive
        );
        questions.push(...progressiveQuestions.map(r => r.question));
      }
      
      if (distribution.review > 0) {
        const reviewQuestions = await this.getReviewQuestions(
          userId, profile, distribution.review
        );
        questions.push(...reviewQuestions.map(r => r.question));
      }
      
      if (distribution.exploration > 0) {
        const explorationQuestions = await this.getExplorationQuestions(
          userId, profile, distribution.exploration
        );
        questions.push(...explorationQuestions.map(r => r.question));
      }

      // 生成组卷说明
      const reasoning = this.generateExamReasoning(profile, distribution);

      return {
        questions: questions.slice(0, examConfig.questionCount),
        distribution,
        reasoning
      };

    } catch (error) {
      console.error('个性化组卷失败:', error);
      throw error;
    }
  }

  /**
   * 计算题目分配比例
   */
  private calculateQuestionDistribution(
    profile: UserLearningProfile,
    examConfig: any
  ): { weakness: number; progressive: number; review: number; exploration: number } {
    
    const total = examConfig.questionCount;
    
    // 根据用户水平调整比例
    if (profile.accuracy < 0.4) {
      // 低水平用户：重点强化薄弱环节
      return {
        weakness: Math.ceil(total * 0.6),
        progressive: Math.ceil(total * 0.3),
        review: Math.ceil(total * 0.1),
        exploration: 0
      };
    } else if (profile.accuracy > 0.8) {
      // 高水平用户：多探索新领域
      return {
        weakness: Math.ceil(total * 0.2),
        progressive: Math.ceil(total * 0.4),
        review: Math.ceil(total * 0.2),
        exploration: Math.ceil(total * 0.2)
      };
    } else {
      // 中等水平用户：均衡发展
      return {
        weakness: Math.ceil(total * 0.4),
        progressive: Math.ceil(total * 0.3),
        review: Math.ceil(total * 0.2),
        exploration: Math.ceil(total * 0.1)
      };
    }
  }

  /**
   * 生成组卷说明
   */
  private generateExamReasoning(
    profile: UserLearningProfile,
    distribution: any
  ): string {
    
    const parts = [];
    
    if (distribution.weakness > 0) {
      parts.push(`${distribution.weakness}道薄弱环节强化题`);
    }
    if (distribution.progressive > 0) {
      parts.push(`${distribution.progressive}道渐进提升题`);
    }
    if (distribution.review > 0) {
      parts.push(`${distribution.review}道复习巩固题`);
    }
    if (distribution.exploration > 0) {
      parts.push(`${distribution.exploration}道新领域探索题`);
    }

    const accuracyDesc = profile.accuracy > 0.8 ? '优秀' : 
                       profile.accuracy > 0.6 ? '良好' : '需要提升';

    return `基于您当前${accuracyDesc}的学习状态，为您精心搭配了${parts.join('、')}，帮助您针对性提升学习效果。`;
  }

  /**
   * 获取个性化学习路径推荐
   */
  async getPersonalizedLearningPaths(
    userId: string,
    options: {
      knowledgeBaseId?: string;
      difficulty?: string;
      maxPaths?: number;
      includeCompleted?: boolean;
    } = {}
  ): Promise<{
    recommendedPaths: Array<{
      path: any;
      reason: string;
      score: number;
      matchReason: string[];
      estimatedProgress: number;
    }>;
    userAnalysis: UserLearningProfile;
  }> {

    try {
      const { maxPaths = 5, includeCompleted = false } = options;
      
      // 1. 分析用户学习状态
      const userProfile = await this.analyzeUserLearningProfile(userId);
      
      // 2. 构建查询条件
      const query: any = { 
        status: 'published',
        visibility: { $in: ['public', 'institution'] }
      };
      
      if (options.knowledgeBaseId) {
        // 验证ObjectId格式
        if (!mongoose.Types.ObjectId.isValid(options.knowledgeBaseId)) {
          console.warn(`无效的知识库ID: ${options.knowledgeBaseId}`);
          return {
            recommendedPaths: [],
            userAnalysis: userProfile
          };
        }
        query.knowledgeBase = options.knowledgeBaseId;
      }
      
      // 4. 获取所有可用学习路径
      const allPaths = await LearningPath.find(query)
        .populate('knowledgeBase', 'title category')
        .populate('knowledgePoints.pointId', 'title category difficulty')
        .lean();
      
      // 5. 获取用户已完成的路径
      const userCompletedPaths = await KnowledgeProgress.find({
        user: userId,
        learningPath: { $exists: true },
        status: 'completed'
      }).distinct('learningPath');
      
      // 6. 过滤和评分路径
      const scoredPaths = [];
      
      for (const path of allPaths) {
        // 跳过已完成的路径（除非明确要求包含）
        if (!includeCompleted && userCompletedPaths.includes(path._id)) {
          continue;
        }
        
        const pathScore = await this.calculatePathRecommendationScore(path, userProfile);
        const matchReasons = this.generatePathMatchReasons(path, userProfile);
        const estimatedProgress = await this.estimatePathProgress(userId, path);
        
        if (pathScore.score > 0.3) { // 只推荐评分较高的路径
          scoredPaths.push({
            path,
            reason: pathScore.reason,
            score: pathScore.score,
            matchReason: matchReasons,
            estimatedProgress
          });
        }
      }
      
      // 7. 排序并返回top N
      scoredPaths.sort((a, b) => b.score - a.score);
      
      return {
        recommendedPaths: scoredPaths.slice(0, maxPaths),
        userAnalysis: userProfile
      };
      
    } catch (error) {
      console.error('获取个性化学习路径失败:', error);
      throw error;
    }
  }

  /**
   * 计算学习路径推荐分数
   */
  private async calculatePathRecommendationScore(
    path: any, 
    userProfile: UserLearningProfile
  ): Promise<{ score: number; reason: string }> {
    
    let score = 0.5; // 基础分数
    let reasons = [];
    
    // 1. 难度匹配 (25%)
    const difficultyMatch = this.calculateDifficultyMatch(path.difficulty, userProfile);
    score += difficultyMatch * 0.25;
    if (difficultyMatch > 0.7) {
      reasons.push('难度适中');
    }
    
    // 2. 薄弱环节覆盖 (30%)
    const weaknessMatch = this.calculateWeaknessMatch(path, userProfile);
    score += weaknessMatch * 0.3;
    if (weaknessMatch > 0.6) {
      reasons.push('针对薄弱环节');
    }
    
    // 3. 兴趣匹配 (20%)
    const interestMatch = this.calculateInterestMatch(path, userProfile);
    score += interestMatch * 0.2;
    if (interestMatch > 0.7) {
      reasons.push('符合学习兴趣');
    }
    
    // 4. 前置条件满足 (15%)
    const prerequisiteMatch = await this.calculatePrerequisiteMatch(path, userProfile);
    score += prerequisiteMatch * 0.15;
    if (prerequisiteMatch > 0.8) {
      reasons.push('前置条件满足');
    }
    
    // 5. 路径热度 (10%)
    const popularityBonus = Math.min(path.stats.learners / 100, 0.1);
    score += popularityBonus;
    
    const reason = reasons.length > 0 ? reasons.join('，') : '基于综合分析推荐';
    
    return { score: Math.min(score, 1.0), reason };
  }

  /**
   * 计算难度匹配度
   */
  private calculateDifficultyMatch(pathDifficulty: string, userProfile: UserLearningProfile): number {
    const userLevel = userProfile.preferredDifficulty;
    
    // 完全匹配
    if (pathDifficulty === userLevel) return 1.0;
    
    // 渐进式匹配
    const difficultyOrder = ['beginner', 'intermediate', 'advanced'];
    const userIndex = difficultyOrder.indexOf(userLevel);
    const pathIndex = difficultyOrder.indexOf(pathDifficulty);
    
    const diff = Math.abs(userIndex - pathIndex);
    return Math.max(0, 1 - diff * 0.3);
  }

  /**
   * 计算薄弱环节匹配度
   */
  private calculateWeaknessMatch(path: any, userProfile: UserLearningProfile): number {
    if (userProfile.weakCategories.length === 0) return 0.5;
    
    let matchCount = 0;
    const pathCategories = new Set();
    
    // 收集路径涉及的分类
    path.knowledgePoints?.forEach((kp: any) => {
      if (kp.pointId?.category) {
        const categoryKey = `${kp.pointId.category.sport || '未分类'}-${kp.pointId.category.knowledgeType || '基础'}`;
        pathCategories.add(categoryKey);
      }
    });
    
    // 计算匹配的薄弱分类数量
    userProfile.weakCategories.forEach(weakCategory => {
      if (pathCategories.has(weakCategory)) {
        matchCount++;
      }
    });
    
    return Math.min(matchCount / userProfile.weakCategories.length, 1.0);
  }

  /**
   * 计算兴趣匹配度
   */
  private calculateInterestMatch(path: any, userProfile: UserLearningProfile): number {
    if (userProfile.recentTopics.length === 0) return 0.5;
    
    let matchCount = 0;
    const pathTopics = new Set([
      ...path.tags || [],
      path.knowledgeBase?.category || '',
      ...(path.knowledgePoints?.map((kp: any) => kp.pointId?.title || '') || [])
    ]);
    
    userProfile.recentTopics.forEach(topic => {
      if (Array.from(pathTopics).some(pathTopic => 
        pathTopic.toLowerCase().includes(topic.toLowerCase())
      )) {
        matchCount++;
      }
    });
    
    return Math.min(matchCount / userProfile.recentTopics.length, 1.0);
  }

  /**
   * 计算前置条件匹配度
   */
  private async calculatePrerequisiteMatch(path: any, userProfile: UserLearningProfile): Promise<number> {
    if (!path.prerequisites || path.prerequisites.length === 0) {
      return 1.0; // 无前置条件，完全匹配
    }
    
    try {
      const { KnowledgeProgress } = await import('../models/KnowledgeBase');
      
      // 检查用户是否完成了前置知识点
      const completedPrerequisites = await KnowledgeProgress.find({
        user: userProfile.totalQuestions > 0 ? 'mock-user-id' : 'unknown', // 这里需要实际的userId
        knowledgePoint: { $in: path.prerequisites },
        status: 'completed'
      }).countDocuments();
      
      return completedPrerequisites / path.prerequisites.length;
      
    } catch (error) {
      console.error('计算前置条件匹配度失败:', error);
      return 0.5; // 默认返回中等匹配度
    }
  }

  /**
   * 生成路径匹配原因
   */
  private generatePathMatchReasons(path: any, userProfile: UserLearningProfile): string[] {
    const reasons = [];
    
    // 难度匹配
    if (path.difficulty === userProfile.preferredDifficulty) {
      reasons.push(`适合您当前的${userProfile.preferredDifficulty}水平`);
    }
    
    // 薄弱环节
    const weaknessMatch = this.calculateWeaknessMatch(path, userProfile);
    if (weaknessMatch > 0.6) {
      reasons.push('重点加强您的薄弱知识点');
    }
    
    // 学习兴趣
    const interestMatch = this.calculateInterestMatch(path, userProfile);
    if (interestMatch > 0.7) {
      reasons.push('与您最近的学习内容相关');
    }
    
    // 路径特色
    if (path.estimatedDuration <= 120) { // 2小时以内
      reasons.push('学习时长适中，容易完成');
    }
    
    if (path.stats?.completionRate > 80) {
      reasons.push('完成率高，效果显著');
    }
    
    if (path.stats?.avgRating > 4.5) {
      reasons.push('用户评价优秀');
    }
    
    return reasons.slice(0, 3); // 最多返回3个原因
  }

  /**
   * 估算用户完成路径的进度
   */
  private async estimatePathProgress(userId: string, path: any): Promise<number> {
    try {
      const { KnowledgeProgress } = await import('../models/KnowledgeBase');
      
      if (!path.knowledgePoints || path.knowledgePoints.length === 0) {
        return 0;
      }
      
      const knowledgePointIds = path.knowledgePoints.map((kp: any) => kp.pointId);
      
      const completedCount = await KnowledgeProgress.find({
        user: userId,
        knowledgePoint: { $in: knowledgePointIds },
        status: 'completed'
      }).countDocuments();
      
      return Math.round((completedCount / knowledgePointIds.length) * 100);
      
    } catch (error) {
      console.error('估算路径进度失败:', error);
      return 0;
    }
  }

  /**
   * 获取知识点推荐（针对特定知识库）
   */
  async getRecommendedKnowledgePoints(
    userId: string,
    knowledgeBaseId: string,
    options: {
      count?: number;
      includeCompleted?: boolean;
    } = {}
  ): Promise<Array<{
    knowledgePoint: any;
    reason: string;
    priority: 'high' | 'medium' | 'low';
    estimatedTime: number;
    difficulty: string;
    progress: number;
  }>> {
    
    try {
      const { count = 10, includeCompleted = false } = options;
      
      // 1. 分析用户学习状态
      const userProfile = await this.analyzeUserLearningProfile(userId);
      
      // 2. 验证知识库ID格式
      if (!mongoose.Types.ObjectId.isValid(knowledgeBaseId)) {
        console.warn(`无效的知识库ID: ${knowledgeBaseId}`);
        return [];
      }
      
      // 3. 获取知识库中的所有知识点
      const allKnowledgePoints = await KnowledgePoint.find({
        knowledgeBaseId,
        status: 'published'
      }).lean();
      
      // 4. 获取用户已完成的知识点
      const userProgress = await KnowledgeProgress.find({
        user: userId,
        knowledgeBase: knowledgeBaseId
      }).lean();
      
      const progressMap = new Map();
      userProgress.forEach(p => {
        if (p.knowledgePoint) {
          progressMap.set(p.knowledgePoint.toString(), p);
        }
      });
      
      // 5. 筛选和评分知识点
      const recommendations = [];
      
      for (const kp of allKnowledgePoints) {
        const userProgressData = progressMap.get(kp._id.toString());
        
        // 跳过已完成的知识点（除非明确要求包含）
        if (!includeCompleted && userProgressData?.status === 'completed') {
          continue;
        }
        
        const recommendation = this.evaluateKnowledgePointRecommendation(
          kp, 
          userProfile, 
          userProgressData
        );
        
        if (recommendation.priority !== 'low') {
          recommendations.push(recommendation);
        }
      }
      
      // 6. 排序并返回
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      recommendations.sort((a, b) => {
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        // 相同优先级按预计时间排序（短的优先）
        return a.estimatedTime - b.estimatedTime;
      });
      
      return recommendations.slice(0, count);
      
    } catch (error) {
      console.error('获取推荐知识点失败:', error);
      return [];
    }
  }

  /**
   * 评估知识点推荐
   */
  private evaluateKnowledgePointRecommendation(
    knowledgePoint: any,
    userProfile: UserLearningProfile,
    userProgress?: any
  ): {
    knowledgePoint: any;
    reason: string;
    priority: 'high' | 'medium' | 'low';
    estimatedTime: number;
    difficulty: string;
    progress: number;
  } {
    
    let priority: 'high' | 'medium' | 'low' = 'medium';
    let reason = '基于学习分析推荐';
    
    const categoryKey = `${knowledgePoint.category?.sport || '未分类'}-${knowledgePoint.category?.knowledgeType || '基础'}`;
    const progress = userProgress?.progress || 0;
    
    // 高优先级判断
    if (userProfile.weakCategories.includes(categoryKey)) {
      priority = 'high';
      reason = '针对您的薄弱环节，建议优先学习';
    } else if (progress > 0 && progress < 100) {
      priority = 'high';
      reason = '继续之前未完成的学习内容';
    } 
    // 中优先级判断
    else if (knowledgePoint.difficulty === userProfile.preferredDifficulty) {
      priority = 'medium';
      reason = '难度适合，推荐学习';
    } else if (userProfile.recentTopics.some((topic: string) => 
      knowledgePoint.title?.toLowerCase().includes(topic.toLowerCase()) ||
      knowledgePoint.tags?.some((tag: string) => tag.toLowerCase().includes(topic.toLowerCase()))
    )) {
      priority = 'medium';
      reason = '与您最近的学习兴趣相关';
    }
    // 低优先级
    else {
      priority = 'low';
      reason = '扩展学习内容';
    }
    
    return {
      knowledgePoint,
      reason,
      priority,
      estimatedTime: knowledgePoint.estimatedTime || 30,
      difficulty: knowledgePoint.difficulty || 'medium',
      progress
    };
  }
}

const recommendationService = new RecommendationService();
export { recommendationService as RecommendationService };
export default recommendationService; 