const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

// 导入mock数据
const { 
  tempUsers: initialUsers, 
  mockInstitutions, 
  mockKnowledgeBases, 
  mockLearningPaths, 
  mockKnowledgePoints 
} = require('./mock');

const app = express();
const PORT = 5001;

// 临时用户数据存储（内存中），从mock数据初始化
let tempUsers = [...initialUsers];

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
      knowledgeBases: mockKnowledgeBases
    }
  });
});

// 个性化学习路径推荐API
app.get('/api/recommendations/learning-paths', (req, res) => {
  console.log('🚀 请求个性化学习路径推荐');
  res.json({
    success: true,
    data: mockLearningPaths
  });
});

// 知识点推荐API
app.get('/api/recommendations/knowledge-points/:knowledgeBaseId', (req, res) => {
  const { knowledgeBaseId } = req.params;
  console.log('💡 请求知识点推荐，知识库ID:', knowledgeBaseId);
  
  res.json({
    success: true,
    data: mockKnowledgePoints
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