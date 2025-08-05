import api from './api';

// 统计相关API
export const statsAPI = {
  // 获取系统统计数据 (管理员)
  getSystemStats: () => api.get('/stats/system'),
  
  // 获取个人学习统计
  getLearningStats: (params?: any) => api.get('/stats/learning', { params }),
  
  // 获取题目统计
  getQuestionStats: () => api.get('/stats/questions'),
  
  // 获取排行榜
  getLeaderboard: (params?: any) => api.get('/stats/leaderboard', { params }),
};

export default statsAPI; 