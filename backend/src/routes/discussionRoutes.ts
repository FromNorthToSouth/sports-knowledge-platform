import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getDiscussions,
  getDiscussion,
  createDiscussion,
  addReply,
  likeDiscussion,
  likeReply,
  markResolved,
  getDiscussionStats
} from '../controllers/discussionController';

const router = express.Router();

// 讨论相关路由
router.get('/', getDiscussions);                                    // 获取讨论列表
router.get('/stats', authenticate, getDiscussionStats);             // 获取讨论统计
router.get('/:id', getDiscussion);                                  // 获取讨论详情
router.post('/', authenticate, createDiscussion);                   // 创建讨论
router.post('/:id/replies', authenticate, addReply);                // 添加回复
router.post('/:id/like', authenticate, likeDiscussion);             // 点赞讨论
router.post('/:discussionId/replies/:replyId/like', authenticate, likeReply); // 点赞回复
router.patch('/:id/resolved', authenticate, markResolved);          // 标记已解决

export default router; 