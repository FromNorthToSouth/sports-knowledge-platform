import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { uploadMiddleware } from '../middleware/upload';
import * as knowledgeBaseController from '../controllers/knowledgeBaseController';

const router = express.Router();

// 所有路由都需要认证
router.use(authenticate);

// 知识库基础路由
router.get('/', knowledgeBaseController.getKnowledgeBases);
router.get('/:id', knowledgeBaseController.getKnowledgeBaseById);
router.post('/', authorize('teacher', 'admin', 'super_admin'), knowledgeBaseController.createKnowledgeBase);
router.put('/:id', authorize('teacher', 'admin', 'super_admin'), knowledgeBaseController.updateKnowledgeBase);
router.delete('/:id', authorize('teacher', 'admin', 'super_admin'), knowledgeBaseController.deleteKnowledgeBase);

// 知识点相关路由
router.get('/:knowledgeBaseId/knowledge-points', knowledgeBaseController.getKnowledgePoints);
router.post('/:knowledgeBaseId/knowledge-points', authorize('teacher', 'admin', 'super_admin'), knowledgeBaseController.createKnowledgePoint);

// 学习路径相关路由
router.get('/:knowledgeBaseId/learning-paths', knowledgeBaseController.getLearningPaths);
router.post('/:knowledgeBaseId/learning-paths', authorize('teacher', 'admin', 'super_admin'), knowledgeBaseController.createLearningPath);

// 知识库内容管理路由
router.post('/:knowledgeBaseId/contents/upload',
  authorize('teacher', 'admin', 'super_admin'),
  uploadMiddleware.knowledgeBase,
  knowledgeBaseController.uploadKnowledgeBaseContent
);

router.get('/:knowledgeBaseId/contents',
  knowledgeBaseController.getKnowledgeBaseContents
);

router.put('/:knowledgeBaseId/contents/:contentId',
  authorize('teacher', 'admin', 'super_admin'),
  knowledgeBaseController.updateKnowledgeBaseContent
);

router.delete('/:knowledgeBaseId/contents/:contentId',
  authorize('teacher', 'admin', 'super_admin'),
  knowledgeBaseController.deleteKnowledgeBaseContent
);

// AI内容生成路由
router.post('/:knowledgeBaseId/ai-generate',
  authorize('teacher', 'admin', 'super_admin'),
  knowledgeBaseController.generateAIContent
);

// 网址内容导入路由
router.post('/:knowledgeBaseId/url-import',
  authorize('teacher', 'admin', 'super_admin'),
  knowledgeBaseController.importFromUrl
);

// 统计数据路由
router.get('/stats/overview', authorize('teacher', 'admin', 'super_admin'), knowledgeBaseController.getKnowledgeBaseStats);

export default router; 