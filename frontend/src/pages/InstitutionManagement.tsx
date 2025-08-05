import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Table, Button, Modal, Form, Input, Select, Switch, 
  Tag, Typography, Space, Divider, Tabs, message, Popconfirm,
  Badge, Tooltip, Avatar, Progress, Statistic, Alert, DatePicker
} from 'antd';
import {
  BankOutlined, UserOutlined, TeamOutlined, BookOutlined,
  EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined,
  BarChartOutlined, FileTextOutlined, CheckCircleOutlined,
  CloseCircleOutlined, StarOutlined, TrophyOutlined
} from '@ant-design/icons';
import { useTheme } from '../hooks/useTheme';
import '../styles/modern-theme.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface InstitutionUser {
  id: string;
  username: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  grade?: string;
  classInfo?: string;
  isActive: boolean;
  lastLogin: string;
  learningStats: {
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
    totalTime: number;
  };
  joinDate: string;
}

interface InstitutionQuestion {
  id: string;
  title: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  type: string;
  status: 'draft' | 'published' | 'archived';
  isExclusive: boolean; // 是否为机构专属
  creator: string;
  createdAt: string;
  usage: {
    totalAttempts: number;
    accuracy: number;
  };
}

interface InstitutionStats {
  totalUsers: number;
  activeUsers: number;
  totalQuestions: number;
  exclusiveQuestions: number;
  avgAccuracy: number;
  totalLearningTime: number;
}

const InstitutionManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  
  // 用户管理状态
  const [users, setUsers] = useState<InstitutionUser[]>([]);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<InstitutionUser | null>(null);
  
  // 题库管理状态
  const [questions, setQuestions] = useState<InstitutionQuestion[]>([]);
  const [questionModalVisible, setQuestionModalVisible] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<InstitutionQuestion | null>(null);
  
  // 统计数据
  const [stats, setStats] = useState<InstitutionStats | null>(null);

  const [userForm] = Form.useForm();
  const [questionForm] = Form.useForm();

  const { isDark, primaryColor } = useTheme();

  // 模拟机构用户数据
  const mockUsers: InstitutionUser[] = [
    {
      id: '1',
      username: '张小明',
      email: 'zhang.xiaoming@school.com',
      role: 'student',
      grade: '三年级',
      classInfo: '三年级1班',
      isActive: true,
      lastLogin: '2024-01-20T10:30:00Z',
      learningStats: {
        totalQuestions: 245,
        correctAnswers: 198,
        accuracy: 80.8,
        totalTime: 156
      },
      joinDate: '2024-01-10'
    },
    {
      id: '2',
      username: '李老师',
      email: 'li.teacher@school.com',
      role: 'teacher',
      isActive: true,
      lastLogin: '2024-01-20T14:20:00Z',
      learningStats: {
        totalQuestions: 0,
        correctAnswers: 0,
        accuracy: 0,
        totalTime: 0
      },
      joinDate: '2024-01-05'
    },
    {
      id: '3',
      username: '王小红',
      email: 'wang.xiaohong@school.com',
      role: 'student',
      grade: '四年级',
      classInfo: '四年级2班',
      isActive: true,
      lastLogin: '2024-01-19T16:45:00Z',
      learningStats: {
        totalQuestions: 189,
        correctAnswers: 167,
        accuracy: 88.4,
        totalTime: 134
      },
      joinDate: '2024-01-12'
    },
    {
      id: '4',
      username: '陈管理员',
      email: 'chen.admin@school.com',
      role: 'admin',
      isActive: true,
      lastLogin: '2024-01-20T09:15:00Z',
      learningStats: {
        totalQuestions: 0,
        correctAnswers: 0,
        accuracy: 0,
        totalTime: 0
      },
      joinDate: '2024-01-01'
    }
  ];

  // 模拟机构题库数据
  const mockQuestions: InstitutionQuestion[] = [
    {
      id: '1',
      title: '学校运动会足球规则',
      category: '足球',
      difficulty: 'easy',
      type: '单选题',
      status: 'published',
      isExclusive: true,
      creator: '李老师',
      createdAt: '2024-01-15',
      usage: {
        totalAttempts: 156,
        accuracy: 85.3
      }
    },
    {
      id: '2',
      title: '本校篮球场使用规范',
      category: '篮球',
      difficulty: 'medium',
      type: '多选题',
      status: 'published',
      isExclusive: true,
      creator: '王教练',
      createdAt: '2024-01-18',
      usage: {
        totalAttempts: 89,
        accuracy: 76.4
      }
    },
    {
      id: '3',
      title: '期末体育考试要求',
      category: '综合',
      difficulty: 'medium',
      type: '填空题',
      status: 'draft',
      isExclusive: true,
      creator: '陈管理员',
      createdAt: '2024-01-20',
      usage: {
        totalAttempts: 0,
        accuracy: 0
      }
    },
    {
      id: '4',
      title: '游泳池安全须知',
      category: '游泳',
      difficulty: 'easy',
      type: '判断题',
      status: 'published',
      isExclusive: true,
      creator: '李老师',
      createdAt: '2024-01-16',
      usage: {
        totalAttempts: 123,
        accuracy: 92.7
      }
    }
  ];

  // 模拟统计数据
  const mockStats: InstitutionStats = {
    totalUsers: 4,
    activeUsers: 4,
    totalQuestions: 4,
    exclusiveQuestions: 4,
    avgAccuracy: 85.7,
    totalLearningTime: 290
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setTimeout(() => {
      setUsers(mockUsers);
      setQuestions(mockQuestions);
      setStats(mockStats);
      setLoading(false);
    }, 800);
  };

  // 用户管理相关函数
  const handleUserSave = async (values: any) => {
    try {
      if (selectedUser) {
        message.success('用户信息更新成功');
      } else {
        message.success('用户创建成功');
      }
      setUserModalVisible(false);
      userForm.resetFields();
      setSelectedUser(null);
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleUserDelete = async (user: InstitutionUser) => {
    try {
      message.success('用户删除成功');
      loadData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleUserToggleStatus = async (user: InstitutionUser) => {
    try {
      message.success(`用户${user.isActive ? '禁用' : '启用'}成功`);
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 题库管理相关函数
  const handleQuestionSave = async (values: any) => {
    try {
      if (selectedQuestion) {
        message.success('题目更新成功');
      } else {
        message.success('题目创建成功');
      }
      setQuestionModalVisible(false);
      questionForm.resetFields();
      setSelectedQuestion(null);
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleQuestionDelete = async (question: InstitutionQuestion) => {
    try {
      message.success('题目删除成功');
      loadData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleQuestionPublish = async (question: InstitutionQuestion) => {
    try {
      message.success('题目发布成功');
      loadData();
    } catch (error) {
      message.error('发布失败');
    }
  };

  // 用户表格列
  const userColumns = [
    {
      title: '用户信息',
      key: 'user',
      width: 200,
      render: (record: InstitutionUser) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            size={40}
            icon={<UserOutlined />}
            style={{
              marginRight: '12px',
              background: record.role === 'student' ? '#52c41a' : 
                         record.role === 'teacher' ? '#1890ff' : '#faad14'
            }}
          />
          <div>
            <Text strong>{record.username}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.email}
            </Text>
          </div>
        </div>
      )
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: string) => {
        const roleConfig = {
          student: { color: '#52c41a', text: '学生' },
          teacher: { color: '#1890ff', text: '教师' },
          admin: { color: '#faad14', text: '管理员' }
        };
        const config = roleConfig[role as keyof typeof roleConfig];
        return (
          <Tag color={config.color}>{config.text}</Tag>
        );
      }
    },
    {
      title: '班级信息',
      key: 'classInfo',
      width: 120,
      render: (record: InstitutionUser) => (
        <div>
          {record.grade && <Text>{record.grade}</Text>}
          {record.classInfo && (
            <>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.classInfo}
              </Text>
            </>
          )}
        </div>
      )
    },
    {
      title: '学习数据',
      key: 'learningStats',
      width: 150,
      render: (record: InstitutionUser) => (
        record.role === 'student' ? (
          <div>
            <div style={{ marginBottom: '4px' }}>
              <Text style={{ fontSize: '12px' }}>正确率: </Text>
              <Text strong style={{ color: record.learningStats.accuracy >= 80 ? '#52c41a' : '#faad14' }}>
                {record.learningStats.accuracy}%
              </Text>
            </div>
            <Progress 
              percent={record.learningStats.accuracy} 
              size="small" 
              strokeColor={record.learningStats.accuracy >= 80 ? '#52c41a' : '#faad14'}
              showInfo={false}
            />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {record.learningStats.totalQuestions} 题，{record.learningStats.totalTime} 分钟
            </Text>
          </div>
        ) : (
          <Text type="secondary">-</Text>
        )
      )
    },
    {
      title: '最近登录',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      width: 120,
      render: (date: string) => (
        <div>
          <Text style={{ fontSize: '12px' }}>
            {new Date(date).toLocaleDateString()}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {new Date(date).toLocaleTimeString()}
          </Text>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean) => (
        <Badge 
          status={isActive ? 'success' : 'error'} 
          text={isActive ? '正常' : '禁用'} 
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (record: InstitutionUser) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedUser(record);
                // 可以打开详情抽屉
              }}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedUser(record);
                userForm.setFieldsValue(record);
                setUserModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title={record.isActive ? '禁用' : '启用'}>
            <Popconfirm
              title={`确定${record.isActive ? '禁用' : '启用'}此用户吗？`}
              onConfirm={() => handleUserToggleStatus(record)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="text"
                size="small"
                icon={record.isActive ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
                style={{ color: record.isActive ? '#ff4d4f' : '#52c41a' }}
              />
            </Popconfirm>
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定删除此用户吗？"
              onConfirm={() => handleUserDelete(record)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 题库表格列
  const questionColumns = [
    {
      title: '题目信息',
      key: 'question',
      width: 250,
      render: (record: InstitutionQuestion) => (
        <div>
          <Text strong>{record.title}</Text>
          <br />
          <Space size="small" style={{ marginTop: '4px' }}>
            <Tag color="blue" style={{ fontSize: '11px', padding: '2px 6px', height: 'auto', lineHeight: 1.2 }}>{record.type}</Tag>
            <Tag color="cyan" style={{ fontSize: '11px', padding: '2px 6px', height: 'auto', lineHeight: 1.2 }}>{record.category}</Tag>
            <Tag 
              color={
                record.difficulty === 'easy' ? 'green' : 
                record.difficulty === 'medium' ? 'orange' : 'red'
              }
              style={{ fontSize: '11px', padding: '2px 6px', height: 'auto', lineHeight: 1.2 }}
            >
              {record.difficulty === 'easy' ? '简单' : 
               record.difficulty === 'medium' ? '中等' : '困难'}
            </Tag>
            {record.isExclusive && (
              <Tag color="gold" style={{ fontSize: '11px', padding: '2px 6px', height: 'auto', lineHeight: 1.2 }}>专属</Tag>
            )}
          </Space>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusConfig = {
          draft: { color: '#faad14', text: '草稿' },
          published: { color: '#52c41a', text: '已发布' },
          archived: { color: '#8c8c8c', text: '已归档' }
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return (
          <Tag color={config.color}>{config.text}</Tag>
        );
      }
    },
    {
      title: '创建者',
      dataIndex: 'creator',
      key: 'creator',
      width: 100,
    },
    {
      title: '使用统计',
      key: 'usage',
      width: 150,
      render: (record: InstitutionQuestion) => (
        <div>
          <div style={{ marginBottom: '4px' }}>
            <Text style={{ fontSize: '12px' }}>尝试次数: </Text>
            <Text strong>{record.usage.totalAttempts}</Text>
          </div>
          {record.usage.totalAttempts > 0 && (
            <>
              <div style={{ marginBottom: '4px' }}>
                <Text style={{ fontSize: '12px' }}>正确率: </Text>
                <Text strong style={{ color: record.usage.accuracy >= 80 ? '#52c41a' : '#faad14' }}>
                  {record.usage.accuracy}%
                </Text>
              </div>
              <Progress 
                percent={record.usage.accuracy} 
                size="small" 
                strokeColor={record.usage.accuracy >= 80 ? '#52c41a' : '#faad14'}
                showInfo={false}
              />
            </>
          )}
        </div>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (record: InstitutionQuestion) => (
        <Space size="small">
          <Tooltip title="查看">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedQuestion(record);
                questionForm.setFieldsValue(record);
                setQuestionModalVisible(true);
              }}
            />
          </Tooltip>
          {record.status === 'draft' && (
            <Tooltip title="发布">
              <Popconfirm
                title="确定发布此题目吗？"
                onConfirm={() => handleQuestionPublish(record)}
                okText="确定"
                cancelText="取消"
              >
                <Button
                  type="text"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  style={{ color: '#52c41a' }}
                />
              </Popconfirm>
            </Tooltip>
          )}
          <Tooltip title="删除">
            <Popconfirm
              title="确定删除此题目吗？"
              onConfirm={() => handleQuestionDelete(record)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ 
      minHeight: '100vh',
      background: isDark ? '#0f0f0f' : '#f5f7fa',
      padding: '24px',
      paddingBottom: '40px'
    }}>
      {/* 页面标题区域 */}
      <div className="animate-slideUp" style={{
        marginBottom: '24px',
        padding: '24px 0',
        borderBottom: `1px solid ${isDark ? '#404040' : '#e2e8f0'}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: `linear-gradient(135deg, ${primaryColor}20 0%, ${primaryColor}10 100%)`,
                border: `2px solid ${primaryColor}30`,
                marginRight: '16px'
              }}>
                <BankOutlined style={{ fontSize: '20px', color: primaryColor }} />
              </div>
              <div>
                <Title level={2} style={{ 
                  margin: 0, 
                  fontSize: '28px',
                  fontWeight: '700',
                  background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}80 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  机构管理
                </Title>
                <Text type="secondary" style={{ fontSize: '16px', marginLeft: '2px' }}>
                  管理机构用户、数据和专属题库
                </Text>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 统计卡片区域 */}
      {stats && (
        <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} lg={6}>
            <div className="stats-card modern-card animate-slideUp">
              <div style={{ 
                background: 'linear-gradient(135deg, #52c41a15 0%, #52c41a05 100%)',
                borderRadius: '12px',
                padding: '20px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <UserOutlined style={{ 
                  fontSize: '24px', 
                  color: '#52c41a', 
                  marginBottom: '12px'
                }} />
                <div className="stats-number" style={{ color: '#52c41a' }}>
                  {stats.totalUsers}
                </div>
                <div className="stats-label">机构用户</div>
                <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                  活跃: {stats.activeUsers} 人
                </div>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <div className="stats-card modern-card animate-slideUp" style={{ animationDelay: '0.1s' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #1890ff15 0%, #1890ff05 100%)',
                borderRadius: '12px',
                padding: '20px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <BookOutlined style={{ 
                  fontSize: '24px', 
                  color: '#1890ff', 
                  marginBottom: '12px'
                }} />
                <div className="stats-number" style={{ color: '#1890ff' }}>
                  {stats.totalQuestions}
                </div>
                <div className="stats-label">题库总量</div>
                <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                  专属: {stats.exclusiveQuestions} 题
                </div>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <div className="stats-card modern-card animate-slideUp" style={{ animationDelay: '0.2s' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #faad1415 0%, #faad1405 100%)',
                borderRadius: '12px',
                padding: '20px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <TrophyOutlined style={{ 
                  fontSize: '24px', 
                  color: '#faad14', 
                  marginBottom: '12px'
                }} />
                <div className="stats-number" style={{ color: '#faad14' }}>
                  {stats.avgAccuracy}%
                </div>
                <div className="stats-label">平均正确率</div>
                <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                  机构整体水平
                </div>
              </div>
            </div>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <div className="stats-card modern-card animate-slideUp" style={{ animationDelay: '0.3s' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #722ed115 0%, #722ed105 100%)',
                borderRadius: '12px',
                padding: '20px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <BarChartOutlined style={{ 
                  fontSize: '24px', 
                  color: '#722ed1', 
                  marginBottom: '12px'
                }} />
                <div className="stats-number" style={{ color: '#722ed1' }}>
                  {Math.round(stats.totalLearningTime / 60)}
                </div>
                <div className="stats-label">学习时长(小时)</div>
                <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                  累计学习时间
                </div>
              </div>
            </div>
          </Col>
        </Row>
      )}

      {/* 主要内容区域 */}
      <div className="modern-card animate-slideUp" style={{
        animationDelay: '0.4s',
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
                <BarChartOutlined style={{ marginRight: '8px' }} />
                数据概览
              </span>
            } 
            key="overview"
          >
            <div style={{ padding: '24px' }}>
              <Alert
                message="机构数据概览"
                description="这里可以展示更详细的数据分析图表，包括学习趋势、题目分析、用户活跃度等。"
                type="info"
                showIcon
                style={{ marginBottom: '24px' }}
              />
              
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Card title="用户角色分布" size="small">
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <Text type="secondary">角色分布图表占位</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        学生: {users.filter(u => u.role === 'student').length} 人
                        <br />
                        教师: {users.filter(u => u.role === 'teacher').length} 人
                        <br />
                        管理员: {users.filter(u => u.role === 'admin').length} 人
                      </Text>
                    </div>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="题目难度分布" size="small">
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <Text type="secondary">难度分布图表占位</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        简单: {questions.filter(q => q.difficulty === 'easy').length} 题
                        <br />
                        中等: {questions.filter(q => q.difficulty === 'medium').length} 题
                        <br />
                        困难: {questions.filter(q => q.difficulty === 'hard').length} 题
                      </Text>
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>
          </TabPane>
          
          <TabPane 
            tab={
              <span style={{ fontSize: '16px', fontWeight: '500' }}>
                <UserOutlined style={{ marginRight: '8px' }} />
                用户管理
                <Badge 
                  count={users.length} 
                  style={{ 
                    marginLeft: '8px',
                    background: '#52c41a'
                  }} 
                />
              </span>
            } 
            key="users"
          >
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                <Space>
                  <Select
                    placeholder="筛选角色"
                    style={{ width: 120 }}
                    allowClear
                  >
                    <Option value="student">学生</Option>
                    <Option value="teacher">教师</Option>
                    <Option value="admin">管理员</Option>
                  </Select>
                  <Select
                    placeholder="筛选年级"
                    style={{ width: 120 }}
                    allowClear
                  >
                    <Option value="三年级">三年级</Option>
                    <Option value="四年级">四年级</Option>
                    <Option value="五年级">五年级</Option>
                  </Select>
                </Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setSelectedUser(null);
                    userForm.resetFields();
                    setUserModalVisible(true);
                  }}
                >
                  添加用户
                </Button>
              </div>
              <Table
                columns={userColumns}
                dataSource={users}
                rowKey="id"
                loading={loading}
                pagination={{
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
                <BookOutlined style={{ marginRight: '8px' }} />
                专属题库
                <Badge 
                  count={questions.filter(q => q.isExclusive).length} 
                  style={{ 
                    marginLeft: '8px',
                    background: '#faad14'
                  }} 
                />
              </span>
            } 
            key="questions"
          >
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                <Space>
                  <Select
                    placeholder="筛选状态"
                    style={{ width: 120 }}
                    allowClear
                  >
                    <Option value="draft">草稿</Option>
                    <Option value="published">已发布</Option>
                    <Option value="archived">已归档</Option>
                  </Select>
                  <Select
                    placeholder="筛选难度"
                    style={{ width: 120 }}
                    allowClear
                  >
                    <Option value="easy">简单</Option>
                    <Option value="medium">中等</Option>
                    <Option value="hard">困难</Option>
                  </Select>
                </Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setSelectedQuestion(null);
                    questionForm.resetFields();
                    setQuestionModalVisible(true);
                  }}
                >
                  创建题目
                </Button>
              </div>
              <Table
                columns={questionColumns}
                dataSource={questions}
                rowKey="id"
                loading={loading}
                pagination={{
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                }}
              />
            </div>
          </TabPane>
        </Tabs>
      </div>

      {/* 用户编辑模态框 */}
      <Modal
        title={selectedUser ? '编辑用户' : '添加用户'}
        open={userModalVisible}
        onCancel={() => {
          setUserModalVisible(false);
          setSelectedUser(null);
          userForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={userForm}
          layout="vertical"
          onFinish={handleUserSave}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="用户名"
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="邮箱"
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="角色"
                name="role"
                rules={[{ required: true, message: '请选择角色' }]}
              >
                <Select placeholder="请选择角色">
                  <Option value="student">学生</Option>
                  <Option value="teacher">教师</Option>
                  <Option value="admin">管理员</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="年级" name="grade">
                <Select placeholder="请选择年级" allowClear>
                  <Option value="三年级">三年级</Option>
                  <Option value="四年级">四年级</Option>
                  <Option value="五年级">五年级</Option>
                  <Option value="六年级">六年级</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="班级" name="classInfo">
                <Input placeholder="如：三年级1班" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="状态"
            name="isActive"
            valuePropName="checked"
          >
            <Switch checkedChildren="正常" unCheckedChildren="禁用" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button 
                onClick={() => {
                  setUserModalVisible(false);
                  setSelectedUser(null);
                  userForm.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {selectedUser ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 题目编辑模态框 */}
      <Modal
        title={selectedQuestion ? '编辑题目' : '创建题目'}
        open={questionModalVisible}
        onCancel={() => {
          setQuestionModalVisible(false);
          setSelectedQuestion(null);
          questionForm.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={questionForm}
          layout="vertical"
          onFinish={handleQuestionSave}
        >
          <Form.Item
            label="题目标题"
            name="title"
            rules={[{ required: true, message: '请输入题目标题' }]}
          >
            <Input placeholder="请输入题目标题" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="分类"
                name="category"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select placeholder="请选择分类">
                  <Option value="足球">足球</Option>
                  <Option value="篮球">篮球</Option>
                  <Option value="游泳">游泳</Option>
                  <Option value="田径">田径</Option>
                  <Option value="综合">综合</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="难度"
                name="difficulty"
                rules={[{ required: true, message: '请选择难度' }]}
              >
                <Select placeholder="请选择难度">
                  <Option value="easy">简单</Option>
                  <Option value="medium">中等</Option>
                  <Option value="hard">困难</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="题目类型"
                name="type"
                rules={[{ required: true, message: '请选择题目类型' }]}
              >
                <Select placeholder="请选择题目类型">
                  <Option value="单选题">单选题</Option>
                  <Option value="多选题">多选题</Option>
                  <Option value="判断题">判断题</Option>
                  <Option value="填空题">填空题</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value="draft">草稿</Option>
              <Option value="published">发布</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="机构专属"
            name="isExclusive"
            valuePropName="checked"
          >
            <Switch 
              checkedChildren="专属" 
              unCheckedChildren="公开"
              defaultChecked={true}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button 
                onClick={() => {
                  setQuestionModalVisible(false);
                  setSelectedQuestion(null);
                  questionForm.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {selectedQuestion ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InstitutionManagement; 