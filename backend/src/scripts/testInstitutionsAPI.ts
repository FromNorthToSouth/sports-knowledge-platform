import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Institution } from '../models/Institution';

dotenv.config();

const testInstitutionsAPI = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('📦 MongoDB 连接成功');

    // 1. 检查数据库中的机构数据
    console.log('\n🔍 检查数据库中的机构数据:');
    const institutions = await Institution.find({}).select('name type description status').lean();
    
    console.log(`发现 ${institutions.length} 个机构:`);
    institutions.forEach((inst, index) => {
      console.log(`${index + 1}. ${inst.name} (${inst.type}) - ${inst.status}`);
    });

    // 2. 模拟API响应格式
    console.log('\n📋 API响应格式:');
    const apiResponse = {
      success: true,
      data: {
        institutions: institutions.map(inst => ({
          _id: inst._id,
          name: inst.name,
          type: inst.type,
          description: inst.description,
          status: inst.status
        })),
        pagination: {
          current: 1,
          pageSize: 20,
          total: institutions.length,
          totalPages: Math.ceil(institutions.length / 20)
        }
      }
    };

    console.log('API响应数据结构:');
    console.log(JSON.stringify(apiResponse, null, 2));

    // 3. 检查是否有我们创建的融梦体育科技学校
    console.log('\n🏫 融梦体育科技学校检查:');
    const rongmengSchools = institutions.filter(inst => 
      inst.name.includes('融梦体育科技')
    );
    
    if (rongmengSchools.length > 0) {
      console.log(`✅ 发现 ${rongmengSchools.length} 个融梦体育科技学校:`);
      rongmengSchools.forEach(school => {
        console.log(`   - ${school.name} (${school.type})`);
      });
    } else {
      console.log('❌ 没有发现融梦体育科技学校');
    }

    await mongoose.connection.close();
    console.log('\n📦 数据库连接已关闭');

  } catch (error: any) {
    console.error('❌ 测试失败:', error.message);
    await mongoose.connection.close();
  }
};

testInstitutionsAPI(); 