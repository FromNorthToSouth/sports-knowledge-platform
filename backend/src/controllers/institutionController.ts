import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Institution, IInstitution } from '../models/Institution';
import User from '../models/User';
import { Class } from '../models/Class';
import mongoose from 'mongoose';

// 获取机构列表
export const getInstitutions = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      keyword,
      type,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // 构建查询条件
    const query: any = {};
    
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { 'contact.email': { $regex: keyword, $options: 'i' } }
      ];
    }

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    // 排序选项
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    // 分页
    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);

    const [institutions, total] = await Promise.all([
      Institution.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(pageSize as string))
        .populate('adminUsers', 'username email')
        .lean(),
      Institution.countDocuments(query)
    ]);

    // 为每个机构添加统计信息
    const institutionsWithStats = await Promise.all(
      institutions.map(async (institution) => {
        const [userCount, classCount] = await Promise.all([
          User.countDocuments({ institution: institution._id }),
          Class.countDocuments({ institutionId: institution._id })
        ]);

        return {
          ...institution,
          statistics: {
            totalUsers: userCount,
            totalClasses: classCount,
            activeUsers: 0, // 这里可以添加活跃用户统计
            storageUsed: 0  // 这里可以添加存储使用统计
          }
        };
      })
    );

    res.json({
      success: true,
      data: {
        institutions: institutionsWithStats,
        pagination: {
          current: parseInt(page as string),
          pageSize: parseInt(pageSize as string),
          total,
          totalPages: Math.ceil(total / parseInt(pageSize as string))
        }
      }
    });
  } catch (error: any) {
    console.error('获取机构列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取机构列表失败',
      error: error.message
    });
  }
};

// 获取单个机构详情
export const getInstitution = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的机构ID'
      });
    }

    const institution = await Institution.findById(id)
      .populate('adminUsers', 'username email avatar role')
      .lean();

    if (!institution) {
      return res.status(404).json({
        success: false,
        message: '机构不存在'
      });
    }

    // 获取机构详细统计
    const [
      totalUsers,
      totalClasses,
      totalTeachers,
      totalStudents,
      recentUsers
    ] = await Promise.all([
      User.countDocuments({ institution: id }),
      Class.countDocuments({ institutionId: id }),
      User.countDocuments({ institution: id, role: 'teacher' }),
      User.countDocuments({ institution: id, role: 'student' }),
      User.find({ institution: id })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('username email role createdAt')
        .lean()
    ]);

    const institutionWithDetails = {
      ...institution,
      statistics: {
        totalUsers,
        totalClasses,
        totalTeachers,
        totalStudents,
        recentUsers
      }
    };

    res.json({
      success: true,
      data: institutionWithDetails
    });
  } catch (error: any) {
    console.error('获取机构详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取机构详情失败',
      error: error.message
    });
  }
};

// 创建机构
export const createInstitution = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    // 权限检查
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    const {
      name,
      type,
      description,
      address,
      contact,
      settings,
      adminUserIds
    } = req.body;

    // 必填字段验证
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: '机构名称和类型为必填项'
      });
    }

    // 检查机构名称是否已存在
    const existingInstitution = await Institution.findOne({ name });
    if (existingInstitution) {
      return res.status(400).json({
        success: false,
        message: '机构名称已存在'
      });
    }

    // 验证管理员用户ID
    let validAdminUsers = [];
    if (adminUserIds && adminUserIds.length > 0) {
      const adminUsers = await User.find({
        _id: { $in: adminUserIds },
        role: { $in: ['admin', 'teacher'] }
      }).select('_id').lean();
      
      validAdminUsers = adminUsers.map(u => u._id);
    }

    // 创建机构
    const institution = new Institution({
      name,
      type,
      description: description || '',
      address,
      contact: contact || {},
      settings: {
        maxUsers: settings?.maxUsers || 1000,
        enabledFeatures: settings?.enabledFeatures || ['basic'],
        customization: settings?.customization || {},
        ...settings
      },
      adminUsers: validAdminUsers,
      createdBy: user.id,
      status: 'active'
    });

    const savedInstitution = await institution.save();

          // 更新管理员用户的机构信息
      if (validAdminUsers.length > 0) {
        await User.updateMany(
          { _id: { $in: validAdminUsers } },
          { $set: { institution: savedInstitution._id } }
        );
      }

    res.status(201).json({
      success: true,
      data: savedInstitution,
      message: '机构创建成功'
    });
  } catch (error: any) {
    console.error('创建机构失败:', error);
    res.status(500).json({
      success: false,
      message: '创建机构失败',
      error: error.message
    });
  }
};

