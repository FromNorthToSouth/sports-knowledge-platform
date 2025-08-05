import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { LearningResource, ResourceInteraction, LearningRecord, ResourceCategory } from '../models/LearningResource';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// 文件上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/resources');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = {
    video: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],
    audio: ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  };

  const allAllowedTypes = Object.values(allowedTypes).flat();
  
  if (allAllowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件类型'));
  }
};

export const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB限制
  }
});

// 获取资源列表
export const getResources = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      category,
      level,
      status = 'published',
      author,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // 构建查询条件
    const query: any = {};
    
    if (type && type !== 'all') query.type = type;
    if (category && category !== 'all') query.category = category;
    if (level && level !== 'all') query.level = level;
    if (author) query.author = author;
    
    // 权限过滤
    if (req.user?.role === 'student' || req.user?.role === 'teacher') {
      // 学生和教师只能看到已发布的资源
      query.status = 'published';
      query.$or = [
        { isPublic: true },
        { allowedInstitutions: req.user.institution }
      ];
    } else if (req.user?.role === 'content_manager') {
      // 内容管理员可以看到待审核和已发布的资源
      if (status && status !== 'all') {
        query.status = status;
      } else {
        query.status = { $in: ['pending', 'published'] };
      }
    } else if (req.user?.role === 'institution_admin') {
      // 机构管理员可以看到本机构的所有资源
             query.$or = [
         { author: { $in: await getUsersByInstitution(req.user.institution?.toString() || '') } },
         { allowedInstitutions: req.user.institution }
       ];
      if (status && status !== 'all') query.status = status;
    } else {
      // 超级管理员和管理员可以看到所有资源
      if (status && status !== 'all') query.status = status;
    }

    // 文本搜索
    if (search) {
      query.$text = { $search: search };
    }

    // 执行查询
    const sortObj: any = {};
    sortObj[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const resources = await LearningResource.find(query)
      .populate('author', 'username email avatar')
      .populate('reviewedBy', 'username email')
      .sort(sortObj)
      .limit(Number(limit) * Number(page))
      .skip((Number(page) - 1) * Number(limit));

    const total = await LearningResource.countDocuments(query);

    res.json({
      success: true,
      data: {
        resources,
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
      message: '获取资源列表失败',
      error: error.message
    });
  }
};

// 获取资源详情
export const getResourceById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const resource = await LearningResource.findById(id)
      .populate('author', 'username email avatar')
      .populate('reviewedBy', 'username email');

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: '资源不存在'
      });
    }

    // 权限检查
    if (resource.status !== 'published') {
      if (req.user?.role === 'student' || req.user?.role === 'teacher') {
        return res.status(403).json({
          success: false,
          message: '无权访问此资源'
        });
      }
    }

    // 记录浏览
    if (req.user && resource.status === 'published') {
      await recordInteraction(req.user.id, id, 'view');
      await LearningResource.findByIdAndUpdate(id, {
        $inc: { 'stats.views': 1 }
      });
    }

    res.json({
      success: true,
      data: resource
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取资源详情失败',
      error: error.message
    });
  }
};

// 上传资源
export const uploadResource = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '未上传文件'
      });
    }

    const {
      title,
      description,
      type,
      category,
      level,
      duration,
      tags,
      isPublic = true,
      allowedInstitutions
    } = req.body;

    // 验证必填字段
    if (!title || !description || !type || !category || !level) {
      return res.status(400).json({
        success: false,
        message: '请填写所有必填字段'
      });
    }

    // 获取文件信息
    const fileSize = req.file.size / (1024 * 1024); // 转换为MB
    const fileUrl = `/uploads/resources/${req.file.filename}`;

    // 解析标签
    const parsedTags = tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [];

    // 创建资源
    const resource = new LearningResource({
      title,
      description,
      type,
      category,
      level,
      duration: duration ? Number(duration) : undefined,
      fileSize,
      fileUrl,
      originalFileName: req.file.originalname,
      mimeType: req.file.mimetype,
      tags: parsedTags,
      author: req.user!.id,
      status: 'pending', // 默认为待审核
      isPublic: isPublic === 'true',
      allowedInstitutions: allowedInstitutions ? JSON.parse(allowedInstitutions) : []
    });

    await resource.save();

    res.status(201).json({
      success: true,
      message: '资源上传成功，等待审核',
      data: resource
    });
  } catch (error: any) {
    // 如果保存失败，删除已上传的文件
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
    
    res.status(500).json({
      success: false,
      message: '资源上传失败',
      error: error.message
    });
  }
};

// 审核资源
export const reviewResource = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { action, comment } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: '无效的审核操作'
      });
    }

    const resource = await LearningResource.findById(id);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: '资源不存在'
      });
    }

    if (resource.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: '该资源不在待审核状态'
      });
    }

    // 更新资源状态
    const updateData: any = {
      status: action === 'approve' ? 'published' : 'rejected',
      reviewedBy: req.user!.id,
      reviewedAt: new Date(),
      reviewComment: comment
    };

    if (action === 'approve') {
      updateData.publishedAt = new Date();
    }

    await LearningResource.findByIdAndUpdate(id, updateData);

    res.json({
      success: true,
      message: `资源${action === 'approve' ? '审核通过' : '审核拒绝'}`
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '审核操作失败',
      error: error.message
    });
  }
};

