import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import User from '../models/User';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
  role?: string;
}

interface SocketData {
  type: string;
  data: any;
  timestamp?: Date;
}

class WebSocketService {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, AuthenticatedSocket> = new Map();
  private userSockets: Map<string, Set<string>> = new Map();

  // 初始化WebSocket服务
  initialize(server: HttpServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? [process.env.FRONTEND_URL || 'https://your-domain.com']
          : ['http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupEventHandlers();
    console.log('WebSocket服务初始化成功');
  }

  // 设置事件处理器
  private setupEventHandlers(): void {
    if (!this.io) return;

    this.io.use(this.authenticateSocket.bind(this));

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`用户连接: ${socket.username} (${socket.userId})`);
      
      // 记录连接的用户
      this.connectedUsers.set(socket.id, socket);
      
      // 为用户ID建立socket映射
      if (socket.userId && !this.userSockets.has(socket.userId)) {
        this.userSockets.set(socket.userId, new Set());
      }
      if (socket.userId) {
        this.userSockets.get(socket.userId)!.add(socket.id);
      }

      // 发送连接成功消息
      socket.emit('connected', {
        message: '连接成功',
        userId: socket.userId,
        timestamp: new Date()
      });

      // 加入用户专属房间
      socket.join(`user:${socket.userId}`);
      
      // 根据角色加入相应房间
      socket.join(`role:${socket.role}`);

      // 处理用户主动请求
      this.setupSocketEvents(socket);

      // 处理断开连接
      socket.on('disconnect', () => {
        console.log(`用户断开连接: ${socket.username} (${socket.userId})`);
        this.handleDisconnect(socket);
      });

      // 发送未读通知数量
      this.sendUnreadCount(socket.userId);
    });
  }

  // Socket身份验证
  private async authenticateSocket(socket: AuthenticatedSocket, next: Function): Promise<void> {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('认证令牌缺失'));
      }

      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
      const user = await User.findById(decoded.id).select('username role status').lean();
      
      if (!user || user.status !== 'active') {
        return next(new Error('用户不存在或已被禁用'));
      }

      socket.userId = decoded.id;
      socket.username = user.username;
      socket.role = user.role;
      
      next();
    } catch (error) {
      console.error('WebSocket认证失败:', error);
      next(new Error('认证失败'));
    }
  }

  // 设置Socket事件处理
  private setupSocketEvents(socket: AuthenticatedSocket): void {
    // 标记通知为已读
    socket.on('markNotificationRead', async (data: { notificationId: string }) => {
      try {
        // 这里应该调用通知服务标记为已读
        console.log(`用户 ${socket.userId} 标记通知 ${data.notificationId} 为已读`);
        
        // 发送已读确认
        socket.emit('notificationMarkedRead', {
          notificationId: data.notificationId,
          success: true
        });

        // 更新未读数量
        this.sendUnreadCount(socket.userId);
      } catch (error) {
        socket.emit('error', {
          message: '标记通知失败',
          error: error.message
        });
      }
    });

    // 获取在线用户列表（管理员）
    socket.on('getOnlineUsers', () => {
      if (socket.role === 'admin' || socket.role === 'super_admin') {
        const onlineUsers = Array.from(this.connectedUsers.values()).map(s => ({
          userId: s.userId,
          username: s.username,
          role: s.role,
          connectedAt: new Date()
        }));

        socket.emit('onlineUsers', onlineUsers);
      }
    });

    // 加入特定房间（班级、机构等）
    socket.on('joinRoom', (data: { roomType: string; roomId: string }) => {
      const roomName = `${data.roomType}:${data.roomId}`;
      socket.join(roomName);
      console.log(`用户 ${socket.username} 加入房间: ${roomName}`);
    });

    // 离开房间
    socket.on('leaveRoom', (data: { roomType: string; roomId: string }) => {
      const roomName = `${data.roomType}:${data.roomId}`;
      socket.leave(roomName);
      console.log(`用户 ${socket.username} 离开房间: ${roomName}`);
    });

    // 发送消息到房间
    socket.on('sendRoomMessage', (data: { 
      roomType: string; 
      roomId: string; 
      message: string;
      type?: string;
    }) => {
      const roomName = `${data.roomType}:${data.roomId}`;
      
      // 广播消息到房间内的所有用户
      socket.to(roomName).emit('roomMessage', {
        roomType: data.roomType,
        roomId: data.roomId,
        message: data.message,
        type: data.type || 'text',
        sender: {
          userId: socket.userId,
          username: socket.username,
          role: socket.role
        },
        timestamp: new Date()
      });
      
      console.log(`用户 ${socket.username} 在房间 ${roomName} 发送消息: ${data.message}`);
    });
  }

  // 断开连接处理
  private handleDisconnect(socket: any) {
    console.log(`用户断开连接: ${socket.id}`);
    
    // 从连接列表中移除
    this.connectedUsers.delete(socket.id);
    
    // 从用户socket映射中移除
    if (socket.userId && this.userSockets.has(socket.userId)) {
      this.userSockets.get(socket.userId)!.delete(socket.id);
      
      // 如果用户没有其他连接，则从映射中删除
      if (this.userSockets.get(socket.userId)!.size === 0) {
        this.userSockets.delete(socket.userId);
      }
    }
  }

  // 发送未读通知数量
  private async sendUnreadCount(userId?: string): Promise<void> {
    if (!userId) return;
    
    try {
      // 这里应该查询数据库获取未读通知数量
      // 暂时返回0，后续可以连接数据库
      const unreadCount = 0;
      
      // 发送给用户的所有连接
      if (this.userSockets.has(userId)) {
        const socketIds = this.userSockets.get(userId)!;
        socketIds.forEach(socketId => {
          const socket = this.connectedUsers.get(socketId);
          if (socket) {
            socket.emit('unreadCount', { count: unreadCount });
          }
        });
      }
    } catch (error: any) {
      console.error('发送未读通知数量失败:', error.message);
    }
  }
}