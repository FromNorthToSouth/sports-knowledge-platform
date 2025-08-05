import api from './api';

// 成就相关API
export const achievementAPI = {
  // 获取用户成就列表
  getUserAchievements: () => api.get('/achievements'),
  
  // 获取所有成就列表（包括未获得的）
  getAllAchievements: () => api.get('/achievements/all'),
  
  // 获取成就统计
  getAchievementStats: () => api.get('/achievements/stats'),
  
  // 获取最近获得的成就
  getRecentAchievements: (limit?: number) => 
    api.get('/achievements/recent', { params: { limit } }),
  
  // 手动检查成就进度
  checkAchievements: () => api.post('/achievements/check'),
  
  // 标记成就通知已读
  markAchievementNotified: (achievementId: string) => 
    api.put(`/achievements/notify/${achievementId}`),
  
  // 初始化默认成就（管理员功能）
  initializeAchievements: () => api.post('/achievements/initialize')
};

export default achievementAPI; 