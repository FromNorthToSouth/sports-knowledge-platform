const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // 只代理API请求到后端，避免代理静态资源和webpack热更新文件
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
      timeout: 10000, // 10秒超时
      retries: 3, // 重试3次
      onError: (err, req, res) => {
        console.error('🔴 代理错误:', err.message);
        console.error('请求路径:', req.path);
        console.error('目标地址:', 'http://localhost:5000');
        console.error('错误详情:', err);
        
        // 发送友好的错误响应
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: '后端服务连接失败，请检查后端服务是否正常运行',
            error: err.message,
            target: 'http://localhost:5000',
            path: req.path,
            timestamp: new Date().toISOString()
          });
        }
      },
      onProxyReq: (proxyReq, req, res) => {
        console.log('🔵 代理请求:', req.method, req.path, '->', proxyReq.path);
        console.log('请求头:', req.headers);
      },
      onProxyRes: (proxyRes, req, res) => {
        console.log('🟢 代理响应:', req.path, '->', proxyRes.statusCode);
        if (proxyRes.statusCode >= 400) {
          console.error('代理响应错误:', proxyRes.statusCode, proxyRes.statusMessage);
        }
      },
      // 添加健康检查
      onProxyReqWs: (proxyReq, req, socket, options, head) => {
        console.log('WebSocket代理请求:', req.url);
      }
    })
  );

  // 可选：代理上传文件请求
  app.use(
    '/uploads',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
      logLevel: 'warn'
    })
  );
  
  // 添加代理状态检查路由
  app.get('/proxy-status', (req, res) => {
    res.json({
      status: 'ok',
      proxy: {
        target: 'http://localhost:5000',
        paths: ['/api', '/uploads']
      },
      timestamp: new Date().toISOString()
    });
  });
}; 