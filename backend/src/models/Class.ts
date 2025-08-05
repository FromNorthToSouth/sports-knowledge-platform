import mongoose, { Schema, Document } from 'mongoose';

// 班级接口
export interface IClass extends Document {
  name: string;
  grade: string;
  description?: string;
  institutionId: string;
  teacherId: string;
  teacherName: string;
  capacity: number;
  currentStudentCount: number;
  students: Array<{
    userId: string;
    username: string;
    joinedAt: Date;
    status: 'active' | 'inactive' | 'pending';
    performance?: {
      averageScore: number;
      totalQuestions: number;
      correctAnswers: number;
      lastActiveAt: Date;
    };
  }>;
  settings: {
    allowSelfEnroll: boolean;
    requireApproval: boolean;
    enabledFeatures: string[];
    notificationSettings: {
      assignmentReminders: boolean;
      gradeUpdates: boolean;
      announcements: boolean;
    };
  };
  schedule?: {
    startDate?: Date;
    endDate?: Date;
    classTime?: string;
    location?: string;
    weekdays?: number[]; // 0-6, 0=Sunday
    duration?: number; // 分钟
  };
  curriculum?: {
    subjects: string[];
    objectives: string[];
    requirements: string[];
  };
  status: 'active' | 'inactive' | 'archived' | 'draft';
  statistics: {
    totalStudents: number;
    activeStudents: number;
    averagePerformance: number;
    totalAssignments: number;
    totalExams: number;
    lastActivityDate?: Date;
  };
  metadata: {
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    lastModifiedBy?: string;
    tags?: string[];
    category?: string;
  };
}

