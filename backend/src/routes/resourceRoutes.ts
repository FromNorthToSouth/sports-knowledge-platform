import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getResources,
  getResourceById,
  uploadResource,
  reviewResource,
  updateResource,
  deleteResource,
  interactWithResource,
  getResourceStats,
  upload
} from '../controllers/resourceController';

const router = express.Router();

// 公共路由（需要认证）
router.use(authenticate);

// 获取资源列表
router.get('/', getResources);

// 获取资源详情
router.get('/:id', getResourceById);

// 获取资源统计（仅管理员和教师）
router.get('/stats/overview', 
  authorize('teacher', 'admin', 'super_admin', 'institution_admin', 'content_manager'),
  getResourceStats
);

// 资源互动（点赞、收藏、评分）
router.post('/:id/interact', interactWithResource);

// 上传资源（教师、管理员）
router.post('/upload', 
  authorize('teacher', 'admin', 'super_admin', 'institution_admin'),
  upload.single('file'),
  uploadResource
);

// 审核资源（内容管理员、管理员）
router.post('/:id/review', 
  authorize('content_manager', 'admin', 'super_admin'),
  reviewResource
);

// 更新资源
router.put('/:id', 
  authorize('teacher', 'admin', 'super_admin', 'institution_admin'),
  updateResource
);

// 删除资源
router.delete('/:id', 
  authorize('teacher', 'admin', 'super_admin', 'institution_admin'),
  deleteResource
);

export default router; 