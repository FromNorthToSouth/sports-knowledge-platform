import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { KnowledgeBase, LearningPath, KnowledgeProgress } from '../models/KnowledgeBase';
import { KnowledgePoint } from '../models/KnowledgePoint';
import fileService from '../services/fileService';

// 获取知识库列表
export const getKnowledgeBases = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      level,
      status = 'published',
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // 构建查询条件
    const query: any = {};
    
    if (category && category !== 'all') query.category = category;
    if (level && level !== 'all') query.level = level;
    
    // 权限过滤
    if (req.user?.role === 'student') {
      // 学生只能看到已发布的公开知识库
      query.status = 'published';
      query.isPublic = true;
    } else if (req.user?.role === 'teacher' || req.user?.role === 'institution_admin') {
      // 教师和机构管理员可以看到自己创建的和公开的知识库
      if (status && status !== 'all') {
        query.$or = [
          { author: req.user.id, status },
          { status: 'published', isPublic: true }
        ];
      } else {
        query.$or = [
          { author: req.user.id },
          { status: 'published', isPublic: true }
        ];
      }
    } else {
      // 管理员可以看到所有知识库
      if (status && status !== 'all') query.status = status;
    }

    // 文本搜索
    if (search) {
      query.$text = { $search: search };
    }

    // 执行查询
    const sortObj: any = {};
    sortObj[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const knowledgeBases = await KnowledgeBase.find(query)
      .populate('author', 'username email avatar')
      .sort(sortObj)
      .limit(Number(limit) * Number(page))
      .skip((Number(page) - 1) * Number(limit));

    const total = await KnowledgeBase.countDocuments(query);

    res.json({
      success: true,
      data: {
        knowledgeBases,
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
      message: '获取知识库列表失败',
      error: error.message
    });
  }
};

// 获取知识库详情
export const getKnowledgeBaseById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const knowledgeBase = await KnowledgeBase.findById(id)
      .populate('author', 'username email avatar')
      .populate('collaborators', 'username email avatar');

    if (!knowledgeBase) {
      return res.status(404).json({
        success: false,
        message: '知识库不存在'
      });
    }

    // 权限检查
    if (knowledgeBase.status !== 'published') {
      if (req.user?.role === 'student' || 
          (knowledgeBase.author.toString() !== req.user!.id && 
           !['admin', 'super_admin'].includes(req.user!.role))) {
        return res.status(403).json({
          success: false,
          message: '无权访问此知识库'
        });
      }
    }

    // 更新浏览量
    await KnowledgeBase.findByIdAndUpdate(id, {
      $inc: { 'stats.totalViews': 1 }
    });

    res.json({
      success: true,
      data: knowledgeBase
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取知识库详情失败',
      error: error.message
    });
  }
};

// 创建知识库
export const createKnowledgeBase = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      description,
      category,
      level,
      isPublic = true,
      tags = [],
      allowedInstitutions = []
    } = req.body;

    // 验证必填字段
    if (!title || !description || !category || !level) {
      return res.status(400).json({
        success: false,
        message: '请填写所有必填字段'
      });
    }

    // 创建知识库
    const knowledgeBase = new KnowledgeBase({
      title,
      description,
      category,
      level,
      isPublic,
      tags,
      allowedInstitutions,
      author: req.user!.id,
      status: 'draft'
    });

    await knowledgeBase.save();

    res.status(201).json({
      success: true,
      message: '知识库创建成功',
      data: knowledgeBase
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '知识库创建失败',
      error: error.message
    });
  }
};

// 更新知识库
export const updateKnowledgeBase = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const knowledgeBase = await KnowledgeBase.findById(id);
    if (!knowledgeBase) {
      return res.status(404).json({
        success: false,
        message: '知识库不存在'
      });
    }

    // 权限检查
    if (knowledgeBase.author.toString() !== req.user!.id && 
        !['admin', 'super_admin'].includes(req.user!.role)) {
      return res.status(403).json({
        success: false,
        message: '无权修改此知识库'
      });
    }

    const updatedKB = await KnowledgeBase.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    ).populate('author', 'username email avatar');

    res.json({
      success: true,
      message: '知识库更新成功',
      data: updatedKB
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '知识库更新失败',
      error: error.message
    });
  }
};

