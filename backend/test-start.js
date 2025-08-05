console.log('开始启动后端服务...');

try {
  // 检查环境变量
  require('dotenv').config();
  console.log('✅ 环境变量加载成功');

  // 检查Express
  const express = require('express');
  const app = express();
  console.log('✅ Express加载成功');

  // 简单的健康检查路由
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 测试机构路由
  app.get('/api/institutions/for-registration', (req, res) => {
    res.json({
      success: true,
      data: [
        { _id: 'test1', name: '测试学校1', type: 'university' },
        { _id: 'test2', name: '测试学校2', type: 'high_school' }
      ]
    });
  });

  const PORT = process.env.PORT || 5000;
  
  app.listen(PORT, () => {
    console.log(`🚀 测试服务器启动成功，运行在端口 ${PORT}`);
    console.log(`🌐 健康检查: http://localhost:${PORT}/api/health`);
    console.log(`🏫 学校接口: http://localhost:${PORT}/api/institutions/for-registration`);
  });

} catch (error) {
  console.error('❌ 启动失败:', error.message);
  console.error('详细错误:', error);
} 