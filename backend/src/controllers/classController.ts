import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Class, ClassGroup, ClassAssignment, ClassAnnouncement, IClass } from '../models/Class';
import mongoose from 'mongoose';

// 获取班级列表
export const getClasses = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      page = 1, 
      pageSize = 10, 
      keyword, 
      grade, 
      institutionId, 
      teacherId, 
      status = 'active' 
    } = req.query;

    const query: any = {};
    
    // 根据用户角色过滤
    if (req.user?.role === 'teacher') {
      query.teacherId = req.user.id;
    } else if (req.user?.role === 'student') {
      query['students.userId'] = req.user.id;
    } else if (institutionId) {
      query.institutionId = institutionId;
    }

    // 添加其他过滤条件
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { teacherName: { $regex: keyword, $options: 'i' } }
      ];
    }

    if (grade) query.grade = grade;
    if (teacherId) query.teacherId = teacherId;
    if (status) query.status = status;

    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    const limit = parseInt(pageSize as string);

    const [classes, total] = await Promise.all([
      Class.find(query)
        .sort({ 'metadata.createdAt': -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Class.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        classes,
        pagination: {
          current: parseInt(page as string),
          pageSize: limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取班级列表失败',
      error: error.message
    });
  }
};

// 获取单个班级详情
export const getClass = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的班级ID'
      });
    }

    const classData = await Class.findById(id).lean();
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: '班级不存在'
      });
    }

    // 检查访问权限
    const canAccess = req.user?.role === 'admin' || 
                     req.user?.role === 'super_admin' ||
                     classData.teacherId === req.user?.id ||
                     classData.students.some(s => s.userId === req.user?.id);

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: '无权访问此班级'
      });
    }

    res.json({
      success: true,
      data: classData
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取班级详情失败',
      error: error.message
    });
  }
};

// 创建班级
export const createClass = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      grade,
      description,
      institutionId,
      teacherId,
      teacherName,
      capacity,
      settings,
      schedule,
      curriculum
    } = req.body;

    // 打印接收到的数据用于调试
    console.log('创建班级接收到的数据:', {
      name,
      grade,
      description,
      institutionId,
      teacherId,
      teacherName,
      capacity,
      settings,
      schedule,
      curriculum
    });

    // 验证必填字段
    const missingFields = [];
    if (!name) missingFields.push('name');
    if (!grade) missingFields.push('grade');
    if (!institutionId) missingFields.push('institutionId');
    if (!teacherId) missingFields.push('teacherId');
    if (!teacherName) missingFields.push('teacherName');

    if (missingFields.length > 0) {
      console.log('缺少的必填字段:', missingFields);
      return res.status(400).json({
        success: false,
        message: `缺少必填字段: ${missingFields.join(', ')}`
      });
    }

    // 权限检查：只有教师和管理员可以创建班级
    if (req.user?.role === 'student') {
      return res.status(403).json({
        success: false,
        message: '学生无权创建班级'
      });
    }

    // 如果是教师角色，只能为自己创建班级
    if (req.user?.role === 'teacher' && teacherId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: '教师只能为自己创建班级'
      });
    }

    const newClass = new Class({
      name,
      grade,
      description,
      institutionId,
      teacherId,
      teacherName,
      capacity: capacity || 50,
      settings: {
        allowSelfEnroll: settings?.allowSelfEnroll || false,
        requireApproval: settings?.requireApproval || true,
        enabledFeatures: settings?.enabledFeatures || [],
        notificationSettings: {
          assignmentReminders: settings?.notificationSettings?.assignmentReminders ?? true,
          gradeUpdates: settings?.notificationSettings?.gradeUpdates ?? true,
          announcements: settings?.notificationSettings?.announcements ?? true
        }
      },
      schedule,
      curriculum,
      metadata: {
        createdBy: req.user?.id || '',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    const savedClass = await newClass.save();

    res.status(201).json({
      success: true,
      data: savedClass,
      message: '班级创建成功'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '创建班级失败',
      error: error.message
    });
  }
};

// 更新班级
export const updateClass = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的班级ID'
      });
    }

    const classData = await Class.findById(id);
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: '班级不存在'
      });
    }

    // 权限检查：只有班级老师和管理员可以更新
    const canUpdate = req.user?.role === 'admin' || 
                     req.user?.role === 'super_admin' ||
                     classData.teacherId === req.user?.id;

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: '无权修改此班级'
      });
    }

    // 更新元数据
    updates['metadata.updatedAt'] = new Date();
    updates['metadata.lastModifiedBy'] = req.user?.id;

    const updatedClass = await Class.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedClass,
      message: '班级更新成功'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '更新班级失败',
      error: error.message
    });
  }
};