// 更新资源
export const updateResource = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const resource = await LearningResource.findById(id);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: '资源不存在'
      });
    }

    // 权限检查
    if (resource.author.toString() !== req.user!.id && 
        !['admin', 'super_admin'].includes(req.user!.role)) {
      return res.status(403).json({
        success: false,
        message: '无权修改此资源'
      });
    }

    // 如果资源已发布，修改后需要重新审核
    if (resource.status === 'published' && 
        (updates.title || updates.description || updates.tags)) {
      updates.status = 'pending';
      updates.reviewedBy = undefined;
      updates.reviewedAt = undefined;
      updates.reviewComment = undefined;
    }

    const updatedResource = await LearningResource.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    ).populate('author', 'username email avatar');

    res.json({
      success: true,
      message: '资源更新成功',
      data: updatedResource
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '资源更新失败',
      error: error.message
    });
  }
};

// 删除资源
export const deleteResource = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const resource = await LearningResource.findById(id);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: '资源不存在'
      });
    }

    // 权限检查
    if (resource.author.toString() !== req.user!.id && 
        !['admin', 'super_admin'].includes(req.user!.role)) {
      return res.status(403).json({
        success: false,
        message: '无权删除此资源'
      });
    }

    // 删除文件
    const filePath = path.join(__dirname, '../../', resource.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 删除缩略图
    if (resource.thumbnailUrl) {
      const thumbnailPath = path.join(__dirname, '../../', resource.thumbnailUrl);
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath);
      }
    }

    // 删除相关记录
    await ResourceInteraction.deleteMany({ resource: id });
    await LearningRecord.deleteMany({ resource: id });
    await LearningResource.findByIdAndDelete(id);

    res.json({
      success: true,
      message: '资源删除成功'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '资源删除失败',
      error: error.message
    });
  }
};

// 资源互动（点赞、收藏、评分）
export const interactWithResource = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { type, value } = req.body;

    if (!['like', 'favorite', 'rating'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: '无效的互动类型'
      });
    }

    if (type === 'rating' && (!value || value < 1 || value > 5)) {
      return res.status(400).json({
        success: false,
        message: '评分必须在1-5之间'
      });
    }

    const resource = await LearningResource.findById(id);
    if (!resource || resource.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: '资源不存在或未发布'
      });
    }

    await recordInteraction(req.user!.id, id, type, value);

    // 更新资源统计
    await updateResourceStats(id);

    res.json({
      success: true,
      message: '操作成功'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '操作失败',
      error: error.message
    });
  }
};

// 获取资源统计
export const getResourceStats = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await LearningResource.aggregate([
      {
        $group: {
          _id: null,
          totalResources: { $sum: 1 },
          publishedResources: {
            $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
          },
          pendingReview: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          totalViews: { $sum: '$stats.views' },
          totalDownloads: { $sum: '$stats.downloads' },
          avgRating: { $avg: '$stats.rating' }
        }
      }
    ]);

    const typeStats = await LearningResource.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    const resourcesByType = typeStats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        ...(stats[0] || {}),
        resourcesByType
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

// 辅助函数：记录用户互动
const recordInteraction = async (userId: string, resourceId: string, type: string, value?: number) => {
  try {
    await ResourceInteraction.findOneAndUpdate(
      { user: userId, resource: resourceId, type },
      { user: userId, resource: resourceId, type, value },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error('记录互动失败:', error);
  }
};

// 辅助函数：更新资源统计
const updateResourceStats = async (resourceId: string) => {
  try {
    const [likesCount, favoritesCount, ratingsCount, avgRating] = await Promise.all([
      ResourceInteraction.countDocuments({ resource: resourceId, type: 'like' }),
      ResourceInteraction.countDocuments({ resource: resourceId, type: 'favorite' }),
      ResourceInteraction.countDocuments({ resource: resourceId, type: 'rating' }),
      ResourceInteraction.aggregate([
        { $match: { resource: resourceId, type: 'rating' } },
        { $group: { _id: null, avgRating: { $avg: '$value' } } }
      ])
    ]);

    await LearningResource.findByIdAndUpdate(resourceId, {
      'stats.likes': likesCount,
      'stats.favorites': favoritesCount,
      'stats.rating': avgRating[0]?.avgRating || 0,
      'stats.ratingCount': ratingsCount
    });
  } catch (error) {
    console.error('更新统计失败:', error);
  }
};

// 辅助函数：获取机构用户列表
const getUsersByInstitution = async (institutionId: string) => {
  // 这里需要根据实际的用户模型来查询
  // 返回机构下所有用户的ID列表
  return [];
}; 