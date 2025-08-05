// 用户相关类型
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'student' | 'teacher' | 'admin' | 'super_admin' | 'content_manager' | 'institution_admin';
  institution?: Institution;
  grade?: string;
  classInfo?: string;
  avatar?: string;
  phone?: string;
  
  learningStats: {
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
    totalTime: number;
    continuousLoginDays: number;
    lastLoginDate: string;
  };
  
  settings: {
    notifications: boolean;
    difficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
    preferredSports: string[];
  };
  
  abilityProfile: {
    sportsKnowledge: number;
    rulesUnderstanding: number;
    technicalSkills: number;
    historyKnowledge: number;
    judgeAbility: number;
    safetyAwareness: number;
  };
  
  points: number;
  achievements: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 用户资料更新类型 (只包含可更新的字段)
export type UserProfile = Partial<Pick<User, 
  'username' | 'email' | 'phone' | 'avatar' | 
  'grade' | 'classInfo' | 'settings'
>>;

// 机构类型
export interface Institution {
  id: string;
  name: string;
  type: 'school' | 'training_center' | 'sports_club' | 'other';
  code: string;
  contact: {
    address: string;
    phone: string;
    email: string;
    principal?: string;
  };
  level: 'primary' | 'middle' | 'high' | 'university' | 'mixed';
  isActive: boolean;
}

// 题目选项类型
export interface QuestionOption {
  text: string;
  isCorrect: boolean;
  explanation?: string;
}

// 题目类型
export interface Question {
  id: string;
  title: string;
  content: string;
  type: 'single_choice' | 'multiple_choice' | 'true_false' | 'case_analysis' | 'fill_blank';
  options: QuestionOption[];
  correctAnswer: string | string[];
  explanation: string;
  
  category: {
    sport: string;
    knowledgeType: string;
    subCategory?: string;
  };
  
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  
  media: {
    images?: string[];
    videos?: string[];
    audio?: string[];
  };
  
  stats: {
    totalAttempts: number;
    correctAttempts: number;
    accuracy: number;
    averageTime: number;
  };
  
  status: 'draft' | 'published' | 'archived';
  creator: string;
  reviewedBy?: string;
  reviewedAt?: string;
  isAIGenerated: boolean;
  aiPrompt?: string;
  version: number;
  parentQuestion?: string;
  createdAt: string;
  updatedAt: string;
}

// 考试答案类型
export interface ExamAnswer {
  questionId: string;
  userAnswer: string | string[];
  isCorrect: boolean;
  timeSpent: number;
  submittedAt: string;
}

// 考试类型
export interface Exam {
  id: string;
  title: string;
  description?: string;
  
  config: {
    timeLimit: number;
    questionCount: number;
    passingScore: number;
    allowReview: boolean;
    randomOrder: boolean;
  };
  
  questionFilter: {
    sports?: string[];
    knowledgeTypes?: string[];
    difficulty?: string[];
    tags?: string[];
  };
  
  user: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  startedAt?: string;
  completedAt?: string;
  answers: ExamAnswer[];
  
  result: {
    score: number;
    accuracy: number;
    totalTime: number;
    passed: boolean;
    rank?: number;
  };
  
  abilityAnalysis: {
    sportsKnowledge: number;
    rulesUnderstanding: number;
    technicalSkills: number;
    historyKnowledge: number;
    judgeAbility: number;
    safetyAwareness: number;
  };
  
  weaknessAnalysis: {
    categories: string[];
    tags: string[];
    difficulties: string[];
  };
  
  examType: 'practice' | 'mock_exam' | 'competition' | 'assessment';
  createdAt: string;
  updatedAt: string;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

// 分页数据类型
export interface PaginationData<T> {
  items: T[];
  pagination: {
    current: number;
    total: number;
    pageSize: number;
    totalCount: number;
  };
}

// 登录表单类型
export interface LoginForm {
  username?: string;
  email?: string;
  password: string;
  role?: string;
  institution?: string;
}

// 注册表单类型
export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirm?: string; // 确认密码字段名
  phone?: string;
  role?: string;
  institution?: string; // 机构ID，不是代码
  grade?: string;
  classInfo?: string;
}

// Redux状态类型
export interface RootState {
  auth: AuthState;
  question: QuestionState;
  exam: ExamState;
  ui: UIState;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface QuestionState {
  questions: Question[];
  currentQuestion: Question | null;
  loading: boolean;
  error: string | null;
  pagination: {
    current: number;
    total: number;
    pageSize: number;
    totalCount: number;
  };
  filters: {
    sport?: string;
    knowledgeType?: string;
    difficulty?: string;
    tags?: string[];
    search?: string;
  };
}

export interface ExamState {
  currentExam: Exam | null;
  exams: Exam[];
  loading: boolean;
  error: string | null;
}

export interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  language: 'zh' | 'en';
  primaryColor: string;
  animationsEnabled: boolean;
  compactMode: boolean;
}

// 成就相关类型
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'learning' | 'streak' | 'accuracy' | 'time' | 'quiz' | 'exam' | 'social' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  progress?: number;
  maxProgress?: number;
  isCompleted?: boolean;
  completedAt?: string;
  earnedAt?: string; // 兼容字段
  
  // 新增属性修复TypeScript错误
  status?: 'completed' | 'in_progress' | 'not_started';
  progressPercentage?: number;
  targetValue?: number; // 目标值，通常等于maxProgress
  
  // 成就条件信息
  conditions?: {
    type: 'count' | 'streak' | 'percentage' | 'time' | 'custom';
    target: number;
    metric: string;
    timeframe?: string;
  };
}

export interface AchievementStats {
  total: number;
  completed: number;
  byRarity: {
    common: number;
    rare: number;
    epic: number;
    legendary: number;
  };
  totalPoints: number;
  completionRate: string;
} 