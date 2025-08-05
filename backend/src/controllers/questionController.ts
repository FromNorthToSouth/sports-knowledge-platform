import { Response } from 'express';
import Question from '../models/Question';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { qwenAIService } from '../services/aiService';

// 获取题目列表
export const getQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      sport,
      knowledgeType,
      difficulty,
      tags,
      status,
      search
    } = req.query;

    // 构建查询条件
    const query: any = {};
    
    // 只有明确指定状态时才过滤状态
    if (status) query.status = status;

    if (sport) query['category.sport'] = sport;
    if (knowledgeType) query['category.knowledgeType'] = knowledgeType;
    if (difficulty) query.difficulty = difficulty;
    if (tags) query.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('执行题目查询，条件:', JSON.stringify(query));
    
    // 执行查询
    const questions = await Question.find(query)
      .populate('creator', 'username')
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Question.countDocuments(query);
    
    console.log('查询结果:', questions.length, '道题目，总计:', total);
    console.log('题目列表:', questions.map(q => ({
      id: q._id,
      title: q.title,
      status: q.status,
      isAIGenerated: q.isAIGenerated,
      createdAt: q.createdAt
    })));

    res.json({
      success: true,
      data: {
        questions,
        pagination: {
          current: Number(page),
          total: Math.ceil(total / Number(limit)),
          pageSize: Number(limit),
          totalCount: total
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取题目列表失败'
    });
  }
};

// 获取单个题目详情
export const getQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const question = await Question.findById(id)
      .populate('creator', 'username')
      .populate('reviewedBy', 'username');

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在'
      });
    }

    res.json({
      success: true,
      data: { question }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取题目详情失败'
    });
  }
};

// 创建题目
export const createQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      content,
      type,
      options,
      correctAnswer,
      explanation,
      category,
      tags,
      difficulty,
      media
    } = req.body;

    const question = new Question({
      title,
      content,
      type,
      options,
      correctAnswer,
      explanation,
      category,
      tags,
      difficulty,
      media,
      creator: req.user?._id,
      status: req.user?.role === 'content_manager' || req.user?.role === 'admin' ? 'published' : 'draft'
    });

    await question.save();

    res.status(201).json({
      success: true,
      message: '题目创建成功',
      data: { question }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '创建题目失败'
    });
  }
};

// 更新题目
export const updateQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在'
      });
    }

    // 检查权限
    if (
      question.creator.toString() !== req.user?._id.toString() &&
      !['admin', 'content_manager', 'super_admin'].includes(req.user?.role || '')
    ) {
      return res.status(403).json({
        success: false,
        message: '无权限修改此题目'
      });
    }

    // 更新题目，增加版本号
    const updatedQuestion = await Question.findByIdAndUpdate(
      id,
      { 
        ...updateData, 
        version: question.version + 1,
        parentQuestion: question.parentQuestion || question._id
      },
      { new: true }
    );

    res.json({
      success: true,
      message: '题目更新成功',
      data: { question: updatedQuestion }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '更新题目失败'
    });
  }
};

// 删除题目
export const deleteQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在'
      });
    }

    // 检查权限
    if (
      question.creator.toString() !== req.user?._id.toString() &&
      !['admin', 'content_manager', 'super_admin'].includes(req.user?.role || '')
    ) {
      return res.status(403).json({
        success: false,
        message: '无权限删除此题目'
      });
    }

    await Question.findByIdAndDelete(id);

    res.json({
      success: true,
      message: '题目删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除题目失败'
    });
  }
};

// 审核题目
export const reviewQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, reviewComments } = req.body;

    // 检查权限
    if (!['admin', 'content_manager', 'super_admin'].includes(req.user?.role || '')) {
      return res.status(403).json({
        success: false,
        message: '无权限审核题目'
      });
    }

    const question = await Question.findByIdAndUpdate(
      id,
      {
        status,
        reviewedBy: req.user?._id,
        reviewedAt: new Date(),
        reviewComments
      },
      { new: true }
    );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在'
      });
    }

    res.json({
      success: true,
      message: '题目审核完成',
      data: { question }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '审核题目失败'
    });
  }
};