// 删除知识库
export const deleteKnowledgeBase = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const knowledgeBase = await KnowledgeBase.findById(id);
    if (!knowledgeBase) {
      return res.status(404).json({
        success: false,
        message: '知识库不存在'
      });
    }

    // 权限检查
    if (knowledgeBase.author.toString() !== req.user!.id && 
        !['admin', 'super_admin'].includes(req.user!.role)) {
      return res.status(403).json({
        success: false,
        message: '无权删除此知识库'
      });
    }

    // 删除相关数据
    await KnowledgePoint.deleteMany({ knowledgeBase: id });
    await LearningPath.deleteMany({ knowledgeBase: id });
    await KnowledgeProgress.deleteMany({ knowledgeBase: id });
    await KnowledgeBase.findByIdAndDelete(id);

    res.json({
      success: true,
      message: '知识库删除成功'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '知识库删除失败',
      error: error.message
    });
  }
};

// 获取知识点列表
export const getKnowledgePoints = async (req: AuthRequest, res: Response) => {
  try {
    const { knowledgeBaseId } = req.params;
    const { type, difficulty, parentId } = req.query;

    // 构建查询条件
    const query: any = { knowledgeBase: knowledgeBaseId };
    if (type && type !== 'all') query.type = type;
    if (difficulty && difficulty !== 'all') query.difficulty = difficulty;
    if (parentId !== undefined) {
      query.parentId = parentId === 'null' ? null : parentId;
    }

    const knowledgePoints = await KnowledgePoint.find(query)
      .populate('resources', 'title type')
      .populate('prerequisites', 'title')
      .sort({ order: 1, createdAt: 1 });

    res.json({
      success: true,
      data: knowledgePoints
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取知识点列表失败',
      error: error.message
    });
  }
};

// 创建知识点
export const createKnowledgePoint = async (req: AuthRequest, res: Response) => {
  try {
    const { knowledgeBaseId } = req.params;
    const {
      title,
      description,
      content,
      type,
      parentId,
      difficulty,
      estimatedTime,
      prerequisites = [],
      objectives = [],
      keywords = []
    } = req.body;

    // 验证必填字段
    if (!title || !description || !content || !type || !difficulty || !estimatedTime) {
      return res.status(400).json({
        success: false,
        message: '请填写所有必填字段'
      });
    }

    // 检查知识库是否存在且有权限
    const knowledgeBase = await KnowledgeBase.findById(knowledgeBaseId);
    if (!knowledgeBase) {
      return res.status(404).json({
        success: false,
        message: '知识库不存在'
      });
    }

    if (knowledgeBase.author.toString() !== req.user!.id && 
        !['admin', 'super_admin'].includes(req.user!.role)) {
      return res.status(403).json({
        success: false,
        message: '无权在此知识库中添加知识点'
      });
    }

    // 计算层级和顺序
    let level = 1;
    let order = 0;

    if (parentId) {
      const parent = await KnowledgePoint.findById(parentId);
      if (parent) {
        level = parent.level + 1;
      }
    }

    // 获取同级最大序号
    const lastPoint = await KnowledgePoint.findOne({
      knowledgeBase: knowledgeBaseId,
      parentId: parentId || null
    }).sort({ order: -1 });

    if (lastPoint) {
      order = lastPoint.order + 1;
    }

    // 创建知识点
    const knowledgePoint = new KnowledgePoint({
      knowledgeBase: knowledgeBaseId,
      title,
      description,
      content,
      type,
      parentId: parentId || undefined,
      level,
      order,
      difficulty,
      estimatedTime,
      prerequisites,
      objectives,
      keywords,
      createdBy: req.user!.id
    });

    await knowledgePoint.save();

    // 更新知识库统计
    await KnowledgeBase.findByIdAndUpdate(knowledgeBaseId, {
      $inc: { 'stats.knowledgePoints': 1 }
    });

    res.status(201).json({
      success: true,
      message: '知识点创建成功',
      data: knowledgePoint
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '知识点创建失败',
      error: error.message
    });
  }
};

