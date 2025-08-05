import api from './api';

// 操作日志相关API
export const operationLogAPI = {
  // 获取操作日志列表
  getOperationLogs: (params?: {
    page?: number;
    pageSize?: number;
    userId?: string;
    action?: string;
    module?: string;
    resource?: string;
    level?: string;
    startDate?: string;
    endDate?: string;
    ipAddress?: string;
    status?: string;
    keyword?: string;
  }) => api.get('/operation-logs', { params }),
  
  // 获取单个操作日志详情
  getOperationLog: (id: string) => api.get(`/operation-logs/${id}`),
  
  // 记录操作日志（通常由后端自动调用）
  createOperationLog: (data: {
    userId?: string;
    action: string;
    module: string;
    resource?: string;
    resourceId?: string;
    description: string;
    details?: any;
    level: 'info' | 'warn' | 'error' | 'debug';
    ipAddress?: string;
    userAgent?: string;
    method?: string;
    path?: string;
    statusCode?: number;
    responseTime?: number;
  }) => api.post('/operation-logs', data),
  
  // 批量记录操作日志
  createBatchOperationLogs: (logs: Array<{
    userId?: string;
    action: string;
    module: string;
    resource?: string;
    resourceId?: string;
    description: string;
    details?: any;
    level: 'info' | 'warn' | 'error' | 'debug';
    timestamp?: string;
  }>) => api.post('/operation-logs/batch', { logs }),
  
  // 获取操作统计
  getOperationStats: (params?: {
    timeRange?: string;
    groupBy?: 'day' | 'week' | 'month' | 'hour';
    userId?: string;
    module?: string;
    action?: string;
  }) => api.get('/operation-logs/stats', { params }),
  
  // 获取用户操作统计
  getUserOperationStats: (userId: string, params?: {
    timeRange?: string;
    includeDetails?: boolean;
  }) => api.get(`/operation-logs/users/${userId}/stats`, { params }),
  
  // 获取热门操作
  getPopularOperations: (params?: {
    timeRange?: string;
    limit?: number;
    module?: string;
  }) => api.get('/operation-logs/popular', { params }),
  
  // 获取异常操作
  getAnomalousOperations: (params?: {
    timeRange?: string;
    limit?: number;
    threshold?: number;
    userId?: string;
  }) => api.get('/operation-logs/anomalous', { params }),
  
  // 获取最近操作
  getRecentOperations: (params?: {
    limit?: number;
    userId?: string;
    module?: string;
    level?: string;
  }) => api.get('/operation-logs/recent', { params }),
  
  // 搜索操作日志
  searchOperationLogs: (params: {
    query: string;
    filters?: {
      userId?: string[];
      action?: string[];
      module?: string[];
      level?: string[];
      dateRange?: string[];
    };
    sort?: string;
    page?: number;
    pageSize?: number;
  }) => api.post('/operation-logs/search', params),
  
  // 导出操作日志
  exportOperationLogs: (params?: {
    startDate?: string;
    endDate?: string;
    userId?: string;
    module?: string;
    action?: string;
    format?: 'csv' | 'excel' | 'json';
    includeDetails?: boolean;
  }) => api.get('/operation-logs/export', { 
    params, 
    responseType: 'blob' 
  }),
  
  // 安全审计相关
  getSecurityEvents: (params?: {
    page?: number;
    pageSize?: number;
    eventType?: string;
    severity?: string;
    startDate?: string;
    endDate?: string;
    userId?: string;
    ipAddress?: string;
  }) => api.get('/operation-logs/security-events', { params }),
  
  // 获取登录日志
  getLoginLogs: (params?: {
    page?: number;
    pageSize?: number;
    userId?: string;
    success?: boolean;
    startDate?: string;
    endDate?: string;
    ipAddress?: string;
    location?: string;
  }) => api.get('/operation-logs/login', { params }),
  
  // 获取失败操作日志
  getFailedOperations: (params?: {
    page?: number;
    pageSize?: number;
    timeRange?: string;
    module?: string;
    userId?: string;
    errorCode?: string;
  }) => api.get('/operation-logs/failed', { params }),
  
  // 获取慢操作日志
  getSlowOperations: (params?: {
    page?: number;
    pageSize?: number;
    threshold?: number;
    timeRange?: string;
    module?: string;
  }) => api.get('/operation-logs/slow', { params }),
  
  // 操作日志分析
  getOperationTrends: (params?: {
    timeRange?: string;
    granularity?: 'hour' | 'day' | 'week' | 'month';
    metrics?: string[];
    groupBy?: string[];
  }) => api.get('/operation-logs/trends', { params }),
  
  getTopUsers: (params?: {
    timeRange?: string;
    metric?: 'operations' | 'time' | 'errors';
    limit?: number;
    module?: string;
  }) => api.get('/operation-logs/top-users', { params }),
  
  getTopResources: (params?: {
    timeRange?: string;
    resourceType?: string;
    limit?: number;
    orderBy?: 'access_count' | 'unique_users' | 'error_rate';
  }) => api.get('/operation-logs/top-resources', { params }),
  
  // 实时监控
  getRealtimeMetrics: () => api.get('/operation-logs/realtime'),
  
  // 获取在线用户
  getActiveUsers: (params?: {
    timeWindow?: number;
    includeDetails?: boolean;
  }) => api.get('/operation-logs/active-users', { params }),
  
  // 系统性能日志
  getPerformanceLogs: (params?: {
    page?: number;
    pageSize?: number;
    metric?: string;
    threshold?: number;
    startDate?: string;
    endDate?: string;
  }) => api.get('/operation-logs/performance', { params }),
  
  // 错误日志
  getErrorLogs: (params?: {
    page?: number;
    pageSize?: number;
    level?: 'error' | 'warn';
    module?: string;
    startDate?: string;
    endDate?: string;
    resolved?: boolean;
  }) => api.get('/operation-logs/errors', { params }),
  
  // 标记错误已解决
  markErrorResolved: (logId: string, data?: {
    resolution?: string;
    resolvedBy?: string;
  }) => api.put(`/operation-logs/${logId}/resolve`, data),
  
  // 日志清理
  cleanupLogs: (data: {
    olderThan: string;
    level?: string[];
    module?: string[];
    dryRun?: boolean;
  }) => api.post('/operation-logs/cleanup', data),
  
  // 获取日志存储统计
  getStorageStats: () => api.get('/operation-logs/storage-stats'),
  
  // 配置日志记录规则
  getLogRules: () => api.get('/operation-logs/rules'),
  
  updateLogRules: (data: {
    rules: Array<{
      module: string;
      actions: string[];
      level: string;
      enabled: boolean;
      retention: number;
      includeDetails?: boolean;
    }>;
  }) => api.put('/operation-logs/rules', data),
  
  // 日志归档
  archiveLogs: (data: {
    startDate: string;
    endDate: string;
    compression?: boolean;
    format?: 'json' | 'csv';
  }) => api.post('/operation-logs/archive', data, { responseType: 'blob' }),
  
  // 恢复归档日志
  restoreArchive: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/operation-logs/restore', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  
  // 日志警报
  getAlerts: (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    severity?: string;
    type?: string;
  }) => api.get('/operation-logs/alerts', { params }),
  
  createAlert: (data: {
    name: string;
    description: string;
    conditions: Array<{
      field: string;
      operator: string;
      value: any;
      timeWindow?: number;
    }>;
    actions: Array<{
      type: 'email' | 'webhook' | 'sms';
      config: any;
    }>;
    severity: 'low' | 'medium' | 'high' | 'critical';
    enabled?: boolean;
  }) => api.post('/operation-logs/alerts', data),
  
  updateAlert: (alertId: string, data: any) => 
    api.put(`/operation-logs/alerts/${alertId}`, data),
  
  deleteAlert: (alertId: string) => 
    api.delete(`/operation-logs/alerts/${alertId}`),
  
  // 批量操作
  batchOperations: (data: {
    action: 'delete' | 'archive' | 'mark-resolved';
    logIds: string[];
    parameters?: any;
  }) => api.post('/operation-logs/batch', data)
};

export default operationLogAPI; 