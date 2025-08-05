import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { KnowledgeProgress, IKnowledgeProgress } from '../models/KnowledgeBase';
import { KnowledgePoint } from '../models/KnowledgePoint';
import { Class } from '../models/Class';
import User from '../models/User';
import mongoose from 'mongoose';

// 获取学生进度列表
export const getStudentProgress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { 
      classId, 
      institutionId, 
      knowledgeBaseId,
      status,
      page = 1, 
      pageSize = 20,
      keyword,
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = req.query;

    // 权限检查
    if (!userId || !['teacher', 'admin', 'super_admin'].includes(userRole!)) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    // 构建查询条件
    const query: any = {};
    
    if (knowledgeBaseId) {
      query.knowledgeBase = knowledgeBaseId;
    }

    if (status) {
      query.status = status;
    }

    // 如果是教师，只能查看自己班级的学生
    if (userRole === 'teacher') {
      const teacherClasses = await Class.find({ teacherId: userId }).select('_id').lean();
      const classIds = teacherClasses.map(c => c._id.toString());
      
      if (classId && classIds.includes(classId as string)) {
        // 获取指定班级的学生
        const classInfo = await Class.findById(classId).select('students').lean();
        const studentIds = classInfo?.students.map(s => s.userId) || [];
        query.user = { $in: studentIds };
      } else {
        // 获取所有班级的学生
        const allStudentIds: string[] = [];
        const classDetails = await Class.find({ teacherId: userId }).select('students').lean();
        classDetails.forEach(c => {
          c.students.forEach(s => allStudentIds.push(s.userId));
        });
        query.user = { $in: allStudentIds };
      }
    } else if (classId) {
      // 管理员可以查看任意班级
      const classInfo = await Class.findById(classId).select('students').lean();
      const studentIds = classInfo?.students.map(s => s.userId) || [];
      query.user = { $in: studentIds };
    }

    // 关键词搜索
    let userQuery: any = {};
    if (keyword) {
      userQuery = {
        $or: [
          { username: { $regex: keyword, $options: 'i' } },
          { email: { $regex: keyword, $options: 'i' } }
        ]
      };
      
      const matchingUsers = await User.find(userQuery).select('_id').lean();
      const matchingUserIds = matchingUsers.map(u => u._id.toString());
      
      if (query.user) {
        query.user = { $in: query.user.$in.filter((id: string) => matchingUserIds.includes(id)) };
      } else {
        query.user = { $in: matchingUserIds };
      }
    }

    // 排序选项
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    // 分页
    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);

    // 查询进度数据
    const [progressData, total] = await Promise.all([
      KnowledgeProgress.find(query)
        .populate('user', 'username email avatar')
        .populate('knowledgeBase', 'title description')
        .populate('knowledgePoint', 'title difficulty')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(pageSize as string))
        .lean(),
      KnowledgeProgress.countDocuments(query)
    ]);

    // 计算统计数据
    const stats = await calculateProgressStats(query);

    res.json({
      success: true,
      data: {
        students: progressData,
        pagination: {
          current: parseInt(page as string),
          pageSize: parseInt(pageSize as string),
          total,
          totalPages: Math.ceil(total / parseInt(pageSize as string))
        },
        stats
      }
    });
  } catch (error: any) {
    console.error('获取学生进度失败:', error);
    res.status(500).json({
      success: false,
      message: '获取学生进度失败',
      error: error.message
    });
  }
};

// 获取单个学生详细进度
export const getStudentDetailProgress = async (req: AuthRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { knowledgeBaseId, timeRange = '30d' } = req.query;

    // 权限检查
    if (!userId || !['teacher', 'admin', 'super_admin', 'student'].includes(userRole!)) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    // 如果是学生，只能查看自己的进度
    if (userRole === 'student' && userId !== studentId) {
      return res.status(403).json({
        success: false,
        message: '只能查看自己的学习进度'
      });
    }

    // 构建查询条件
    const query: any = { user: studentId };
    if (knowledgeBaseId) {
      query.knowledgeBase = knowledgeBaseId;
    }

    // 时间范围过滤
    const timeFilter = getTimeFilter(timeRange as string);
    if (timeFilter) {
      query.updatedAt = timeFilter;
    }

    // 获取学生信息
    const student = await User.findById(studentId).select('username email avatar createdAt').lean();
    if (!student) {
      return res.status(404).json({
        success: false,
        message: '学生不存在'
      });
    }

    // 获取进度数据
    const progressData = await KnowledgeProgress.find(query)
      .populate('knowledgeBase', 'title description category')
      .populate('knowledgePoint', 'title difficulty category')
      .sort({ updatedAt: -1 })
      .lean();

    // 计算学习统计
    const learningStats = calculateLearningStats(progressData);

    // 获取学习时间线
    const timeline = generateLearningTimeline(progressData, timeRange as string);

    // 获取强弱项分析
    const strengthWeaknessAnalysis = analyzeStrengthWeakness(progressData);

    // 获取学习建议
    const recommendations = await generateRecommendations(studentId, progressData);

    res.json({
      success: true,
      data: {
        student,
        learningStats,
        progressData,
        timeline,
        strengthWeaknessAnalysis,
        recommendations
      }
    });
  } catch (error: any) {
    console.error('获取学生详细进度失败:', error);
    res.status(500).json({
      success: false,
      message: '获取学生详细进度失败',
      error: error.message
    });
  }
};

