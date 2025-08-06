const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = 5001;

// 临时用户数据存储（内存中）
let tempUsers = [
  {
    _id: 'admin001',
    username: 'admin',
    email: 'admin@example.com',
    password: '21232f297a57a5a743894a0e4a801fc3', // admin的MD5
    name: '系统管理员',
    role: 'admin',
    institution: '507f1f77bcf86cd799439011',
    createdAt: new Date(),
    isActive: true
  },
  {
    _id: 'teacher001',
    username: 'teacher1',
    email: 'teacher@example.com',
    password: 'a426dcf72ba25d046591f81a5495eab7', // teacher123的MD5
    name: '张老师',
    role: 'teacher',
    institution: '507f1f77bcf86cd799439011',
    createdAt: new Date(),
    isActive: true
  },
  {
    _id: 'student001',
    username: 'student1',
    email: 'student@example.com',
    password: 'ad6a280417a0f533d8b670c61667e1a0', // student123的MD5
    name: '李同学',
    role: 'student',
    institution: '507f1f77bcf86cd799439011',
    createdAt: new Date(),
    isActive: true
  }
];

// 活跃token存储
let activeTokens = new Set();

// 简单的MD5哈希函数
function md5Hash(text) {
  return crypto.createHash('md5').update(text).digest('hex');
}

// 生成简单的JWT token (模拟)
function generateToken(user) {
  const payload = {
    userId: user._id,
    username: user.username,
    role: user.role,
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24小时过期
  };
  const token = Buffer.from(JSON.stringify(payload)).toString('base64');
  activeTokens.add(token);
  return token;
}

// 验证token
function verifyToken(token) {
  if (!activeTokens.has(token)) {
    return null;
  }
  
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    if (payload.exp < Date.now()) {
      activeTokens.delete(token);
      return null;
    }
    return payload;
  } catch (error) {
    return null;
  }
}

// 认证中间件
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '未提供认证令牌'
    });
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({
      success: false,
      message: '无效或过期的认证令牌'
    });
  }

  req.user = payload;
  next();
}

// 中间件
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// 模拟学校数据
const mockInstitutions = [
  {
    _id: '507f1f77bcf86cd799439011',
    name: '北京体育大学',
    description: '中国体育最高学府，培养体育人才的摇篮',
    type: 'university'
  },
  {
    _id: '507f1f77bcf86cd799439012',
    name: '上海体育学院',
    description: '新中国成立最早的体育高等学府之一',
    type: 'university'
  },
  {
    _id: '507f1f77bcf86cd799439013', 
    name: '成都体育学院',
    description: '西南地区唯一的高等体育学府',
    type: 'university'
  },
  {
    _id: '507f1f77bcf86cd799439014',
    name: '北京市第一中学',
    description: '北京市重点中学，体育教育特色鲜明',
    type: 'high_school'
  },
  {
    _id: '507f1f77bcf86cd799439015',
    name: '深圳中学',
    description: '广东省重点中学，现代化教育设施完善',
    type: 'high_school'
  },
  {
    _id: '507f1f77bcf86cd799439016',
    name: '华师一附中',
    description: '华中师范大学第一附属中学，湖北省示范高中',
    type: 'high_school'
  },
  {
    _id: '507f1f77bcf86cd799439017',
    name: '北京市育英中学',
    description: '海淀区重点中学，体育教育成绩突出',
    type: 'middle_school'
  },
  {
    _id: '507f1f77bcf86cd799439018',
    name: '杭州市求是教育集团',
    description: '杭州市知名教育集团，注重学生全面发展',
    type: 'middle_school'
  },
  {
    _id: '507f1f77bcf86cd799439019',
    name: '星海体育培训中心',
    description: '专业体育培训机构，青少年体育教育专家',
    type: 'training_center'
  },
  {
    _id: '507f1f77bcf86cd799439020',
    name: '阳光少年体育俱乐部',
    description: '致力于青少年体育素质提升的专业机构',
    type: 'training_center'
  }
];

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '临时后端服务运行正常',
    timestamp: new Date().toISOString() 
  });
});

// 学校列表接口（注册页面专用）
app.get('/api/institutions/for-registration', (req, res) => {
  try {
    const { keyword } = req.query;
    
    let filteredInstitutions = mockInstitutions;
    
    // 如果有搜索关键词，进行过滤
    if (keyword) {
      const searchTerm = keyword.toLowerCase();
      filteredInstitutions = mockInstitutions.filter(inst => 
        inst.name.toLowerCase().includes(searchTerm) ||
        inst.description.toLowerCase().includes(searchTerm)
      );
    }
    
    console.log(`✅ 返回 ${filteredInstitutions.length} 个学校数据${keyword ? ` (搜索: ${keyword})` : ''}`);
    
    res.json({
      success: true,
      data: filteredInstitutions.map(inst => ({
        _id: inst._id,
        name: inst.name,
        description: inst.description,
        type: inst.type
      }))
    });
  } catch (error) {
    console.error('❌ 获取学校列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取学校列表失败',
      error: error.message
    });
  }
});