// 更新机构信息
export const updateInstitution = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // 权限检查
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的机构ID'
      });
    }

    const institution = await Institution.findById(id);
    if (!institution) {
      return res.status(404).json({
        success: false,
        message: '机构不存在'
      });
    }

    const {
      name,
      type,
      description,
      address,
      contact,
      settings,
      status,
      adminUserIds
    } = req.body;

    // 如果更新名称，检查是否重复
    if (name && name !== institution.name) {
      const existingInstitution = await Institution.findOne({ name, _id: { $ne: id } });
      if (existingInstitution) {
        return res.status(400).json({
          success: false,
          message: '机构名称已存在'
        });
      }
    }

    // 验证新的管理员用户ID
    let validAdminUsers = institution.adminUsers;
    if (adminUserIds !== undefined) {
      if (adminUserIds.length > 0) {
        const adminUsers = await User.find({
          _id: { $in: adminUserIds },
          role: { $in: ['admin', 'teacher'] }
        }).select('_id').lean();
        
        validAdminUsers = adminUsers.map(u => u._id);
      } else {
        validAdminUsers = [];
      }
    }

    // 更新机构信息
    const updateData: any = {
      ...(name && { name }),
      ...(type && { type }),
      ...(description !== undefined && { description }),
      ...(address && { address }),
      ...(contact && { contact: { ...institution.contact, ...contact } }),
      ...(settings && { settings: { ...institution.settings, ...settings } }),
      ...(status && { status }),
      adminUsers: validAdminUsers,
      updatedAt: new Date()
    };

    const updatedInstitution = await Institution.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('adminUsers', 'username email avatar role');

    // 更新管理员用户的机构信息
    if (adminUserIds !== undefined) {
      // 清除原管理员的机构关联
      await User.updateMany(
        { institution: id },
        { $unset: { institution: 1 } }
      );
      
      // 设置新管理员的机构关联
      if (validAdminUsers.length > 0) {
        await User.updateMany(
          { _id: { $in: validAdminUsers } },
          { $set: { institution: id } }
        );
      }
    }

    res.json({
      success: true,
      data: updatedInstitution,
      message: '机构信息更新成功'
    });
  } catch (error: any) {
    console.error('更新机构失败:', error);
    res.status(500).json({
      success: false,
      message: '更新机构失败',
      error: error.message
    });
  }
};

// 删除机构
export const deleteInstitution = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // 权限检查
    if (!user || user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: '只有超级管理员可以删除机构'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的机构ID'
      });
    }

    const institution = await Institution.findById(id);
    if (!institution) {
      return res.status(404).json({
        success: false,
        message: '机构不存在'
      });
    }

    // 检查是否有关联用户
    const userCount = await User.countDocuments({ institution: id });
    if (userCount > 0) {
      return res.status(400).json({
        success: false,
        message: `无法删除机构，还有 ${userCount} 个用户关联到此机构`
      });
    }

    // 检查是否有关联班级
    const classCount = await Class.countDocuments({ institutionId: id });
    if (classCount > 0) {
      return res.status(400).json({
        success: false,
        message: `无法删除机构，还有 ${classCount} 个班级关联到此机构`
      });
    }

    await Institution.findByIdAndDelete(id);

    res.json({
      success: true,
      message: '机构删除成功'
    });
  } catch (error: any) {
    console.error('删除机构失败:', error);
    res.status(500).json({
      success: false,
      message: '删除机构失败',
      error: error.message
    });
  }
};