// 获取班级整体进度
export const getClassProgress = async (req: AuthRequest, res: Response) => {
  try {
    const { classId } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { knowledgeBaseId, subject, difficulty } = req.query;

    // 权限检查
    if (!userId || !['teacher', 'admin', 'super_admin'].includes(userRole!)) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    // 获取班级信息
    const classInfo = await Class.findById(classId)
      .populate('teacherId', 'username')
      .lean();
    
    if (!classInfo) {
      return res.status(404).json({
        success: false,
        message: '班级不存在'
      });
    }

    // 教师权限检查
    if (userRole === 'teacher' && classInfo.teacherId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: '只能查看自己班级的进度'
      });
    }

    // 获取班级学生列表
    const studentIds = classInfo.students.map(s => s.userId);

    // 构建查询条件
    const query: any = { user: { $in: studentIds } };
    if (knowledgeBaseId) {
      query.knowledgeBase = knowledgeBaseId;
    }

    // 获取进度数据
    const progressData = await KnowledgeProgress.find(query)
      .populate('user', 'username email avatar')
      .populate('knowledgeBase', 'title category')
      .populate('knowledgePoint', 'title difficulty category')
      .lean();

    // 按科目和难度过滤
    let filteredProgress = progressData;
    if (subject || difficulty) {
      filteredProgress = progressData.filter(p => {
        if (subject && (p.knowledgePoint as any)?.category !== subject) return false;
        if (difficulty && (p.knowledgePoint as any)?.difficulty !== difficulty) return false;
        return true;
      });
    }

    // 计算班级统计
    const classStats = calculateClassStats(filteredProgress, studentIds.length);

    // 按学科分组统计
    const subjectStats = calculateSubjectStats(filteredProgress);

    // 按难度分组统计
    const difficultyStats = calculateDifficultyStats(filteredProgress);

    // 学习趋势分析
    const trendAnalysis = calculateTrendAnalysis(filteredProgress);

    // 排名信息
    const rankings = calculateStudentRankings(filteredProgress);

    res.json({
      success: true,
      data: {
        classInfo: {
          ...classInfo,
          totalStudents: studentIds.length,
          activeStudents: classStats.activeStudents
        },
        overall: classStats,
        subjectStats,
        difficultyStats,
        trendAnalysis,
        rankings
      }
    });
  } catch (error: any) {
    console.error('获取班级进度失败:', error);
    res.status(500).json({
      success: false,
      message: '获取班级进度失败',
      error: error.message
    });
  }
};

