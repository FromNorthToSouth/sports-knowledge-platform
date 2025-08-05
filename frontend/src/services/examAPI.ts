import api from './api';

// 考试相关API
export const examAPI = {
  // 学生端考试接口
  getExams: (params?: any) => 
    api.get('/exams', { params }),

  createExam: (examData: any) =>
    api.post('/exams', examData),

  getExam: (examId: string) =>
    api.get(`/exams/${examId}`),

  startExam: (examId: string) =>
    api.post(`/exams/${examId}/start`),

  submitAnswer: (examId: string, answerData: any) =>
    api.post(`/exams/${examId}/answer`, answerData),

  submitExam: (examId: string) =>
    api.post(`/exams/${examId}/submit`),

  finishExam: (examId: string) =>
    api.post(`/exams/${examId}/submit`),

  getExamStats: () =>
    api.get('/exams/stats'),

  // 教师端考试发布接口
  publishExam: (examData: {
    title: string;
    description?: string;
    examConfig: {
      timeLimit: number;
      allowReview: boolean;
      randomOrder: boolean;
      allowRetake: boolean;
      maxAttempts: number;
    };
    autoGeneration: {
      enabled: boolean;
      criteria: {
        questionCount: number;
        difficulty: string[];
        categories: string[];
        knowledgeTypes: string[];
        questionTypes: string[];
        balanceStrategy: string;
        useAI: boolean;
      };
      questionIds?: string[];
    };
    targetAudience: {
      type: string;
      classIds?: string[];
      gradeIds?: string[];
      studentIds?: string[];
      specificUsers?: string[];
    };
    schedule: {
      startTime: string;
      endTime: string;
      timezone: string;
    };
    grading: {
      passingScore: number;
      showScore: boolean;
      showAnswers: boolean;
      showAnalysis: boolean;
    };
  }) => api.post('/exams/publish', examData),

  // 获取教师发布的考试列表
  getPublishedExams: (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    type?: string;
    teacherId?: string;
    includeStats?: boolean;
  }) => 
    api.get('/exams/published/list', { params }),

  // 获取考试参与统计
  getExamParticipationStats: (examId: string) =>
    api.get(`/exams/published/${examId}/stats`),

  // 自动组卷接口
  generateQuestions: (criteria: {
    questionCount: number;
    difficulty: string[];
    categories: string[];
    knowledgeTypes: string[];
    questionTypes: string[];
    balanceStrategy: string;
    useAI: boolean;
    targetUserId?: string;
  }) => api.post('/exams/auto-generate', criteria),

  // 获取可用的题目分类
  getQuestionCategories: () =>
    api.get('/questions/categories'),

  // 预览题目内容
  previewQuestions: (questionIds: string[]) =>
    api.post('/questions/preview', { questionIds }),

  // 考试管理接口
  updateExamStatus: (examId: string, status: string) =>
    api.put(`/exams/published/${examId}/status`, { status }),

  cancelExam: (examId: string, reason?: string) =>
    api.post(`/exams/published/${examId}/cancel`, { reason }),

  extendExamTime: (examId: string, additionalTime: number) =>
    api.post(`/exams/published/${examId}/extend`, { additionalTime }),

  // 批量操作接口
  batchPublishExam: (examData: any, targetGroups: string[]) =>
    api.post('/exams/batch-publish', { examData, targetGroups }),

  bulkNotifyStudents: (examId: string, message: string) =>
    api.post(`/exams/published/${examId}/notify`, { message }),

  // 考试模板接口
  saveAsTemplate: (examId: string, templateName: string) =>
    api.post(`/exams/published/${examId}/template`, { templateName }),

  getExamTemplates: () =>
    api.get('/exams/templates'),

  useTemplate: (templateId: string, modifications?: any) =>
    api.post(`/exams/templates/${templateId}/use`, modifications),

  // 考试分析接口
  getExamAnalysis: (examId: string) =>
    api.get(`/exams/published/${examId}/analysis`),

  getQuestionAnalysis: (examId: string, questionId: string) =>
    api.get(`/exams/published/${examId}/questions/${questionId}/analysis`),

  exportExamResults: (examId: string, format: 'excel' | 'pdf' | 'csv') =>
    api.get(`/exams/published/${examId}/export`, { 
      params: { format },
      responseType: 'blob'
    }),

  // 实时监控接口
  getExamRealTimeStats: (examId: string) =>
    api.get(`/exams/published/${examId}/realtime`),

  getOnlineParticipants: (examId: string) =>
    api.get(`/exams/published/${examId}/online`),

  // 防作弊接口
  reportSuspiciousActivity: (examId: string, userId: string, activity: any) =>
    api.post(`/exams/published/${examId}/suspicious`, { userId, activity }),

  getExamLogs: (examId: string, userId?: string) =>
    api.get(`/exams/published/${examId}/logs`, { params: { userId } }),

  // 题目推荐接口（基于AI）
  getRecommendedQuestions: (criteria: {
    targetStudents?: string[];
    weaknessAnalysis?: boolean;
    difficultyAdjustment?: boolean;
    count?: number;
  }) => api.post('/exams/ai-recommend', criteria),

  // 智能评分接口
  enableAutoGrading: (examId: string, settings: {
    essayGrading: boolean;
    rubricId?: string;
    aiAssistance: boolean;
  }) => api.post(`/exams/published/${examId}/auto-grade`, settings),

  // 学习路径集成
  linkToLearningPath: (examId: string, learningPathId: string) =>
    api.post(`/exams/published/${examId}/learning-path`, { learningPathId }),

  // 协作功能
  shareExamWithTeachers: (examId: string, teacherIds: string[], permissions: string[]) =>
    api.post(`/exams/published/${examId}/share`, { teacherIds, permissions }),

  // 多语言支持
  translateExam: (examId: string, targetLanguage: string) =>
    api.post(`/exams/published/${examId}/translate`, { targetLanguage }),

  // 移动端优化
  getMobileOptimizedExam: (examId: string) =>
    api.get(`/exams/published/${examId}/mobile`),

  // 离线考试支持
  generateOfflinePackage: (examId: string) =>
    api.get(`/exams/published/${examId}/offline`, { responseType: 'blob' }),

  syncOfflineResults: (examId: string, results: any[]) =>
    api.post(`/exams/published/${examId}/sync`, { results })
};

export default examAPI; 