// 获取机构用户列表
export const getInstitutionUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      page = 1,
      pageSize = 20,
      role,
      status,
      keyword
    } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的机构ID'
      });
    }

    // 构建查询条件
    const query: any = { institution: id };
    
    if (role) {
      query.role = role;
    }

    if (status) {
      query.status = status;
    }

    if (keyword) {
      query.$or = [
        { username: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('username email role status avatar createdAt lastLoginAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(pageSize as string))
        .lean(),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page as string),
          pageSize: parseInt(pageSize as string),
          total,
          totalPages: Math.ceil(total / parseInt(pageSize as string))
        }
      }
    });
  } catch (error: any) {
    console.error('获取机构用户失败:', error);
    res.status(500).json({
      success: false,
      message: '获取机构用户失败',
      error: error.message
    });
  }
};

// 添加用户到机构
export const addUserToInstitution = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const { userIds, emails, role = 'student' } = req.body;

    // 权限检查
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的机构ID'
      });
    }

    const institution = await Institution.findById(id);
    if (!institution) {
      return res.status(404).json({
        success: false,
        message: '机构不存在'
      });
    }

    let targetUsers = [];

    // 根据用户ID查找用户
    if (userIds && userIds.length > 0) {
      const users = await User.find({ _id: { $in: userIds } });
      targetUsers.push(...users);
    }

    // 根据邮箱查找用户
    if (emails && emails.length > 0) {
      const users = await User.find({ email: { $in: emails } });
      targetUsers.push(...users);
    }

    if (targetUsers.length === 0) {
      return res.status(400).json({
        success: false,
        message: '未找到要添加的用户'
      });
    }

    // 检查机构用户数量限制
    const currentUserCount = await User.countDocuments({ institutionId: id });
    if (currentUserCount + targetUsers.length > institution.settings.maxUsers) {
      return res.status(400).json({
        success: false,
        message: `机构用户数量将超过限制 (${institution.settings.maxUsers})`
      });
    }

    // 更新用户的机构信息
    const updatedUsers = [];
    for (const targetUser of targetUsers) {
      if (targetUser.institution && targetUser.institution.toString() !== id) {
        // 用户已属于其他机构，需要特殊处理
        continue;
      }

      targetUser.institution = new mongoose.Types.ObjectId(id);
      if (role && ['student', 'teacher'].includes(role)) {
        targetUser.role = role;
      }
      
      await targetUser.save();
      updatedUsers.push(targetUser);
    }

    res.json({
      success: true,
      data: {
        addedUsers: updatedUsers.length,
        users: updatedUsers.map(u => ({
          id: u._id,
          username: u.username,
          email: u.email,
          role: u.role
        }))
      },
      message: `成功添加 ${updatedUsers.length} 个用户到机构`
    });
  } catch (error: any) {
    console.error('添加用户到机构失败:', error);
    res.status(500).json({
      success: false,
      message: '添加用户到机构失败',
      error: error.message
    });
  }
};

// 从机构移除用户
export const removeUserFromInstitution = async (req: AuthRequest, res: Response) => {
  try {
    const { id, userId } = req.params;
    const user = req.user;

    // 权限检查
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: '无效的ID'
      });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    if (!targetUser.institution || targetUser.institution.toString() !== id) {
      return res.status(400).json({
        success: false,
        message: '用户不属于此机构'
      });
    }

    // 检查是否是机构管理员
    const institution = await Institution.findById(id);
    if (institution && institution.adminUsers.includes(targetUser._id)) {
      return res.status(400).json({
        success: false,
        message: '无法移除机构管理员，请先取消其管理员权限'
      });
    }

    // 移除用户的机构关联
    targetUser.institution = undefined;
    await targetUser.save();

    res.json({
      success: true,
      message: '用户已从机构中移除'
    });
  } catch (error: any) {
    console.error('移除用户失败:', error);
    res.status(500).json({
      success: false,
      message: '移除用户失败',
      error: error.message
    });
  }
};

