import api from './api';

// 收藏相关API
export const favoriteAPI = {
  // 添加收藏
  addFavorite: (questionId: string) => api.post('/favorites', { questionId }),
  
  // 取消收藏
  removeFavorite: (questionId: string) => api.delete(`/favorites/${questionId}`),
  
  // 获取收藏列表
  getFavorites: (params?: any) => api.get('/favorites', { params }),
  
  // 检查收藏状态
  checkFavorite: (questionId: string) => api.get(`/favorites/check/${questionId}`),
  
  // 获取收藏统计
  getFavoriteStats: () => api.get('/favorites/stats'),
};

export default favoriteAPI; 