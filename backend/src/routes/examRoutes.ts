import express from 'express';
import { 
  getExams, 
  createExam, 
  getExam, 
  startExam, 
  submitAnswer, 
  finishExam, 
  getExamStats,
  publishExam,
  getPublishedExams,
  getExamParticipationStats
} from '../controllers/examController';
import { authenticate, authorize } from '../middleware/auth';

const router = express.Router();

// 考试相关路由
router.get('/', authenticate, getExams);                    // 获取考试列表
router.post('/', authenticate, createExam);                // 创建新考试
router.get('/stats', authenticate, getExamStats);          // 获取考试统计
router.get('/:id', authenticate, getExam);                 // 获取单个考试
router.post('/:id/start', authenticate, startExam);        // 开始考试
router.post('/:id/answer', authenticate, submitAnswer);    // 提交答案
router.post('/:id/submit', authenticate, finishExam);      // 提交考试

// 教师端考试发布路由
router.post('/publish', authenticate, authorize('teacher', 'admin', 'super_admin'), publishExam);                    // 发布考试
router.get('/published/list', authenticate, authorize('teacher', 'admin', 'super_admin'), getPublishedExams);       // 获取已发布考试列表
router.get('/published/:examId/stats', authenticate, authorize('teacher', 'admin', 'super_admin'), getExamParticipationStats); // 获取考试参与统计

export default router; 