// 获取学习路径列表
export const getLearningPaths = async (req: AuthRequest, res: Response) => {
  try {
    const { knowledgeBaseId } = req.params;
    const { difficulty } = req.query;

    const query: any = { knowledgeBase: knowledgeBaseId };
    if (difficulty && difficulty !== 'all') query.difficulty = difficulty;

    const learningPaths = await LearningPath.find(query)
      .populate('knowledgePoints.pointId', 'title type difficulty')
      .sort({ isDefault: -1, createdAt: -1 });

    res.json({
      success: true,
      data: learningPaths
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取学习路径失败',
      error: error.message
    });
  }
};

// 创建学习路径
export const createLearningPath = async (req: AuthRequest, res: Response) => {
  try {
    const { knowledgeBaseId } = req.params;
    const {
      title,
      description,
      difficulty,
      knowledgePoints = [],
      objectives = [],
      prerequisites = []
    } = req.body;

    // 验证必填字段
    if (!title || !description || !difficulty || knowledgePoints.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请填写所有必填字段'
      });
    }

    // 检查知识库权限
    const knowledgeBase = await KnowledgeBase.findById(knowledgeBaseId);
    if (!knowledgeBase) {
      return res.status(404).json({
        success: false,
        message: '知识库不存在'
      });
    }

    if (knowledgeBase.author.toString() !== req.user!.id && 
        !['admin', 'super_admin'].includes(req.user!.role)) {
      return res.status(403).json({
        success: false,
        message: '无权在此知识库中创建学习路径'
      });
    }

    // 计算总预计时间
    const kpIds = knowledgePoints.map((kp: any) => kp.pointId);
    const points = await KnowledgePoint.find({ _id: { $in: kpIds } });
    const estimatedDuration = points.reduce((sum, point) => sum + point.estimatedTime, 0);

    // 格式化知识点数据
    const formattedKPs = knowledgePoints.map((kp: any, index: number) => ({
      pointId: kp.pointId,
      order: index + 1,
      isOptional: kp.isOptional || false,
      estimatedTime: points.find(p => p._id.toString() === kp.pointId)?.estimatedTime || 0
    }));

    // 创建学习路径
    const learningPath = new LearningPath({
      knowledgeBase: knowledgeBaseId,
      title,
      description,
      difficulty,
      knowledgePoints: formattedKPs,
      estimatedDuration,
      objectives,
      prerequisites,
      createdBy: req.user!.id
    });

    await learningPath.save();

    res.status(201).json({
      success: true,
      message: '学习路径创建成功',
      data: learningPath
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '学习路径创建失败',
      error: error.message
    });
  }
};

// 获取知识库统计
export const getKnowledgeBaseStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // 获取用户创建的知识库统计
    const userKBStats = await KnowledgeBase.aggregate([
      { $match: { author: userId } },
      {
        $group: {
          _id: null,
          totalKBs: { $sum: 1 },
          publishedKBs: {
            $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
          },
          totalLearners: { $sum: '$stats.learners' },
          totalViews: { $sum: '$stats.totalViews' },
          avgRating: { $avg: '$stats.avgRating' }
        }
      }
    ]);

    // 获取知识点统计
    const kpStats = await KnowledgePoint.aggregate([
      { 
        $lookup: {
          from: 'knowledgebases',
          localField: 'knowledgeBase',
          foreignField: '_id',
          as: 'kb'
        }
      },
      { $match: { 'kb.author': userId } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const kpByType = kpStats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        ...(userKBStats[0] || {}),
        knowledgePointsByType: kpByType
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取统计数据失败',
      error: error.message
    });
  }
}; 