// 删除班级
export const deleteClass = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的班级ID'
      });
    }

    const classData = await Class.findById(id);
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: '班级不存在'
      });
    }

    // 权限检查：只有管理员可以删除班级
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: '只有管理员可以删除班级'
      });
    }

    // 软删除：设置状态为archived
    await Class.findByIdAndUpdate(id, {
      status: 'archived',
      'metadata.updatedAt': new Date(),
      'metadata.lastModifiedBy': req.user?.id
    });

    res.json({
      success: true,
      message: '班级删除成功'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '删除班级失败',
      error: error.message
    });
  }
};

// 获取班级学生列表
export const getClassStudents = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { page = 1, pageSize = 20, keyword, status } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的班级ID'
      });
    }

    const classData = await Class.findById(id);
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: '班级不存在'
      });
    }

    // 权限检查
    const canAccess = req.user?.role === 'admin' || 
                     req.user?.role === 'super_admin' ||
                     classData.teacherId === req.user?.id ||
                     classData.students.some(s => s.userId === req.user?.id);

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: '无权访问此班级学生信息'
      });
    }

    let students = classData.students;

    // 过滤条件
    if (keyword) {
      students = students.filter(s => 
        s.username.toLowerCase().includes((keyword as string).toLowerCase())
      );
    }

    if (status) {
      students = students.filter(s => s.status === status);
    }

    // 分页
    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    const limit = parseInt(pageSize as string);
    const paginatedStudents = students.slice(skip, skip + limit);

    res.json({
      success: true,
      data: {
        students: paginatedStudents,
        pagination: {
          current: parseInt(page as string),
          pageSize: limit,
          total: students.length,
          totalPages: Math.ceil(students.length / limit)
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取班级学生失败',
      error: error.message
    });
  }
};

// 添加学生到班级
export const addStudentToClass = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { studentId, email, username, autoApprove = false } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的班级ID'
      });
    }

    if (!studentId && !email && !username) {
      return res.status(400).json({
        success: false,
        message: '请提供学生ID、邮箱或用户名'
      });
    }

    const classData = await Class.findById(id);
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: '班级不存在'
      });
    }

    // 权限检查：只有班级老师和管理员可以添加学生
    const canAdd = req.user?.role === 'admin' || 
                  req.user?.role === 'super_admin' ||
                  classData.teacherId === req.user?.id;

    if (!canAdd) {
      return res.status(403).json({
        success: false,
        message: '无权向此班级添加学生'
      });
    }

    // 检查班级容量
    if (classData.currentStudentCount >= classData.capacity) {
      return res.status(400).json({
        success: false,
        message: '班级已满，无法添加更多学生'
      });
    }

    // 检查学生是否已在班级中
    const existingStudent = classData.students.find(s => 
      s.userId === studentId || s.username === username
    );

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: '学生已在班级中'
      });
    }

    // 添加学生
    const newStudent = {
      userId: studentId || `temp_${Date.now()}`, // 临时ID，应该从用户系统获取真实ID
      username: username || email || `学生${Date.now()}`,
      joinedAt: new Date(),
      status: autoApprove ? 'active' as const : 'pending' as const,
      performance: {
        averageScore: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        lastActiveAt: new Date()
      }
    };

    classData.students.push(newStudent);
    await classData.save();

    res.json({
      success: true,
      data: newStudent,
      message: autoApprove ? '学生添加成功' : '学生添加成功，等待审核'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '添加学生失败',
      error: error.message
    });
  }
};

