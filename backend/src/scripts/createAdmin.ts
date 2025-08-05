import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User';
import Institution from '../models/Institution';

dotenv.config();

const createDefaultInstitution = async () => {
  // 检查是否已存在默认机构
  let defaultInstitution = await Institution.findOne({ name: '系统管理机构' });
  
  if (!defaultInstitution) {
    defaultInstitution = new Institution({
      name: '系统管理机构',
      type: 'other',
      description: '系统管理员专用机构',
      contact: {
        email: 'admin@sportsplatform.com',
        phone: '000-0000-0000'
      },
      settings: {
        maxUsers: 10000,
        maxClasses: 1000,
        maxStorage: 102400, // 100GB
        enabledFeatures: ['basic', 'analytics', 'collaboration', 'ai_features', 'video_learning', 'mobile_app', 'api_access', 'white_label'],
        customization: {
          logo: '',
          primaryColor: '#1890ff',
          theme: 'default'
        },
        permissions: {
          allowSelfRegistration: false,
          requireApproval: false,
          allowGuestAccess: false,
          defaultUserRole: 'student'
        },
        notification: {
          emailEnabled: true,
          smsEnabled: true,
          pushEnabled: true,
          defaultLanguage: 'zh-CN'
        }
      },
      adminUsers: [],
      status: 'active',
      statistics: {
        totalUsers: 0,
        totalClasses: 0,
        totalQuestions: 0,
        storageUsed: 0,
        lastActivityAt: new Date()
      },
      createdBy: new mongoose.Types.ObjectId() // 临时ID，稍后会被替换
    });

    await defaultInstitution.save();
    console.log('✅ 默认管理机构创建成功');
  } else {
    console.log('ℹ️  默认管理机构已存在');
  }

  return defaultInstitution;
};

const createSuperAdmin = async () => {
  try {
    // 连接数据库
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('📦 MongoDB 连接成功');

    // 创建默认机构
    const defaultInstitution = await createDefaultInstitution();

    // 检查是否已存在超级管理员
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    
    if (existingSuperAdmin) {
      console.log('⚠️  超级管理员已存在:');
      console.log(`   用户名: ${existingSuperAdmin.username}`);
      console.log(`   邮箱: ${existingSuperAdmin.email}`);
      console.log(`   角色: ${existingSuperAdmin.role}`);
      return;
    }

    // 管理员账户信息
    const adminInfo = {
      username: 'superadmin',
      email: 'admin@sportsplatform.com',
      password: 'Admin123456', // 强密码
      role: 'super_admin',
      phone: '13800138000',
      institution: defaultInstitution._id
    };

    // 检查用户名和邮箱是否已被使用
    const existingUser = await User.findOne({
      $or: [
        { username: adminInfo.username },
        { email: adminInfo.email }
      ]
    });

    if (existingUser) {
      console.log('❌ 管理员用户名或邮箱已存在，请手动检查数据库');
      return;
    }

    // 加密密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminInfo.password, salt);

    // 创建超级管理员
    const superAdmin = new User({
      username: adminInfo.username,
      email: adminInfo.email,
      password: hashedPassword,
      phone: adminInfo.phone,
      role: adminInfo.role,
      institution: adminInfo.institution,
      learningStats: {
        totalQuestions: 0,
        correctAnswers: 0,
        accuracy: 0,
        totalTime: 0,
        totalExams: 0,
        passedExams: 0,
        continuousLoginDays: 0,
        lastLoginDate: new Date()
      },
      settings: {
        notifications: true,
        difficulty: 'adaptive',
        preferredSports: []
      },
      abilityProfile: {
        sportsKnowledge: 100,
        rulesUnderstanding: 100,
        technicalSkills: 100,
        historyKnowledge: 100,
        judgeAbility: 100,
        safetyAwareness: 100
      },
      points: 10000,
      achievements: [],
      isActive: true
    });

    await superAdmin.save();

    // 更新机构的createdBy字段
    await Institution.findByIdAndUpdate(defaultInstitution._id, {
      createdBy: superAdmin._id,
      $push: { adminUsers: superAdmin._id }
    });

    console.log('🎉 超级管理员创建成功！');
    console.log('📋 登录信息:');
    console.log(`   用户名: ${adminInfo.username}`);
    console.log(`   邮箱: ${adminInfo.email}`);
    console.log(`   密码: ${adminInfo.password}`);
    console.log(`   角色: ${adminInfo.role}`);
    console.log('');
    console.log('🚀 可以使用以下任一方式登录:');
    console.log(`   1. 用户名登录: ${adminInfo.username}`);
    console.log(`   2. 邮箱登录: ${adminInfo.email}`);
    console.log('');
    console.log('⚠️  请立即登录并修改默认密码！');

  } catch (error: any) {
    console.error('❌ 创建超级管理员失败:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('📦 数据库连接已关闭');
  }
};

// 创建普通管理员的函数
const createAdmin = async (username: string, email: string, password: string, institutionName?: string) => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('📦 MongoDB 连接成功');

    // 寻找机构
    let institution;
    if (institutionName) {
      institution = await Institution.findOne({ name: institutionName });
      if (!institution) {
        console.log(`❌ 未找到机构: ${institutionName}`);
        return;
      }
    } else {
      institution = await Institution.findOne({ name: '系统管理机构' });
    }

    // 检查用户是否已存在
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      console.log('❌ 用户名或邮箱已存在');
      return;
    }

    // 加密密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 创建管理员
    const admin = new User({
      username,
      email,
      password: hashedPassword,
      role: 'admin',
      institution: institution?._id,
      learningStats: {
        totalQuestions: 0,
        correctAnswers: 0,
        accuracy: 0,
        totalTime: 0,
        totalExams: 0,
        passedExams: 0,
        continuousLoginDays: 0,
        lastLoginDate: new Date()
      },
      settings: {
        notifications: true,
        difficulty: 'adaptive',
        preferredSports: []
      },
      abilityProfile: {
        sportsKnowledge: 90,
        rulesUnderstanding: 90,
        technicalSkills: 90,
        historyKnowledge: 90,
        judgeAbility: 90,
        safetyAwareness: 90
      },
      points: 5000,
      achievements: [],
      isActive: true
    });

    await admin.save();

    console.log('🎉 管理员创建成功！');
    console.log(`   用户名: ${username}`);
    console.log(`   邮箱: ${email}`);
    console.log(`   角色: admin`);
    console.log(`   所属机构: ${institution?.name}`);

  } catch (error: any) {
    console.error('❌ 创建管理员失败:', error.message);
  } finally {
    await mongoose.connection.close();
  }
};

// 命令行参数处理
const args = process.argv.slice(2);

if (args.length === 0) {
  // 创建超级管理员
  createSuperAdmin();
} else if (args.length >= 3) {
  // 创建普通管理员
  // npm run create-admin username email password [institutionName]
  const [username, email, password, institutionName] = args;
  createAdmin(username, email, password, institutionName);
} else {
  console.log('使用方法:');
  console.log('1. 创建超级管理员: npm run create-admin');
  console.log('2. 创建普通管理员: npm run create-admin <username> <email> <password> [institutionName]');
} 