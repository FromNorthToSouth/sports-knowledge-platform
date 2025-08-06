// 模拟知识库数据
const mockKnowledgeBases = [
  {
    _id: '1',
    title: '足球基础技能训练',
    description: '从零开始学习足球基本技能，包括颠球、传球、射门等核心技术动作。',
    category: '足球',
    difficulty: 'beginner',
    stats: {
      knowledgePoints: 24,
      resources: 18,
      learners: 156,
      completionRate: 78,
      avgRating: 4.6
    }
  },
  {
    _id: '2',
    title: '篮球进阶技术',
    description: '面向有一定基础的学员，深入学习篮球高级技术和战术配合。',
    category: '篮球',
    difficulty: 'intermediate',
    stats: {
      knowledgePoints: 32,
      resources: 28,
      learners: 89,
      completionRate: 65,
      avgRating: 4.8
    }
  }
];

module.exports = {
  mockKnowledgeBases
};