// 从班级移除学生
export const removeStudentFromClass = async (req: AuthRequest, res: Response) => {
  try {
    const { id, studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的班级ID'
      });
    }

    const classData = await Class.findById(id);
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: '班级不存在'
      });
    }

    // 权限检查
    const canRemove = req.user?.role === 'admin' || 
                     req.user?.role === 'super_admin' ||
                     classData.teacherId === req.user?.id;

    if (!canRemove) {
      return res.status(403).json({
        success: false,
        message: '无权移除班级学生'
      });
    }

    // 查找并移除学生
    const studentIndex = classData.students.findIndex(s => s.userId === studentId);
    
    if (studentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '学生不在班级中'
      });
    }

    classData.students.splice(studentIndex, 1);
    await classData.save();

    res.json({
      success: true,
      message: '学生移除成功'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '移除学生失败',
      error: error.message
    });
  }
};

// 获取班级统计信息
export const getClassStats = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { timeRange = '30d', includeDetails = false } = req.query;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的班级ID'
      });
    }

    const classData = await Class.findById(id);
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: '班级不存在'
      });
    }

    // 权限检查
    const canAccess = req.user?.role === 'admin' || 
                     req.user?.role === 'super_admin' ||
                     classData.teacherId === req.user?.id;

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: '无权查看班级统计'
      });
    }

    const stats = {
      basicInfo: {
        name: classData.name,
        grade: classData.grade,
        teacherName: classData.teacherName,
        capacity: classData.capacity,
        currentStudentCount: classData.currentStudentCount
      },
      studentStats: {
        total: classData.statistics.totalStudents,
        active: classData.statistics.activeStudents,
        pending: classData.students.filter(s => s.status === 'pending').length,
        inactive: classData.students.filter(s => s.status === 'inactive').length
      },
      performanceStats: {
        averagePerformance: classData.statistics.averagePerformance,
        totalAssignments: classData.statistics.totalAssignments,
        totalExams: classData.statistics.totalExams
      },
      activityStats: {
        lastActivityDate: classData.statistics.lastActivityDate,
        createdAt: classData.metadata.createdAt,
        updatedAt: classData.metadata.updatedAt
      }
    };

    if (includeDetails === 'true') {
      // 获取更详细的统计信息
      const assignments = await ClassAssignment.find({ classId: id }).lean();
      const announcements = await ClassAnnouncement.find({ classId: id }).lean();
      
      (stats as any).detailedStats = {
        assignments: assignments.length,
        announcements: announcements.length,
        recentActivity: {
          assignments: assignments.slice(0, 5),
          announcements: announcements.slice(0, 5)
        }
      };
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '获取班级统计失败',
      error: error.message
    });
  }
};

// 批量操作
export const batchOperations = async (req: AuthRequest, res: Response) => {
  try {
    const { action, classIds } = req.body;

    if (!Array.isArray(classIds) || classIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要操作的班级ID列表'
      });
    }

    // 验证所有ID
    const invalidIds = classIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: `无效的班级ID: ${invalidIds.join(', ')}`
      });
    }

    // 权限检查：只有管理员可以批量操作
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: '只有管理员可以进行批量操作'
      });
    }

    const updateData: any = {
      'metadata.updatedAt': new Date(),
      'metadata.lastModifiedBy': req.user?.id
    };

    switch (action) {
      case 'archive':
        updateData.status = 'archived';
        break;
      case 'activate':
        updateData.status = 'active';
        break;
      case 'delete':
        // 实际删除（危险操作）
        const deleteResult = await Class.deleteMany({ _id: { $in: classIds } });
        return res.json({
          success: true,
          data: {
            deletedCount: deleteResult.deletedCount,
            message: `成功删除 ${deleteResult.deletedCount} 个班级`
          }
        });
      default:
        return res.status(400).json({
          success: false,
          message: `不支持的操作: ${action}`
        });
    }

    const result = await Class.updateMany(
      { _id: { $in: classIds } },
      { $set: updateData }
    );

    res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
        message: `成功${action === 'archive' ? '归档' : '激活'} ${result.modifiedCount} 个班级`
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '批量操作失败',
      error: error.message
    });
  }
};

