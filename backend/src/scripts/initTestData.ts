import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Class } from '../models/Class';
import User from '../models/User';
import Institution from '../models/Institution';

// 加载环境变量
dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sports_knowledge_platform';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB 连接成功');
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error);
    process.exit(1);
  }
};

const initTestData = async () => {
  try {
    console.log('🚀 开始初始化测试数据...');

    // 1. 查找或创建默认机构
    let institution = await Institution.findOne({ name: '测试学校' });
    if (!institution) {
      // 创建临时的Institution ID
      const tempInstitutionId = new mongoose.Types.ObjectId();
      
      // 先创建系统管理员用户，使用临时的Institution ID
      let systemUser = await User.findOne({ email: 'system@test.com' });
      if (!systemUser) {
        systemUser = new User({
          username: '系统管理员',
          email: 'system@test.com',
          password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
          role: 'admin',
          institution: tempInstitutionId, // 使用临时ID
          isActive: true,
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
            difficulty: 'medium',
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
          points: 0,
          achievements: []
        });
        await systemUser.save();
      }

      // 创建Institution，使用正确的ID
      institution = new Institution({
        _id: tempInstitutionId, // 使用预先创建的ID
        name: '测试学校',
        type: 'high_school',
        description: '用于测试的高中学校',
        address: {
          country: '中国',
          province: '北京市',
          city: '北京市',
          district: '朝阳区',
          street: '测试街道123号',
          postalCode: '100000'
        },
        contact: {
          phone: '010-12345678',
          email: 'admin@testschool.com',
          website: 'https://testschool.com'
        },
        settings: {
          maxUsers: 1000,
          maxClasses: 100,
          maxStorage: 1024, // 1GB
          enabledFeatures: ['basic', 'analytics', 'collaboration', 'ai_features'],
          customization: {
            primaryColor: '#1890ff',
            theme: 'default'
          },
          permissions: {
            allowSelfRegistration: true,
            requireApproval: false,
            allowGuestAccess: false,
            defaultUserRole: 'student'
          },
          notification: {
            emailEnabled: true,
            smsEnabled: false,
            pushEnabled: true,
            defaultLanguage: 'zh-CN'
          }
        },
        adminUsers: [systemUser._id],
        status: 'active',
        statistics: {
          totalUsers: 0,
          totalClasses: 0,
          totalQuestions: 0,
          storageUsed: 0,
          lastActivityAt: new Date()
        },
        createdBy: systemUser._id
      });
      await institution.save();
      console.log('✅ 创建默认机构:', institution.name);
    }

    // 2. 查找或创建测试教师
    let teacher = await User.findOne({ email: 'teacher@test.com' });
    if (!teacher) {
      teacher = new User({
        username: '张老师',
        email: 'teacher@test.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        role: 'teacher',
        institution: institution._id,
        isActive: true,
        phone: '13800138001',
        learningStats: {
          totalQuestions: 0,
          correctAnswers: 0,
          accuracy: 0,
          totalTime: 0,
          continuousLoginDays: 0,
          lastLoginDate: new Date().toISOString()
        },
        settings: {
          notifications: true,
          difficulty: 'medium',
          preferredSports: ['足球', '篮球']
        },
        abilityProfile: {
          sportsKnowledge: 80,
          rulesUnderstanding: 85,
          technicalSkills: 75,
          historyKnowledge: 70,
          judgeAbility: 90,
          safetyAwareness: 95
        },
        points: 0,
        achievements: []
      });
      await teacher.save();
      console.log('✅ 创建测试教师:', teacher.username);
    }

    // 3. 创建测试班级数据
    const classesData = [
      {
        name: '高一(1)班',
        grade: '高一',
        description: '高一年级第一班',
        teacherId: teacher._id,
        teacherName: teacher.username,
        institutionId: institution._id,
        status: 'active',
        capacity: 50,
        subject: '体育',
        schedule: {
          classTime: '周一 14:00-15:30',
          semester: '2024年春季',
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-07-01')
        }
      },
      {
        name: '高一(2)班',
        grade: '高一',
        description: '高一年级第二班',
        teacherId: teacher._id,
        teacherName: teacher.username,
        institutionId: institution._id,
        status: 'active',
        capacity: 48,
        subject: '体育',
        schedule: {
          classTime: '周二 14:00-15:30',
          semester: '2024年春季',
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-07-01')
        }
      },
      {
        name: '高二(1)班',
        grade: '高二',
        description: '高二年级第一班',
        teacherId: teacher._id,
        teacherName: teacher.username,
        institutionId: institution._id,
        status: 'active',
        capacity: 45,
        subject: '体育',
        schedule: {
          classTime: '周三 14:00-15:30',
          semester: '2024年春季',
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-07-01')
        }
      },
      {
        name: '高二(2)班',
        grade: '高二',
        description: '高二年级第二班',
        teacherId: teacher._id,
        teacherName: teacher.username,
        institutionId: institution._id,
        status: 'active',
        capacity: 47,
        subject: '体育',
        schedule: {
          classTime: '周四 14:00-15:30',
          semester: '2024年春季',
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-07-01')
        }
      },
      {
        name: '高三(1)班',
        grade: '高三',
        description: '高三年级第一班',
        teacherId: teacher._id,
        teacherName: teacher.username,
        institutionId: institution._id,
        status: 'active',
        capacity: 40,
        subject: '体育',
        schedule: {
          classTime: '周五 14:00-15:30',
          semester: '2024年春季',
          startDate: new Date('2024-02-01'),
          endDate: new Date('2024-07-01')
        }
      }
    ];

    // 检查并创建班级
    for (const classData of classesData) {
      const existingClass = await Class.findOne({ 
        name: classData.name,
        teacherId: teacher._id 
      });
      
      if (!existingClass) {
        const newClass = new Class({
          ...classData,
          currentStudentCount: 0,
          students: [], // 初始为空，后续可以添加学生
          settings: {
            allowSelfEnroll: false,
            requireApproval: true,
            enabledFeatures: ['assignments', 'discussions', 'grades'],
            notificationSettings: {
              assignmentReminders: true,
              gradeUpdates: true,
              announcements: true
            }
          },
          statistics: {
            totalStudents: 0,
            activeStudents: 0,
            averagePerformance: 0,
            totalAssignments: 0,
            totalExams: 0,
            lastActivityDate: new Date()
          },
          metadata: {
            createdBy: teacher._id.toString(),
            createdAt: new Date(),
            updatedAt: new Date(),
            tags: ['体育', '基础班级'],
            category: 'regular_class'
          }
        });
        await newClass.save();
        console.log('✅ 创建班级:', classData.name);
      } else {
        console.log('ℹ️ 班级已存在:', classData.name);
      }
    }

    // 4. 创建一些测试学生（可选）
    const studentsData = [
      { username: '张三', email: 'student1@test.com', grade: '高一' },
      { username: '李四', email: 'student2@test.com', grade: '高一' },
      { username: '王五', email: 'student3@test.com', grade: '高二' },
      { username: '赵六', email: 'student4@test.com', grade: '高二' },
      { username: '钱七', email: 'student5@test.com', grade: '高三' },
      { username: '孙八', email: 'student6@test.com', grade: '高三' }
    ];

    for (const studentData of studentsData) {
      const existingStudent = await User.findOne({ email: studentData.email });
      if (!existingStudent) {
        const student = new User({
          username: studentData.username,
          email: studentData.email,
          password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
          role: 'student',
          institution: institution._id,
          grade: studentData.grade,
          isActive: true,
          learningStats: {
            totalQuestions: 0,
            correctAnswers: 0,
            accuracy: 0,
            totalTime: 0,
            continuousLoginDays: 0,
            lastLoginDate: new Date().toISOString()
          },
          settings: {
            notifications: true,
            difficulty: 'medium',
            preferredSports: ['足球', '篮球']
          },
          abilityProfile: {
            sportsKnowledge: Math.floor(Math.random() * 30) + 50,
            rulesUnderstanding: Math.floor(Math.random() * 30) + 50,
            technicalSkills: Math.floor(Math.random() * 30) + 50,
            historyKnowledge: Math.floor(Math.random() * 30) + 50,
            judgeAbility: Math.floor(Math.random() * 30) + 50,
            safetyAwareness: Math.floor(Math.random() * 30) + 50
          },
          points: 0,
          achievements: []
        });
        await student.save();
        console.log('✅ 创建测试学生:', studentData.username);

        // 将学生分配到对应年级的班级
        const targetClass = await Class.findOne({ 
          grade: studentData.grade,
          teacherId: teacher._id 
        });
        
        if (targetClass) {
          targetClass.students.push({
            userId: student._id,
            username: student.username,
            joinedAt: new Date(),
            status: 'active',
            performance: {
              averageScore: Math.floor(Math.random() * 40) + 60,
              totalQuestions: Math.floor(Math.random() * 100) + 50,
              correctAnswers: Math.floor(Math.random() * 50) + 30,
              lastActiveAt: new Date()
            }
          });
          await targetClass.save();
          console.log(`✅ 将学生 ${studentData.username} 加入班级 ${targetClass.name}`);
        }
      }
    }

    console.log('🎉 测试数据初始化完成！');
    console.log('📊 统计信息:');
    console.log(`   - 机构数量: ${await Institution.countDocuments()}`);
    console.log(`   - 教师数量: ${await User.countDocuments({ role: 'teacher' })}`);
    console.log(`   - 学生数量: ${await User.countDocuments({ role: 'student' })}`);
    console.log(`   - 班级数量: ${await Class.countDocuments()}`);
    console.log('');
    console.log('🔑 测试账号信息:');
    console.log('   教师账号: teacher@test.com / password');
    console.log('   学生账号: student1@test.com / password (还有student2-student6)');

  } catch (error) {
    console.error('❌ 初始化测试数据失败:', error);
  }
};

const main = async () => {
  await connectDB();
  await initTestData();
  await mongoose.disconnect();
  console.log('✅ 数据库连接已关闭');
  process.exit(0);
};

main().catch(console.error); 