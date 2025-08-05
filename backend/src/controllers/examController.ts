import { Request, Response } from 'express';
import Exam from '../models/Exam';
import Question from '../models/Question';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { updateLearningStats } from './userController';
import ExamPublication from '../models/ExamPublication'; // 新增导入

// 获取考试列表
export const getExams = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10, status, type } = req.query;

    const query: any = { user: userId };
    if (status) query.status = status;
    if (type) query.examType = type;

    const exams = await Exam.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .populate('user', 'username')
      .select('title description config status examType startedAt completedAt result');

    const total = await Exam.countDocuments(query);

    res.json({
      success: true,
      data: {
        exams,
        pagination: {
          current: Number(page),
          pageSize: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取考试列表失败',
      error: error.message
    });
  }
};

// 获取单个考试详情
export const getExam = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const exam = await Exam.findOne({ _id: id, user: userId })
      .populate('user', 'username email')
      .populate('answers.questionId');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: '考试不存在'
      });
    }

    res.json({
      success: true,
      data: exam
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取考试详情失败',
      error: error.message
    });
  }
};

// 创建考试
export const createExam = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    let {
      title,
      description,
      timeLimit,
      questionCount,
      passingScore,
      sports,
      knowledgeTypes,
      difficulty,
      examType = 'practice',
      usePersonalized = false  // 新增：是否使用个性化组卷
    } = req.body;

    let questions: any[] = [];
    let finalDescription = description;
    let finalUsePersonalized = usePersonalized;

    if (finalUsePersonalized && userId) {
      // 使用个性化智能组卷
      try {
        const recommendationService = await import('../services/recommendationService');
        const personalizedData = await recommendationService.default.getPersonalizedExamQuestions(userId, {
          questionCount: Number(questionCount) || 20,
          difficulty: difficulty ? (Array.isArray(difficulty) ? difficulty : [difficulty]) : undefined,
          categories: sports ? (Array.isArray(sports) ? sports : [sports]) : undefined,
          timeLimit: Number(timeLimit) || 60,
          focusWeakness: true
        });
        
        questions = personalizedData.questions;
        
        // 添加个性化描述
        if (!finalDescription && personalizedData.reasoning) {
          finalDescription = personalizedData.reasoning;
        }
        
      } catch (personalizedError) {
        console.warn('个性化组卷失败，降级到普通组卷:', personalizedError);
        // 降级到普通组卷
        finalUsePersonalized = false;
      }
    }

    // 如果不使用个性化或个性化失败，使用原有的随机组卷
    if (!finalUsePersonalized || questions.length === 0) {
      // 构建题目查询条件
      const questionQuery: any = { status: 'published' };
      if (sports) questionQuery.category = { $in: sports };
      if (difficulty) questionQuery.difficulty = { $in: difficulty };

      // 随机获取指定数量的题目
      questions = await Question.aggregate([
        { $match: questionQuery },
        { $sample: { size: Number(questionCount) || 10 } }
      ]);
    }

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有找到符合条件的题目'
      });
    }

    // 创建考试
    const exam = new Exam({
      user: userId,
      title: title || `${examType === 'mock_exam' ? '模拟考试' : '练习'} - ${new Date().toLocaleDateString()}`,
      description: finalDescription,
      config: {
        timeLimit: Number(timeLimit) || 60,
        questionCount: questions.length,
        passingScore: Number(passingScore) || 60,
        allowReview: true,
        randomOrder: !finalUsePersonalized  // 个性化组卷已经优化了顺序，不需要随机
      },
      questionFilter: {
        sports: sports || [],
        knowledgeTypes: knowledgeTypes || [],
        difficulty: difficulty || []
      },
      examType,
      status: 'not_started',
      answers: questions.map((q, index) => ({
        questionId: q._id,
        userAnswer: null,
        isCorrect: false,
        timeSpent: 0,
        submittedAt: new Date()
      }))
    });

    await exam.save();

    // 返回考试信息，包含题目
    const examWithQuestions = await Exam.findById(exam._id)
      .populate('answers.questionId', 'title content type options category difficulty');

    res.status(201).json({
      success: true,
      message: finalUsePersonalized ? '个性化考试创建成功' : '考试创建成功',
      data: {
        ...examWithQuestions?.toObject(),
        isPersonalized: finalUsePersonalized,
        generationMethod: finalUsePersonalized ? 'AI个性化推荐' : '随机组卷'
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '创建考试失败',
      error: error.message
    });
  }
};