// 记录学习进度
export const trackLearningProgress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const {
      knowledgeBaseId,
      knowledgePointId,
      progress,
      timeSpent,
      score,
      sessionData
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '用户未认证'
      });
    }

    // 验证必要参数
    if (!knowledgeBaseId || !knowledgePointId || typeof progress !== 'number') {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    // 查找或创建进度记录
    let progressRecord = await KnowledgeProgress.findOne({
      user: userId,
      knowledgeBase: knowledgeBaseId,
      knowledgePoint: knowledgePointId
    });

    if (!progressRecord) {
      // 创建新的进度记录
      progressRecord = new KnowledgeProgress({
        user: userId,
        knowledgeBase: knowledgeBaseId,
        knowledgePoint: knowledgePointId,
        progress: 0,
        status: 'not_started',
        totalTime: 0,
        sessions: [],
        notes: ''
      });
    }

    // 更新进度
    const oldProgress = progressRecord.progress;
    progressRecord.progress = Math.max(progressRecord.progress, progress);
    
    // 更新状态
    if (progressRecord.progress === 0) {
      progressRecord.status = 'not_started';
    } else if (progressRecord.progress >= 100) {
      progressRecord.status = 'completed';
      if (!progressRecord.completedAt) {
        progressRecord.completedAt = new Date();
      }
    } else {
      progressRecord.status = 'in_progress';
      if (!progressRecord.startedAt) {
        progressRecord.startedAt = new Date();
      }
    }

    // 添加学习时间
    if (timeSpent && timeSpent > 0) {
      progressRecord.totalTime += timeSpent;
    }

    // 更新分数
    if (score !== undefined) {
      progressRecord.score = Math.max(progressRecord.score || 0, score);
    }

    // 添加学习会话记录
    if (sessionData) {
      progressRecord.sessions.push({
        startedAt: sessionData.startedAt || new Date(),
        endedAt: sessionData.endedAt || new Date(),
        duration: timeSpent || 0,
        progress: progressRecord.progress
      });
      
      // 限制会话记录数量
      if (progressRecord.sessions.length > 100) {
        progressRecord.sessions = progressRecord.sessions.slice(-100);
      }
    }

    await progressRecord.save();

    // 如果进度有显著提升，检查成就
    if (progressRecord.progress - oldProgress >= 10) {
      // 这里可以触发成就检查
      // await AchievementService.checkUserAchievements(userId, {
      //   type: 'learning_progress',
      //   knowledgePointId,
      //   progress: progressRecord.progress
      // });
    }

    res.json({
      success: true,
      data: {
        progress: progressRecord,
        progressIncrease: progressRecord.progress - oldProgress,
        message: '学习进度已更新'
      }
    });
  } catch (error: any) {
    console.error('记录学习进度失败:', error);
    res.status(500).json({
      success: false,
      message: '记录学习进度失败',
      error: error.message
    });
  }
};

// 获取进度分析报告
export const getProgressAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { 
      type = 'overview', 
      timeRange = '30d',
      classId,
      institutionId,
      knowledgeBaseId
    } = req.query;

    // 权限检查
    if (!userId || !['teacher', 'admin', 'super_admin'].includes(userRole!)) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    // 构建查询条件
    const query: any = {};
    const timeFilter = getTimeFilter(timeRange as string);
    if (timeFilter) {
      query.updatedAt = timeFilter;
    }

    if (knowledgeBaseId) {
      query.knowledgeBase = knowledgeBaseId;
    }

    // 根据角色和参数设置学生范围
    if (userRole === 'teacher') {
      const teacherClasses = await Class.find({ teacherId: userId }).select('students').lean();
      const studentIds: string[] = [];
      teacherClasses.forEach(c => {
        c.students.forEach(s => studentIds.push(s.userId));
      });
      query.user = { $in: studentIds };
    } else if (classId) {
      const classInfo = await Class.findById(classId).select('students').lean();
      query.user = { $in: classInfo?.students.map(s => s.userId) || [] };
    }

    let analyticsData;

    switch (type) {
      case 'overview':
        analyticsData = await generateOverviewAnalytics(query);
        break;
      case 'performance':
        analyticsData = await generatePerformanceAnalytics(query);
        break;
      case 'engagement':
        analyticsData = await generateEngagementAnalytics(query);
        break;
      case 'completion':
        analyticsData = await generateCompletionAnalytics(query);
        break;
      default:
        analyticsData = await generateOverviewAnalytics(query);
    }

    res.json({
      success: true,
      data: analyticsData
    });
  } catch (error: any) {
    console.error('获取进度分析失败:', error);
    res.status(500).json({
      success: false,
      message: '获取进度分析失败',
      error: error.message
    });
  }
};

// 辅助方法
function calculateProgressStats(query: any) {
  // 实现进度统计计算逻辑
  return KnowledgeProgress.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalStudents: { $addToSet: '$user' },
        averageProgress: { $avg: '$progress' },
        completedCount: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        inProgressCount: {
          $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
        },
        totalTime: { $sum: '$totalTime' }
      }
    },
    {
      $project: {
        totalStudents: { $size: '$totalStudents' },
        averageProgress: { $round: ['$averageProgress', 2] },
        completedCount: 1,
        inProgressCount: 1,
        totalTime: 1,
        completionRate: {
          $round: [
            { $multiply: [{ $divide: ['$completedCount', { $size: '$totalStudents' }] }, 100] },
            2
          ]
        }
      }
    }
  ]);
}

