import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User';
import Institution from '../models/Institution';
import Class from '../models/Class';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('📦 MongoDB 连接成功');
  } catch (error: any) {
    console.error('❌ MongoDB 连接失败:', error.message);
    process.exit(1);
  }
};

const createSchoolAccounts = async () => {
  try {
    console.log('🏫 开始创建融梦体育科技学校账户...');

    // 学校信息配置
    const schools = [
      {
        name: '融梦体育科技大学',
        type: 'university' as const,
        description: '专业的体育科技高等教育机构，致力于培养体育科技人才',
        level: 'university' as const,
        teacherEmail: 'teacher@university.rongmeng.com',
        teacherName: '李教授',
        studentEmail: 'student@university.rongmeng.com',
        studentName: '张大明',
        studentGrade: '大三'
      },
      {
        name: '融梦体育科技中学',
        type: 'high_school' as const,
        description: '融合体育与科技的现代化中学教育，培养全面发展的中学生',
        level: 'high' as const,
        teacherEmail: 'teacher@highschool.rongmeng.com',
        teacherName: '王老师',
        studentEmail: 'student@highschool.rongmeng.com',
        studentName: '李小华',
        studentGrade: '高二'
      },
      {
        name: '融梦体育科技小学',
        type: 'primary_school' as const,
        description: '以体育科技为特色的小学教育，注重学生兴趣培养和全面发展',
        level: 'primary' as const,
        teacherEmail: 'teacher@primary.rongmeng.com',
        teacherName: '陈老师',
        studentEmail: 'student@primary.rongmeng.com',
        studentName: '刘小明',
        studentGrade: '五年级'
      }
    ];

    for (const schoolConfig of schools) {
      console.log(`\n🏛️ 创建学校: ${schoolConfig.name}`);

      // 1. 检查学校是否已存在
      let institution = await Institution.findOne({ name: schoolConfig.name });
      
      if (institution) {
        console.log(`⚠️  学校 ${schoolConfig.name} 已存在，跳过创建`);
        continue;
      }

      // 2. 创建学校机构
      institution = new Institution({
        name: schoolConfig.name,
        type: schoolConfig.type,
        description: schoolConfig.description,
        level: schoolConfig.level,
        address: {
          country: '中国',
          province: '北京市',
          city: '北京市',
          district: '海淀区',
          street: '融梦体育科技园区',
          postalCode: '100000'
        },
        contact: {
          phone: '010-88888888',
          email: `admin@${schoolConfig.name.toLowerCase().replace(/融梦体育科技/g, 'rongmeng')}.com`,
          website: `https://www.${schoolConfig.name.toLowerCase().replace(/融梦体育科技/g, 'rongmeng')}.com`
        },
        settings: {
          maxUsers: schoolConfig.type === 'university' ? 10000 : 
                   schoolConfig.type === 'high_school' ? 2000 : 1000,
          maxClasses: schoolConfig.type === 'university' ? 500 : 
                     schoolConfig.type === 'high_school' ? 100 : 50,
          maxStorage: schoolConfig.type === 'university' ? 10240 : 5120, // GB
          enabledFeatures: ['basic', 'analytics', 'collaboration', 'ai_features', 'video_learning'],
          customization: {
            logo: '',
            primaryColor: '#1890ff',
            theme: 'default'
          },
          permissions: {
            allowSelfRegistration: false,
            requireApproval: true,
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
        createdBy: new mongoose.Types.ObjectId() // 临时ID，稍后会更新
      });

      await institution.save();
      console.log(`✅ 创建学校: ${institution.name}`);

      // 3. 创建教师账户
      const teacherExists = await User.findOne({ email: schoolConfig.teacherEmail });
      if (!teacherExists) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        const teacher = new User({
          username: schoolConfig.teacherName,
          email: schoolConfig.teacherEmail,
          password: hashedPassword,
          role: 'teacher',
          institution: institution._id,
          isActive: true,
          phone: `138${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
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
            preferredSports: ['足球', '篮球', '田径']
          },
          abilityProfile: {
            sportsKnowledge: 90,
            rulesUnderstanding: 95,
            technicalSkills: 85,
            historyKnowledge: 80,
            judgeAbility: 92,
            safetyAwareness: 98
          },
          points: 1000,
          achievements: []
        });

        await teacher.save();
        console.log(`✅ 创建教师: ${teacher.username} (${teacher.email})`);

        // 更新机构的管理员用户
        institution.adminUsers.push(teacher._id);
        institution.createdBy = teacher._id;
        await institution.save();
      }

      // 4. 创建学生账户
      const studentExists = await User.findOne({ email: schoolConfig.studentEmail });
      if (!studentExists) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        
        const student = new User({
          username: schoolConfig.studentName,
          email: schoolConfig.studentEmail,
          password: hashedPassword,
          role: 'student',
          institution: institution._id,
          grade: schoolConfig.studentGrade,
          isActive: true,
          phone: `139${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
          learningStats: {
            totalQuestions: Math.floor(Math.random() * 100) + 50,
            correctAnswers: Math.floor(Math.random() * 50) + 30,
            accuracy: Math.floor(Math.random() * 30) + 60,
            totalTime: Math.floor(Math.random() * 10000) + 5000,
            totalExams: Math.floor(Math.random() * 10) + 5,
            passedExams: Math.floor(Math.random() * 8) + 3,
            continuousLoginDays: Math.floor(Math.random() * 15) + 1,
            lastLoginDate: new Date()
          },
          settings: {
            notifications: true,
            difficulty: 'medium',
            preferredSports: ['足球', '篮球']
          },
          abilityProfile: {
            sportsKnowledge: Math.floor(Math.random() * 30) + 60,
            rulesUnderstanding: Math.floor(Math.random() * 25) + 65,
            technicalSkills: Math.floor(Math.random() * 35) + 55,
            historyKnowledge: Math.floor(Math.random() * 20) + 50,
            judgeAbility: Math.floor(Math.random() * 25) + 60,
            safetyAwareness: Math.floor(Math.random() * 20) + 70
          },
          points: Math.floor(Math.random() * 500) + 100,
          achievements: []
        });

        await student.save();
        console.log(`✅ 创建学生: ${student.username} (${student.email})`);

        // 5. 为学生创建默认班级
        const defaultClassName = `${schoolConfig.studentGrade}默认班`;
        const classExists = await Class.findOne({ 
          name: defaultClassName,
          institutionId: institution._id.toString()
        });

        if (!classExists) {
          const teacherUser = await User.findOne({ email: schoolConfig.teacherEmail });
          
          const defaultClass = new Class({
            name: defaultClassName,
            grade: schoolConfig.studentGrade,
            description: `${schoolConfig.name}${schoolConfig.studentGrade}的默认班级`,
            institutionId: institution._id.toString(),
            teacherId: teacherUser?._id.toString() || '',
            teacherName: schoolConfig.teacherName,
            capacity: 50,
            currentStudentCount: 1,
            students: [{
              userId: student._id.toString(),
              username: student.username,
              joinedAt: new Date(),
              status: 'active',
              performance: {
                averageScore: student.learningStats.accuracy,
                totalQuestions: student.learningStats.totalQuestions,
                correctAnswers: student.learningStats.correctAnswers,
                lastActiveAt: new Date()
              }
            }],
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
            schedule: {
              startDate: new Date(),
              classTime: '09:00-10:30',
              location: '体育馆',
              weekdays: [1, 3, 5], // 周一、三、五
              duration: 90
            },
            curriculum: {
              subjects: ['体育理论', '体育实践'],
              objectives: ['提高体育素养', '培养运动习惯'],
              requirements: ['按时参加', '积极参与']
            },
            status: 'active',
            statistics: {
              totalStudents: 1,
              activeStudents: 1,
              averagePerformance: student.learningStats.accuracy,
              totalAssignments: 0,
              totalExams: 0,
              lastActivityDate: new Date()
            },
            metadata: {
              createdBy: teacherUser?._id.toString() || '',
              createdAt: new Date(),
              updatedAt: new Date(),
              tags: ['默认班级', '体育'],
              category: schoolConfig.type
            }
          });

          await defaultClass.save();
          console.log(`✅ 创建班级: ${defaultClass.name}`);
        }
      }

      console.log(`🎉 学校 ${schoolConfig.name} 账户创建完成！`);
    }

    // 6. 显示创建总结
    console.log('\n📊 融梦体育科技学校账户创建总结:');
    console.log('='.repeat(60));
    
    for (const schoolConfig of schools) {
      const institution = await Institution.findOne({ name: schoolConfig.name });
      const teacher = await User.findOne({ email: schoolConfig.teacherEmail });
      const student = await User.findOne({ email: schoolConfig.studentEmail });
      
      console.log(`\n🏛️ ${schoolConfig.name}`);
      console.log(`   📧 机构邮箱: ${institution?.contact.email}`);
      console.log(`   👨‍🏫 教师账户: ${teacher?.username} (${teacher?.email})`);
      console.log(`   👨‍🎓 学生账户: ${student?.username} (${student?.email})`);
      console.log(`   🔑 默认密码: password123`);
    }

    console.log('\n🔑 登录信息汇总:');
    console.log('='.repeat(60));
    console.log('**教师账户**:');
    for (const schoolConfig of schools) {
      console.log(`${schoolConfig.name} - ${schoolConfig.teacherEmail} / password123`);
    }
    console.log('\n**学生账户**:');
    for (const schoolConfig of schools) {
      console.log(`${schoolConfig.name} - ${schoolConfig.studentEmail} / password123`);
    }

    console.log('\n✨ 所有融梦体育科技学校账户创建完成！');

  } catch (error: any) {
    console.error('❌ 创建学校账户失败:', error.message);
    console.error(error);
  }
};

const main = async () => {
  await connectDB();
  await createSchoolAccounts();
  await mongoose.connection.close();
  console.log('📦 数据库连接已关闭');
};

// 直接执行
main(); 