// 开始考试
export const startExam = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const exam = await Exam.findOne({ _id: id, user: userId });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: '考试不存在'
      });
    }

    if (exam.status !== 'not_started') {
      return res.status(400).json({
        success: false,
        message: '考试状态不正确，无法开始'
      });
    }

    exam.status = 'in_progress';
    exam.startedAt = new Date();
    await exam.save();

    // 返回考试信息，但不包含正确答案
    const examData = await Exam.findById(id)
      .populate('answers.questionId', 'title content type options explanation category difficulty -correctAnswer');

    res.json({
      success: true,
      message: '考试已开始',
      data: examData
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '开始考试失败',
      error: error.message
    });
  }
};

// 提交答案
export const submitAnswer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { questionId, answer, timeSpent } = req.body;
    const userId = req.user?.id;

    const exam = await Exam.findOne({ _id: id, user: userId });

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: '考试不存在'
      });
    }

    if (exam.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: '考试未在进行中'
      });
    }

    // 检查考试是否超时
    const now = new Date();
    const timeElapsed = (now.getTime() - exam.startedAt!.getTime()) / (1000 * 60); // 分钟
    if (timeElapsed > exam.config.timeLimit) {
      exam.status = 'completed';
      exam.completedAt = now;
      await exam.save();
      
      return res.status(400).json({
        success: false,
        message: '考试时间已结束'
      });
    }

    // 更新答案
    const answerIndex = exam.answers.findIndex((a: any) => a.questionId.toString() === questionId);
    if (answerIndex === -1) {
      return res.status(400).json({
        success: false,
        message: '题目不存在'
      });
    }

    exam.answers[answerIndex].userAnswer = answer;
    exam.answers[answerIndex].timeSpent = Number(timeSpent) || 0;
    exam.answers[answerIndex].submittedAt = now;

    await exam.save();

    res.json({
      success: true,
      message: '答案已保存'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '提交答案失败',
      error: error.message
    });
  }
};

// 完成考试
export const finishExam = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const exam = await Exam.findOne({ _id: id, user: userId })
      .populate('answers.questionId');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: '考试不存在'
      });
    }

    if (exam.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: '考试未在进行中'
      });
    }

    const now = new Date();
    exam.status = 'completed';
    exam.completedAt = now;

    // 计算分数和正确率
    let correctCount = 0;
    let totalQuestions = exam.answers.length;
    let totalTime = 0;

    for (let i = 0; i < exam.answers.length; i++) {
      const answer = exam.answers[i];
      const questionData = answer.questionId as any;
      
      // 判断答案是否正确
      const isCorrect = answer.userAnswer === questionData.correctAnswer;
      answer.isCorrect = isCorrect;
      
      if (isCorrect) correctCount++;
      totalTime += answer.timeSpent;
    }

    const accuracy = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    const score = Math.round(accuracy);
    const passed = score >= exam.config.passingScore;

    // 保存考试结果
    exam.result = {
      score,
      accuracy,
      totalTime: Math.round(totalTime / 60), // 转换为分钟
      passed
    };

    await exam.save();

    // 更新用户学习统计并触发成就检查
    try {
      const updateResult = await updateLearningStats(userId!, {
        questionsAnswered: totalQuestions,
        correctAnswers: correctCount,
        timeSpent: Math.round(totalTime / 60),
        examCompleted: true,
        examPassed: passed
      }, {
        sessionAccuracy: accuracy,
        examScore: score,
        examType: exam.examType
      });

      // 如果获得了新成就，在响应中包含这些信息
      const response: any = {
        result: exam.result,
        answers: exam.answers
      };

      if (updateResult.earnedAchievements && updateResult.earnedAchievements.length > 0) {
        response.newAchievements = updateResult.earnedAchievements.map((ea: any) => ({
          id: ea.achievement.id,
          title: ea.achievement.title,
          description: ea.achievement.description,
          icon: ea.achievement.icon,
          points: ea.achievement.points
        }));
      }

      res.json({
        success: true,
        message: '考试已完成',
        data: response
      });
    } catch (statsError) {
      console.error('更新学习统计失败:', statsError);
      // 即使统计更新失败，也要返回考试结果
      res.json({
        success: true,
        message: '考试已完成',
        data: {
          result: exam.result,
          answers: exam.answers
        }
      });
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '完成考试失败',
      error: error.message
    });
  }
};

