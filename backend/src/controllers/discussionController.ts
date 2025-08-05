import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Discussion from '../models/Discussion';
import User from '../models/User';

// 获取讨论列表
export const getDiscussions = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      type, 
      sort = 'latest',
      search 
    } = req.query;

    // 构建查询条件
    const matchCondition: any = { status: 'published' };
    
    if (category) {
      matchCondition['category.sport'] = category;
    }
    
    if (type) {
      matchCondition['category.type'] = type;
    }
    
    if (search) {
      matchCondition.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    // 排序条件
    let sortCondition: any;
    switch (sort) {
      case 'hot':
        sortCondition = { likes: -1, views: -1 };
        break;
      case 'views':
        sortCondition = { views: -1 };
        break;
      case 'replies':
        sortCondition = { replyCount: -1 };
        break;
      default: // latest
        sortCondition = { isPinned: -1, createdAt: -1 };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const discussions = await Discussion.find(matchCondition)
      .populate('author', 'username avatar role')
      .populate('replies.author', 'username avatar role')
      .sort(sortCondition)
      .skip(skip)
      .limit(Number(limit));

    const total = await Discussion.countDocuments(matchCondition);

    res.json({
      success: true,
      data: {
        discussions,
        pagination: {
          current: Number(page),
          pageSize: Number(limit),
          total,
          totalCount: total
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取讨论列表失败',
      error: error.message
    });
  }
};

// 获取讨论详情
export const getDiscussion = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const discussion = await Discussion.findById(id)
      .populate('author', 'username avatar role institution')
      .populate('replies.author', 'username avatar role institution');

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: '讨论不存在'
      });
    }

    // 增加浏览量
    discussion.views += 1;
    await discussion.save();

    res.json({
      success: true,
      data: { discussion }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取讨论详情失败',
      error: error.message
    });
  }
};

// 创建讨论
export const createDiscussion = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { title, content, category, tags, isExpertQuestion } = req.body;

    const discussion = new Discussion({
      title,
      content,
      author: userId,
      category,
      tags: tags || [],
      isExpertQuestion: isExpertQuestion || false
    });

    await discussion.save();
    await discussion.populate('author', 'username avatar role');

    res.status(201).json({
      success: true,
      message: '发布讨论成功',
      data: { discussion }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '创建讨论失败',
      error: error.message
    });
  }
};

// 添加回复
export const addReply = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { id } = req.params;
    const { content } = req.body;

    const discussion = await Discussion.findById(id);
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: '讨论不存在'
      });
    }

    if (discussion.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: '该讨论已关闭，无法回复'
      });
    }

    // 判断是否为专家回复
    const isExpertReply = ['teacher', 'admin', 'super_admin', 'content_manager'].includes(userRole || '');

    const reply = {
      author: userId,
      content,
      isExpertReply,
      likes: 0,
      likedBy: []
    };

    discussion.replies.push(reply as any);
    
    // 如果是专家回复且这是专家问答
    if (isExpertReply && discussion.isExpertQuestion) {
      discussion.expertReplied = true;
      discussion.expertReply = discussion.replies[discussion.replies.length - 1]._id;
    }

    await discussion.save();
    await discussion.populate('replies.author', 'username avatar role');

    res.status(201).json({
      success: true,
      message: '回复成功',
      data: { 
        reply: discussion.replies[discussion.replies.length - 1]
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '添加回复失败',
      error: error.message
    });
  }
};

// 点赞讨论
export const likeDiscussion = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const discussion = await Discussion.findById(id);
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: '讨论不存在'
      });
    }

    const hasLiked = discussion.likedBy.includes(userId as any);
    
    if (hasLiked) {
      // 取消点赞
      discussion.likedBy = discussion.likedBy.filter(
        (id: any) => id.toString() !== userId?.toString()
      );
      discussion.likes -= 1;
    } else {
      // 点赞
      discussion.likedBy.push(userId as any);
      discussion.likes += 1;
    }

    await discussion.save();

    res.json({
      success: true,
      message: hasLiked ? '取消点赞成功' : '点赞成功',
      data: {
        likes: discussion.likes,
        hasLiked: !hasLiked
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '点赞操作失败',
      error: error.message
    });
  }
};

// 点赞回复
export const likeReply = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { discussionId, replyId } = req.params;

    const discussion = await Discussion.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: '讨论不存在'
      });
    }

    const reply = discussion.replies.find((r: any) => r._id.toString() === replyId);
    if (!reply) {
      return res.status(404).json({
        success: false,
        message: '回复不存在'
      });
    }

    const hasLiked = reply.likedBy.includes(userId as any);
    
    if (hasLiked) {
      // 取消点赞
      reply.likedBy = reply.likedBy.filter(
        (id: any) => id.toString() !== userId?.toString()
      );
      reply.likes -= 1;
    } else {
      // 点赞
      reply.likedBy.push(userId as any);
      reply.likes += 1;
    }

    await discussion.save();

    res.json({
      success: true,
      message: hasLiked ? '取消点赞成功' : '点赞成功',
      data: {
        likes: reply.likes,
        hasLiked: !hasLiked
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '点赞回复失败',
      error: error.message
    });
  }
};

// 标记为已解决
export const markResolved = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const discussion = await Discussion.findById(id);
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: '讨论不存在'
      });
    }

    // 只有作者或管理员可以标记为已解决
    if (discussion.author.toString() !== userId?.toString() && 
        !['admin', 'super_admin', 'content_manager'].includes(req.user?.role || '')) {
      return res.status(403).json({
        success: false,
        message: '无权限执行此操作'
      });
    }

    discussion.isResolved = !discussion.isResolved;
    await discussion.save();

    res.json({
      success: true,
      message: discussion.isResolved ? '标记为已解决' : '取消已解决标记',
      data: {
        isResolved: discussion.isResolved
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '操作失败',
      error: error.message
    });
  }
};

// 获取讨论统计
export const getDiscussionStats = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await Discussion.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byCategory: {
            $push: '$category.sport'
          },
          byType: {
            $push: '$category.type'
          },
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: '$likes' },
          totalReplies: { $sum: '$replyCount' }
        }
      }
    ]);

    const result = stats.length > 0 ? stats[0] : {
      total: 0,
      byCategory: [],
      byType: [],
      totalViews: 0,
      totalLikes: 0,
      totalReplies: 0
    };

    // 统计分类分布
    const categoryStats = result.byCategory.reduce((acc: any, category: string) => {
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    // 统计类型分布
    const typeStats = result.byType.reduce((acc: any, type: string) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        total: result.total,
        totalViews: result.totalViews,
        totalLikes: result.totalLikes,
        totalReplies: result.totalReplies,
        categoryStats,
        typeStats
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