import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

// 扩展Request接口以包含用户信息
export interface AuthRequest extends Request {
  user?: IUser;
}

// JWT认证中间件
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: '访问被拒绝，未提供认证令牌' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await User.findById(decoded.userId).populate('institution');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false, 
        message: '无效的认证令牌或用户已被禁用' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: '无效的认证令牌' 
    });
  }
};

// 角色权限检查中间件
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: '未认证的用户' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: '权限不足，无法访问此资源' 
      });
    }

    next();
  };
};

// 机构权限检查中间件（用户只能访问自己机构的数据）
export const institutionAccess = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: '未认证的用户' 
      });
    }

    // 超级管理员可以访问所有数据
    if (req.user.role === 'super_admin') {
      return next();
    }

    // 检查是否有机构限制
    const targetInstitution = req.params.institutionId || req.body.institution;
    
    if (targetInstitution && req.user.institution?.toString() !== targetInstitution) {
      return res.status(403).json({ 
        success: false, 
        message: '无权访问其他机构的数据' 
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: '权限验证失败' 
    });
  }
}; 