/**
 * 教师发布考试（针对班级/年级）
 */
export const publishExam = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    // 检查权限
    if (!['teacher', 'admin', 'super_admin'].includes(userRole || '')) {
      return res.status(403).json({
        success: false,
        message: '无权限发布考试'
      });
    }

    const {
      title,
      description,
      examConfig,
      autoGeneration,
      targetAudience,
      schedule,
      grading
    } = req.body;

    // 验证必填字段
    if (!title || !examConfig || !targetAudience || !schedule) {
      return res.status(400).json({
        success: false,
        message: '请填写所有必填字段'
      });
    }

    let questions: any[] = [];

    // 自动组卷
    if (autoGeneration.enabled) {
      questions = await generateExamQuestions(autoGeneration);
    } else if (autoGeneration.questionIds && autoGeneration.questionIds.length > 0) {
      // 手动选择题目
      questions = await Question.find({ 
        _id: { $in: autoGeneration.questionIds },
        status: 'published'
      });
    }

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有找到符合条件的题目，无法创建考试'
      });
    }

    // 创建考试发布记录
    const examPublication = new ExamPublication({
      title,
      description,
      creator: userId,
      examConfig: {
        timeLimit: examConfig.timeLimit,
        questionCount: questions.length,
        passingScore: grading.passingScore,
        allowReview: examConfig.allowReview,
        randomOrder: examConfig.randomOrder,
        showScore: grading.showScore,
        allowRetake: examConfig.allowRetake,
        maxAttempts: examConfig.maxAttempts || 1
      },
      questions: questions.map(q => q._id),
      targetAudience: {
        type: targetAudience.type, // 'class', 'grade', 'institution', 'all'
        classIds: targetAudience.classIds || [],
        gradeIds: targetAudience.gradeIds || [],
        institutionIds: targetAudience.institutionIds || [],
        specificUsers: targetAudience.specificUsers || []
      },
      schedule: {
        startTime: new Date(schedule.startTime),
        endTime: new Date(schedule.endTime),
        duration: examConfig.timeLimit,
        timezone: schedule.timezone || 'Asia/Shanghai'
      },
      grading: {
        passingScore: grading.passingScore,
        scoreWeight: grading.scoreWeight || 100,
        gradingCriteria: grading.gradingCriteria || 'percentage',
        showScore: grading.showScore,
        showAnswers: grading.showAnswers,
        showAnalysis: grading.showAnalysis
      },
      autoGeneration: {
        enabled: autoGeneration.enabled,
        criteria: autoGeneration.criteria || {},
        generatedAt: autoGeneration.enabled ? new Date() : undefined
      },
      status: 'published',
      statistics: {
        totalParticipants: 0,
        completedCount: 0,
        averageScore: 0,
        passRate: 0,
        avgCompletionTime: 0
      }
    });

    await examPublication.save();

    // 创建个人考试实例（针对目标用户）
    const targetUsers = await getTargetUsers(targetAudience);
    const examInstances = [];

    for (const targetUser of targetUsers) {
      const examInstance = new Exam({
        user: targetUser._id,
        publicationId: examPublication._id,
        title: `${title} - ${targetUser.username}`,
        description,
        config: examPublication.examConfig,
        examType: 'published_exam',
        status: 'not_started',
        answers: questions.map((q, index) => ({
          questionId: q._id,
          userAnswer: null,
          isCorrect: false,
          timeSpent: 0,
          submittedAt: new Date()
        }))
      });

      const savedExam = await examInstance.save();
      examInstances.push(savedExam);
    }

    // 发送通知给目标用户
    if (targetUsers.length > 0) {
      try {
        const { NotificationService } = await import('../services/notificationService');
        await NotificationService.sendBulkNotification({
          recipients: targetUsers.map(u => ({ userId: u._id.toString(), role: u.role })),
          title: '新考试通知',
          content: `教师发布了考试："${title}"，请及时参加。`,
          type: 'exam',
          priority: 'high',
          metadata: {
            examId: examPublication._id.toString(),
            startTime: schedule.startTime,
            endTime: schedule.endTime
          }
        });
      } catch (notificationError) {
        console.warn('发送考试通知失败:', notificationError);
      }
    }

    res.status(201).json({
      success: true,
      message: `考试发布成功，已通知 ${targetUsers.length} 名学生`,
      data: {
        examPublication: examPublication.toObject(),
        participantCount: targetUsers.length,
        examInstances: examInstances.length,
        autoGenerated: autoGeneration.enabled,
        questionCount: questions.length
      }
    });

  } catch (error: any) {
    console.error('发布考试失败:', error);
    res.status(500).json({
      success: false,
      message: '发布考试失败',
      error: error.message
    });
  }
};

