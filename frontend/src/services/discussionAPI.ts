import api from './api';

// 讨论区相关API
export const discussionAPI = {
  // 获取讨论列表
  getDiscussions: (params?: any) => api.get('/discussions', { params }),
  
  // 获取讨论详情
  getDiscussion: (id: string) => api.get(`/discussions/${id}`),
  
  // 创建讨论
  createDiscussion: (data: any) => api.post('/discussions', data),
  
  // 添加回复
  addReply: (discussionId: string, content: string) => 
    api.post(`/discussions/${discussionId}/replies`, { content }),
  
  // 点赞讨论
  likeDiscussion: (id: string) => api.post(`/discussions/${id}/like`),
  
  // 点赞回复
  likeReply: (discussionId: string, replyId: string) => 
    api.post(`/discussions/${discussionId}/replies/${replyId}/like`),
  
  // 收藏讨论
  starDiscussion: (id: string) => api.post(`/discussions/${id}/star`),
  
  // 取消收藏讨论
  unstarDiscussion: (id: string) => api.delete(`/discussions/${id}/star`),
  
  // 标记已解决
  markResolved: (id: string) => api.patch(`/discussions/${id}/resolved`),
  
  // 获取讨论统计
  getDiscussionStats: () => api.get('/discussions/stats'),
};

export default discussionAPI; 