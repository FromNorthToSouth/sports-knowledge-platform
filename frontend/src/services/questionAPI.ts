import api from './api';

// 题目相关API
export const questionAPI = {
  // 获取题目列表
  getQuestions: (params?: any) => api.get('/questions', { params }),
  
  // 获取题目详情
  getQuestion: (id: string) => api.get(`/questions/${id}`),
  
  // 创建题目
  createQuestion: (data: any) => api.post('/questions', data),
  
  // 更新题目
  updateQuestion: (id: string, data: any) => api.put(`/questions/${id}`, data),
  
  // 删除题目
  deleteQuestion: (id: string) => api.delete(`/questions/${id}`),
  
  // 审核题目
  reviewQuestion: (id: string, data: any) => api.put(`/questions/${id}/review`, data),
  
  // AI生成题目
  generateQuestion: (data: any) => api.post('/questions/generate', data),
  
  // 批量AI生成题目
  generateMultipleQuestions: (data: any) => api.post('/questions/generate/batch', data),
  
  // 导入题目
  importQuestions: (data: any) => api.post('/questions/import', data),
  
  // 获取题目统计
  getQuestionStats: () => api.get('/questions/stats'),
  
  // 数据库诊断
  debugQuestions: () => api.get('/questions/debug/all'),
};

export default questionAPI; 