// 登录相关API
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('🔐 请求登录:', username);
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    // 查找用户（支持用户名或邮箱登录）
    const user = tempUsers.find(u => 
      (u.username === username || u.email === username) && u.isActive
    );

    if (!user) {
      console.log('❌ 用户不存在:', username);
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 验证密码
    const hashedPassword = md5Hash(password);
    if (user.password !== hashedPassword) {
      console.log('❌ 密码错误:', username);
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 生成token
    const token = generateToken(user);
    
    console.log('✅ 登录成功:', username, '角色:', user.role);
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
          institution: user.institution
        }
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试'
    });
  }
});

app.post('/api/auth/register', (req, res) => {
  try {
    const { username, email, password, name, institution, role = 'student' } = req.body;
    
    console.log('📝 请求注册:', username, email);
    
    // 基本验证
    if (!username || !email || !password || !name || !institution) {
      return res.status(400).json({
        success: false,
        message: '所有字段都是必填的'
      });
    }

    // 检查用户名是否已存在
    const existingUser = tempUsers.find(u => u.username === username || u.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名或邮箱已存在'
      });
    }

    // 验证学校是否存在
    const validInstitution = mockInstitutions.find(inst => inst._id === institution);
    if (!validInstitution) {
      return res.status(400).json({
        success: false,
        message: '选择的学校不存在'
      });
    }

    // 创建新用户
    const newUser = {
      _id: 'user_' + Date.now(),
      username,
      email,
      password: md5Hash(password),
      name,
      role,
      institution,
      createdAt: new Date(),
      isActive: true
    };

    tempUsers.push(newUser);
    
    console.log('✅ 注册成功:', username, '角色:', role);
    
    res.json({
      success: true,
      message: '注册成功',
      data: {
        user: {
          _id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          institution: newUser.institution
        }
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '注册失败，请稍后重试'
    });
  }
});