// 获取机构统计信息
export const getInstitutionStats = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { timeRange = '30d' } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的机构ID'
      });
    }

    // 时间过滤
    let dateFilter = {};
    if (timeRange === '7d') {
      dateFilter = { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } };
    } else if (timeRange === '30d') {
      dateFilter = { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } };
    }

    // 并行获取各种统计数据
    const [
      totalUsers,
      newUsersInPeriod,
      usersByRole,
      totalClasses,
      newClassesInPeriod,
      activeUsers // 这里可以根据最后登录时间定义活跃用户
    ] = await Promise.all([
      User.countDocuments({ institution: id }),
      User.countDocuments({ institution: id, ...dateFilter }),
      User.aggregate([
        { $match: { institution: new mongoose.Types.ObjectId(id) } },
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]),
      Class.countDocuments({ institutionId: id }),
      Class.countDocuments({ institutionId: id, ...dateFilter }),
      User.countDocuments({
        institution: id,
        lastLoginAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
    ]);

    // 处理角色统计数据
    const roleStats = usersByRole.reduce((acc: any, item: any) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const stats = {
      overview: {
        totalUsers,
        totalClasses,
        activeUsers,
        newUsersInPeriod,
        newClassesInPeriod
      },
      userStats: {
        byRole: {
          students: roleStats.student || 0,
          teachers: roleStats.teacher || 0,
          admins: roleStats.admin || 0
        },
        activeRate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
      },
      timeRange
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('获取机构统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取机构统计失败',
      error: error.message
    });
  }
};

// 批量操作
export const batchOperations = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { action, institutionIds, data } = req.body;

    // 权限检查
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足'
      });
    }

    if (!action || !institutionIds || !Array.isArray(institutionIds)) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    let result;

    switch (action) {
      case 'updateStatus':
        if (!data.status) {
          return res.status(400).json({
            success: false,
            message: '缺少状态参数'
          });
        }
        
        result = await Institution.updateMany(
          { _id: { $in: institutionIds } },
          { $set: { status: data.status, updatedAt: new Date() } }
        );
        break;

      case 'updateSettings':
        if (!data.settings) {
          return res.status(400).json({
            success: false,
            message: '缺少设置参数'
          });
        }
        
        result = await Institution.updateMany(
          { _id: { $in: institutionIds } },
          { $set: { 'settings': data.settings, updatedAt: new Date() } }
        );
        break;

      case 'delete':
        // 检查是否有关联数据
        const usersCount = await User.countDocuments({ institution: { $in: institutionIds } });
        const classesCount = await Class.countDocuments({ institutionId: { $in: institutionIds } });
        
        if (usersCount > 0 || classesCount > 0) {
          return res.status(400).json({
            success: false,
            message: `无法删除，共有 ${usersCount} 个用户和 ${classesCount} 个班级关联到这些机构`
          });
        }
        
        result = await Institution.deleteMany({ _id: { $in: institutionIds } });
        break;

      default:
        return res.status(400).json({
          success: false,
          message: '不支持的操作类型'
        });
    }

    res.json({
      success: true,
      data: {
        affected: 'modifiedCount' in result ? result.modifiedCount : result.deletedCount,
        message: `批量${action}操作完成`
      }
    });
  } catch (error: any) {
    console.error('批量操作失败:', error);
    res.status(500).json({
      success: false,
      message: '批量操作失败',
      error: error.message
    });
  }
}; 

// 获取机构列表（简化版，专为注册页面使用）
export const getInstitutionsForRegistration = async (req: AuthRequest, res: Response) => {
  try {
    const { keyword } = req.query;

    // 构建查询条件
    const query: any = { status: 'active' };
    
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } }
      ];
    }

    // 获取活跃的机构，只返回必要字段
    const institutions = await Institution.find(query)
      .select('name description type')
      .sort({ name: 1 })
      .limit(100) // 限制返回数量
      .lean();

    console.log(`找到 ${institutions.length} 个活跃机构`);

    // 返回简化的数据格式
    res.json({
      success: true,
      data: institutions.map(inst => ({
        _id: inst._id,
        name: inst.name,
        description: inst.description,
        type: inst.type
      }))
    });
  } catch (error: any) {
    console.error('获取注册用机构列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取学校列表失败',
      error: error.message
    });
  }
}; 