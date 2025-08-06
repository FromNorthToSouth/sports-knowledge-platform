import axios from 'axios';
import { message } from 'antd';

// 创建一个共享的axios实例
const api = axios.create({
  // 临时直接指向后端服务器，绕过代理
  baseURL: process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5001/api'  // 开发环境直接访问后端
    : '/api',  // 生产环境使用相对路径
});

// 请求拦截器，在每个请求头中自动添加token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器，统一处理错误
api.interceptors.response.use(
  response => response,
  error => {
    // 统一处理认证和授权错误
    if (error.response?.status === 401) {
      // 清除无效的token
      localStorage.removeItem('token');
      
      // 避免重复显示错误消息
      if (!error.config.__isRetryRequest) {
        message.error('登录已过期，请重新登录');
        
        // 延迟跳转，避免在某些页面加载过程中立即跳转
        setTimeout(() => {
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }, 1000);
      }
    } else if (error.response?.status === 403) {
      message.error('权限不足，无法访问该功能');
    } else if (error.response?.status >= 500) {
      message.error('服务器错误，请稍后重试');
    }
    
    return Promise.reject(error);
  }
);

export default api; 