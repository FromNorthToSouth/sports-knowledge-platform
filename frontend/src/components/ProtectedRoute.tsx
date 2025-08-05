import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  // 如果用户未登录，重定向到登录页
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // 如果指定了角色要求，检查用户角色
  if (roles && roles.length > 0) {
    if (!roles.includes(user.role)) {
      // 角色不匹配，重定向到仪表盘
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute; 