function calculateLearningStats(progressData: any[]) {
  const total = progressData.length;
  const completed = progressData.filter(p => p.status === 'completed').length;
  const inProgress = progressData.filter(p => p.status === 'in_progress').length;
  const totalTime = progressData.reduce((sum, p) => sum + (p.totalTime || 0), 0);
  const averageProgress = total > 0 ? progressData.reduce((sum, p) => sum + p.progress, 0) / total : 0;

  return {
    totalTopics: total,
    completedTopics: completed,
    inProgressTopics: inProgress,
    notStartedTopics: total - completed - inProgress,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    averageProgress: Math.round(averageProgress),
    totalStudyTime: totalTime,
    averageScore: calculateAverageScore(progressData)
  };
}

function calculateAverageScore(progressData: any[]) {
  const withScores = progressData.filter(p => p.score !== undefined && p.score !== null);
  return withScores.length > 0 
    ? Math.round(withScores.reduce((sum, p) => sum + p.score, 0) / withScores.length)
    : 0;
}

function generateLearningTimeline(progressData: any[], timeRange: string) {
  // 根据时间范围生成学习时间线数据
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const timeline = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const dayProgress = progressData.filter(p => {
      const updatedDate = new Date(p.updatedAt).toISOString().split('T')[0];
      return updatedDate === dateStr;
    });

    timeline.push({
      date: dateStr,
      progress: dayProgress.length > 0 ? 
        Math.round(dayProgress.reduce((sum, p) => sum + p.progress, 0) / dayProgress.length) : 0,
      studyTime: dayProgress.reduce((sum, p) => sum + (p.totalTime || 0), 0),
      completions: dayProgress.filter(p => p.status === 'completed').length
    });
  }

  return timeline;
}

function analyzeStrengthWeakness(progressData: any[]) {
  // 按类别分组分析强弱项
  const categoryStats = new Map();

  progressData.forEach(p => {
    const category = (p.knowledgePoint as any)?.category || '其他';
    if (!categoryStats.has(category)) {
      categoryStats.set(category, { total: 0, completed: 0, averageProgress: 0, totalProgress: 0 });
    }

    const stats = categoryStats.get(category);
    stats.total += 1;
    stats.totalProgress += p.progress;
    if (p.status === 'completed') {
      stats.completed += 1;
    }
  });

  const analysis = Array.from(categoryStats.entries()).map(([category, stats]: [string, any]) => ({
    category,
    total: stats.total,
    completed: stats.completed,
    completionRate: Math.round((stats.completed / stats.total) * 100),
    averageProgress: Math.round(stats.totalProgress / stats.total)
  }));

  analysis.sort((a, b) => b.averageProgress - a.averageProgress);

  return {
    strengths: analysis.slice(0, 3),
    weaknesses: analysis.slice(-3).reverse()
  };
}

