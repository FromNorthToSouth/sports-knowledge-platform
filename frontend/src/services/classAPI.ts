import api from './api';

// 班级相关API
export const classAPI = {
  // 获取班级列表
  getClasses: (params?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    grade?: string;
    institutionId?: string;
    teacherId?: string;
    status?: string;
  }) => api.get('/classes', { params }),
  
  // 获取单个班级详情
  getClass: (id: string) => api.get(`/classes/${id}`),
  
  // 创建班级
  createClass: (data: {
    name: string;
    grade: string;
    description?: string;
    institutionId: string;
    teacherId: string;
    teacherName: string; // 添加教师姓名字段
    capacity?: number;
    settings?: {
      allowSelfEnroll?: boolean;
      requireApproval?: boolean;
      enabledFeatures?: string[];
    };
    schedule?: {
      startDate?: string;
      endDate?: string;
      classTime?: string;
      location?: string;
    };
  }) => api.post('/classes', data),
  
  // 更新班级信息
  updateClass: (id: string, data: any) => api.put(`/classes/${id}`, data),
  
  // 删除班级
  deleteClass: (id: string) => api.delete(`/classes/${id}`),
  
  // 获取班级学生列表
  getClassStudents: (id: string, params?: {
    page?: number;
    pageSize?: number;
    keyword?: string;
    status?: string;
  }) => api.get(`/classes/${id}/students`, { params }),
  
  // 添加学生到班级
  addStudentToClass: (id: string, data: {
    studentId?: string;
    email?: string;
    username?: string;
    autoApprove?: boolean;
  }) => api.post(`/classes/${id}/students`, data),
  
  // 从班级移除学生
  removeStudentFromClass: (id: string, studentId: string) =>
    api.delete(`/classes/${id}/students/${studentId}`),

  // 更新班级中的学生信息
  updateStudentInClass: (id: string, studentId: string, data: {
    status?: string;
    performance?: any;
  }) => api.put(`/classes/${id}/students/${studentId}`, data),

  // 批量添加学生
  batchAddStudents: (id: string, data: {
    students: Array<{
      studentId?: string;
      email?: string;
      username?: string;
    }>;
    autoApprove?: boolean;
  }) => api.post(`/classes/${id}/students/batch`, data),

  // 搜索用户（用于添加学生）
  searchUsers: (params: {
    keyword: string;
    role?: string;
    page?: number;
    pageSize?: number;
    excludeClassId?: string;
  }) => api.get('/classes/search/users', { params }),

  // 获取班级统计信息
  getClassStats: (id: string, params?: {
    timeRange?: string;
    includeDetails?: boolean;
  }) => api.get(`/classes/${id}/stats`, { params }),
  
  // 获取班级学习进度
  getClassProgress: (id: string, params?: {
    subject?: string;
    category?: string;
    timeRange?: string;
  }) => api.get(`/classes/${id}/progress`, { params }),
  
  // 获取班级考试记录
  getClassExams: (id: string, params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    dateRange?: string[];
  }) => api.get(`/classes/${id}/exams`, { params }),
  
  // 创建班级考试
  createClassExam: (id: string, data: {
    title: string;
    description?: string;
    config: {
      timeLimit: number;
      questionCount: number;
      passingScore: number;
      categories?: string[];
      difficulty?: string;
    };
    schedule: {
      startTime: string;
      endTime: string;
      allowLateSubmission?: boolean;
    };
  }) => api.post(`/classes/${id}/exams`, data),
  
  // 获取班级作业列表
  getClassAssignments: (id: string, params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    dueDate?: string;
  }) => api.get(`/classes/${id}/assignments`, { params }),
  
  // 创建班级作业
  createClassAssignment: (id: string, data: {
    title: string;
    description: string;
    type: 'practice' | 'exam' | 'project';
    dueDate: string;
    requirements: {
      categories?: string[];
      questionCount?: number;
      timeLimit?: number;
      passingScore?: number;
    };
  }) => api.post(`/classes/${id}/assignments`, data),
  
  // 获取班级公告
  getClassAnnouncements: (id: string, params?: {
    page?: number;
    pageSize?: number;
    type?: string;
  }) => api.get(`/classes/${id}/announcements`, { params }),
  
  // 发布班级公告
  createClassAnnouncement: (id: string, data: {
    title: string;
    content: string;
    type: 'general' | 'assignment' | 'exam' | 'important';
    priority: 'low' | 'medium' | 'high';
    scheduledTime?: string;
    targetStudents?: string[];
  }) => api.post(`/classes/${id}/announcements`, data),
  
  // 班级分组管理
  getClassGroups: (id: string) => api.get(`/classes/${id}/groups`),
  
  createClassGroup: (id: string, data: {
    name: string;
    description?: string;
    studentIds: string[];
    settings?: any;
  }) => api.post(`/classes/${id}/groups`, data),
  
  updateClassGroup: (classId: string, groupId: string, data: any) =>
    api.put(`/classes/${classId}/groups/${groupId}`, data),
  
  deleteClassGroup: (classId: string, groupId: string) =>
    api.delete(`/classes/${classId}/groups/${groupId}`),
  
  // 批量操作
  batchOperations: (data: {
    action: 'archive' | 'activate' | 'delete';
    classIds: string[];
  }) => api.post('/classes/batch', data),
  
  // 导出班级数据
  exportClassData: (id: string, type: 'students' | 'progress' | 'stats') =>
    api.get(`/classes/${id}/export/${type}`, { responseType: 'blob' }),
  
  // 复制班级
  duplicateClass: (id: string, data: {
    name: string;
    includeStudents?: boolean;
    includeSettings?: boolean;
  }) => api.post(`/classes/${id}/duplicate`, data)
};

export default classAPI; 