/**
 * 自动组卷功能
 */
const generateExamQuestions = async (autoGeneration: any): Promise<any[]> => {
  const {
    questionCount,
    difficulty,
    categories,
    knowledgeTypes,
    questionTypes,
    balanceStrategy,
    useAI
  } = autoGeneration.criteria;

  let questions: any[] = [];

  if (useAI && autoGeneration.targetUserId) {
    // 使用AI个性化组卷
    try {
      const { RecommendationService } = await import('../services/recommendationService');
      const personalizedData = await RecommendationService.getPersonalizedExamQuestions(
        autoGeneration.targetUserId,
        {
          questionCount: Number(questionCount) || 20,
          difficulty: difficulty ? (Array.isArray(difficulty) ? difficulty : [difficulty]) : undefined,
          categories: categories ? (Array.isArray(categories) ? categories : [categories]) : undefined,
          focusWeakness: balanceStrategy === 'weakness_focused'
        }
      );
      questions = personalizedData.questions;
    } catch (aiError) {
      console.warn('AI组卷失败，降级到规则组卷:', aiError);
    }
  }

  // 如果AI组卷失败或未启用，使用规则组卷
  if (questions.length === 0) {
    questions = await generateRuleBasedQuestions({
      questionCount,
      difficulty,
      categories,
      knowledgeTypes,
      questionTypes,
      balanceStrategy
    });
  }

  return questions;
};

/**
 * 基于规则的组卷
 */