// 上传知识库内容
export const uploadKnowledgeBaseContent = async (req: AuthRequest, res: Response) => {
  try {
    const { knowledgeBaseId } = req.params;
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '未选择文件'
      });
    }

    // 检查知识库是否存在且有权限
    const knowledgeBase = await KnowledgeBase.findById(knowledgeBaseId);
    if (!knowledgeBase) {
      return res.status(404).json({
        success: false,
        message: '知识库不存在'
      });
    }

    if (knowledgeBase.author.toString() !== req.user!.id && 
        !['admin', 'super_admin'].includes(req.user!.role)) {
      return res.status(403).json({
        success: false,
        message: '无权上传内容到此知识库'
      });
    }

    // 处理每个上传的文件
    const uploadedContents = [];
    let totalSize = 0;
    let totalDuration = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const contentTitle = req.body[`contentTitle_${i}`] || file.originalname;
      const contentDescription = req.body[`contentDescription_${i}`] || '';
      const contentTags = req.body[`contentTags_${i}`] ? JSON.parse(req.body[`contentTags_${i}`]) : [];
      const isRequired = req.body[`isRequired_${i}`] === 'true';
      const estimatedDuration = req.body[`estimatedDuration_${i}`] ? parseInt(req.body[`estimatedDuration_${i}`]) : undefined;

      // 处理文件
      const fileMetadata = await fileService.processUploadedFile(
        file, 
        req.user!.id,
        {
          isPublic: knowledgeBase.isPublic,
          tags: contentTags,
          description: contentDescription,
          generateThumbnail: true
        }
      );

      // 创建内容记录
      const contentData = {
        type: fileMetadata.type as any,
        fileId: fileMetadata.id,
        filename: fileMetadata.filename,
        originalName: fileMetadata.originalName,
        title: contentTitle,
        description: contentDescription,
        url: fileMetadata.url,
        thumbnailUrl: fileMetadata.thumbnailUrl,
        size: fileMetadata.size,
        uploadedAt: new Date(),
        order: knowledgeBase.contents.length + i,
        tags: contentTags,
        isRequired,
        estimatedDuration,
        metadata: fileMetadata.metadata
      };

      uploadedContents.push(contentData);
      totalSize += fileMetadata.size;
      
      // 计算总时长
      if (estimatedDuration) {
        totalDuration += estimatedDuration;
      } else if (fileMetadata.metadata?.duration) {
        totalDuration += Math.ceil(fileMetadata.metadata.duration / 60);
      }
    }

    // 更新知识库，添加内容
    await KnowledgeBase.findByIdAndUpdate(knowledgeBaseId, {
      $push: { contents: { $each: uploadedContents } },
      $inc: { 
        'stats.resources': uploadedContents.length,
        'stats.totalContentSize': totalSize,
        'stats.totalContentDuration': totalDuration
      }
    });

    res.json({
      success: true,
      message: `成功上传 ${uploadedContents.length} 个内容文件`,
      data: {
        uploadedContents,
        totalFiles: uploadedContents.length,
        totalSize,
        totalDuration
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '上传知识库内容失败',
      error: error.message
    });
  }
};