// 班级分组接口
export interface IClassGroup extends Document {
  classId: string;
  name: string;
  description?: string;
  students: Array<{
    userId: string;
    username: string;
    role?: 'member' | 'leader';
    joinedAt: Date;
  }>;
  settings: {
    maxMembers?: number;
    allowSelfJoin: boolean;
    isActive: boolean;
  };
  tasks?: Array<{
    taskId: string;
    title: string;
    assignedAt: Date;
    dueDate?: Date;
    status: 'assigned' | 'in_progress' | 'completed' | 'overdue';
  }>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// 班级作业接口
export interface IClassAssignment extends Document {
  classId: string;
  title: string;
  description: string;
  type: 'practice' | 'exam' | 'project' | 'homework';
  requirements: {
    categories?: string[];
    questionCount?: number;
    timeLimit?: number; // 分钟
    passingScore?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    allowRetakes?: boolean;
    maxAttempts?: number;
  };
  schedule: {
    assignedDate: Date;
    dueDate: Date;
    startTime?: Date;
    endTime?: Date;
    allowLateSubmission: boolean;
    latePenalty?: number; // 百分比
  };
  targetStudents: string[]; // 如果为空则面向全班
  resources?: Array<{
    type: 'file' | 'link' | 'text';
    title: string;
    content: string;
    url?: string;
    fileId?: string;
  }>;
  submissions: Array<{
    studentId: string;
    studentName: string;
    submittedAt: Date;
    score?: number;
    status: 'submitted' | 'graded' | 'late' | 'missing';
    attempts: number;
    timeSpent?: number; // 分钟
    answers?: any;
    feedback?: string;
  }>;
  status: 'draft' | 'published' | 'active' | 'completed' | 'archived';
  statistics: {
    totalSubmissions: number;
    averageScore: number;
    completionRate: number;
    onTimeSubmissions: number;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// 班级公告接口
export interface IClassAnnouncement extends Document {
  classId: string;
  title: string;
  content: string;
  type: 'general' | 'assignment' | 'exam' | 'important' | 'reminder';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  publishDate: Date;
  scheduledTime?: Date;
  expiryDate?: Date;
  targetStudents?: string[]; // 如果为空则面向全班
  attachments?: Array<{
    type: 'file' | 'link';
    title: string;
    url: string;
    fileId?: string;
  }>;
  readStatus: Array<{
    studentId: string;
    readAt: Date;
    acknowledged?: boolean;
  }>;
  settings: {
    requireAcknowledgment: boolean;
    allowComments: boolean;
    sendNotification: boolean;
    pinned: boolean;
  };
  comments?: Array<{
    userId: string;
    username: string;
    content: string;
    createdAt: Date;
    replies?: Array<{
      userId: string;
      username: string;
      content: string;
      createdAt: Date;
    }>;
  }>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// 班级数据模型
const ClassSchema = new Schema<IClass>({
  name: { type: String, required: true, trim: true },
  grade: { type: String, required: true },
  description: { type: String, trim: true },
  institutionId: { type: String, required: true },
  teacherId: { type: String, required: true },
  teacherName: { type: String, required: true },
  capacity: { type: Number, default: 50, min: 1, max: 200 },
  currentStudentCount: { type: Number, default: 0 },
  students: [{
    userId: { type: String, required: true },
    username: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now },
    status: { 
      type: String, 
      enum: ['active', 'inactive', 'pending'], 
      default: 'active' 
    },
    performance: {
      averageScore: { type: Number, default: 0 },
      totalQuestions: { type: Number, default: 0 },
      correctAnswers: { type: Number, default: 0 },
      lastActiveAt: { type: Date, default: Date.now }
    }
  }],
  settings: {
    allowSelfEnroll: { type: Boolean, default: false },
    requireApproval: { type: Boolean, default: true },
    enabledFeatures: [{ type: String }],
    notificationSettings: {
      assignmentReminders: { type: Boolean, default: true },
      gradeUpdates: { type: Boolean, default: true },
      announcements: { type: Boolean, default: true }
    }
  },
  schedule: {
    startDate: { type: Date },
    endDate: { type: Date },
    classTime: { type: String },
    location: { type: String },
    weekdays: [{ type: Number, min: 0, max: 6 }],
    duration: { type: Number, min: 30, max: 300 }
  },
  curriculum: {
    subjects: [{ type: String }],
    objectives: [{ type: String }],
    requirements: [{ type: String }]
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'archived', 'draft'], 
    default: 'active' 
  },
  statistics: {
    totalStudents: { type: Number, default: 0 },
    activeStudents: { type: Number, default: 0 },
    averagePerformance: { type: Number, default: 0 },
    totalAssignments: { type: Number, default: 0 },
    totalExams: { type: Number, default: 0 },
    lastActivityDate: { type: Date }
  },
  metadata: {
    createdBy: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    lastModifiedBy: { type: String },
    tags: [{ type: String }],
    category: { type: String }
  }
});

// 班级分组数据模型
const ClassGroupSchema = new Schema<IClassGroup>({
  classId: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  students: [{
    userId: { type: String, required: true },
    username: { type: String, required: true },
    role: { 
      type: String, 
      enum: ['member', 'leader'], 
      default: 'member' 
    },
    joinedAt: { type: Date, default: Date.now }
  }],
  settings: {
    maxMembers: { type: Number, min: 2, max: 20 },
    allowSelfJoin: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
  },
  tasks: [{
    taskId: { type: String, required: true },
    title: { type: String, required: true },
    assignedAt: { type: Date, default: Date.now },
    dueDate: { type: Date },
    status: { 
      type: String, 
      enum: ['assigned', 'in_progress', 'completed', 'overdue'], 
      default: 'assigned' 
    }
  }],
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 班级作业数据模型
const ClassAssignmentSchema = new Schema<IClassAssignment>({
  classId: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['practice', 'exam', 'project', 'homework'], 
    required: true 
  },
  requirements: {
    categories: [{ type: String }],
    questionCount: { type: Number, min: 1 },
    timeLimit: { type: Number, min: 5 },
    passingScore: { type: Number, min: 0, max: 100 },
    difficulty: { 
      type: String, 
      enum: ['easy', 'medium', 'hard'] 
    },
    allowRetakes: { type: Boolean, default: true },
    maxAttempts: { type: Number, min: 1, max: 10, default: 3 }
  },
  schedule: {
    assignedDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    startTime: { type: Date },
    endTime: { type: Date },
    allowLateSubmission: { type: Boolean, default: false },
    latePenalty: { type: Number, min: 0, max: 100, default: 10 }
  },
  targetStudents: [{ type: String }],
  resources: [{
    type: { 
      type: String, 
      enum: ['file', 'link', 'text'], 
      required: true 
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    url: { type: String },
    fileId: { type: String }
  }],
  submissions: [{
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    submittedAt: { type: Date, required: true },
    score: { type: Number, min: 0, max: 100 },
    status: { 
      type: String, 
      enum: ['submitted', 'graded', 'late', 'missing'], 
      default: 'submitted' 
    },
    attempts: { type: Number, default: 1 },
    timeSpent: { type: Number },
    answers: { type: Schema.Types.Mixed },
    feedback: { type: String }
  }],
  status: { 
    type: String, 
    enum: ['draft', 'published', 'active', 'completed', 'archived'], 
    default: 'draft' 
  },
  statistics: {
    totalSubmissions: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    onTimeSubmissions: { type: Number, default: 0 }
  },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 班级公告数据模型
const ClassAnnouncementSchema = new Schema<IClassAnnouncement>({
  classId: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['general', 'assignment', 'exam', 'important', 'reminder'], 
    default: 'general' 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  publishDate: { type: Date, default: Date.now },
  scheduledTime: { type: Date },
  expiryDate: { type: Date },
  targetStudents: [{ type: String }],
  attachments: [{
    type: { 
      type: String, 
      enum: ['file', 'link'], 
      required: true 
    },
    title: { type: String, required: true },
    url: { type: String, required: true },
    fileId: { type: String }
  }],
  readStatus: [{
    studentId: { type: String, required: true },
    readAt: { type: Date, required: true },
    acknowledged: { type: Boolean, default: false }
  }],
  settings: {
    requireAcknowledgment: { type: Boolean, default: false },
    allowComments: { type: Boolean, default: true },
    sendNotification: { type: Boolean, default: true },
    pinned: { type: Boolean, default: false }
  },
  comments: [{
    userId: { type: String, required: true },
    username: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    replies: [{
      userId: { type: String, required: true },
      username: { type: String, required: true },
      content: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }]
  }],
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// 添加索引
ClassSchema.index({ institutionId: 1, status: 1 });
ClassSchema.index({ teacherId: 1, status: 1 });
ClassSchema.index({ 'students.userId': 1 });
ClassSchema.index({ grade: 1, status: 1 });

ClassGroupSchema.index({ classId: 1 });
ClassGroupSchema.index({ 'students.userId': 1 });

ClassAssignmentSchema.index({ classId: 1, status: 1 });
ClassAssignmentSchema.index({ 'schedule.dueDate': 1 });
ClassAssignmentSchema.index({ 'submissions.studentId': 1 });

ClassAnnouncementSchema.index({ classId: 1, publishDate: -1 });
ClassAnnouncementSchema.index({ priority: 1, publishDate: -1 });

// 中间件
ClassSchema.pre('save', function(next) {
  this.metadata.updatedAt = new Date();
  this.statistics.totalStudents = this.students.length;
  this.statistics.activeStudents = this.students.filter(s => s.status === 'active').length;
  this.currentStudentCount = this.statistics.activeStudents;
  next();
});

ClassGroupSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

ClassAssignmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // 更新统计信息
  const submissions = this.submissions;
  this.statistics.totalSubmissions = submissions.length;
  
  if (submissions.length > 0) {
    const gradedSubmissions = submissions.filter(s => s.score !== undefined);
    if (gradedSubmissions.length > 0) {
      const totalScore = gradedSubmissions.reduce((sum, s) => sum + (s.score || 0), 0);
      this.statistics.averageScore = totalScore / gradedSubmissions.length;
    }
    
    const onTimeSubmissions = submissions.filter(s => 
      s.submittedAt <= this.schedule.dueDate
    );
    this.statistics.onTimeSubmissions = onTimeSubmissions.length;
    this.statistics.completionRate = (submissions.length / (this.targetStudents.length || 1)) * 100;
  }
  
  next();
});

ClassAnnouncementSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 导出模型
export const Class = mongoose.model<IClass>('Class', ClassSchema);
export const ClassGroup = mongoose.model<IClassGroup>('ClassGroup', ClassGroupSchema);
export const ClassAssignment = mongoose.model<IClassAssignment>('ClassAssignment', ClassAssignmentSchema);
export const ClassAnnouncement = mongoose.model<IClassAnnouncement>('ClassAnnouncement', ClassAnnouncementSchema);

export default Class; 