const generateRuleBasedQuestions = async (criteria: any): Promise<any[]> => {
  const {
    questionCount,
    difficulty,
    categories,
    knowledgeTypes,
    questionTypes,
    balanceStrategy
  } = criteria;

  // 构建查询条件
  const baseQuery: any = { status: 'published' };
  
  if (categories && categories.length > 0) {
    baseQuery['category.sport'] = { $in: categories };
  }
  
  if (knowledgeTypes && knowledgeTypes.length > 0) {
    baseQuery['category.knowledgeType'] = { $in: knowledgeTypes };
  }
  
  if (questionTypes && questionTypes.length > 0) {
    baseQuery.type = { $in: questionTypes };
  }

  let questions: any[] = [];

  if (balanceStrategy === 'balanced') {
    // 平衡组卷：每个难度等级平均分配
    const difficultyLevels = difficulty && difficulty.length > 0 ? difficulty : ['easy', 'medium', 'hard'];
    const questionsPerDifficulty = Math.floor(questionCount / difficultyLevels.length);
    const remainder = questionCount % difficultyLevels.length;

    for (let i = 0; i < difficultyLevels.length; i++) {
      const difficultyLevel = difficultyLevels[i];
      const countForThisDifficulty = questionsPerDifficulty + (i < remainder ? 1 : 0);
      
      const difficultyQuestions = await Question.aggregate([
        { $match: { ...baseQuery, difficulty: difficultyLevel } },
        { $sample: { size: countForThisDifficulty } }
      ]);

      questions.push(...difficultyQuestions);
    }
  } else if (balanceStrategy === 'category_balanced') {
    // 分类平衡组卷
    const availableCategories = categories && categories.length > 0 ? categories : 
      await Question.distinct('category.sport', baseQuery);
    
    const questionsPerCategory = Math.floor(questionCount / availableCategories.length);
    const remainder = questionCount % availableCategories.length;

    for (let i = 0; i < availableCategories.length; i++) {
      const category = availableCategories[i];
      const countForThisCategory = questionsPerCategory + (i < remainder ? 1 : 0);
      
      const categoryQuestions = await Question.aggregate([
        { $match: { ...baseQuery, 'category.sport': category } },
        { $sample: { size: countForThisCategory } }
      ]);

      questions.push(...categoryQuestions);
    }
  } else {
    // 随机组卷
    if (difficulty && difficulty.length > 0) {
      baseQuery.difficulty = { $in: difficulty };
    }

    questions = await Question.aggregate([
      { $match: baseQuery },
      { $sample: { size: Number(questionCount) || 20 } }
    ]);
  }

  return questions;
};

/**
 * 获取目标用户列表
 */
const getTargetUsers = async (targetAudience: any): Promise<any[]> => {
  const { type, classIds, gradeIds, institutionIds, specificUsers } = targetAudience;
  
  let users: any[] = [];

  switch (type) {
    case 'class':
      if (classIds && classIds.length > 0) {
        const { Class } = await import('../models/Class');
        const classes = await Class.find({ _id: { $in: classIds } });
        const allStudentIds = classes.flatMap(c => c.students.map(s => s.userId));
        users = await User.find({ _id: { $in: allStudentIds }, role: 'student' });
      }
      break;

    case 'grade':
      if (gradeIds && gradeIds.length > 0) {
        // 假设User模型有grade字段
        users = await User.find({ 
          grade: { $in: gradeIds },
          role: 'student'
        });
      }
      break;

    case 'institution':
      if (institutionIds && institutionIds.length > 0) {
        users = await User.find({ 
          institution: { $in: institutionIds },
          role: 'student'
        });
      }
      break;

    case 'specific':
      if (specificUsers && specificUsers.length > 0) {
        users = await User.find({ 
          _id: { $in: specificUsers },
          role: 'student'
        });
      }
      break;

    case 'all':
      users = await User.find({ role: 'student' });
      break;

    default:
      users = [];
  }

  return users;
};

/**
 * 获取教师发布的考试列表
 */
export const getPublishedExams = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { page = 1, pageSize = 10, status, type } = req.query;

    const query: any = { creator: userId };
    if (status) query.status = status;
    if (type) query['targetAudience.type'] = type;

    const examPublications = await ExamPublication.find(query)
      .populate('creator', 'username email')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(pageSize))
      .limit(Number(pageSize));

    const total = await ExamPublication.countDocuments(query);

    res.json({
      success: true,
      data: {
        examPublications,
        pagination: {
          current: Number(page),
          pageSize: Number(pageSize),
          total
        }
      }
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取考试列表失败',
      error: error.message
    });
  }
};