// 获取知识库内容列表
export const getKnowledgeBaseContents = async (req: AuthRequest, res: Response) => {
  try {
    const { knowledgeBaseId } = req.params;
    const { type, page = 1, limit = 20 } = req.query;

    const knowledgeBase = await KnowledgeBase.findById(knowledgeBaseId);
    if (!knowledgeBase) {
      return res.status(404).json({
        success: false,
        message: '知识库不存在'
      });
    }

    // 权限检查
    if (knowledgeBase.status !== 'published') {
      if (req.user?.role === 'student' || 
          (knowledgeBase.author.toString() !== req.user!.id && 
           !['admin', 'super_admin'].includes(req.user!.role))) {
        return res.status(403).json({
          success: false,
          message: '无权访问此知识库内容'
        });
      }
    }

    let contents = knowledgeBase.contents;

    // 按类型过滤
    if (type && type !== 'all') {
      contents = contents.filter(content => content.type === type);
    }

    // 排序
    contents.sort((a, b) => a.order - b.order);

    // 分页
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedContents = contents.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        contents: paginatedContents,
        pagination: {
          current: Number(page),
          pageSize: Number(limit),
          total: contents.length,
          totalPages: Math.ceil(contents.length / Number(limit))
        },
        stats: {
          totalContents: contents.length,
          byType: contents.reduce((acc, content) => {
            acc[content.type] = (acc[content.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取知识库内容失败',
      error: error.message
    });
  }
};

// 删除知识库内容
export const deleteKnowledgeBaseContent = async (req: AuthRequest, res: Response) => {
  try {
    const { knowledgeBaseId, contentId } = req.params;

    const knowledgeBase = await KnowledgeBase.findById(knowledgeBaseId);
    if (!knowledgeBase) {
      return res.status(404).json({
        success: false,
        message: '知识库不存在'
      });
    }

    // 权限检查
    if (knowledgeBase.author.toString() !== req.user!.id && 
        !['admin', 'super_admin'].includes(req.user!.role)) {
      return res.status(403).json({
        success: false,
        message: '无权删除此知识库内容'
      });
    }

    // 查找要删除的内容
    const contentIndex = knowledgeBase.contents.findIndex(
      content => content.fileId === contentId
    );

    if (contentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '内容不存在'
      });
    }

    const content = knowledgeBase.contents[contentIndex];

    // 删除文件
    await fileService.deleteFile(content.fileId);

    // 从知识库中移除内容
    knowledgeBase.contents.splice(contentIndex, 1);

    // 更新统计数据
    knowledgeBase.stats.resources = Math.max(0, knowledgeBase.stats.resources - 1);
    knowledgeBase.stats.totalContentSize = Math.max(0, knowledgeBase.stats.totalContentSize - content.size);
    if (content.estimatedDuration) {
      knowledgeBase.stats.totalContentDuration = Math.max(0, knowledgeBase.stats.totalContentDuration - content.estimatedDuration);
    }

    await knowledgeBase.save();

    res.json({
      success: true,
      message: '内容删除成功'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '删除知识库内容失败',
      error: error.message
    });
  }
};

// 更新知识库内容信息
export const updateKnowledgeBaseContent = async (req: AuthRequest, res: Response) => {
  try {
    const { knowledgeBaseId, contentId } = req.params;
    const { title, description, tags, isRequired, estimatedDuration, order } = req.body;

    const knowledgeBase = await KnowledgeBase.findById(knowledgeBaseId);
    if (!knowledgeBase) {
      return res.status(404).json({
        success: false,
        message: '知识库不存在'
      });
    }

    // 权限检查
    if (knowledgeBase.author.toString() !== req.user!.id && 
        !['admin', 'super_admin'].includes(req.user!.role)) {
      return res.status(403).json({
        success: false,
        message: '无权修改此知识库内容'
      });
    }

    // 查找内容
    const contentIndex = knowledgeBase.contents.findIndex(
      content => content.fileId === contentId
    );

    if (contentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '内容不存在'
      });
    }

    // 更新内容信息
    const content = knowledgeBase.contents[contentIndex];
    if (title !== undefined) content.title = title;
    if (description !== undefined) content.description = description;
    if (tags !== undefined) content.tags = tags;
    if (isRequired !== undefined) content.isRequired = isRequired;
    if (estimatedDuration !== undefined) content.estimatedDuration = estimatedDuration;
    if (order !== undefined) content.order = order;

    await knowledgeBase.save();

    res.json({
      success: true,
      message: '内容更新成功',
      data: content
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '更新知识库内容失败',
      error: error.message
    });
  }
}; 

