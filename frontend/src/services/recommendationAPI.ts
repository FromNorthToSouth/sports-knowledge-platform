import api from './api';

// 推荐配置接口
interface RecommendationConfig {
  count?: number;
  difficulty?: string[];
  categories?: string[];
  excludeAnswered?: boolean;
  focusWeakness?: boolean;
  reviewMode?: boolean;
}

// 个性化考试配置接口
interface PersonalizedExamConfig {
  questionCount: number;
  difficulty?: string[];
  categories?: string[];
  timeLimit?: number;
  focusWeakness?: boolean;
}

// 学习路径推荐配置接口
interface LearningPathConfig {
  knowledgeBaseId?: string;
  difficulty?: string;
  maxPaths?: number;
  includeCompleted?: boolean;
}

// 知识点推荐配置接口
interface KnowledgePointConfig {
  count?: number;
  includeCompleted?: boolean;
}

// 推荐系统相关API
export const recommendationAPI = {
  
  // 获取智能推荐题目
  getSmartRecommendations: (config?: RecommendationConfig) => 
    api.get('/recommendations/questions', { params: config }),

  // 获取个性化组卷
  getPersonalizedExam: (config: PersonalizedExamConfig) =>
    api.post('/recommendations/exam', config),

  // 获取用户学习分析
  getUserLearningAnalysis: () =>
    api.get('/recommendations/analysis'),

  // 获取推荐统计信息
  getRecommendationStats: () =>
    api.get('/recommendations/stats'),

  // 获取个性化学习路径推荐
  getPersonalizedLearningPaths: (config?: LearningPathConfig) =>
    api.get('/recommendations/learning-paths', { params: config }),

  // 获取知识点推荐
  getRecommendedKnowledgePoints: (knowledgeBaseId: string, config?: KnowledgePointConfig) =>
    api.get(`/recommendations/knowledge-points/${knowledgeBaseId}`, { params: config }),

  // 获取推荐原因说明
  getRecommendationReasons: () => ({
    weakness: '基于您的薄弱环节，推荐针对性练习题目',
    progressive: '根据您当前水平，推荐适当难度的进阶题目',
    review: '基于您最近的学习内容，推荐复习巩固题目',
    exploration: '为您推荐新的知识领域探索题目',
    similar: '基于相似度算法推荐的相关题目'
  }),

  // 获取学习路径推荐原因说明
  getLearningPathReasons: () => ({
    difficulty: '难度匹配您当前水平',
    weakness: '针对薄弱环节加强',
    interest: '符合学习兴趣方向',
    prerequisite: '前置条件完全满足',
    popular: '热门路径，效果显著',
    time: '学习时长适中'
  }),

  // 获取知识点优先级说明
  getKnowledgePointPriorities: () => ({
    high: '优先学习 - 重要或未完成内容',
    medium: '推荐学习 - 适合当前水平',
    low: '可选学习 - 扩展内容'
  })
};

export default recommendationAPI; 