async function generateRecommendations(studentId: string, progressData: any[]) {
  const recommendations = [];

  // 基于进度分析生成建议
  const lowProgressTopics = progressData.filter(p => p.progress < 50 && p.status === 'in_progress');
  if (lowProgressTopics.length > 0) {
    recommendations.push({
      type: 'focus',
      title: '建议重点关注',
      description: `有 ${lowProgressTopics.length} 个知识点进度较慢，建议加强学习`,
      topics: lowProgressTopics.slice(0, 3).map(p => (p.knowledgePoint as any)?.title)
    });
  }

  const completedRecently = progressData.filter(p => 
    p.status === 'completed' && 
    p.completedAt && 
    new Date(p.completedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  
  if (completedRecently.length > 0) {
    recommendations.push({
      type: 'review',
      title: '复习建议',
      description: `最近完成了 ${completedRecently.length} 个知识点，建议适时复习巩固`,
      topics: completedRecently.slice(0, 3).map(p => (p.knowledgePoint as any)?.title)
    });
  }

  return recommendations;
}

function getTimeFilter(timeRange: string) {
  const now = new Date();
  switch (timeRange) {
    case '7d':
      return { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
    case '30d':
      return { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
    case '90d':
      return { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) };
    default:
      return null;
  }
}

function calculateClassStats(progressData: any[], totalStudents: number) {
  const activeStudents = new Set(progressData.map(p => (p.user as any)._id.toString())).size;
  const totalProgress = progressData.reduce((sum, p) => sum + p.progress, 0);
  const averageProgress = progressData.length > 0 ? totalProgress / progressData.length : 0;
  const completedTopics = progressData.filter(p => p.status === 'completed').length;
  const totalTime = progressData.reduce((sum, p) => sum + (p.totalTime || 0), 0);

  return {
    totalStudents,
    activeStudents,
    participationRate: Math.round((activeStudents / totalStudents) * 100),
    averageProgress: Math.round(averageProgress),
    completedTopics,
    totalStudyTime: totalTime,
    averageStudyTime: activeStudents > 0 ? Math.round(totalTime / activeStudents) : 0
  };
}

function calculateSubjectStats(progressData: any[]) {
  const subjectMap = new Map();
  
  progressData.forEach(p => {
    const subject = (p.knowledgePoint as any)?.category || '其他';
    if (!subjectMap.has(subject)) {
      subjectMap.set(subject, { total: 0, completed: 0, totalProgress: 0, students: new Set() });
    }
    
    const stats = subjectMap.get(subject);
    stats.total += 1;
    stats.totalProgress += p.progress;
    stats.students.add((p.user as any)._id.toString());
    if (p.status === 'completed') {
      stats.completed += 1;
    }
  });

  return Array.from(subjectMap.entries()).map(([subject, stats]: [string, any]) => ({
    subject,
    total: stats.total,
    completed: stats.completed,
    students: stats.students.size,
    averageProgress: Math.round(stats.totalProgress / stats.total),
    completionRate: Math.round((stats.completed / stats.total) * 100)
  }));
}

function calculateDifficultyStats(progressData: any[]) {
  const difficultyMap = new Map();
  
  progressData.forEach(p => {
    const difficulty = (p.knowledgePoint as any)?.difficulty || 'medium';
    if (!difficultyMap.has(difficulty)) {
      difficultyMap.set(difficulty, { total: 0, completed: 0, totalProgress: 0 });
    }
    
    const stats = difficultyMap.get(difficulty);
    stats.total += 1;
    stats.totalProgress += p.progress;
    if (p.status === 'completed') {
      stats.completed += 1;
    }
  });

  return Array.from(difficultyMap.entries()).map(([difficulty, stats]: [string, any]) => ({
    difficulty,
    total: stats.total,
    completed: stats.completed,
    averageProgress: Math.round(stats.totalProgress / stats.total),
    completionRate: Math.round((stats.completed / stats.total) * 100)
  }));
}

function calculateTrendAnalysis(progressData: any[]) {
  // 简化的趋势分析
  const last7Days = progressData.filter(p => 
    new Date(p.updatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  
  const last30Days = progressData.filter(p => 
    new Date(p.updatedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );

  return {
    weeklyActivity: last7Days.length,
    monthlyActivity: last30Days.length,
    trend: last7Days.length > (last30Days.length / 4) ? 'increasing' : 'decreasing'
  };
}

function calculateStudentRankings(progressData: any[]) {
  const studentMap = new Map();
  
  progressData.forEach(p => {
    const userId = (p.user as any)._id.toString();
    const username = (p.user as any).username;
    
    if (!studentMap.has(userId)) {
      studentMap.set(userId, { 
        userId, 
        username, 
        totalProgress: 0, 
        completed: 0, 
        total: 0,
        totalTime: 0
      });
    }
    
    const stats = studentMap.get(userId);
    stats.totalProgress += p.progress;
    stats.total += 1;
    stats.totalTime += p.totalTime || 0;
    if (p.status === 'completed') {
      stats.completed += 1;
    }
  });

  const rankings = Array.from(studentMap.values()).map((stats: any) => ({
    ...stats,
    averageProgress: Math.round(stats.totalProgress / stats.total),
    completionRate: Math.round((stats.completed / stats.total) * 100)
  }));

  rankings.sort((a, b) => b.averageProgress - a.averageProgress);

  return rankings.slice(0, 10); // 返回前10名
}

async function generateOverviewAnalytics(query: any) {
  const stats = await KnowledgeProgress.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalRecords: { $sum: 1 },
        averageProgress: { $avg: '$progress' },
        totalTime: { $sum: '$totalTime' },
        completedCount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
      }
    }
  ]);

  return stats[0] || {
    totalRecords: 0,
    averageProgress: 0,
    totalTime: 0,
    completedCount: 0
  };
}

async function generatePerformanceAnalytics(query: any) {
  // 实现性能分析逻辑
  return await generateOverviewAnalytics(query);
}

async function generateEngagementAnalytics(query: any) {
  // 实现参与度分析逻辑  
  return await generateOverviewAnalytics(query);
}

async function generateCompletionAnalytics(query: any) {
  // 实现完成度分析逻辑
  return await generateOverviewAnalytics(query);
} 