// 知识库AI内容生成
export const generateAIContent = async (req: AuthRequest, res: Response) => {
  try {
    const { knowledgeBaseId } = req.params;
    const { topic, requirements, contentType, difficulty, category } = req.body;

    // 检查知识库是否存在和权限
    const knowledgeBase = await KnowledgeBase.findById(knowledgeBaseId);
    if (!knowledgeBase) {
      return res.status(404).json({
        success: false,
        message: '知识库不存在'
      });
    }

    // 权限检查
    if (knowledgeBase.author?.toString() !== req.user?.id && 
        !['admin', 'super_admin'].includes(req.user?.role || '')) {
      return res.status(403).json({
        success: false,
        message: '没有权限修改此知识库'
      });
    }

    // 模拟AI生成内容（实际项目中这里会调用AI服务）
    const aiContent = {
      title: `${topic} - AI生成内容`,
      content: `这是根据主题"${topic}"生成的${contentType === 'text' ? '知识文档' : contentType === 'quiz' ? '练习题目' : '教学指南'}内容。\n\n基于您的要求：${requirements || '无特殊要求'}\n\n[AI生成的详细内容会在这里显示...]`,
      type: contentType,
      difficulty,
      category,
      generatedAt: new Date()
    };

    // 添加生成的内容到知识库
    const contentMetadata = {
      type: 'document' as const,
      fileId: `ai-${Date.now()}`,
      filename: `ai-generated-${contentType}.md`,
      originalName: `${topic}-${contentType}.md`,
      title: aiContent.title,
      description: `AI生成的${contentType === 'text' ? '知识文档' : contentType === 'quiz' ? '练习题目' : '教学指南'}`,
      url: `/ai-content/${knowledgeBaseId}/${aiContent.generatedAt.getTime()}`,
      size: aiContent.content.length,
      uploadedAt: aiContent.generatedAt,
      order: knowledgeBase.contents.length,
      tags: ['AI生成', contentType, category],
      isRequired: false,
      estimatedDuration: Math.ceil(aiContent.content.length / 200), // 假设每分钟阅读200字
      metadata: {
        pageCount: 1,
        format: 'text/markdown'
      }
    };

    await KnowledgeBase.findByIdAndUpdate(knowledgeBaseId, {
      $push: { contents: contentMetadata },
      $inc: {
        'stats.resources': 1,
        'stats.totalContentSize': aiContent.content.length,
        'stats.totalContentDuration': contentMetadata.estimatedDuration
      },
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'AI内容生成成功',
      data: {
        content: contentMetadata,
        aiContent
      }
    });

  } catch (error) {
    console.error('AI内容生成失败:', error);
    res.status(500).json({
      success: false,
      message: 'AI内容生成失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
};

// 网址内容导入
export const importFromUrl = async (req: AuthRequest, res: Response) => {
  try {
    const { knowledgeBaseId } = req.params;
    const { url, extractOptions, fetchedContent } = req.body;

    // 检查知识库是否存在和权限
    const knowledgeBase = await KnowledgeBase.findById(knowledgeBaseId);
    if (!knowledgeBase) {
      return res.status(404).json({
        success: false,
        message: '知识库不存在'
      });
    }

    // 权限检查
    if (knowledgeBase.author?.toString() !== req.user?.id && 
        !['admin', 'super_admin'].includes(req.user?.role || '')) {
      return res.status(403).json({
        success: false,
        message: '没有权限修改此知识库'
      });
    }

    // 验证URL格式
    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        message: '无效的URL格式'
      });
    }

    // 处理抓取的内容
    const processedContent = {
      title: fetchedContent.title || 'Imported Web Content',
      content: fetchedContent.content || '',
      url: url,
      images: fetchedContent.images || [],
      extractedAt: new Date()
    };

    // 创建内容元数据
    const contentMetadata = {
      type: 'document' as const,
      fileId: `url-${Date.now()}`,
      filename: `imported-${Date.now()}.html`,
      originalName: `${processedContent.title}.html`,
      title: processedContent.title,
      description: `从 ${url} 导入的网页内容`,
      url: `/url-content/${knowledgeBaseId}/${processedContent.extractedAt.getTime()}`,
      size: processedContent.content.length,
      uploadedAt: processedContent.extractedAt,
      order: knowledgeBase.contents.length,
      tags: ['网页导入', 'URL', new URL(url).hostname],
      isRequired: false,
      estimatedDuration: Math.ceil(processedContent.content.length / 300), // 假设每分钟阅读300字
      metadata: {
        format: 'text/html',
        sourceUrl: url,
        extractOptions: extractOptions
      }
    };

    await KnowledgeBase.findByIdAndUpdate(knowledgeBaseId, {
      $push: { contents: contentMetadata },
      $inc: {
        'stats.resources': 1,
        'stats.totalContentSize': processedContent.content.length,
        'stats.totalContentDuration': contentMetadata.estimatedDuration
      },
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: '网页内容导入成功',
      data: {
        content: contentMetadata,
        processedContent
      }
    });

  } catch (error) {
    console.error('网页内容导入失败:', error);
    res.status(500).json({
      success: false,
      message: '网页内容导入失败',
      error: error instanceof Error ? error.message : '未知错误'
    });
  }
}; 