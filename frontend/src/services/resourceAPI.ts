import api from './api';

// 学习资源相关API
export const resourceAPI = {
  // 获取资源列表
  getResources: (params?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    category?: string;
    type?: string;
    difficulty?: string;
    status?: string;
    authorId?: string;
    tags?: string[];
  }) => api.get('/resources', { params }),
  
  // 获取单个资源详情
  getResource: (id: string) => api.get(`/resources/${id}`),
  
  // 创建资源
  createResource: (data: {
    title: string;
    description: string;
    category: string;
    type: 'document' | 'video' | 'audio' | 'image' | 'link' | 'interactive';
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    content?: string;
    fileUrl?: string;
    externalUrl?: string;
    tags?: string[];
    metadata?: {
      duration?: number;
      fileSize?: number;
      format?: string;
      language?: string;
    };
    visibility: 'public' | 'private' | 'institution' | 'class';
    targetAudience?: string[];
  }) => api.post('/resources', data),
  
  // 更新资源
  updateResource: (id: string, data: any) => api.put(`/resources/${id}`, data),
  
  // 删除资源
  deleteResource: (id: string) => api.delete(`/resources/${id}`),
  
  // 上传文件资源
  uploadFile: (file: File, data?: {
    title?: string;
    description?: string;
    category?: string;
    tags?: string[];
  }) => {
    const formData = new FormData();
    formData.append('file', file);
    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
        }
      });
    }
    return api.post('/resources/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // 批量上传文件
  batchUploadFiles: (files: File[], category?: string) => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files`, file);
    });
    if (category) {
      formData.append('category', category);
    }
    return api.post('/resources/upload/batch', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // 资源审核
  reviewResource: (id: string, data: {
    status: 'approved' | 'rejected' | 'pending';
    reason?: string;
    feedback?: string;
  }) => api.put(`/resources/${id}/review`, data),
  
  // 获取资源统计
  getResourceStats: (id: string) => api.get(`/resources/${id}/stats`),
  
  // 资源互动
  likeResource: (id: string) => api.post(`/resources/${id}/like`),
  unlikeResource: (id: string) => api.delete(`/resources/${id}/like`),
  favoriteResource: (id: string) => api.post(`/resources/${id}/favorite`),
  unfavoriteResource: (id: string) => api.delete(`/resources/${id}/favorite`),
  
  // 资源评价
  rateResource: (id: string, data: {
    rating: number;
    comment?: string;
  }) => api.post(`/resources/${id}/rate`, data),
  
  getRatings: (id: string, params?: {
    page?: number;
    pageSize?: number;
  }) => api.get(`/resources/${id}/ratings`, { params }),
  
  // 资源使用记录
  recordResourceUsage: (id: string, data: {
    action: 'view' | 'download' | 'share' | 'complete';
    duration?: number;
    progress?: number;
  }) => api.post(`/resources/${id}/usage`, data),
  
  getResourceUsage: (id: string, params?: {
    timeRange?: string;
    userId?: string;
  }) => api.get(`/resources/${id}/usage`, { params }),
  
  // 获取推荐资源
  getRecommendedResources: (params?: {
    userId?: string;
    category?: string;
    limit?: number;
    algorithm?: string;
  }) => api.get('/resources/recommended', { params }),
  
  // 搜索资源
  searchResources: (params: {
    query: string;
    filters?: {
      category?: string[];
      type?: string[];
      difficulty?: string[];
      tags?: string[];
    };
    sort?: string;
    page?: number;
    pageSize?: number;
  }) => api.post('/resources/search', params),
  
  // 获取热门资源
  getPopularResources: (params?: {
    timeRange?: string;
    category?: string;
    limit?: number;
  }) => api.get('/resources/popular', { params }),
  
  // 获取最新资源
  getLatestResources: (params?: {
    category?: string;
    limit?: number;
  }) => api.get('/resources/latest', { params }),
  
  // 资源分类管理
  getCategories: () => api.get('/resources/categories'),
  createCategory: (data: {
    name: string;
    description?: string;
    parentId?: string;
    icon?: string;
  }) => api.post('/resources/categories', data),
  updateCategory: (id: string, data: any) => api.put(`/resources/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/resources/categories/${id}`),
  
  // 资源标签管理
  getTags: (params?: { category?: string }) => api.get('/resources/tags', { params }),
  createTag: (data: { name: string; color?: string }) => api.post('/resources/tags', data),
  
  // 批量操作
  batchOperations: (data: {
    action: 'approve' | 'reject' | 'delete' | 'archive';
    resourceIds: string[];
    reason?: string;
  }) => api.post('/resources/batch', data),
  
  // 导出资源列表
  exportResources: (params?: any) =>
    api.get('/resources/export', { params, responseType: 'blob' }),
  
  // 资源收藏夹
  getFavorites: (params?: {
    page?: number;
    pageSize?: number;
    category?: string;
  }) => api.get('/resources/favorites', { params }),
  
  // 获取我的资源
  getMyResources: (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
  }) => api.get('/resources/mine', { params }),
  
  // 资源分享
  shareResource: (id: string, data: {
    shareType: 'link' | 'class' | 'user';
    targets?: string[];
    message?: string;
    expiresAt?: string;
  }) => api.post(`/resources/${id}/share`, data),
  
  // 获取分享链接
  getShareLink: (id: string) => api.get(`/resources/${id}/share-link`),
  
  // 通过分享链接访问资源
  accessSharedResource: (shareToken: string) => api.get(`/resources/shared/${shareToken}`)
};

export default resourceAPI; 