import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getSmartRecommendations,
  getPersonalizedExam,
  getUserLearningAnalysis,
  getRecommendationStats,
  getPersonalizedLearningPaths,
  getRecommendedKnowledgePoints
} from '../controllers/recommendationController';

const router = express.Router();

// 所有路由都需要身份验证
router.use(authenticate);

// 智能推荐题目
router.get('/questions', getSmartRecommendations);

// 个性化组卷
router.post('/exam', getPersonalizedExam);

// 用户学习分析
router.get('/analysis', getUserLearningAnalysis);

// 推荐统计信息
router.get('/stats', getRecommendationStats);

// 个性化学习路径推荐
router.get('/learning-paths', getPersonalizedLearningPaths);

// 知识点推荐
router.get('/knowledge-points/:knowledgeBaseId', getRecommendedKnowledgePoints);

export default router; 