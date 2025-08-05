import api from './api';

// 知识库相关API
export const knowledgeAPI = {
  // 知识库管理
  getKnowledgeBases: (params?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    category?: string;
    status?: string;
    authorId?: string;
  }) => api.get('/knowledge-bases', { params }),
  
  getKnowledgeBase: (id: string) => api.get(`/knowledge-bases/${id}`),
  
  createKnowledgeBase: (data: {
    title: string;
    description: string;
    category: string;
    visibility: 'public' | 'private' | 'institution';
    tags?: string[];
    structure?: any;
    settings?: {
      allowComments?: boolean;
      allowEditing?: boolean;
      requireApproval?: boolean;
    };
  }) => api.post('/knowledge-bases', data),
  
  updateKnowledgeBase: (id: string, data: any) => api.put(`/knowledge-bases/${id}`, data),
  
  deleteKnowledgeBase: (id: string) => api.delete(`/knowledge-bases/${id}`),
  
  // 知识点管理
  getKnowledgePoints: (params?: {
    knowledgeBaseId?: string;
    category?: string;
    difficulty?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }) => api.get('/knowledge-points', { params }),
  
  getKnowledgePoint: (id: string) => api.get(`/knowledge-points/${id}`),
  
  createKnowledgePoint: (data: {
    title: string;
    content: string;
    knowledgeBaseId: string;
    category?: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    prerequisites?: string[];
    tags?: string[];
    mediaFiles?: Array<{
      type: 'image' | 'video' | 'audio' | 'document';
      url: string;
      description?: string;
    }>;
    relatedPoints?: string[];
  }) => api.post('/knowledge-points', data),
  
  updateKnowledgePoint: (id: string, data: any) => api.put(`/knowledge-points/${id}`, data),
  
  deleteKnowledgePoint: (id: string) => api.delete(`/knowledge-points/${id}`),
  
  // 学习路径管理
  getLearningPaths: (params?: {
    knowledgeBaseId?: string;
    difficulty?: string;
    duration?: string;
    page?: number;
    pageSize?: number;
  }) => api.get('/learning-paths', { params }),
  
  getLearningPath: (id: string) => api.get(`/learning-paths/${id}`),
  
  createLearningPath: (data: {
    name: string;
    description: string;
    knowledgeBaseId: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    estimatedDuration: number;
    steps: Array<{
      knowledgePointId: string;
      order: number;
      isRequired: boolean;
      estimatedTime?: number;
    }>;
    prerequisites?: string[];
    objectives?: string[];
  }) => api.post('/learning-paths', data),
  
  updateLearningPath: (id: string, data: any) => api.put(`/learning-paths/${id}`, data),
  
  deleteLearningPath: (id: string) => api.delete(`/learning-paths/${id}`),
  
  // 学习进度跟踪
  startLearningPath: (id: string) => api.post(`/learning-paths/${id}/start`),
  
  updateProgress: (pathId: string, data: {
    knowledgePointId: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
    progress?: number;
    timeSpent?: number;
    notes?: string;
  }) => api.put(`/learning-paths/${pathId}/progress`, data),
  
  getProgress: (pathId: string) => api.get(`/learning-paths/${pathId}/progress`),
  
  // 知识点搜索
  searchKnowledgePoints: (params: {
    query: string;
    knowledgeBaseId?: string;
    filters?: {
      category?: string[];
      difficulty?: string[];
      tags?: string[];
    };
    sort?: string;
    page?: number;
    pageSize?: number;
  }) => api.post('/knowledge-points/search', params),
  
  // 相关推荐
  getRelatedKnowledgePoints: (id: string, limit?: number) =>
    api.get(`/knowledge-points/${id}/related`, { params: { limit } }),
  
  // 知识图谱
  getKnowledgeGraph: (knowledgeBaseId: string, params?: {
    depth?: number;
    nodeTypes?: string[];
    includeRelations?: boolean;
  }) => api.get(`/knowledge-bases/${knowledgeBaseId}/graph`, { params }),
  
  // 协作编辑
  lockKnowledgePoint: (id: string) => api.post(`/knowledge-points/${id}/lock`),
  unlockKnowledgePoint: (id: string) => api.delete(`/knowledge-points/${id}/lock`),
  
  getEditHistory: (id: string, params?: {
    page?: number;
    pageSize?: number;
  }) => api.get(`/knowledge-points/${id}/history`, { params }),
  
  revertToVersion: (id: string, versionId: string) =>
    api.post(`/knowledge-points/${id}/revert`, { versionId }),
  
  // 评论和讨论
  getComments: (knowledgePointId: string, params?: {
    page?: number;
    pageSize?: number;
  }) => api.get(`/knowledge-points/${knowledgePointId}/comments`, { params }),
  
  addComment: (knowledgePointId: string, data: {
    content: string;
    parentId?: string;
    type?: 'comment' | 'question' | 'suggestion';
  }) => api.post(`/knowledge-points/${knowledgePointId}/comments`, data),
  
  updateComment: (commentId: string, data: { content: string }) =>
    api.put(`/comments/${commentId}`, data),
  
  deleteComment: (commentId: string) => api.delete(`/comments/${commentId}`),
  
  // 知识库统计
  getKnowledgeBaseStats: (id: string) => api.get(`/knowledge-bases/${id}/stats`),
  
  getPopularKnowledgePoints: (knowledgeBaseId?: string, limit?: number) =>
    api.get('/knowledge-points/popular', { 
      params: { knowledgeBaseId, limit } 
    }),
  
  // 导入导出
  exportKnowledgeBase: (id: string, format: 'json' | 'markdown' | 'pdf') =>
    api.get(`/knowledge-bases/${id}/export`, { 
      params: { format },
      responseType: 'blob' 
    }),
  
  importKnowledgeBase: (file: File, knowledgeBaseId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (knowledgeBaseId) {
      formData.append('knowledgeBaseId', knowledgeBaseId);
    }
    return api.post('/knowledge-bases/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // 标签管理
  getTags: (knowledgeBaseId?: string) =>
    api.get('/knowledge-bases/tags', { params: { knowledgeBaseId } }),
  
  createTag: (data: {
    name: string;
    color?: string;
    knowledgeBaseId?: string;
  }) => api.post('/knowledge-bases/tags', data),
  
  // 模板管理
  getTemplates: (category?: string) =>
    api.get('/knowledge-bases/templates', { params: { category } }),
  
  createTemplate: (data: {
    name: string;  
    description: string;
    category: string;
    structure: any;
  }) => api.post('/knowledge-bases/templates', data),
  
  useTemplate: (templateId: string, data: {
    title: string;
    description: string;
  }) => api.post(`/knowledge-bases/templates/${templateId}/use`, data),
  
  // 批量操作
  batchOperations: (data: {
    action: 'publish' | 'unpublish' | 'delete' | 'archive';
    ids: string[];
    type: 'knowledge-base' | 'knowledge-point' | 'learning-path';
  }) => api.post('/knowledge-bases/batch', data)
};

export default knowledgeAPI; 