// 导出班级数据
export const exportClassData = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { type } = req.params; // 'students' | 'progress' | 'stats'

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的班级ID'
      });
    }

    const classData = await Class.findById(id);
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: '班级不存在'
      });
    }

    // 权限检查
    const canExport = req.user?.role === 'admin' || 
                     req.user?.role === 'super_admin' ||
                     classData.teacherId === req.user?.id;

    if (!canExport) {
      return res.status(403).json({
        success: false,
        message: '无权导出班级数据'
      });
    }

    let exportData: any;

    switch (type) {
      case 'students':
        exportData = {
          className: classData.name,
          grade: classData.grade,
          teacher: classData.teacherName,
          exportDate: new Date().toISOString(),
          students: classData.students.map(s => ({
            username: s.username,
            status: s.status,
            joinedAt: s.joinedAt,
            averageScore: s.performance?.averageScore || 0,
            totalQuestions: s.performance?.totalQuestions || 0,
            correctAnswers: s.performance?.correctAnswers || 0,
            lastActiveAt: s.performance?.lastActiveAt
          }))
        };
        break;
        
      case 'stats':
        exportData = {
          className: classData.name,
          grade: classData.grade,
          teacher: classData.teacherName,
          exportDate: new Date().toISOString(),
          statistics: classData.statistics,
          studentCount: {
            total: classData.students.length,
            active: classData.students.filter(s => s.status === 'active').length,
            pending: classData.students.filter(s => s.status === 'pending').length,
            inactive: classData.students.filter(s => s.status === 'inactive').length
          }
        };
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: '不支持的导出类型'
        });
    }

    // 设置下载响应头
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${classData.name}_${type}_${new Date().toISOString().slice(0, 10)}.json"`);
    
    res.json(exportData);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '导出数据失败',
      error: error.message
    });
  }
}; 

// 搜索用户（用于添加学生）
export const searchUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      keyword, 
      role = 'student', 
      page = 1, 
      pageSize = 10, 
      excludeClassId 
    } = req.query;

    if (!keyword || (keyword as string).trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: '搜索关键词至少需要2个字符'
      });
    }

    // 构建基础查询条件
    const query: any = {
      role: role,
      isActive: true,
      $or: [
        { username: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } }
      ]
    };

    // 权限控制：教师只能搜索同机构的用户
    if (req.user?.role === 'teacher') {
      query.institution = req.user.institution;
    } else if (req.user?.role === 'admin' || req.user?.role === 'super_admin') {
      // 管理员可以搜索所有用户，但如果指定了机构，则限制在该机构内
      if (req.user.institution) {
        query.institution = req.user.institution;
      }
    }

    // 如果指定了excludeClassId，排除已在该班级中的学生
    if (excludeClassId && mongoose.Types.ObjectId.isValid(excludeClassId as string)) {
      const classData = await Class.findById(excludeClassId).select('students').lean();
      if (classData) {
        const existingUserIds = classData.students.map(s => s.userId);
        query._id = { $nin: existingUserIds };
      }
    }

    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
    const limit = parseInt(pageSize as string);

    const [users, total] = await Promise.all([
      mongoose.model('User').find(query)
        .select('_id username email grade avatar learningStats.accuracy points')
        .populate('institution', 'name')
        .sort({ username: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      mongoose.model('User').countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        users: users.map(user => ({
          id: user._id,
          username: user.username,
          email: user.email,
          grade: user.grade,
          avatar: user.avatar,
          accuracy: user.learningStats?.accuracy || 0,
          points: user.points || 0,
          institution: user.institution
        })),
        pagination: {
          current: parseInt(page as string),
          pageSize: limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '搜索用户失败',
      error: error.message
    });
  }
}; 

// 更新班级中的学生信息
export const updateStudentInClass = async (req: AuthRequest, res: Response) => {
  try {
    const { id, studentId } = req.params;
    const { status, performance } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的班级ID'
      });
    }

    const classData = await Class.findById(id);
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: '班级不存在'
      });
    }

    // 权限检查
    const canUpdate = req.user?.role === 'admin' || 
                     req.user?.role === 'super_admin' ||
                     classData.teacherId === req.user?.id;

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: '无权修改班级学生信息'
      });
    }

    // 查找学生
    const studentIndex = classData.students.findIndex(s => s.userId === studentId);
    
    if (studentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '学生不在班级中'
      });
    }

    // 更新学生信息
    if (status) {
      classData.students[studentIndex].status = status;
    }

    if (performance) {
      classData.students[studentIndex].performance = {
        ...classData.students[studentIndex].performance,
        ...performance
      };
    }

    await classData.save();

    res.json({
      success: true,
      data: classData.students[studentIndex],
      message: '学生信息更新成功'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '更新学生信息失败',
      error: error.message
    });
  }
}; 

