import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import recommendationService from '../services/recommendationService';
import mongoose from 'mongoose';

/**
 * 获取智能推荐题目
 */
export const getSmartRecommendations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }

    const {
      count = 10,
      difficulty,
      categories,
      excludeAnswered = true,
      focusWeakness = true,
      reviewMode = true
    } = req.query;

    const config = {
      count: Number(count),
      difficulty: difficulty ? (Array.isArray(difficulty) ? difficulty.map(d => String(d)) : [String(difficulty)]) : undefined,
      categories: categories ? (Array.isArray(categories) ? categories.map(c => String(c)) : [String(categories)]) : undefined,
      excludeAnswered: excludeAnswered === 'true',
      focusWeakness: focusWeakness === 'true',
      reviewMode: reviewMode === 'true'
    };

    const recommendations = await recommendationService.getSmartQuestionRecommendations(userId, config);

    res.json({
      success: true,
      message: '智能推荐获取成功',
      data: {
        recommendations,
        total: recommendations.length,
        config: config
      }
    });

  } catch (error: any) {
    console.error('获取智能推荐失败:', error);
    res.status(500).json({
      success: false,
      message: '智能推荐服务暂时不可用',
      error: error.message
    });
  }
};

/**
 * 获取个性化组卷推荐
 */
export const getPersonalizedExam = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }

    const {
      questionCount = 20,
      difficulty,
      categories,
      timeLimit = 60,
      focusWeakness = true
    } = req.body;

    const examConfig = {
      questionCount: Number(questionCount),
      difficulty: difficulty ? (Array.isArray(difficulty) ? difficulty : [difficulty]) : undefined,
      categories: categories ? (Array.isArray(categories) ? categories : [categories]) : undefined,
      timeLimit: Number(timeLimit),
      focusWeakness: focusWeakness === true
    };

    const examData = await recommendationService.getPersonalizedExamQuestions(userId, examConfig);

    res.json({
      success: true,
      message: '个性化试卷生成成功',
      data: {
        questions: examData.questions,
        questionCount: examData.questions.length,
        distribution: examData.distribution,
        reasoning: examData.reasoning,
        config: examConfig
      }
    });

  } catch (error: any) {
    console.error('个性化组卷失败:', error);
    res.status(500).json({
      success: false,
      message: '个性化组卷服务暂时不可用',
      error: error.message
    });
  }
};

/**
 * 获取用户学习分析
 */
export const getUserLearningAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }

    // 调用推荐服务的内部方法来获取学习分析
    // 注意：这里需要将 analyzeUserLearningProfile 方法公开
    const analysis = await (recommendationService as any).analyzeUserLearningProfile(userId);

    res.json({
      success: true,
      message: '学习分析获取成功',
      data: {
        profile: analysis,
        suggestions: [
          ...(analysis.weakCategories.length > 0 ? 
            [`重点关注：${analysis.weakCategories.join('、')}`] : []),
          ...(analysis.accuracy < 0.6 ? 
            ['建议加强基础练习，提高答题准确率'] : []),
          ...(analysis.accuracy > 0.8 ? 
            ['您的基础很扎实，可以尝试更有挑战性的题目'] : []),
          ...(analysis.totalQuestions < 50 ? 
            ['建议增加练习量，多做题目巩固知识'] : [])
        ]
      }
    });

  } catch (error: any) {
    console.error('获取学习分析失败:', error);
    res.status(500).json({
      success: false,
      message: '学习分析服务暂时不可用',
      error: error.message
    });
  }
};

/**
 * 获取推荐统计信息
 */
