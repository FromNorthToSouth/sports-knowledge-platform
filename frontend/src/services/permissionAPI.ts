import api from './api';

// 权限管理相关API
export const permissionAPI = {
  // 权限管理
  getPermissions: (params?: {
    page?: number;
    pageSize?: number;
    module?: string;
    keyword?: string;
    isActive?: boolean;
  }) => api.get('/permissions', { params }),
  
  getPermission: (id: string) => api.get(`/permissions/${id}`),
  
  createPermission: (data: {
    name: string;
    code: string;
    module: string;
    description: string;
    isActive?: boolean;
    dependencies?: string[];
  }) => api.post('/permissions', data),
  
  updatePermission: (id: string, data: any) => api.put(`/permissions/${id}`, data),
  
  deletePermission: (id: string) => api.delete(`/permissions/${id}`),
  
  // 角色管理
  getRoles: (params?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    institutionId?: string;
    isSystem?: boolean;
  }) => api.get('/roles', { params }),
  
  getRole: (id: string) => api.get(`/roles/${id}`),
  
  createRole: (data: {
    name: string;
    code: string;
    description: string;
    permissions: string[];
    isSystem?: boolean;
    institutionId?: string;
    restrictions?: {
      maxUsers?: number;
      questionDifficultyLimit?: string[];
      moduleAccess?: string[];
      dataAccessLevel?: string;
    };
    parentRoleId?: string;
  }) => api.post('/roles', data),
  
  updateRole: (id: string, data: any) => api.put(`/roles/${id}`, data),
  
  deleteRole: (id: string) => api.delete(`/roles/${id}`),
  
  // 角色权限管理
  getRolePermissions: (roleId: string) => api.get(`/roles/${roleId}/permissions`),
  
  updateRolePermissions: (roleId: string, data: {
    permissionIds: string[];
    action: 'add' | 'remove' | 'replace';
  }) => api.put(`/roles/${roleId}/permissions`, data),
  
  // 用户角色管理
  getUserRoles: (params?: {
    page?: number;
    pageSize?: number;
    userId?: string;
    roleId?: string;
    institutionId?: string;
    isActive?: boolean;
  }) => api.get('/user-roles', { params }),
  
  assignUserRole: (data: {
    userId: string;
    roleId: string;
    assignedBy?: string;
    expiresAt?: string;
    institutionId?: string;
    restrictions?: any;
  }) => api.post('/user-roles', data),
  
  updateUserRole: (id: string, data: {
    roleId?: string;
    expiresAt?: string;
    isActive?: boolean;
    restrictions?: any;
  }) => api.put(`/user-roles/${id}`, data),
  
  removeUserRole: (id: string) => api.delete(`/user-roles/${id}`),
  
  // 批量用户角色操作
  batchAssignRoles: (data: {
    userIds: string[];
    roleId: string;
    expiresAt?: string;
    institutionId?: string;
  }) => api.post('/user-roles/batch-assign', data),
  
  batchRemoveRoles: (data: {
    userRoleIds: string[];
    reason?: string;
  }) => api.post('/user-roles/batch-remove', data),
  
  // 权限检查
  checkPermission: (data: {
    userId?: string;
    permission: string;
    resource?: string;
    resourceId?: string;
  }) => api.post('/permissions/check', data),
  
  checkMultiplePermissions: (data: {
    userId?: string;
    permissions: Array<{
      permission: string;
      resource?: string;
      resourceId?: string;
    }>;
  }) => api.post('/permissions/check-multiple', data),
  
  // 获取用户权限
  getUserPermissions: (userId?: string) => api.get('/permissions/user', {
    params: { userId }
  }),
  
  // 获取当前用户权限
  getCurrentUserPermissions: () => api.get('/permissions/current'),
  
  // 权限继承
  getRoleHierarchy: (institutionId?: string) => api.get('/roles/hierarchy', {
    params: { institutionId }
  }),
  
  setRoleParent: (roleId: string, parentRoleId: string) =>
    api.put(`/roles/${roleId}/parent`, { parentRoleId }),
  
  removeRoleParent: (roleId: string) => api.delete(`/roles/${roleId}/parent`),
  
  // 权限模板
  getPermissionTemplates: (params?: {
    category?: string;
    targetRole?: string;
  }) => api.get('/permissions/templates', { params }),
  
  createPermissionTemplate: (data: {
    name: string;
    description: string;
    category: string;
    permissions: string[];
    targetRoles?: string[];
  }) => api.post('/permissions/templates', data),
  
  applyPermissionTemplate: (templateId: string, data: {
    roleIds: string[];
    mode: 'add' | 'replace';
  }) => api.post(`/permissions/templates/${templateId}/apply`, data),
  
  // 权限审批
  getPermissionRequests: (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    requesterId?: string;
    approverId?: string;
  }) => api.get('/permission-requests', { params }),
  
  createPermissionRequest: (data: {
    targetUserId: string;
    requestedPermissions: string[];
    reason: string;
    urgency: 'low' | 'medium' | 'high';
    temporaryAccess?: {
      expiresAt: string;
      reason: string;
    };
  }) => api.post('/permission-requests', data),
  
  approvePermissionRequest: (requestId: string, data: {
    approved: boolean;
    reason?: string;
    modifiedPermissions?: string[];
    expiresAt?: string;
  }) => api.put(`/permission-requests/${requestId}/approve`, data),
  
  // 权限审计
  getPermissionAuditLog: (params?: {
    page?: number;
    pageSize?: number;
    userId?: string;
    action?: string;
    resource?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get('/permissions/audit', { params }),
  
  exportPermissionAudit: (params?: any) =>
    api.get('/permissions/audit/export', { params, responseType: 'blob' }),
  
  // 权限分析
  getPermissionUsageStats: (params?: {
    timeRange?: string;
    groupBy?: string;
    permissions?: string[];
  }) => api.get('/permissions/usage-stats', { params }),
  
  getUnusedPermissions: (params?: {
    institutionId?: string;
    daysSinceLastUse?: number;
  }) => api.get('/permissions/unused', { params }),
  
  getOverPermissionedUsers: (params?: {
    institutionId?: string;
    riskLevel?: string;
  }) => api.get('/permissions/over-permissioned', { params }),
  
  // 权限同步
  syncPermissionsFromSource: (data: {
    source: 'ldap' | 'ad' | 'external';
    config: any;
    dryRun?: boolean;
  }) => api.post('/permissions/sync', data),
  
  // 权限备份和恢复
  backupPermissions: (data?: {
    includeUsers?: boolean;
    includeRoles?: boolean;
    includePermissions?: boolean;
  }) => api.post('/permissions/backup', data, { responseType: 'blob' }),
  
  restorePermissions: (file: File, options?: {
    mode: 'merge' | 'replace';
    validateOnly?: boolean;
  }) => {
    const formData = new FormData();
    formData.append('file', file);
    if (options) {
      formData.append('options', JSON.stringify(options));
    }
    return api.post('/permissions/restore', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // 权限策略
  getPermissionPolicies: () => api.get('/permissions/policies'),
  
  updatePermissionPolicy: (policyId: string, data: {
    rules: any[];
    conditions?: any[];
    effect: 'allow' | 'deny';
    priority?: number;
  }) => api.put(`/permissions/policies/${policyId}`, data),
  
  // 资源权限
  getResourcePermissions: (resourceType: string, resourceId: string) =>
    api.get(`/permissions/resource/${resourceType}/${resourceId}`),
  
  setResourcePermissions: (resourceType: string, resourceId: string, data: {
    permissions: Array<{
      userId?: string;
      roleId?: string;
      permission: string;
      granted: boolean;
    }>;
  }) => api.put(`/permissions/resource/${resourceType}/${resourceId}`, data),
  
  // 批量操作
  batchOperations: (data: {
    action: 'enable' | 'disable' | 'delete';
    type: 'permission' | 'role' | 'user-role';
    ids: string[];
    reason?: string;
  }) => api.post('/permissions/batch', data)
};

export default permissionAPI; 