import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Favorite from '../models/Favorite';
import Question from '../models/Question';

// 添加收藏
export const addFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { questionId } = req.body;

    // 检查题目是否存在
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: '题目不存在'
      });
    }

    // 检查是否已经收藏
    const existingFavorite = await Favorite.findOne({
      user: userId,
      question: questionId
    });

    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: '已经收藏过该题目'
      });
    }

    // 创建收藏
    const favorite = new Favorite({
      user: userId,
      question: questionId
    });

    await favorite.save();

    res.status(201).json({
      success: true,
      message: '收藏成功',
      data: favorite
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '添加收藏失败',
      error: error.message
    });
  }
};

// 取消收藏
export const removeFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { questionId } = req.params;

    const favorite = await Favorite.findOneAndDelete({
      user: userId,
      question: questionId
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: '收藏记录不存在'
      });
    }

    res.json({
      success: true,
      message: '取消收藏成功'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '取消收藏失败',
      error: error.message
    });
  }
};

// 获取用户收藏列表
export const getFavorites = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 20, category, difficulty } = req.query;

    // 构建查询条件
    const matchCondition: any = { user: userId };

    // 构建聚合管道
    const pipeline: any[] = [
      { $match: matchCondition },
      {
        $lookup: {
          from: 'questions',
          localField: 'question',
          foreignField: '_id',
          as: 'questionDetails'
        }
      },
      { $unwind: '$questionDetails' },
      {
        $match: {
          'questionDetails.status': 'published'
        }
      }
    ];

    // 添加分类过滤
    if (category) {
      pipeline.push({
        $match: {
          'questionDetails.category.sport': category
        }
      });
    }

    // 添加难度过滤
    if (difficulty) {
      pipeline.push({
        $match: {
          'questionDetails.difficulty': difficulty
        }
      });
    }

    // 排序
    pipeline.push({
      $sort: { createdAt: -1 }
    });

    // 分页
    const skip = (Number(page) - 1) * Number(limit);
    pipeline.push(
      { $skip: skip },
      { $limit: Number(limit) }
    );

    // 投影
    pipeline.push({
      $project: {
        _id: 1,
        createdAt: 1,
        question: {
          _id: '$questionDetails._id',
          title: '$questionDetails.title',
          content: '$questionDetails.content',
          type: '$questionDetails.type',
          category: '$questionDetails.category',
          difficulty: '$questionDetails.difficulty',
          tags: '$questionDetails.tags',
          stats: '$questionDetails.stats'
        }
      }
    });

    const favorites = await Favorite.aggregate(pipeline);

    // 获取总数
    const totalPipeline = [
      { $match: matchCondition },
      {
        $lookup: {
          from: 'questions',
          localField: 'question',
          foreignField: '_id',
          as: 'questionDetails'
        }
      },
      { $unwind: '$questionDetails' },
      {
        $match: {
          'questionDetails.status': 'published'
        }
      }
    ];

    if (category) {
      totalPipeline.push({
        $match: {
          'questionDetails.category.sport': category
        }
      });
    }

    if (difficulty) {
      totalPipeline.push({
        $match: {
          'questionDetails.difficulty': difficulty
        }
      });
    }

    totalPipeline.push({ $count: 'total' } as any);

    const totalResult = await Favorite.aggregate(totalPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    res.json({
      success: true,
      data: {
        favorites,
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
      message: '获取收藏列表失败',
      error: error.message
    });
  }
};

// 检查题目是否已收藏
export const checkFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { questionId } = req.params;

    const favorite = await Favorite.findOne({
      user: userId,
      question: questionId
    });

    res.json({
      success: true,
      data: {
        isFavorited: !!favorite
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '检查收藏状态失败',
      error: error.message
    });
  }
};

// 获取收藏统计
export const getFavoriteStats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const stats = await Favorite.aggregate([
      { $match: { user: userId } },
      {
        $lookup: {
          from: 'questions',
          localField: 'question',
          foreignField: '_id',
          as: 'questionDetails'
        }
      },
      { $unwind: '$questionDetails' },
      {
        $match: {
          'questionDetails.status': 'published'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byCategory: {
            $push: '$questionDetails.category.sport'
          },
          byDifficulty: {
            $push: '$questionDetails.difficulty'
          }
        }
      }
    ]);

    const result = stats.length > 0 ? stats[0] : { total: 0, byCategory: [], byDifficulty: [] };

    // 统计分类分布
    const categoryStats = result.byCategory.reduce((acc: any, category: string) => {
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    // 统计难度分布
    const difficultyStats = result.byDifficulty.reduce((acc: any, difficulty: string) => {
      acc[difficulty] = (acc[difficulty] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        total: result.total,
        categoryStats,
        difficultyStats
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取收藏统计失败',
      error: error.message
    });
  }
}; 