// AI生成题目（使用阿里云千问模型）
export const generateQuestion = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      sport,
      category, // 兼容前端发送的category字段
      knowledgePoint,
      knowledgePoints, // 前端发送的知识点数组
      topic, // 前端发送的详细描述
      context,
      difficulty = 'medium',
      type = 'single_choice',
      count = 1
    } = req.body;

    // 参数处理和兼容性
    const finalSport = sport || category;
    const finalKnowledgePoint = knowledgePoint || (Array.isArray(knowledgePoints) ? knowledgePoints.join('、') : knowledgePoints);
    const finalContext = context || topic;
    const finalCount = parseInt(count) || 1;

    // 验证必填参数
    if (!finalSport || !finalKnowledgePoint) {
      return res.status(400).json({
        success: false,
        message: '请提供运动项目和知识点信息'
      });
    }

    // 如果需要生成多题，调用批量生成
    if (finalCount > 1) {
      return generateMultipleQuestions(req, res);
    }

    // 调用AI服务生成题目
    const questionData = await qwenAIService.generateSportsQuestion({
      sport: finalSport,
      knowledgePoint: finalKnowledgePoint,
      difficulty,
      type,
      context: finalContext
    });
    
    // 创建题目
    const question = new Question({
      title: questionData.title,
      content: questionData.content,
      type,
      options: questionData.options,
      correctAnswer: questionData.options.find((o: any) => o.isCorrect)?.text,
      explanation: questionData.explanation,
      category: {
        sport: finalSport,
        knowledgeType: finalKnowledgePoint,
      },
      tags: questionData.tags || [],
      difficulty,
      creator: req.user?._id,
      isAIGenerated: true,
      aiPrompt: `运动项目：${finalSport}，知识点：${finalKnowledgePoint}，难度：${difficulty}，类型：${type}${finalContext ? `，描述：${finalContext}` : ''}`,
      status: req.user?.role === 'teacher' || req.user?.role === 'content_manager' || req.user?.role === 'admin' || req.user?.role === 'super_admin' ? 'published' : 'draft'
    });

    await question.save();
    console.log('AI题目已保存到数据库，ID:', question._id, '标题:', question.title);

    res.json({
      success: true,
      message: 'AI题目生成成功',
      data: { question }
    });
  } catch (error: any) {
    console.error('AI生成题目失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'AI生成题目失败，请重试'
    });
  }
};

// 批量导入题目
export const importQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的题目数据'
      });
    }

    const createdQuestions = [];
    const errors = [];

    for (let i = 0; i < questions.length; i++) {
      try {
        const questionData = {
          ...questions[i],
          creator: req.user?._id,
          status: 'draft'
        };
        
        const question = new Question(questionData);
        await question.save();
        createdQuestions.push(question);
      } catch (error) {
        errors.push({
          index: i,
          error: `题目 ${i + 1} 导入失败`
        });
      }
    }

    res.json({
      success: true,
      message: `成功导入 ${createdQuestions.length} 道题目`,
      data: {
        imported: createdQuestions.length,
        errors
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '批量导入题目失败'
    });
  }
};

// 批量AI生成题目
export const generateMultipleQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      sport,
      category, // 兼容前端发送的category字段
      knowledgePoint, 
      knowledgePoints, // 前端发送的知识点数组
      topic, // 前端发送的详细描述
      context,
      difficulty = 'medium',
      type = 'single_choice',
      count = 5
    } = req.body;

    // 参数处理和兼容性
    const finalSport = sport || category;
    const finalKnowledgePoint = knowledgePoint || (Array.isArray(knowledgePoints) ? knowledgePoints.join('、') : knowledgePoints);
    const finalContext = context || topic;
    const finalCount = parseInt(count) || 5;

    // 验证必填参数
    if (!finalSport || !finalKnowledgePoint) {
      return res.status(400).json({
        success: false,
        message: '请提供运动项目和知识点信息'
      });
    }

    if (finalCount > 20) {
      return res.status(400).json({
        success: false,
        message: '单次生成题目数量不能超过20道'
      });
    }

    // 调用AI服务批量生成题目
    const result = await qwenAIService.generateMultipleQuestions({
      sport: finalSport,
      knowledgePoint: finalKnowledgePoint,
      difficulty,
      type,
      context: finalContext
    }, finalCount);

    const createdQuestions = [];
    
    // 保存生成的题目到数据库
    for (const questionData of result.questions) {
      try {
        const question = new Question({
          title: questionData.title,
          content: questionData.content,
          type,
          options: questionData.options,
          correctAnswer: questionData.options.find((o: any) => o.isCorrect)?.text,
          explanation: questionData.explanation,
          category: {
            sport: finalSport,
            knowledgeType: finalKnowledgePoint,
          },
          tags: questionData.tags || [],
          difficulty,
          creator: req.user?._id,
          isAIGenerated: true,
          aiPrompt: `批量生成 - 运动项目：${finalSport}，知识点：${finalKnowledgePoint}，难度：${difficulty}，类型：${type}${finalContext ? `，描述：${finalContext}` : ''}`,
          status: req.user?.role === 'teacher' || req.user?.role === 'content_manager' || req.user?.role === 'admin' || req.user?.role === 'super_admin' ? 'published' : 'draft'
        });

        await question.save();
        console.log('批量生成-AI题目已保存到数据库，ID:', question._id, '标题:', question.title);
        createdQuestions.push(question);
      } catch (error) {
        console.error('批量生成-保存题目失败:', error);
        result.errors.push({
          index: questionData.title ? questionData.title.length : 0,
          error: '保存题目到数据库失败'
        });
      }
    }

    res.json({
      success: true,
      message: `成功生成 ${createdQuestions.length} 道题目`,
      data: {
        questions: createdQuestions,
        generated: result.questions.length,
        saved: createdQuestions.length,
        errors: result.errors
      }
    });
  } catch (error: any) {
    console.error('批量AI生成题目失败:', error);
    res.status(500).json({
      success: false,
      message: error.message || '批量AI生成题目失败，请重试'
    });
  }
};

