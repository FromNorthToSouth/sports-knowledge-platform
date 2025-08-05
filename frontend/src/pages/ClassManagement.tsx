import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Space,
  Tag,
  Avatar,
  Statistic,
  Row,
  Col,
  Tabs,
  Progress,
  Typography,
  Badge,
  Tooltip,
  Divider,
  AutoComplete,
  Spin
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  BookOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  StarOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  FireOutlined,
  CalendarOutlined,
  BarChartOutlined,
  LineChartOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { RootState } from '../types';
import { useTheme } from '../hooks/useTheme';
import '../styles/modern-theme.css';
import { classAPI } from '../services/classAPI';

const { Option } = Select;
const { TabPane } = Tabs;
const { Title, Text } = Typography;

interface Student {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  grade: string;
  classInfo: string;
  learningStats: {
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
    totalTime: number;
    continuousLoginDays: number;
    lastLoginDate: string;
  };
  points: number;
  isActive: boolean;
}

interface Class {
  id: string;
  name: string;
  grade: string;
  subject: string;
  studentCount: number;
  description?: string;
  createdAt: string;
}

const ClassManagement: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('classes');
  
  // 新增学生管理相关状态
  const [studentModalVisible, setStudentModalVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentModalType, setStudentModalType] = useState<'add' | 'edit'>('add');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  
  // 用户搜索相关状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { isDark, primaryColor } = useTheme();
  const [form] = Form.useForm();
  const [studentForm] = Form.useForm(); // 新增学生表单

  // 模拟数据 - 实际应用中应该从API获取
  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const response = await classAPI.getClasses({
        teacherId: user?.id, // 只获取当前教师的班级
        status: 'active'
      });
      
      if (response.data.success) {
        // 转换数据格式以匹配组件接口
        const apiClasses = response.data.data.classes.map((cls: any) => ({
          id: cls._id,
          name: cls.name,
          grade: cls.grade,
          subject: '体育', // 默认学科
          studentCount: cls.students?.length || 0,
          description: cls.description || '',
          createdAt: cls.metadata?.createdAt || new Date().toISOString()
        }));
        setClasses(apiClasses);
        
        // 如果当前有选中的班级，重新加载其学生数据以确保数据同步
        if (selectedClass && apiClasses.find((c: Class) => c.id === selectedClass)) {
          loadStudents(selectedClass);
        }
      } else {
        console.warn('获取班级列表失败，使用模拟数据');
        setClasses([]); // 如果API调用失败，显示空列表
      }
    } catch (error) {
      console.error('加载班级列表失败:', error);
      message.warning('加载班级列表失败，请检查网络连接');
      setClasses([]); // 发生错误时显示空列表
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async (classId: string) => {
    setLoading(true);
    try {
      const response = await classAPI.getClassStudents(classId, {
        pageSize: 100, // 获取更多学生数据
        status: 'active'
      });
      
      if (response.data.success) {
        // 转换API数据格式以匹配组件接口
        const apiStudents = response.data.data.students.map((student: any) => ({
          id: student.userId || student._id,
          username: student.username,
          email: student.email || '',
          avatar: student.avatar || '',
          grade: student.grade || '',
          classInfo: classes.find(c => c.id === classId)?.name || '',
          learningStats: {
            totalQuestions: student.learningStats?.totalQuestions || 0,
            correctAnswers: student.learningStats?.correctAnswers || 0,
            accuracy: student.learningStats?.accuracy || 0,
            totalTime: student.learningStats?.totalTime || 0,
            continuousLoginDays: student.learningStats?.continuousLoginDays || 0,
            lastLoginDate: student.learningStats?.lastLoginDate || new Date().toISOString()
          },
          points: student.points || 0,
          isActive: student.status === 'active'
        }));
        setStudents(apiStudents);
        
        // 更新选中班级的实际学生数量
        setClasses(prevClasses => 
          prevClasses.map(cls => 
            cls.id === classId 
              ? { ...cls, studentCount: apiStudents.length }
              : cls
          )
        );
      } else {
        console.warn('获取学生列表失败，使用空列表');
        setStudents([]);
      }
    } catch (error) {
      console.error('加载学生列表失败:', error);
      message.warning('加载学生列表失败，显示模拟数据');
      
      // 如果API调用失败，使用模拟数据
      const selectedClassName = classes.find(c => c.id === classId)?.name || '';
      const mockStudents: Student[] = [
        {
          id: '1',
          username: '张小明',
          email: 'zhangxiaoming@student.com',
          avatar: '',
          grade: '三年级',
          classInfo: selectedClassName,
          learningStats: {
            totalQuestions: 245,
            correctAnswers: 196,
            accuracy: 80,
            totalTime: 7200,
            continuousLoginDays: 12,
            lastLoginDate: '2024-01-20'
          },
          points: 2450,
          isActive: true
        },
        {
          id: '2',
          username: '李小红',
          email: 'lixiaohong@student.com',
          avatar: '',
          grade: '三年级',
          classInfo: selectedClassName,
          learningStats: {
            totalQuestions: 312,
            correctAnswers: 281,
            accuracy: 90,
            totalTime: 9600,
            continuousLoginDays: 18,
            lastLoginDate: '2024-01-20'
          },
          points: 3120,
          isActive: true
        },
        {
          id: '3',
          username: '王小强',
          email: 'wangxiaoqiang@student.com',
          avatar: '',
          grade: '三年级',
          classInfo: selectedClassName,
          learningStats: {
            totalQuestions: 189,
            correctAnswers: 132,
            accuracy: 70,
            totalTime: 5400,
            continuousLoginDays: 5,
            lastLoginDate: '2024-01-19'
          },
          points: 1890,
          isActive: true
        },
        {
          id: '4',
          username: '刘小美',
          email: 'liuxiaomei@student.com',
          avatar: '',
          grade: '三年级',
          classInfo: selectedClassName,
          learningStats: {
            totalQuestions: 267,
            correctAnswers: 227,
            accuracy: 85,
            totalTime: 8100,
            continuousLoginDays: 15,
            lastLoginDate: '2024-01-20'
          },
          points: 2670,
          isActive: true
        },
        {
          id: '5',
          username: '陈小军',
          email: 'chenxiaojun@student.com',
          avatar: '',
          grade: '三年级',
          classInfo: selectedClassName,
          learningStats: {
            totalQuestions: 156,
            correctAnswers: 109,
            accuracy: 70,
            totalTime: 4680,
            continuousLoginDays: 3,
            lastLoginDate: '2024-01-18'
          },
          points: 1560,
          isActive: false
        },
        {
          id: '6',
          username: '周小花',
          email: 'zhouxiaohua@student.com',
          avatar: '',
          grade: '三年级',
          classInfo: selectedClassName,
          learningStats: {
            totalQuestions: 298,
            correctAnswers: 268,
            accuracy: 90,
            totalTime: 8940,
            continuousLoginDays: 21,
            lastLoginDate: '2024-01-20'
          },
          points: 2980,
          isActive: true
        },
        {
          id: '7',
          username: '吴小亮',
          email: 'wuxiaoliang@student.com',
          avatar: '',
          grade: '三年级',
          classInfo: selectedClassName,
          learningStats: {
            totalQuestions: 223,
            correctAnswers: 178,
            accuracy: 80,
            totalTime: 6690,
            continuousLoginDays: 8,
            lastLoginDate: '2024-01-20'
          },
          points: 2230,
          isActive: true
        },
        {
          id: '8',
          username: '赵小芳',
          email: 'zhaoxiaofang@student.com',
          avatar: '',
          grade: '三年级',
          classInfo: selectedClassName,
          learningStats: {
            totalQuestions: 201,
            correctAnswers: 161,
            accuracy: 80,
            totalTime: 6030,
            continuousLoginDays: 7,
            lastLoginDate: '2024-01-19'
          },
          points: 2010,
          isActive: true
        }
      ];
      setStudents(mockStudents);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = () => {
    setEditingClass(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditClass = (classItem: Class) => {
    setEditingClass(classItem);
    form.setFieldsValue(classItem);
    setModalVisible(true);
  };

  const handleDeleteClass = (classId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个班级吗？此操作不可恢复。',
      onOk: async () => {
        try {
          const response = await classAPI.deleteClass(classId);
          if (response.data.success) {
            message.success('班级删除成功');
            loadClasses();
          } else {
            message.error(response.data.message || '删除班级失败');
          }
        } catch (error: any) {
          console.error('删除班级失败:', error);
          const errorMessage = error.response?.data?.message || error.message || '删除班级失败';
          message.error(errorMessage);
        }
      }
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingClass) {
        // 更新班级
        const response = await classAPI.updateClass(editingClass.id, {
          name: values.name,
          grade: values.grade,
          description: values.description
        });
        
        if (response.data.success) {
          message.success('班级更新成功');
          setModalVisible(false);
          loadClasses();
        } else {
          message.error(response.data.message || '更新班级失败');
        }
      } else {
        // 创建班级
        console.log('当前用户信息:', user); // 调试信息
        
        if (!user?.id || !user?.username) {
          message.error('用户基本信息不完整，请重新登录');
          return;
        }

        // 获取机构ID
        let institutionId = '';
        if (user.institution) {
          // 处理不同的institution数据结构
          if (typeof user.institution === 'string') {
            institutionId = user.institution;
          } else if (user.institution.id) {
            institutionId = user.institution.id;
          } else if ((user.institution as any)._id) {
            institutionId = (user.institution as any)._id;
          }
        }

        console.log('提取的机构ID:', institutionId); // 调试信息

        if (!institutionId) {
          message.error('无法获取机构信息，请联系管理员');
          return;
        }

        // 验证所有必填字段
        const requiredFields = {
          name: values.name,
          grade: values.grade,
          institutionId,
          teacherId: user.id,
          teacherName: user.username
        };

        console.log('必填字段验证:', requiredFields); // 调试信息

        // 检查是否有空值
        for (const [key, value] of Object.entries(requiredFields)) {
          if (!value || value === '') {
            message.error(`缺少必填字段: ${key}`);
            console.error(`缺少必填字段: ${key}`, value);
            return;
          }
        }

        const createData = {
          name: values.name,
          grade: values.grade,
          description: values.description || '',
          institutionId,
          teacherId: user.id,
          teacherName: user.username,
          capacity: values.capacity || 50,
          settings: {
            allowSelfEnroll: values.allowSelfEnroll || false,
            requireApproval: values.requireApproval !== false,
            enabledFeatures: []
          }
        };

        console.log('发送创建班级请求:', createData); // 调试信息

        const response = await classAPI.createClass(createData);
        
        if (response.data.success) {
          message.success('班级创建成功');
          setModalVisible(false);
          form.resetFields();
          loadClasses();
        } else {
          message.error(response.data.message || '创建班级失败');
        }
      }
    } catch (error: any) {
      console.error('操作失败:', error);
      console.error('错误详情:', error.response?.data); // 详细错误信息
      const errorMessage = error.response?.data?.message || error.message || '操作失败';
      message.error(errorMessage);
    }
  };

  // ========== 学生管理相关函数 ==========
  
  // 搜索用户
  const searchUsersForClass = async (keyword: string) => {
    if (!keyword || keyword.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await classAPI.searchUsers({
        keyword: keyword.trim(),
        role: 'student',
        pageSize: 20,
        excludeClassId: selectedClass || undefined
      });

      if (response.data.success) {
        setSearchResults(response.data.data.users);
      } else {
        setSearchResults([]);
        message.warning('搜索用户失败');
      }
    } catch (error: any) {
      console.error('搜索用户失败:', error);
      setSearchResults([]);
      message.error('搜索用户失败');
    } finally {
      setSearchLoading(false);
    }
  };

  // 从搜索结果中选择用户
  const handleSelectUserFromSearch = (user: any) => {
    studentForm.setFieldsValue({
      username: user.username,
      email: user.email,
      selectedUserId: user.id
    });
    setSearchKeyword(user.username);
    setSearchResults([]);
  };
  
  // 添加学生
  const handleAddStudent = () => {
    setEditingStudent(null);
    setStudentModalType('add');
    studentForm.resetFields();
    setSearchKeyword('');
    setSearchResults([]);
    setStudentModalVisible(true);
  };

  // 编辑学生
  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setStudentModalType('edit');
    studentForm.setFieldsValue({
      username: student.username,
      email: student.email,
      status: student.isActive ? 'active' : 'inactive'
    });
    setStudentModalVisible(true);
  };

  // 删除学生
  const handleDeleteStudent = (studentId: string, studentName: string) => {
    if (!selectedClass) return;
    
    Modal.confirm({
      title: '确认移除',
      content: `确定要将学生 "${studentName}" 从班级中移除吗？`,
      onOk: async () => {
        try {
          const response = await classAPI.removeStudentFromClass(selectedClass, studentId);
          if (response.data.success) {
            message.success('学生移除成功');
            loadStudents(selectedClass);
          } else {
            message.error(response.data.message || '移除学生失败');
          }
        } catch (error: any) {
          console.error('移除学生失败:', error);
          const errorMessage = error.response?.data?.message || error.message || '移除学生失败';
          message.error(errorMessage);
        }
      }
    });
  };

  // 切换学生状态
  const handleToggleStudentStatus = async (student: Student) => {
    if (!selectedClass) return;
    
    const newStatus = student.isActive ? 'inactive' : 'active';
    
    try {
      const response = await classAPI.updateStudentInClass(selectedClass, student.id, {
        status: newStatus
      });
      
      if (response.data.success) {
        message.success(`学生状态已更新为${newStatus === 'active' ? '活跃' : '不活跃'}`);
        loadStudents(selectedClass);
      } else {
        message.error(response.data.message || '更新状态失败');
      }
    } catch (error: any) {
      console.error('更新学生状态失败:', error);
      const errorMessage = error.response?.data?.message || error.message || '更新状态失败';
      message.error(errorMessage);
    }
  };

  // 提交学生表单
  const handleStudentSubmit = async (values: any) => {
    if (!selectedClass) return;

    try {
      if (studentModalType === 'add') {
        // 添加新学生
        const addData: any = {
          autoApprove: true
        };

        // 如果有选中的用户ID，使用用户ID
        if (values.selectedUserId) {
          addData.studentId = values.selectedUserId;
        } else {
          // 否则使用用户名和邮箱
          addData.username = values.username;
          addData.email = values.email;
        }

        const response = await classAPI.addStudentToClass(selectedClass, addData);
        
        if (response.data.success) {
          message.success('学生添加成功');
          setStudentModalVisible(false);
          studentForm.resetFields();
          setSearchKeyword('');
          setSearchResults([]);
          loadStudents(selectedClass);
        } else {
          message.error(response.data.message || '添加学生失败');
        }
      } else {
        // 编辑学生信息
        const response = await classAPI.updateStudentInClass(selectedClass, editingStudent!.id, {
          status: values.status
        });
        
        if (response.data.success) {
          message.success('学生信息更新成功');
          setStudentModalVisible(false);
          studentForm.resetFields();
          loadStudents(selectedClass);
        } else {
          message.error(response.data.message || '更新学生信息失败');
        }
      }
    } catch (error: any) {
      console.error('操作失败:', error);
      const errorMessage = error.response?.data?.message || error.message || '操作失败';
      message.error(errorMessage);
    }
  };

  // 批量删除学生
  const handleBatchDeleteStudents = () => {
    if (!selectedClass || selectedStudents.length === 0) return;
    
    Modal.confirm({
      title: '批量移除学生',
      content: `确定要移除选中的 ${selectedStudents.length} 名学生吗？`,
      onOk: async () => {
        try {
          const promises = selectedStudents.map(studentId =>
            classAPI.removeStudentFromClass(selectedClass, studentId)
          );
          
          await Promise.all(promises);
          message.success(`成功移除 ${selectedStudents.length} 名学生`);
          setSelectedStudents([]);
          loadStudents(selectedClass);
        } catch (error: any) {
          console.error('批量移除失败:', error);
          message.error('批量移除失败');
        }
      }
    });
  };

  // 批量添加学生
  const handleBatchAddStudents = () => {
    setBatchModalVisible(true);
  };

  // 处理批量添加学生表单提交
  const handleBatchSubmit = async (values: any) => {
    if (!selectedClass) return;

    try {
      const students = values.studentsText
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0)
        .map((line: string) => {
          // 支持多种格式: 用户名, 邮箱, 用户名,邮箱
          const parts = line.split(',');
          if (parts.length >= 2) {
            return {
              username: parts[0].trim(),
              email: parts[1].trim()
            };
          } else if (line.includes('@')) {
            return { email: line };
          } else {
            return { username: line };
          }
        });

      const response = await classAPI.batchAddStudents(selectedClass, {
        students,
        autoApprove: true
      });

      if (response.data.success) {
        const { total, success, failed, results } = response.data.data;
        
        // 显示总体结果
        if (failed === 0) {
          message.success(`批量添加完成！成功添加 ${success} 名学生`);
        } else {
          message.warning(`批量添加完成！成功 ${success} 人，失败 ${failed} 人`);
        }

        // 如果有失败的，显示详细信息
        if (failed > 0) {
          const failedStudents = results.filter((r: any) => !r.success);
          const failedInfo = failedStudents.map((r: any) => `${r.student}: ${r.message}`).join('\n');
          
          Modal.info({
            title: '批量添加结果详情',
            content: (
              <div>
                <div style={{ marginBottom: '16px', color: '#52c41a' }}>
                  ✅ 成功添加：{success} 人
                </div>
                <div style={{ marginBottom: '16px', color: '#ff4d4f' }}>
                  ❌ 添加失败：{failed} 人
                </div>
                <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>失败详情：</div>
                <div style={{ 
                  maxHeight: '200px', 
                  overflow: 'auto', 
                  backgroundColor: '#f5f5f5', 
                  padding: '8px',
                  borderRadius: '4px',
                  whiteSpace: 'pre-wrap',
                  fontSize: '12px'
                }}>
                  {failedInfo}
                </div>
              </div>
            ),
            width: 500
          });
        }

        setBatchModalVisible(false);
        loadStudents(selectedClass);
      } else {
        message.error(response.data.message || '批量添加失败');
      }
    } catch (error: any) {
      console.error('批量添加失败:', error);
      const errorMessage = error.response?.data?.message || error.message || '批量添加失败';
      message.error(errorMessage);
    }
  };

  const classColumns = [
    {
      title: '班级信息',
      key: 'classInfo',
      render: (_: any, record: Class) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${primaryColor}20 0%, ${primaryColor}10 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '12px',
            border: `2px solid ${primaryColor}30`
          }}>
            <TeamOutlined style={{ fontSize: '20px', color: primaryColor }} />
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '2px' }}>
              {record.name}
            </div>
            <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
              {record.grade} · {record.subject}
            </div>
            <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '2px' }}>
              {record.description}
            </div>
          </div>
        </div>
      )
    },
    {
      title: '学生人数',
      dataIndex: 'studentCount',
      key: 'studentCount',
      width: 120,
      render: (count: number) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: primaryColor }}>
            {count}
          </div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            名学生
          </div>
        </div>
      )
    },
    {
      title: '班级状态',
      key: 'status',
      width: 100,
      render: (_: any, record: Class) => {
        const activeRate = Math.floor(Math.random() * 20) + 80; // 80-99%
        return (
          <div style={{ textAlign: 'center' }}>
            <Badge 
              status={activeRate > 90 ? 'success' : activeRate > 80 ? 'processing' : 'warning'} 
              text={
                <span style={{ fontSize: '12px' }}>
                  活跃 {activeRate}%
                </span>
              } 
            />
            <div style={{ fontSize: '10px', color: '#8c8c8c', marginTop: '2px' }}>
              本周
            </div>
          </div>
        );
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => (
        <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
          <CalendarOutlined style={{ marginRight: '4px' }} />
          {new Date(date).toLocaleDateString()}
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: Class) => (
        <Space size="small">
          <Tooltip title="查看学生">
            <Button
              type="text"
              size="small"
              icon={<UserOutlined />}
              onClick={() => {
                setSelectedClass(record.id);
                setActiveTab('students');
                loadStudents(record.id);
              }}
              style={{
                borderRadius: '6px',
                color: primaryColor
              }}
            >
              学生
            </Button>
          </Tooltip>
          <Tooltip title="编辑班级">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditClass(record)}
              style={{ borderRadius: '6px' }}
            >
              编辑
            </Button>
          </Tooltip>
          <Tooltip title="删除班级">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteClass(record.id)}
              style={{ borderRadius: '6px' }}
            >
              删除
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const studentColumns = [
    {
      title: '学生信息',
      key: 'student',
      width: 250,
      render: (_: any, record: Student) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            size={48}
            src={record.avatar} 
            icon={<UserOutlined />}
            style={{
              marginRight: '12px',
              border: `2px solid ${primaryColor}30`,
              background: `linear-gradient(135deg, ${primaryColor}20 0%, ${primaryColor}10 100%)`
            }}
          />
          <div>
            <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '2px' }}>
              {record.username}
            </div>
            <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
              {record.email}
            </div>
            <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '2px' }}>
              {record.classInfo}
            </div>
          </div>
        </div>
      )
    },
    {
      title: '学习数据',
      key: 'stats',
      width: 200,
      render: (_: any, record: Student) => (
        <div>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <Text style={{ fontSize: '12px' }}>正确率</Text>
              <Text strong style={{ fontSize: '12px', color: record.learningStats.accuracy >= 85 ? '#52c41a' : record.learningStats.accuracy >= 70 ? '#faad14' : '#ff4d4f' }}>
                {record.learningStats.accuracy}%
              </Text>
            </div>
            <Progress 
              percent={record.learningStats.accuracy} 
              size="small" 
              strokeColor={{
                '0%': record.learningStats.accuracy >= 85 ? '#52c41a' : record.learningStats.accuracy >= 70 ? '#faad14' : '#ff4d4f',
                '100%': record.learningStats.accuracy >= 85 ? '#95de64' : record.learningStats.accuracy >= 70 ? '#ffd666' : '#ff7875',
              }}
              showInfo={false}
            />
          </div>
          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
            完成题目: {record.learningStats.totalQuestions} / 正确: {record.learningStats.correctAnswers}
          </div>
        </div>
      )
    },
    {
      title: '积分排名',
      key: 'points',
      width: 120,
      render: (_: any, record: Student) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #faad1420 0%, #faad1410 100%)',
            border: '2px solid #faad1430',
            marginBottom: '4px'
          }}>
            <StarOutlined style={{ fontSize: '18px', color: '#faad14' }} />
          </div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#faad14' }}>
            {record.points}
          </div>
          <div style={{ fontSize: '10px', color: '#8c8c8c' }}>
            积分
          </div>
        </div>
      )
    },
    {
      title: '活跃度',
      key: 'activity',
      width: 120,
      render: (_: any, record: Student) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: record.isActive ? 'linear-gradient(135deg, #52c41a20 0%, #52c41a10 100%)' : 'linear-gradient(135deg, #ff4d4f20 0%, #ff4d4f10 100%)',
            border: record.isActive ? '2px solid #52c41a30' : '2px solid #ff4d4f30',
            marginBottom: '4px'
          }}>
            <FireOutlined style={{ 
              fontSize: '18px', 
              color: record.isActive ? '#52c41a' : '#ff4d4f' 
            }} />
          </div>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: record.isActive ? '#52c41a' : '#ff4d4f' }}>
            {record.learningStats.continuousLoginDays}天
          </div>
          <div style={{ fontSize: '10px', color: '#8c8c8c' }}>
            连续登录
          </div>
        </div>
      )
    },
    {
      title: '最近活动',
      key: 'lastActivity',
      width: 120,
      render: (_: any, record: Student) => (
        <div style={{ textAlign: 'center' }}>
          <Badge 
            status={record.isActive ? 'success' : 'error'} 
            text={
              <span style={{ fontSize: '12px' }}>
                {record.isActive ? '在线' : '离线'}
              </span>
            }
          />
          <div style={{ fontSize: '10px', color: '#8c8c8c', marginTop: '2px' }}>
            <ClockCircleOutlined style={{ marginRight: '2px' }} />
            {new Date(record.learningStats.lastLoginDate).toLocaleDateString()}
          </div>
          <div style={{ fontSize: '10px', color: '#8c8c8c' }}>
            学习时长: {Math.round(record.learningStats.totalTime / 60)}分钟
          </div>
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: Student) => (
        <Space size="small">
          <Tooltip title={record.isActive ? '设为不活跃' : '设为活跃'}>
            <Button
              type="text"
              size="small"
              icon={record.isActive ? <CheckCircleOutlined /> : <FireOutlined />}
              onClick={() => handleToggleStudentStatus(record)}
              style={{
                borderRadius: '6px',
                color: record.isActive ? '#52c41a' : '#faad14'
              }}
            >
              {record.isActive ? '活跃' : '激活'}
            </Button>
          </Tooltip>
          <Tooltip title="编辑学生">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditStudent(record)}
              style={{ borderRadius: '6px' }}
            >
              编辑
            </Button>
          </Tooltip>
          <Tooltip title="移除学生">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteStudent(record.id, record.username)}
              style={{ borderRadius: '6px' }}
            >
              移除
            </Button>
          </Tooltip>
        </Space>
      ),
    }
  ];

  return (
    <div style={{ 
      padding: '32px',
      background: isDark ? '#0f0f0f' : '#f5f5f5',
      minHeight: 'calc(100vh - 64px)'
    }}>
      {/* 页面标题区域 */}
      <div className="modern-card animate-fadeIn" style={{
        background: isDark ? '#1a1a1a' : '#ffffff',
        borderRadius: '16px',
        padding: '32px',
        marginBottom: '24px',
        border: `1px solid ${isDark ? '#404040' : '#e2e8f0'}`,
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '120px',
          height: '120px',
          background: `${primaryColor}10`,
          borderRadius: '50%'
        }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <TeamOutlined style={{ 
                fontSize: '32px', 
                color: primaryColor, 
                marginRight: '16px' 
              }} />
              <div>
                <Title level={2} style={{ margin: 0, color: isDark ? '#ffffff' : '#1a202c' }}>
                  班级管理
                </Title>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  管理所有班级信息和学生数据
                </Text>
              </div>
            </div>
          </div>
          
          <Button 
            type="primary" 
            size="large"
            className="modern-button primary"
            icon={<PlusOutlined />} 
            onClick={handleCreateClass}
            style={{
              borderRadius: '8px',
              height: '48px',
              fontSize: '16px',
              background: primaryColor,
              border: 'none'
            }}
          >
            创建班级
          </Button>
        </div>
      </div>

      {/* 统计概览 */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} lg={6}>
          <div className="stats-card modern-card animate-slideUp" style={{ animationDelay: '0.1s' }}>
            <div style={{ 
              background: `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}05 100%)`,
              borderRadius: '12px',
              padding: '20px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ 
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                width: '60px',
                height: '60px',
                background: `${primaryColor}20`,
                borderRadius: '50%'
              }} />
              <TeamOutlined style={{ 
                fontSize: '24px', 
                color: primaryColor, 
                marginBottom: '12px',
                position: 'relative',
                zIndex: 1
              }} />
              <div className="stats-number" style={{ color: primaryColor }}>
                {classes.length}
              </div>
              <div className="stats-label">管理班级</div>
              <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                涵盖三到五年级
              </div>
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stats-card modern-card animate-slideUp" style={{ animationDelay: '0.2s' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #52c41a15 0%, #52c41a05 100%)',
              borderRadius: '12px',
              padding: '20px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ 
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                width: '60px',
                height: '60px',
                background: '#52c41a20',
                borderRadius: '50%'
              }} />
              <UserOutlined style={{ 
                fontSize: '24px', 
                color: '#52c41a', 
                marginBottom: '12px',
                position: 'relative',
                zIndex: 1
              }} />
              <div className="stats-number" style={{ color: '#52c41a' }}>
                {classes.reduce((sum, cls) => sum + cls.studentCount, 0)}
              </div>
              <div className="stats-label">学生总数</div>
              <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                活跃学生: {Math.round(classes.reduce((sum, cls) => sum + cls.studentCount, 0) * 0.87)}人
              </div>
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stats-card modern-card animate-slideUp" style={{ animationDelay: '0.3s' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #faad1415 0%, #faad1405 100%)',
              borderRadius: '12px',
              padding: '20px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ 
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                width: '60px',
                height: '60px',
                background: '#faad1420',
                borderRadius: '50%'
              }} />
              <TrophyOutlined style={{ 
                fontSize: '24px', 
                color: '#faad14', 
                marginBottom: '12px',
                position: 'relative',
                zIndex: 1
              }} />
              <div className="stats-number" style={{ color: '#faad14' }}>
                {classes.length > 0 ? Math.round(classes.reduce((sum, cls) => sum + cls.studentCount, 0) / classes.length) : 0}
              </div>
              <div className="stats-label">平均班级人数</div>
              <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                最大: 32人 | 最小: 25人
              </div>
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stats-card modern-card animate-slideUp" style={{ animationDelay: '0.4s' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #722ed115 0%, #722ed105 100%)',
              borderRadius: '12px',
              padding: '20px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ 
                position: 'absolute',
                top: '-10px',
                right: '-10px',
                width: '60px',
                height: '60px',
                background: '#722ed120',
                borderRadius: '50%'
              }} />
              <BookOutlined style={{ 
                fontSize: '24px', 
                color: '#722ed1', 
                marginBottom: '12px',
                position: 'relative',
                zIndex: 1
              }} />
              <div className="stats-number" style={{ color: '#722ed1' }}>
                87.5%
              </div>
              <div className="stats-label">班级活跃度</div>
              <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                本周平均活跃度
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* 主要内容区域 */}
      <div className="modern-card animate-slideUp" style={{
        animationDelay: '0.5s',
        background: isDark ? '#1a1a1a' : '#ffffff',
        borderRadius: '16px',
        padding: '0',
        border: `1px solid ${isDark ? '#404040' : '#e2e8f0'}`,
        overflow: 'hidden'
      }}>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          size="large"
          style={{ 
            padding: '0 24px',
            marginBottom: '0'
          }}
          tabBarStyle={{
            borderBottom: `1px solid ${isDark ? '#404040' : '#e2e8f0'}`,
            marginBottom: '0'
          }}
        >
          <TabPane 
            tab={
              <span style={{ fontSize: '16px', fontWeight: '500' }}>
                <TeamOutlined style={{ marginRight: '8px' }} />
                班级列表
              </span>
            } 
            key="classes"
          >
            <div style={{ padding: '24px' }}>
              <Table
                columns={classColumns}
                dataSource={classes}
                rowKey="id"
                loading={loading}
                size="large"
                style={{
                  background: 'transparent'
                }}
                onRow={(record: Class) => ({
                  onClick: () => {
                    setSelectedClass(record.id);
                    loadStudents(record.id);
                    setActiveTab('students'); // 自动切换到学生列表标签页
                  },
                  style: { cursor: 'pointer' }
                })}
                pagination={{
                  total: classes.length,
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                }}
              />
            </div>
          </TabPane>
          
          <TabPane 
            tab={
              <span style={{ fontSize: '16px', fontWeight: '500' }}>
                <UserOutlined style={{ marginRight: '8px' }} />
                学生列表
              </span>
            } 
            key="students"
          >
            <div style={{ padding: '24px' }}>
              {selectedClass && (
                <div style={{ 
                  marginBottom: '16px',
                  padding: '12px 16px',
                  background: `${primaryColor}10`,
                  borderRadius: '8px',
                  border: `1px solid ${primaryColor}20`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text strong style={{ color: primaryColor }}>
                      当前班级: {classes.find((c: Class) => c.id === selectedClass)?.name}
                    </Text>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <Text style={{ color: primaryColor }}>
                        班级总人数: {classes.find((c: Class) => c.id === selectedClass)?.studentCount || 0}
                      </Text>
                      <Text style={{ color: primaryColor }}>
                        当前显示: {students.length} 人
                      </Text>
                    </div>
                  </div>
                </div>
              )}

              {/* 学生操作工具栏 */}
              {selectedClass && (
                <div style={{ 
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Space>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleAddStudent}
                      style={{
                        borderRadius: '6px',
                        background: primaryColor,
                        border: 'none'
                      }}
                    >
                      添加学生
                    </Button>
                    <Button
                      icon={<TeamOutlined />}
                      onClick={handleBatchAddStudents}
                      style={{ borderRadius: '6px' }}
                    >
                      批量添加
                    </Button>
                    {selectedStudents.length > 0 && (
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={handleBatchDeleteStudents}
                        style={{ borderRadius: '6px' }}
                      >
                        批量移除 ({selectedStudents.length})
                      </Button>
                    )}
                  </Space>
                  
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    提示：点击学生行可以查看详细信息
                  </Text>
                </div>
              )}

              <Table
                columns={studentColumns}
                dataSource={students}
                rowKey="id"
                loading={loading}
                size="large"
                style={{
                  background: 'transparent'
                }}
                rowSelection={{
                  selectedRowKeys: selectedStudents,
                  onChange: (selectedRowKeys) => setSelectedStudents(selectedRowKeys.map(key => String(key))),
                  type: 'checkbox'
                }}
                pagination={{
                  total: students.length,
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                }}
              />
            </div>
          </TabPane>
        </Tabs>
      </div>

      {/* 创建/编辑班级模态框 */}
      <Modal
        title={editingClass ? '编辑班级' : '创建班级'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="班级名称"
            rules={[{ required: true, message: '请输入班级名称' }]}
          >
            <Input placeholder="请输入班级名称" />
          </Form.Item>

          <Form.Item
            name="grade"
            label="年级"
            rules={[{ required: true, message: '请选择年级' }]}
          >
            <Select placeholder="请选择年级">
              <Option value="一年级">一年级</Option>
              <Option value="二年级">二年级</Option>
              <Option value="三年级">三年级</Option>
              <Option value="四年级">四年级</Option>
              <Option value="五年级">五年级</Option>
              <Option value="六年级">六年级</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="subject"
            label="学科"
            rules={[{ required: true, message: '请输入学科' }]}
          >
            <Input placeholder="请输入学科" defaultValue="体育" />
          </Form.Item>

          <Form.Item
            name="description"
            label="班级描述"
          >
            <Input.TextArea rows={3} placeholder="请输入班级描述" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingClass ? '更新' : '创建'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 添加/编辑学生模态框 */}
      <Modal
        title={studentModalType === 'add' ? '添加学生' : '编辑学生'}
        open={studentModalVisible}
        onCancel={() => {
          setStudentModalVisible(false);
          setSearchKeyword('');
          setSearchResults([]);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={studentForm}
          layout="vertical"
          onFinish={handleStudentSubmit}
        >
          {studentModalType === 'add' && (
            <>
              <Form.Item
                label="搜索学生"
                extra="输入学生姓名或邮箱进行搜索，然后从结果中选择"
              >
                <AutoComplete
                  value={searchKeyword}
                  onChange={(value) => {
                    setSearchKeyword(value);
                    searchUsersForClass(value);
                  }}
                  placeholder="输入学生姓名或邮箱搜索"
                  options={searchResults.map(user => ({
                    value: user.username,
                    label: (
                      <div 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          cursor: 'pointer',
                          padding: '8px 0'
                        }}
                        onClick={() => handleSelectUserFromSearch(user)}
                      >
                        <Avatar 
                          size="small" 
                          src={user.avatar} 
                          icon={<UserOutlined />}
                          style={{ marginRight: '8px' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '500' }}>{user.username}</div>
                          <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                            {user.email} | {user.grade || '未设置年级'} | 准确率: {user.accuracy}%
                          </div>
                        </div>
                        <div style={{ 
                          fontSize: '12px', 
                          color: '#faad14',
                          fontWeight: '500'
                        }}>
                          {user.points} 积分
                        </div>
                      </div>
                    )
                  }))}
                  dropdownRender={(menu) => (
                    <div>
                      {searchLoading && (
                        <div style={{ 
                          textAlign: 'center', 
                          padding: '12px',
                          borderBottom: '1px solid #f0f0f0'
                        }}>
                          <Spin size="small" /> 搜索中...
                        </div>
                      )}
                      {menu}
                      {searchResults.length === 0 && searchKeyword.length >= 2 && !searchLoading && (
                        <div style={{ 
                          textAlign: 'center', 
                          padding: '12px',
                          color: '#8c8c8c'
                        }}>
                          未找到匹配的学生
                        </div>
                      )}
                    </div>
                  )}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Divider style={{ margin: '16px 0' }}>
                <span style={{ color: '#8c8c8c', fontSize: '12px' }}>或手动输入学生信息</span>
              </Divider>
            </>
          )}

          <Form.Item name="selectedUserId" style={{ display: 'none' }}>
            <Input type="hidden" />
          </Form.Item>

          <Form.Item
            name="username"
            label="学生姓名"
            rules={[{ required: true, message: '请输入学生姓名' }]}
          >
            <Input placeholder="请输入学生姓名" />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱地址"
            rules={[
              { required: true, message: '请输入邮箱地址' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="请输入邮箱地址" />
          </Form.Item>

          {studentModalType === 'edit' && (
            <Form.Item
              name="status"
              label="学生状态"
            >
              <Select placeholder="请选择状态">
                <Option value="active">活跃</Option>
                <Option value="inactive">不活跃</Option>
                <Option value="pending">待审核</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {studentModalType === 'add' ? '添加' : '更新'}
              </Button>
              <Button onClick={() => {
                setStudentModalVisible(false);
                setSearchKeyword('');
                setSearchResults([]);
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量添加学生模态框 */}
      <Modal
        title="批量添加学生"
        open={batchModalVisible}
        onCancel={() => setBatchModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          layout="vertical"
          onFinish={handleBatchSubmit}
        >
          <Form.Item
            name="studentsText"
            label="学生信息"
            rules={[{ required: true, message: '请输入学生信息' }]}
            extra={
              <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '8px' }}>
                <div>支持以下格式，每行一个学生：</div>
                <div>• 仅用户名：张三</div>
                <div>• 仅邮箱：zhangsan@student.com</div>
                <div>• 用户名,邮箱：张三,zhangsan@student.com</div>
                <div style={{ marginTop: '4px', color: '#faad14' }}>提示：可以从Excel复制粘贴</div>
              </div>
            }
          >
            <Input.TextArea
              rows={10}
              placeholder={`请输入学生信息，每行一个学生，例如：
张三
李四,lisi@student.com
wangwu@student.com
赵六,zhaoliu@student.com`}
              style={{ fontFamily: 'monospace' }}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                批量添加
              </Button>
              <Button onClick={() => setBatchModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ClassManagement; 