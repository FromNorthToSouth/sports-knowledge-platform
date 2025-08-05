import mongoose from 'mongoose';
import { Institution } from '../models/Institution';
import User from '../models/User';
import connectDatabase from '../config/database';

const institutions = [
  {
    name: '北京体育大学',
    type: 'university',
    description: '中国体育最高学府，培养体育人才的摇篮',
    address: {
      country: '中国',
      province: '北京市',
      city: '北京市',
      district: '海淀区',
      street: '信息路48号',
      postalCode: '100084'
    },
    contact: {
      phone: '010-62989047',
      email: 'info@bsu.edu.cn',
      website: 'https://www.bsu.edu.cn'
    },
    status: 'active'
  },
  {
    name: '上海体育学院',
    type: 'university',
    description: '新中国成立最早的体育高等学府之一',
    address: {
      country: '中国',
      province: '上海市',
      city: '上海市',
      district: '杨浦区',
      street: '长海路399号',
      postalCode: '200438'
    },
    contact: {
      phone: '021-65508900',
      email: 'info@sus.edu.cn',
      website: 'https://www.sus.edu.cn'
    },
    status: 'active'
  },
  {
    name: '成都体育学院',
    type: 'university',
    description: '西南地区唯一的高等体育学府',
    address: {
      country: '中国',
      province: '四川省',
      city: '成都市',
      district: '武侯区',
      street: '体院路2号',
      postalCode: '610041'
    },
    contact: {
      phone: '028-85090713',
      email: 'info@cdsu.edu.cn',
      website: 'https://www.cdsu.edu.cn'
    },
    status: 'active'
  },
  {
    name: '北京市第一中学',
    type: 'high_school',
    description: '北京市重点中学，体育教育特色鲜明',
    address: {
      country: '中国',
      province: '北京市',
      city: '北京市',
      district: '东城区',
      street: '史家胡同59号',
      postalCode: '100010'
    },
    contact: {
      phone: '010-65252968',
      email: 'info@bj1z.edu.cn'
    },
    status: 'active'
  },
  {
    name: '深圳中学',
    type: 'high_school',
    description: '广东省重点中学，现代化教育设施完善',
    address: {
      country: '中国',
      province: '广东省',
      city: '深圳市',
      district: '福田区',
      street: '人民北路深中街18号',
      postalCode: '518001'
    },
    contact: {
      phone: '0755-82222572',
      email: 'info@shenzhong.net'
    },
    status: 'active'
  },
  {
    name: '华师一附中',
    type: 'high_school',
    description: '华中师范大学第一附属中学，湖北省示范高中',
    address: {
      country: '中国',
      province: '湖北省',
      city: '武汉市',
      district: '洪山区',
      street: '汉口路3号',
      postalCode: '430223'
    },
    contact: {
      phone: '027-87920649',
      email: 'info@hzsdyfz.com.cn'
    },
    status: 'active'
  },
  {
    name: '北京市育英中学',
    type: 'middle_school',
    description: '海淀区重点中学，体育教育成绩突出',
    address: {
      country: '中国',
      province: '北京市',
      city: '北京市',
      district: '海淀区',
      street: '万寿路西街11号',
      postalCode: '100036'
    },
    contact: {
      phone: '010-68274146',
      email: 'info@yuying.org.cn'
    },
    status: 'active'
  },
  {
    name: '杭州市求是教育集团',
    type: 'middle_school',
    description: '杭州市知名教育集团，注重学生全面发展',
    address: {
      country: '中国',
      province: '浙江省',
      city: '杭州市',
      district: '西湖区',
      street: '曙光路89号',
      postalCode: '310013'
    },
    contact: {
      phone: '0571-87024066',
      email: 'info@qsjy.com'
    },
    status: 'active'
  },
  {
    name: '星海体育培训中心',
    type: 'training_center',
    description: '专业体育培训机构，青少年体育教育专家',
    address: {
      country: '中国',
      province: '广东省',
      city: '广州市',
      district: '天河区',
      street: '体育东路138号',
      postalCode: '510620'
    },
    contact: {
      phone: '020-38765432',
      email: 'info@xinghai-sports.com'
    },
    status: 'active'
  },
  {
    name: '阳光少年体育俱乐部',
    type: 'training_center',
    description: '致力于青少年体育素质提升的专业机构',
    address: {
      country: '中国',
      province: '上海市',
      city: '上海市',
      district: '浦东新区',
      street: '世纪大道1800号',
      postalCode: '200120'
    },
    contact: {
      phone: '021-58791234',
      email: 'info@sunshine-sports.cn'
    },
    status: 'active'
  }
];

async function initInstitutions() {
  try {
    await connectDatabase();
    console.log('数据库连接成功');

    // 检查是否已存在机构数据
    const existingCount = await Institution.countDocuments();
    if (existingCount > 0) {
      console.log(`数据库中已存在 ${existingCount} 个机构，跳过初始化`);
      process.exit(0);
    }

    // 创建默认管理员用户作为机构创建者
    let adminUser = await User.findOne({ role: 'super_admin' });
    if (!adminUser) {
      // 如果没有超级管理员，创建一个临时的
      adminUser = new User({
        username: 'system',
        email: 'system@example.com',
        password: 'temp_password',
        role: 'super_admin',
        status: 'active'
      });
      await adminUser.save();
      console.log('创建了临时系统管理员用户');
    }

    // 批量创建机构
    const institutionPromises = institutions.map(async (instData) => {
      const institution = new Institution({
        ...instData,
        settings: {
          maxUsers: 1000,
          maxClasses: 100,
          maxStorage: 1024,
          enabledFeatures: ['basic'],
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
        adminUsers: [],
        statistics: {
          totalUsers: 0,
          totalClasses: 0,
          totalQuestions: 0,
          storageUsed: 0,
          lastActivityAt: new Date()
        },
        createdBy: adminUser._id
      });

      return await institution.save();
    });

    const createdInstitutions = await Promise.all(institutionPromises);
    console.log(`✅ 成功创建 ${createdInstitutions.length} 个机构:`);
    
    createdInstitutions.forEach((inst, index) => {
      console.log(`${index + 1}. ${inst.name} (${inst.type})`);
    });

    console.log('\n机构数据初始化完成！');
    process.exit(0);
  } catch (error) {
    console.error('❌ 初始化机构数据失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initInstitutions();
}

export default initInstitutions; 