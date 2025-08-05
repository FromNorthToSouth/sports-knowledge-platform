// 类型修复文件 - 临时解决编译问题

// 扩展User模型的类型
declare module '../models/User' {
  interface IUser {
    status?: string;
  }
}

// 扩展Socket类型
export interface AuthenticatedSocket {
  userId?: string;
  username?: string;
  role?: string;
  id: string;
  emit: (event: string, data: any) => void;
  on: (event: string, callback: (data: any) => void) => void;
  join: (room: string) => void;
  leave: (room: string) => void;
  handshake: {
    auth: {
      token?: string;
    };
  };
}

// 推荐配置类型
export interface RecommendationConfig {
  count: number;
  difficulty?: string[];
  categories?: string[];
  excludeAnswered?: boolean;
  focusWeakness?: boolean;
  reviewMode?: boolean;
} 