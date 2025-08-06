// 模拟学习路径推荐数据
const mockLearningPaths = {
  userAnalysis: {
    totalQuestions: 156,
    accuracy: 0.753,
    weakCategories: ['足球规则', '射门技巧'],
    strongCategories: ['基础体能', '团队配合'],
    preferredDifficulty: 'medium'
  },
  recommendedPaths: [
    {
      path: {
        _id: 'path-1',
        name: '足球基础入门路径',
        description: '专为零基础学员设计的足球学习路径，循序渐进掌握基本技能。',
        difficulty: 'beginner',
        estimatedDuration: 180,
        steps: [
          { id: '1', title: '足球基本规则', description: '了解足球基本规则和场地知识', estimatedTime: 30, type: 'required', completed: false },
          { id: '2', title: '基础颠球技巧', description: '练习基本颠球动作和技巧', estimatedTime: 45, type: 'required', completed: false },
          { id: '3', title: '传球基础', description: '学习短传和长传技巧', estimatedTime: 60, type: 'required', completed: false }
        ],
        statistics: { completionRate: 85, avgRating: 4.7, learners: 156 }
      },
      score: 0.92,
      reason: '根据您的学习水平和薄弱环节定制，难度适中，循序渐进',
      matchReason: ['适合初学者水平', '针对足球规则薄弱环节', '学习时长合理', '内容系统全面'],
      estimatedProgress: 0
    },
    {
      path: {
        _id: 'path-2',
        name: '射门技巧专项训练',
        description: '专注提升射门技巧的训练路径，包含各种射门方式和技术要点。',
        difficulty: 'intermediate',
        estimatedDuration: 120,
        steps: [
          { id: '1', title: '射门姿势要领', description: '学习正确的射门姿势', estimatedTime: 30, type: 'required', completed: false },
          { id: '2', title: '力量射门训练', description: '提升射门力量和精度', estimatedTime: 45, type: 'required', completed: false }
        ],
        statistics: { completionRate: 78, avgRating: 4.6, learners: 89 }
      },
      score: 0.87,
      reason: '针对您的射门技巧薄弱环节，重点强化训练',
      matchReason: ['针对薄弱环节', '中级难度匹配', '专项技能提升'],
      estimatedProgress: 0
    }
  ]
};

// 模拟知识点推荐数据
const mockKnowledgePoints = {
  recommendations: [
    {
      knowledgePoint: {
        _id: 'kp-1',
        title: '足球基本规则详解',
        description: '深入学习足球比赛的基本规则，包括越位、犯规、手球等关键规则概念。'
      },
      difficulty: 'easy',
      estimatedTime: 30,
      progress: 0,
      priority: 'high',
      reason: '针对您的规则知识薄弱环节，建议优先学习掌握'
    },
    {
      knowledgePoint: {
        _id: 'kp-2',
        title: '颠球技巧进阶训练',
        description: '提升颠球技巧，学习单脚颠球、双脚交替、头部颠球等多种颠球方式。'
      },
      difficulty: 'medium',
      estimatedTime: 45,
      progress: 60,
      priority: 'high',
      reason: '继续之前未完成的学习内容，即将完成此技能掌握'
    },
    {
      knowledgePoint: {
        _id: 'kp-3',
        title: '射门技巧专项',
        description: '学习各种射门技巧，包括正脚背射门、内脚背射门、头球射门等。'
      },
      difficulty: 'medium',
      estimatedTime: 40,
      progress: 0,
      priority: 'high',
      reason: '射门是您的薄弱环节，重点推荐加强练习'
    },
    {
      knowledgePoint: {
        _id: 'kp-4',
        title: '传球技术要领',
        description: '掌握短传、长传、直塞球等传球技术，学习传球时机和力度控制。'
      },
      difficulty: 'medium',
      estimatedTime: 50,
      progress: 20,
      priority: 'medium',
      reason: '基于您的学习兴趣，推荐深入学习传球技术'
    }
  ]
};

module.exports = {
  mockLearningPaths,
  mockKnowledgePoints
};