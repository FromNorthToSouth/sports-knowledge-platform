import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Institution from '../models/Institution';

dotenv.config({ path: './.env' });

const institutions = [
  {
    name: '上海市第一中学',
    type: 'school',
    code: 'SH001',
    contact: {
      address: '上海市XX区XX路1号',
      phone: '021-12345678',
      email: 'contact@sh001.edu.cn',
    },
    level: 'high',
  },
  {
    name: '上海市第二实验小学',
    type: 'school',
    code: 'SH002',
    contact: {
      address: '上海市YY区YY路2号',
      phone: '021-87654321',
      email: 'contact@sh002.edu.cn',
    },
    level: 'primary',
  },
  {
    name: '上海市第三体育运动中心',
    type: 'training_center',
    code: 'SH003',
    contact: {
      address: '上海市ZZ区ZZ路3号',
      phone: '021-11223344',
      email: 'contact@sh003.com',
    },
    level: 'mixed',
  },
  {
    name: '北京市实验中学',
    type: 'school',
    code: 'BJ001',
    contact: {
      address: '北京市朝阳区建国路100号',
      phone: '010-12345678',
      email: 'contact@bj001.edu.cn',
    },
    level: 'high',
  },
  {
    name: '深圳市南山小学',
    type: 'school',
    code: 'SZ001',
    contact: {
      address: '深圳市南山区科技园路200号',
      phone: '0755-12345678',
      email: 'contact@sz001.edu.cn',
    },
    level: 'primary',
  },
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('MongoDB connected...');

    // 清空现有数据
    await Institution.deleteMany({});
    console.log('Institutions cleared...');

    // 插入新数据
    await Institution.insertMany(institutions);
    console.log('Institutions seeded successfully!');

  } catch (err: any) {
    console.error('Error seeding database:', err.message);
    process.exit(1);
  } finally {
    mongoose.connection.close();
  }
};

seedDB(); 