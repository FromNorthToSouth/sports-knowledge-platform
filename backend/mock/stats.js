// 模拟统计数据
const mockStats = {
  learning: {
    totalTime: 3600, // 总学习时间（分钟）
    totalSessions: 25, // 总学习次数
    avgScore: 78.5, // 平均分数
    completedKnowledgePoints: 15, // 完成的知识点数量
    totalKnowledgePoints: 20, // 总知识点数量
    weeklyProgress: [
      { date: '2025-07-28', time: 45, score: 75 },
      { date: '2025-07-29', time: 60, score: 80 },
      { date: '2025-07-30', time: 30, score: 72 },
      { date: '2025-07-31', time: 90, score: 85 },
      { date: '2025-08-01', time: 75, score: 88 },
      { date: '2025-08-02', time: 50, score: 76 },
      { date: '2025-08-03', time: 40, score: 82 }
    ],
    categoryProgress: [
      { category: '足球', completed: 8, total: 12, accuracy: 0.82 },
      { category: '篮球', completed: 5, total: 8, accuracy: 0.75 },
      { category: '体能训练', completed: 2, total: 5, accuracy: 0.68 }
    ]
  },
  
  exams: {
    totalExams: 12,
    completedExams: 8,
    avgScore: 82.3,
    bestScore: 95,
    totalTime: 240, // 总考试时间（分钟）
    passRate: 0.875, // 通过率
    recentExams: [
      { id: '1', title: '足球基础知识测试', score: 95, date: '2025-08-03', duration: 30 },
      { id: '2', title: '篮球规则考试', score: 78, date: '2025-08-01', duration: 25 },
      { id: '3', title: '体能训练评估', score: 82, date: '2025-07-30', duration: 35 }
    ],
    scoreDistribution: [
      { range: '90-100', count: 3 },
      { range: '80-89', count: 2 },
      { range: '70-79', count: 2 },
      { range: '60-69', count: 1 }
    ]
  },
  
  leaderboard: [
    { rank: 1, user: { _id: 'student002', name: '王小明', avatar: null }, score: 2850, institution: '北京体育大学' },
    { rank: 2, user: { _id: 'student003', name: '李小红', avatar: null }, score: 2720, institution: '上海体育学院' },
    { rank: 3, user: { _id: 'student001', name: '李同学', avatar: null }, score: 2580, institution: '北京体育大学' },
    { rank: 4, user: { _id: 'student004', name: '张三', avatar: null }, score: 2450, institution: '成都体育学院' },
    { rank: 5, user: { _id: 'student005', name: '赵六', avatar: null }, score: 2380, institution: '北京市第一中学' },
    { rank: 6, user: { _id: 'student006', name: '钱七', avatar: null }, score: 2280, institution: '深圳中学' },
    { rank: 7, user: { _id: 'student007', name: '孙八', avatar: null }, score: 2150, institution: '华师一附中' },
    { rank: 8, user: { _id: 'student008', name: '周九', avatar: null }, score: 2050, institution: '北京市育英中学' },
    { rank: 9, user: { _id: 'student009', name: '吴十', avatar: null }, score: 1980, institution: '杭州市求是教育集团' },
    { rank: 10, user: { _id: 'student010', name: '郑十一', avatar: null }, score: 1920, institution: '星海体育培训中心' }
  ]
};

module.exports = {
  mockStats
};