// 批量添加学生到班级
export const batchAddStudents = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { students, autoApprove = false } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: '无效的班级ID'
      });
    }

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供学生列表'
      });
    }

    const classData = await Class.findById(id);
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: '班级不存在'
      });
    }

    // 权限检查
    const canAdd = req.user?.role === 'admin' || 
                  req.user?.role === 'super_admin' ||
                  classData.teacherId === req.user?.id;

    if (!canAdd) {
      return res.status(403).json({
        success: false,
        message: '无权向此班级添加学生'
      });
    }

    const results = [];
    let successCount = 0;

    for (const student of students) {
      try {
        const { studentId, email, username } = student;

        // 验证必要信息
        if (!studentId && !email && !username) {
          results.push({
            student: '未知学生',
            success: false,
            message: '缺少学生信息',
            error: 'Missing student information'
          });
          continue;
        }

        // 检查学生是否已在班级中
        const existingStudent = classData.students.find(s => 
          s.userId === studentId || s.username === username
        );

        if (existingStudent) {
          results.push({
            student: username || email || studentId,
            success: false,
            message: '学生已在班级中',
            error: 'Student already in class'
          });
          continue;
        }

        // 检查班级容量
        if (classData.currentStudentCount >= classData.capacity) {
          results.push({
            student: username || email || studentId,
            success: false,
            message: '班级已满',
            error: 'Class is full'
          });
          continue;
        }

        // 添加学生
        const newStudent = {
          userId: studentId || `temp_${Date.now()}_${Math.random()}`,
          username: username || email || `学生${Date.now()}`,
          joinedAt: new Date(),
          status: autoApprove ? 'active' as const : 'pending' as const,
          performance: {
            averageScore: 0,
            totalQuestions: 0,
            correctAnswers: 0,
            lastActiveAt: new Date()
          }
        };

        classData.students.push(newStudent);
        classData.currentStudentCount += 1;
        successCount++;

        results.push({
          student: username || email || studentId,
          success: true,
          message: autoApprove ? '添加成功' : '添加成功，等待审核',
          data: {
            userId: newStudent.userId,
            username: newStudent.username,
            status: newStudent.status
          }
        });

      } catch (error: any) {
        results.push({
          student: student.username || student.email || student.studentId || '未知学生',
          success: false,
          message: '添加失败',
          error: error.message
        });
      }
    }

    // 保存班级数据
    if (successCount > 0) {
      await classData.save();
    }

    res.json({
      success: true,
      data: {
        total: students.length,
        success: successCount,
        failed: students.length - successCount,
        results
      },
      message: `批量添加完成：成功 ${successCount} 人，失败 ${students.length - successCount} 人`
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: '批量添加学生失败',
      error: error.message
    });
  }
}; 