/**
 * 获取考试参与统计
 */
export const getExamParticipationStats = async (req: AuthRequest, res: Response) => {
  try {
    const { examId } = req.params;
    const userId = req.user?.id;

    // 检查考试是否存在且用户有权限查看
    const examPublication = await ExamPublication.findOne({
      _id: examId,
      creator: userId
    });

    if (!examPublication) {
      return res.status(404).json({
        success: false,
        message: '考试不存在或无权限查看'
      });
    }

    // 获取所有相关的考试实例
    const examInstances = await Exam.find({ 
      publicationId: examId 
    }).populate('user', 'username email grade class') as any[];

    // 统计数据
    const stats = {
      totalParticipants: examInstances.length,
      completedCount: examInstances.filter(e => e.status === 'completed').length,
      inProgressCount: examInstances.filter(e => e.status === 'in_progress').length,
      notStartedCount: examInstances.filter(e => e.status === 'not_started').length,
      abandonedCount: examInstances.filter(e => e.status === 'abandoned').length,
      
      // 成绩统计
      scores: examInstances
        .filter(e => e.result?.score !== undefined)
        .map(e => ({
          userId: e.user._id,
          username: e.user?.username || '未知',
          score: e.result.score,
          accuracy: e.result.accuracy,
          completedAt: e.completedAt,
          timeSpent: e.result.totalTime
        })),
      
      averageScore: 0,
      passRate: 0,
      avgCompletionTime: 0
    };

    // 计算平均分
    if (stats.scores.length > 0) {
      stats.averageScore = stats.scores.reduce((sum, s) => sum + s.score, 0) / stats.scores.length;
      stats.passRate = (stats.scores.filter(s => s.score >= examPublication.grading.passingScore).length / stats.scores.length) * 100;
      stats.avgCompletionTime = stats.scores.reduce((sum, s) => sum + (s.timeSpent || 0), 0) / stats.scores.length;
    }

    res.json({
      success: true,
      data: {
        examInfo: {
          title: examPublication.title,
          description: examPublication.description,
          startTime: examPublication.schedule.startTime,
          endTime: examPublication.schedule.endTime,
          passingScore: examPublication.grading.passingScore
        },
        statistics: stats,
        participants: examInstances.map(instance => ({
          userId: instance.user._id,
          username: instance.user?.username || '未知',
          email: instance.user?.email || '',
          grade: instance.user?.grade || '',
          class: instance.user?.class || '',
          status: instance.status,
          startedAt: instance.startedAt,
          completedAt: instance.completedAt,
          score: instance.result?.score,
          accuracy: instance.result?.accuracy,
          timeSpent: instance.result?.totalTime
        }))
      }
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取考试统计失败',
      error: error.message
    });
  }
};

// 获取考试统计
export const getExamStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const stats = await Exam.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalExams: { $sum: 1 },
          completedExams: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          averageScore: {
            $avg: { $ifNull: ['$result.score', 0] }
          },
          totalTime: {
            $sum: { $ifNull: ['$result.totalTime', 0] }
          },
          passedExams: {
            $sum: { $cond: [{ $eq: ['$result.passed', true] }, 1, 0] }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalExams: 0,
      completedExams: 0,
      averageScore: 0,
      totalTime: 0,
      passedExams: 0
    };

    // 获取最近的考试记录
    const recentExams = await Exam.find({ user: userId, status: 'completed' })
      .sort({ completedAt: -1 })
      .limit(5)
      .select('title result.score result.passed completedAt examType');

    res.json({
      success: true,
      data: {
        stats: result,
        recentExams
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取考试统计失败',
      error: error.message
    });
  }
}; 