// 诊断：查看数据库中的所有题目
export const debugQuestions = async (req: AuthRequest, res: Response) => {
  try {
    console.log('=== 数据库诊断开始 ===');
    
    // 查询所有题目
    const allQuestions = await Question.find({}).sort({ createdAt: -1 }).limit(20);
    console.log('数据库中共有题目:', allQuestions.length, '道');
    
    // 查询AI生成的题目
    const aiQuestions = await Question.find({ isAIGenerated: true }).sort({ createdAt: -1 });
    console.log('AI生成的题目:', aiQuestions.length, '道');
    
    // 按状态分组统计
    const draftCount = await Question.countDocuments({ status: 'draft' });
    const publishedCount = await Question.countDocuments({ status: 'published' });
    const archivedCount = await Question.countDocuments({ status: 'archived' });
    
    console.log('题目状态统计:', {
      draft: draftCount,
      published: publishedCount,
      archived: archivedCount
    });
    
    // 最新的5道题目详情
    const latestQuestions = allQuestions.slice(0, 5).map(q => ({
      id: q._id,
      title: q.title,
      status: q.status,
      isAIGenerated: q.isAIGenerated,
      createdAt: q.createdAt,
      category: q.category
    }));
    
    console.log('最新5道题目:', latestQuestions);
    console.log('=== 数据库诊断结束 ===');
    
    res.json({
      success: true,
      data: {
        total: allQuestions.length,
        aiGenerated: aiQuestions.length,
        statusCount: {
          draft: draftCount,
          published: publishedCount,
          archived: archivedCount
        },
        latest: latestQuestions,
        allQuestions: allQuestions.map(q => ({
          id: q._id,
          title: q.title,
          status: q.status,
          isAIGenerated: q.isAIGenerated,
          createdAt: q.createdAt
        }))
      }
    });
  } catch (error: any) {
    console.error('数据库诊断失败:', error);
    res.status(500).json({
      success: false,
      message: '数据库诊断失败',
      error: error.message
    });
  }
};

// AI服务状态检查
export const checkAIServiceStatus = async (req: AuthRequest, res: Response) => {
  try {
    const hasApiKey = !!process.env.DASHSCOPE_API_KEY;
    const apiUrl = process.env.DASHSCOPE_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    const model = process.env.DASHSCOPE_MODEL || 'qwen3-235b-a22b-instruct-2507';

    // 尝试简单的AI调用测试
    let aiServiceStatus = 'unknown';
    let testError = null;
    
    if (hasApiKey) {
      try {
        // 导入AI服务并进行简单测试
        const { qwenAIService } = await import('../services/aiService');
        
        // 简单的测试调用
        await qwenAIService.generateText([{
          role: 'user',
          content: '请回答：1+1等于多少？'
        }], { maxTokens: 50 });
        
        aiServiceStatus = 'healthy';
      } catch (error: any) {
        aiServiceStatus = 'error';
        testError = error.message;
      }
    } else {
      aiServiceStatus = 'no_api_key';
    }

    res.json({
      success: true,
      data: {
        status: aiServiceStatus,
        config: {
          hasApiKey,
          apiUrl: hasApiKey ? apiUrl : '***未配置***',
          model: hasApiKey ? model : '***未配置***'
        },
        testError
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'AI服务状态检查失败',
      error: error.message
    });
  }
};

// 获取题目统计信息
export const getQuestionStats = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await Question.aggregate([
      { $match: { status: 'published' } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          avgAccuracy: { $avg: '$stats.accuracy' },
          totalAttempts: { $sum: '$stats.totalAttempts' },
          sportDistribution: {
            $push: {
              sport: '$category.sport',
              count: 1
            }
          },
          difficultyDistribution: {
            $push: {
              difficulty: '$difficulty',
              count: 1
            }
          }
        }
      }
    ]);

    // 计算运动项目分布
    const sportCounts: any = {};
    const difficultyCounts: any = {};

    if (stats[0]) {
      stats[0].sportDistribution.forEach((item: any) => {
        sportCounts[item.sport] = (sportCounts[item.sport] || 0) + 1;
      });

      stats[0].difficultyDistribution.forEach((item: any) => {
        difficultyCounts[item.difficulty] = (difficultyCounts[item.difficulty] || 0) + 1;
      });
    }

    res.json({
      success: true,
      data: {
        total: stats[0]?.total || 0,
        avgAccuracy: stats[0]?.avgAccuracy || 0,
        totalAttempts: stats[0]?.totalAttempts || 0,
        sportDistribution: sportCounts,
        difficultyDistribution: difficultyCounts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取题目统计失败'
    });
  }
}; 