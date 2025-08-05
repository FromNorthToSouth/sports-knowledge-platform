import api from './api';
import { LoginForm, RegisterForm, UserProfile } from '../types';

// 用户登录
export const login = async (credentials: LoginForm): Promise<any> => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

// 用户注册
export const register = async (userData: RegisterForm): Promise<any> => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

// 获取用户信息
export const getProfile = async (): Promise<any> => {
  const response = await api.get('/auth/profile');
  return response.data;
};

// 更新用户信息
export const updateProfile = async (userData: Partial<UserProfile>): Promise<any> => {
  const response = await api.put('/auth/profile', userData);
  return response.data;
};

// 修改密码
export const changePassword = async (passwordData: {
  currentPassword: string;
  newPassword: string;
}): Promise<any> => {
  const response = await api.put('/auth/change-password', passwordData);
  return response.data;
}; 