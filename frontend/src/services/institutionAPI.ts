import api from './api';

// 机构相关API
export const institutionAPI = {
  // 获取机构列表
  getInstitutions: (params?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    type?: string;
    status?: string;
  }) => api.get('/institutions', { params }),
  
  // 获取单个机构详情
  getInstitution: (id: string) => api.get(`/institutions/${id}`),
  
  // 创建机构
  createInstitution: (data: {
    name: string;
    type: 'university' | 'high_school' | 'middle_school' | 'primary_school' | 'training_center';
    description?: string;
    address?: string;
    contact?: {
      phone?: string;
      email?: string;
      website?: string;
    };
    settings?: {
      maxUsers?: number;
      enabledFeatures?: string[];
      customization?: any;
    };
  }) => api.post('/institutions', data),
  
  // 更新机构信息
  updateInstitution: (id: string, data: any) => api.put(`/institutions/${id}`, data),
  
  // 删除机构
  deleteInstitution: (id: string) => api.delete(`/institutions/${id}`),
  
  // 获取机构统计信息
  getInstitutionStats: (id: string) => api.get(`/institutions/${id}/stats`),
  
  // 获取机构用户列表
  getInstitutionUsers: (id: string, params?: {
    page?: number;
    pageSize?: number;
    role?: string;
    status?: string;
  }) => api.get(`/institutions/${id}/users`, { params }),
  
  // 添加用户到机构
  addUserToInstitution: (id: string, data: {
    userId?: string;
    email?: string;
    role: string;
    permissions?: string[];
  }) => api.post(`/institutions/${id}/users`, data),
  
  // 从机构移除用户
  removeUserFromInstitution: (id: string, userId: string) => 
    api.delete(`/institutions/${id}/users/${userId}`),
  
  // 更新用户在机构中的角色
  updateUserRole: (id: string, userId: string, data: {
    role: string;
    permissions?: string[];
  }) => api.put(`/institutions/${id}/users/${userId}`, data),
  
  // 获取机构配置
  getInstitutionConfig: (id: string) => api.get(`/institutions/${id}/config`),
  
  // 更新机构配置
  updateInstitutionConfig: (id: string, config: any) => 
    api.put(`/institutions/${id}/config`, config),
  
  // 批量操作
  batchOperations: (data: {
    action: 'enable' | 'disable' | 'delete';
    institutionIds: string[];
  }) => api.post('/institutions/batch', data),
  
  // 导出机构数据
  exportInstitutions: (params?: any) => 
    api.get('/institutions/export', { params, responseType: 'blob' }),
  
  // 获取机构层级结构
  getInstitutionHierarchy: () => api.get('/institutions/hierarchy'),
  
  // 设置上级机构
  setParentInstitution: (id: string, parentId: string) =>
    api.put(`/institutions/${id}/parent`, { parentId })
};

export default institutionAPI; 