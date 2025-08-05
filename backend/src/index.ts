import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import connectDatabase from './config/database';

// 导入路由
import authRoutes from './routes/authRoutes';
import questionRoutes from './routes/questionRoutes';
import examRoutes from './routes/examRoutes';
import userRoutes from './routes/userRoutes';
import statsRoutes from './routes/statsRoutes';
import institutionRoutes from './routes/institutionRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import discussionRoutes from './routes/discussionRoutes';
import resourceRoutes from './routes/resourceRoutes';
import knowledgeBaseRoutes from './routes/knowledgeBaseRoutes';
import achievementRoutes from './routes/achievementRoutes';
import fileRoutes from './routes/fileRoutes';
import classRoutes from './routes/classRoutes';
import notificationRoutes from './routes/notificationRoutes';
import progressRoutes from './routes/progressRoutes';
import recommendationRoutes from './routes/recommendationRoutes';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 连接数据库并初始化成就系统
connectDatabase().then(async () => {
  // 初始化默认成就
  try {
    const AchievementService = await import('./services/achievementService');
    await AchievementService.default.initializeDefaultAchievements();
    console.log('成就系统初始化完成');
  } catch (error) {
    console.error('成就系统初始化失败:', error);
  }
});

// 安全中间件
app.use(helmet());

// 信任代理配置 - 修复express-rate-limit的X-Forwarded-For错误
// 在开发环境中信任所有代理，生产环境中可以配置具体的代理数量或IP
if (process.env.NODE_ENV === 'production') {
  // 生产环境：信任第一层代理（如nginx、cloudflare等）
  app.set('trust proxy', 1);
} else {
  // 开发环境：信任所有代理（适用于本地开发和测试）
  app.set('trust proxy', true);
}

// CORS配置
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.com'] // 生产环境域名
    : 'http://localhost:3000', // 开发环境
  credentials: true
}));

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每15分钟最多100个请求
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试'
  },
  // 标准化配置，确保在各种代理环境下正常工作
  standardHeaders: true, // 返回标准的rate limit头部
  legacyHeaders: false, // 禁用X-RateLimit-*头部
  // 跳过成功响应的某些限制（可选）
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});
app.use('/api/', limiter);

// 解析JSON和URL编码数据
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务
app.use('/uploads', express.static('uploads'));

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/knowledge-bases', knowledgeBaseRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/recommendations', recommendationRoutes);

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的资源不存在'
  });
});

// 全局错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('服务器错误:', err);

  // MongoDB重复键错误
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} 已存在`
    });
  }

  // Mongoose验证错误
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((error: any) => error.message);
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors
    });
  }

  // JWT错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: '无效的认证令牌'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: '认证令牌已过期'
    });
  }

  // 默认服务器错误
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? '服务器内部错误' 
      : err.message || '服务器内部错误'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 服务器启动成功，运行在端口 ${PORT}`);
  console.log(`📊 环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 健康检查: http://localhost:${PORT}/api/health`);
}); 