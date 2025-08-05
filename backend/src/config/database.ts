import mongoose from 'mongoose';

const connectDatabase = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sports_knowledge_platform';
    
    const options: mongoose.ConnectOptions = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(mongoURI, options);
    
    console.log('MongoDB 数据库连接成功');
    
    // 监听连接事件
    mongoose.connection.on('error', (error) => {
      console.error('MongoDB 连接错误:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB 连接断开');
    });

    // 优雅关闭数据库连接
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB 连接已关闭');
      process.exit(0);
    });

  } catch (error) {
    console.error('数据库连接失败:', error);
    process.exit(1);
  }
};

export default connectDatabase; 