export const getRecommendationStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }

    // 获取各类推荐的数量统计
    const [weaknessRecs, progressiveRecs, reviewRecs, explorationRecs] = await Promise.all([
      recommendationService.getSmartQuestionRecommendations(userId, { 
        count: 50, focusWeakness: true, reviewMode: false 
      }),
      recommendationService.getSmartQuestionRecommendations(userId, { 
        count: 50, focusWeakness: false, reviewMode: false 
      }),
      recommendationService.getSmartQuestionRecommendations(userId, { 
        count: 50, focusWeakness: false, reviewMode: true 
      }),
      recommendationService.getSmartQuestionRecommendations(userId, { 
        count: 50, focusWeakness: false, reviewMode: false 
      })
    ]);

    const stats = {
      weakness: weaknessRecs.filter(r => r.type === 'weakness').length,
      progressive: progressiveRecs.filter(r => r.type === 'progressive').length,  
      review: reviewRecs.filter(r => r.type === 'review').length,
      exploration: explorationRecs.filter(r => r.type === 'new').length,
      total: weaknessRecs.length + progressiveRecs.length + reviewRecs.length + explorationRecs.length
    };

    res.json({
      success: true,
      message: '推荐统计获取成功',
      data: {
        stats,
        recommendations: {
          weakness: '薄弱环节强化',
          progressive: '渐进式提升', 
          review: '复习巩固',
          exploration: '新领域探索'
        }
      }
    });

  } catch (error: any) {
    console.error('获取推荐统计失败:', error);
    res.status(500).json({
      success: false,
      message: '推荐统计服务暂时不可用',
      error: error.message
    });
  }
}; 

/**
 * 获取个性化学习路径推荐
 */
export const getPersonalizedLearningPaths = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }

    const {
      knowledgeBaseId,
      difficulty,
      maxPaths = 5,
      includeCompleted = false
    } = req.query;

    // 如果提供了knowledgeBaseId，验证其格式
    if (knowledgeBaseId && !mongoose.Types.ObjectId.isValid(knowledgeBaseId as string)) {
      return res.status(400).json({
        success: false,
        message: '无效的知识库ID格式'
      });
    }

    const options = {
      knowledgeBaseId: knowledgeBaseId as string,
      difficulty: difficulty as string,
      maxPaths: Number(maxPaths),
      includeCompleted: includeCompleted === 'true'
    };

    const pathRecommendations = await recommendationService.getPersonalizedLearningPaths(userId, options);

    res.json({
      success: true,
      message: '个性化学习路径推荐获取成功',
      data: {
        recommendedPaths: pathRecommendations.recommendedPaths,
        userAnalysis: {
          totalQuestions: pathRecommendations.userAnalysis.totalQuestions,
          accuracy: pathRecommendations.userAnalysis.accuracy,
          preferredDifficulty: pathRecommendations.userAnalysis.preferredDifficulty,
          weakCategories: pathRecommendations.userAnalysis.weakCategories,
          strongCategories: pathRecommendations.userAnalysis.strongCategories
        },
        total: pathRecommendations.recommendedPaths.length
      }
    });

  } catch (error: any) {
    console.error('获取个性化学习路径失败:', error);
    res.status(500).json({
      success: false,
      message: '学习路径推荐服务暂时不可用',
      error: error.message
    });
  }
};

/**
 * 获取知识点推荐
 */
export const getRecommendedKnowledgePoints = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }

    const { knowledgeBaseId } = req.params;
    const {
      count = 10,
      includeCompleted = false
    } = req.query;

    if (!knowledgeBaseId) {
      return res.status(400).json({
        success: false,
        message: '请提供知识库ID'
      });
    }

    // 验证ObjectId格式
    if (!mongoose.Types.ObjectId.isValid(knowledgeBaseId)) {
      return res.status(400).json({
        success: false,
        message: '无效的知识库ID格式'
      });
    }

    const options = {
      count: Number(count),
      includeCompleted: includeCompleted === 'true'
    };

    const knowledgePointRecommendations = await recommendationService.getRecommendedKnowledgePoints(
      userId, 
      knowledgeBaseId, 
      options
    );

    res.json({
      success: true,
      message: '知识点推荐获取成功',
      data: {
        recommendations: knowledgePointRecommendations,
        total: knowledgePointRecommendations.length,
        knowledgeBaseId
      }
    });

  } catch (error: any) {
    console.error('获取知识点推荐失败:', error);
    res.status(500).json({
      success: false,
      message: '知识点推荐服务暂时不可用',
      error: error.message
    });
  }
}; 