app.get('/api/auth/profile', authenticate, (req, res) => {
  try {
    console.log('👤 请求用户信息:', req.user.username);
    
    const user = tempUsers.find(u => u._id === req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        institution: user.institution,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

app.post('/api/auth/logout', authenticate, (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader.substring(7);
    activeTokens.delete(token);
    
    console.log('👋 用户登出:', req.user.username);
    
    res.json({
      success: true,
      message: '登出成功'
    });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({
      success: false,
      message: '登出失败'
    });
  }
});

// 成就相关API（防止前端调用时出错）
app.get('/api/achievements/all', (req, res) => {
  console.log('📊 请求所有成就列表');
  res.json({
    success: true,
    data: [],
    message: '临时服务暂无成就数据'
  });
});

app.get('/api/achievements/stats', (req, res) => {
  console.log('📊 请求成就统计数据');
  res.json({
    success: true,
    data: {
      total: 0,
      completed: 0,
      byRarity: {
        common: 0,
        rare: 0,
        epic: 0,
        legendary: 0
      },
      totalPoints: 0,
      completionRate: '0.00'
    }
  });
});

app.post('/api/achievements/check', (req, res) => {
  console.log('🎯 请求检查成就');
  res.json({
    success: true,
    data: { count: 0 },
    message: '临时服务暂无成就检查功能'
  });
});

app.get('/api/achievements', (req, res) => {
  console.log('🏆 请求用户成就');
  res.json({
    success: true,
    data: [],
    message: '临时服务暂无用户成就数据'
  });
});

app.get('/api/achievements/recent', (req, res) => {
  console.log('⏰ 请求最近成就');
  res.json({
    success: true,
    data: [],
    message: '临时服务暂无最近成就数据'
  });
});

// 知识库相关API
app.get('/api/knowledge-bases', (req, res) => {
  console.log('📚 请求知识库列表');
  res.json({
    success: true,
    data: {
      knowledgeBases: [
        {
          _id: '1',
          title: '足球基础技能训练',
          description: '从零开始学习足球基本技能，包括颠球、传球、射门等核心技术动作。',
          category: '足球',
          difficulty: 'beginner',
          stats: {
            knowledgePoints: 24,
            resources: 18,
            learners: 156,
            completionRate: 78,
            avgRating: 4.6
          }
        },
        {
          _id: '2',
          title: '篮球进阶技术',
          description: '面向有一定基础的学员，深入学习篮球高级技术和战术配合。',
          category: '篮球',
          difficulty: 'intermediate',
          stats: {
            knowledgePoints: 32,
            resources: 28,
            learners: 89,
            completionRate: 65,
            avgRating: 4.8
          }
        }
      ]
    }
  });
});

// 个性化学习路径推荐API
app.get('/api/recommendations/learning-paths', (req, res) => {
  console.log('🚀 请求个性化学习路径推荐');
  res.json({
    success: true,
    data: {
      userAnalysis: {
        totalQuestions: 156,
        accuracy: 0.753,
        weakCategories: ['足球规则', '射门技巧'],
        strongCategories: ['基础体能', '团队配合'],
        preferredDifficulty: 'medium'
      },
      recommendedPaths: [
        {
          path: {
            _id: 'path-1',
            name: '足球基础入门路径',
            description: '专为零基础学员设计的足球学习路径，循序渐进掌握基本技能。',
            difficulty: 'beginner',
            estimatedDuration: 180,
            steps: [
              { id: '1', title: '足球基本规则', description: '了解足球基本规则和场地知识', estimatedTime: 30, type: 'required', completed: false },
              { id: '2', title: '基础颠球技巧', description: '练习基本颠球动作和技巧', estimatedTime: 45, type: 'required', completed: false },
              { id: '3', title: '传球基础', description: '学习短传和长传技巧', estimatedTime: 60, type: 'required', completed: false }
            ],
            statistics: { completionRate: 85, avgRating: 4.7, learners: 156 }
          },
          score: 0.92,
          reason: '根据您的学习水平和薄弱环节定制，难度适中，循序渐进',
          matchReason: ['适合初学者水平', '针对足球规则薄弱环节', '学习时长合理', '内容系统全面'],
          estimatedProgress: 0
        },
        {
          path: {
            _id: 'path-2',
            name: '射门技巧专项训练',
            description: '专注提升射门技巧的训练路径，包含各种射门方式和技术要点。',
            difficulty: 'intermediate',
            estimatedDuration: 120,
            steps: [
              { id: '1', title: '射门姿势要领', description: '学习正确的射门姿势', estimatedTime: 30, type: 'required', completed: false },
              { id: '2', title: '力量射门训练', description: '提升射门力量和精度', estimatedTime: 45, type: 'required', completed: false }
            ],
            statistics: { completionRate: 78, avgRating: 4.6, learners: 89 }
          },
          score: 0.87,
          reason: '针对您的射门技巧薄弱环节，重点强化训练',
          matchReason: ['针对薄弱环节', '中级难度匹配', '专项技能提升'],
          estimatedProgress: 0
        }
      ]
    }
  });
});

// 知识点推荐API
app.get('/api/recommendations/knowledge-points/:knowledgeBaseId', (req, res) => {
  const { knowledgeBaseId } = req.params;
  console.log('💡 请求知识点推荐，知识库ID:', knowledgeBaseId);
  
  res.json({
    success: true,
    data: {
      recommendations: [
        {
          knowledgePoint: {
            _id: 'kp-1',
            title: '足球基本规则详解',
            description: '深入学习足球比赛的基本规则，包括越位、犯规、手球等关键规则概念。'
          },
          difficulty: 'easy',
          estimatedTime: 30,
          progress: 0,
          priority: 'high',
          reason: '针对您的规则知识薄弱环节，建议优先学习掌握'
        },
        {
          knowledgePoint: {
            _id: 'kp-2',
            title: '颠球技巧进阶训练',
            description: '提升颠球技巧，学习单脚颠球、双脚交替、头部颠球等多种颠球方式。'
          },
          difficulty: 'medium',
          estimatedTime: 45,
          progress: 60,
          priority: 'high',
          reason: '继续之前未完成的学习内容，即将完成此技能掌握'
        },
        {
          knowledgePoint: {
            _id: 'kp-3',
            title: '射门技巧专项',
            description: '学习各种射门技巧，包括正脚背射门、内脚背射门、头球射门等。'
          },
          difficulty: 'medium',
          estimatedTime: 40,
          progress: 0,
          priority: 'high',
          reason: '射门是您的薄弱环节，重点推荐加强练习'
        },
        {
          knowledgePoint: {
            _id: 'kp-4',
            title: '传球技术要领',
            description: '掌握短传、长传、直塞球等传球技术，学习传球时机和力度控制。'
          },
          difficulty: 'medium',
          estimatedTime: 50,
          progress: 20,
          priority: 'medium',
          reason: '基于您的学习兴趣，推荐深入学习传球技术'
        }
      ]
    }
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `请求的资源不存在: ${req.originalUrl}`
  });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: err.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 临时后端服务启动成功，运行在端口 ${PORT}`);
  console.log(`🌐 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`🏫 学校接口: http://localhost:${PORT}/api/institutions/for-registration`);
  console.log(`🔐 认证接口: http://localhost:${PORT}/api/auth/login`);
  console.log(`📝 注册接口: http://localhost:${PORT}/api/auth/register`);
  console.log('');
  console.log('📋 可用的测试账户:');
  console.log('   管理员: admin / admin');
  console.log('   教师: teacher1 / teacher123');
  console.log('   学生: student1 / student123');
  console.log('');
  console.log('📝 这是一个临时服务，包含基本的用户认证功能');
  console.log('🔧 请稍后配置完整的数据库和环境后使用正式服务');
  console.log('💾 注意：所有数据存储在内存中，重启后会丢失');
}); 