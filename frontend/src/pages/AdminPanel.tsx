import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Statistic, Table, Button, Modal, Form, Input,
  Select, Space, Tag, message, Tabs, Progress, Alert, Badge,
  Typography, List, Avatar, Tooltip, Popconfirm, Switch,
  Divider, Timeline, Calendar
} from 'antd';
import {
  UserOutlined, BookOutlined, FileTextOutlined, BarChartOutlined,
  CheckCircleOutlined, CloseCircleOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, WarningOutlined, ReloadOutlined, SettingOutlined,
  TrophyOutlined, ClockCircleOutlined, TeamOutlined, GlobalOutlined,
  DashboardOutlined, SafetyOutlined, LineChartOutlined, PieChartOutlined,
  FireOutlined, RiseOutlined, StarOutlined, CrownOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { RootState } from '../types';
import { statsAPI } from '../services/statsAPI';
import { questionAPI } from '../services/questionAPI';
import ReactEcharts from 'echarts-for-react';
import { useTheme } from '../hooks/useTheme';
import '../styles/modern-theme.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

interface SystemStats {
  overview: {
    totalUsers: number;
    totalQuestions: number;
    totalExams: number;
    totalInstitutions: number;
    activeUsers: number;
    todayNewUsers: number;
    monthlyCompletedExams: number;
  };
  distribution: {
    userRoles: any[];
    questionDifficulty: any[];
    questionCategory: any[];
  };
  trends: {
    userRegistration: any[];
    examCompletion: any[];
  };
}

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  const [userForm] = Form.useForm();
  const { user } = useSelector((state: RootState) => state.auth);
  const { isDark, primaryColor } = useTheme();

  // 丰富的系统统计数据
  const mockSystemStats: SystemStats = {
    overview: {
      totalUsers: 458,
      totalQuestions: 2847,
      totalExams: 156,
      totalInstitutions: 23,
      activeUsers: 387,
      todayNewUsers: 12,
      monthlyCompletedExams: 1204
    },
    distribution: {
      userRoles: [
        { name: '学生', value: 387, color: '#52c41a' },
        { name: '教师', value: 54, color: '#1890ff' },
        { name: '管理员', value: 17, color: '#faad14' }
      ],
      questionDifficulty: [
        { name: '简单', value: 1138, color: '#52c41a' },
        { name: '中等', value: 1267, color: '#faad14' },
        { name: '困难', value: 442, color: '#ff4d4f' }
      ],
      questionCategory: [
        { name: '足球', value: 485 },
        { name: '篮球', value: 423 },
        { name: '游泳', value: 367 },
        { name: '田径', value: 398 },
        { name: '排球', value: 312 },
        { name: '乒乓球', value: 289 },
        { name: '体操', value: 234 },
        { name: '健身', value: 339 }
      ]
    },
    trends: {
      userRegistration: [
        { date: '2024-01-01', count: 23 },
        { date: '2024-01-02', count: 18 },
        { date: '2024-01-03', count: 31 },
        { date: '2024-01-04', count: 27 },
        { date: '2024-01-05', count: 35 },
        { date: '2024-01-06', count: 29 },
        { date: '2024-01-07', count: 42 }
      ],
      examCompletion: [
        { date: '2024-01-01', count: 156 },
        { date: '2024-01-02', count: 189 },
        { date: '2024-01-03', count: 234 },
        { date: '2024-01-04', count: 198 },
        { date: '2024-01-05', count: 267 },
        { date: '2024-01-06', count: 223 },
        { date: '2024-01-07', count: 289 }
      ]
    }
  };

  const [systemStats] = useState<SystemStats>(mockSystemStats);

  // 丰富的用户数据
  const mockUsers = [
    {
      id: '1',
      username: '张老师',
      email: 'zhang.teacher@school.com',
      role: 'teacher',
      status: 'active',
      createdAt: '2024-01-10',
      lastLogin: '2024-01-20',
      institution: '第一中学',
      studentsCount: 45
    },
    {
      id: '2',
      username: '李小明',
      email: 'lixiaoming@student.com',
      role: 'student',
      status: 'active',
      createdAt: '2024-01-12',
      lastLogin: '2024-01-20',
      institution: '第一中学',
      grade: '三年级1班'
    },
    {
      id: '3',
      username: '王管理员',
      email: 'wang.admin@system.com',
      role: 'admin',
      status: 'active',
      createdAt: '2024-01-05',
      lastLogin: '2024-01-20',
      institution: '系统管理',
      permissions: ['全部权限']
    },
    {
      id: '4',
      username: '刘教练',
      email: 'liu.coach@school.com',
      role: 'teacher',
      status: 'active',
      createdAt: '2024-01-08',
      lastLogin: '2024-01-19',
      institution: '第二中学',
      studentsCount: 38
    },
    {
      id: '5',
      username: '陈小红',
      email: 'chenxiaohong@student.com',
      role: 'student',
      status: 'inactive',
      createdAt: '2024-01-15',
      lastLogin: '2024-01-18',
      institution: '第一中学',
      grade: '四年级2班'
    }
  ];

  const [users] = useState(mockUsers);

  // 待审核题目数据
  const mockPendingQuestions = [
    {
      id: '1',
      title: '足球新规则解析',
      content: '2024年最新足球规则中关于VAR的使用说明...',
      creator: '张老师',
      category: '足球',
      difficulty: '中等',
      status: 'pending_review',
      createdAt: '2024-01-20'
    },
    {
      id: '2',
      title: '篮球三分线新标准',
      content: '国际篮联最新三分线距离标准修订...',
      creator: '李教练',
      category: '篮球',
      difficulty: '简单',
      status: 'pending_review',
      createdAt: '2024-01-19'
    },
    {
      id: '3',
      title: '游泳安全防护措施',
      content: '游泳池安全管理的最新要求和标准...',
      creator: '王老师',
      category: '游泳',
      difficulty: '中等',
      status: 'pending_review',
      createdAt: '2024-01-18'
    }
  ];

  const [questions] = useState(mockPendingQuestions);

  // 模拟数据加载
  const refreshData = async () => {
    setLoading(true);
    setTimeout(() => {
      message.success('数据刷新成功');
      setLoading(false);
    }, 800);
  };

  // 用户操作
  const handleUserAction = async (action: string, userId: string) => {
    try {
      switch (action) {
        case '禁用':
        case '启用':
          Modal.confirm({
            title: `确认${action}用户`,
            content: `确定要${action}这个用户吗？`,
            onOk: async () => {
              // 模拟API调用
              await new Promise(resolve => setTimeout(resolve, 1000));
              message.success(`用户${action}成功`);
              refreshData();
            }
          });
          break;
        case '重置密码':
          Modal.confirm({
            title: '确认重置密码',
            content: '确定要重置这个用户的密码吗？新密码将发送到用户邮箱。',
            onOk: async () => {
              // 模拟API调用
              await new Promise(resolve => setTimeout(resolve, 1000));
              message.success('密码重置成功，新密码已发送到用户邮箱');
            }
          });
          break;
        case '删除':
          Modal.confirm({
            title: '确认删除用户',
            content: '确定要删除这个用户吗？此操作不可恢复。',
            okType: 'danger',
            onOk: async () => {
              // 模拟API调用
              await new Promise(resolve => setTimeout(resolve, 1000));
              message.success('用户删除成功');
              refreshData();
            }
          });
          break;
        default:
          message.success(`${action}操作成功`);
      }
    } catch (error) {
      message.error(`${action}操作失败`);
    }
  };

  // 题目审核
  const handleQuestionReview = async (questionId: string, action: 'approve' | 'reject') => {
    try {
      const actionText = action === 'approve' ? '通过' : '拒绝';
      
      Modal.confirm({
        title: `确认${actionText}审核`,
        content: `确定要${actionText}这道题目吗？`,
        onOk: async () => {
          // 模拟API调用
          await new Promise(resolve => setTimeout(resolve, 1000));
          message.success(`题目审核${actionText}成功`);
          refreshData();
        }
      });
    } catch (error) {
      message.error('审核操作失败');
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // 用户注册趋势图表配置
  const getUserRegistrationOption = () => {
    if (!systemStats?.trends?.userRegistration?.length) return {};

    // 处理不同的数据格式，支持 MongoDB 聚合格式和简单日期格式
    const dates = systemStats.trends.userRegistration.map((item: any) => {
      if (!item) return ''; // 防止 undefined 项
      
      // MongoDB 聚合格式: { _id: { month: x, day: y }, count: x }
      if (item._id && item._id.month && item._id.day) {
        return `${item._id.month}/${item._id.day}`;
      }
      // 简单日期格式: { date: '2024-01-01', count: x }
      else if (item.date) {
        const date = new Date(item.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }
      // 其他格式的后备处理
      else {
        return item.name || item.label || 'N/A';
      }
    }).filter(date => date); // 过滤掉空值

    const counts = systemStats.trends.userRegistration.map((item: any) => 
      (item && typeof item.count === 'number') ? item.count : 0
    ).filter((_, index) => dates[index]); // 确保与 dates 数组长度一致

    return {
      title: {
        text: '用户注册趋势',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: dates
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        name: '新增用户',
        type: 'line',
        data: counts,
        smooth: true,
        itemStyle: { color: '#1890ff' },
        areaStyle: { opacity: 0.3 }
      }]
    };
  };

  // 考试完成趋势图表配置
  const getExamCompletionOption = () => {
    if (!systemStats?.trends?.examCompletion?.length) return {};

    // 处理不同的数据格式，支持 MongoDB 聚合格式和简单日期格式
    const dates = systemStats.trends.examCompletion.map((item: any) => {
      if (!item) return ''; // 防止 undefined 项
      
      // MongoDB 聚合格式: { _id: { month: x, day: y }, count: x }
      if (item._id && item._id.month && item._id.day) {
        return `${item._id.month}/${item._id.day}`;
      }
      // 简单日期格式: { date: '2024-01-01', count: x }
      else if (item.date) {
        const date = new Date(item.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }
      // 其他格式的后备处理
      else {
        return item.name || item.label || 'N/A';
      }
    }).filter(date => date); // 过滤掉空值

    const counts = systemStats.trends.examCompletion.map((item: any) => 
      (item && typeof item.count === 'number') ? item.count : 0
    ).filter((_, index) => dates[index]); // 确保与 dates 数组长度一致

    return {
      title: {
        text: '考试完成趋势',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: dates
      },
      yAxis: {
        type: 'value'
      },
      series: [{
        name: '完成考试',
        type: 'line',
        data: counts,
        smooth: true,
        itemStyle: { color: '#52c41a' },
        areaStyle: { opacity: 0.3 }
      }]
    };
  };

  // 用户角色分布饼图配置
  const getUserRoleOption = () => {
    if (!systemStats?.distribution?.userRoles?.length) return {};

    // 处理不同的数据格式，支持 MongoDB 聚合格式和简单对象格式
    const data = systemStats.distribution.userRoles.map((item: any) => {
      if (!item) return null; // 防止 undefined 项
      
      // MongoDB 聚合格式: { _id: 'student', count: 387 }
      if (item._id && typeof item.count === 'number') {
        return {
          name: item._id === 'student' ? '学生' : 
                item._id === 'teacher' ? '教师' : 
                item._id === 'admin' ? '管理员' : item._id,
          value: item.count
        };
      }
      // 简单对象格式: { name: '学生', value: 387, color: '#52c41a' }
      else if (item.name && typeof item.value === 'number') {
        return {
          name: item.name,
          value: item.value
        };
      }
      // 其他格式的后备处理
      else {
        return {
          name: item.label || item.type || 'Unknown',
          value: item.count || item.value || 0
        };
      }
    }).filter(item => item !== null); // 过滤掉空值

    return {
      title: {
        text: '用户角色分布',
        left: 'center'
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      series: [{
        name: '用户角色',
        type: 'pie',
        radius: ['40%', '70%'],
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
  };

  // 题目审核（已合并到handleQuestionReview）

  // 用户管理表格列
  const userColumns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const roleMap: any = {
          student: { text: '学生', color: 'blue' },
          teacher: { text: '教师', color: 'green' },
          admin: { text: '管理员', color: 'red' },
          super_admin: { text: '超级管理员', color: 'purple' }
        };
        const config = roleMap[role] || { text: role, color: 'default' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Badge status={isActive ? 'success' : 'error'} text={isActive ? '活跃' : '禁用'} />
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: any) => (
        <Space>
          <Tooltip title="查看">
            <Button type="text" icon={<EyeOutlined />} size="small" />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="text" icon={<EditOutlined />} size="small" />
          </Tooltip>
          <Popconfirm title="确认禁用此用户？">
            <Tooltip title="禁用">
              <Button type="text" danger icon={<DeleteOutlined />} size="small" />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 题目审核表格列
  const questionColumns = [
    {
      title: '题目标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap: any = {
          single_choice: '单选题',
          multiple_choice: '多选题',
          true_false: '判断题',
          fill_blank: '填空题',
          case_analysis: '案例分析'
        };
        return <Tag color="blue">{typeMap[type] || type}</Tag>;
      },
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <Tag color="cyan">{category}</Tag>,
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      render: (difficulty: string) => {
        const difficultyMap: any = {
          easy: { text: '简单', color: 'green' },
          medium: { text: '中等', color: 'orange' },
          hard: { text: '困难', color: 'red' }
        };
        const config = difficultyMap[difficulty];
        return <Tag color={config?.color}>{config?.label}</Tag>;
      },
    },
    {
      title: '创建者',
      dataIndex: ['creator', 'username'],
      key: 'creator',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: any) => (
        <Space>
          <Tooltip title="查看">
            <Button type="text" icon={<EyeOutlined />} size="small" />
          </Tooltip>
          <Tooltip title="通过">
            <Button 
              type="text" 
              style={{ color: '#52c41a' }}
              icon={<CheckCircleOutlined />} 
              size="small"
              onClick={() => handleQuestionReview(record.id, 'approve')}
            />
          </Tooltip>
          <Tooltip title="拒绝">
            <Button 
              type="text" 
              danger
              icon={<CloseCircleOutlined />} 
              size="small"
              onClick={() => handleQuestionReview(record.id, 'reject')}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 渲染系统概览
  const renderOverview = () => (
    <div>
      {/* 系统统计卡片 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={systemStats?.overview?.totalUsers || 0}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总题目数"
              value={systemStats?.overview?.totalQuestions || 0}
              prefix={<BookOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总考试数"
              value={systemStats?.overview?.totalExams || 0}
              prefix={<FileTextOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="活跃用户"
              value={systemStats?.overview?.activeUsers || 0}
              prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* 今日数据 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="今日数据">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="新增用户"
                  value={systemStats?.overview?.todayNewUsers || 0}
                  prefix={<UserOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="完成考试"
                  value={systemStats?.overview?.monthlyCompletedExams || 0}
                  prefix={<TrophyOutlined />}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="系统状态">
            <List
              size="small"
              dataSource={[
                { name: '数据库连接', status: 'normal', icon: <CheckCircleOutlined style={{ color: '#52c41a' }} /> },
                { name: 'AI服务', status: 'normal', icon: <CheckCircleOutlined style={{ color: '#52c41a' }} /> },
                { name: '文件存储', status: 'normal', icon: <CheckCircleOutlined style={{ color: '#52c41a' }} /> },
                { name: '消息队列', status: 'warning', icon: <WarningOutlined style={{ color: '#faad14' }} /> }
              ]}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={item.icon}
                    title={item.name}
                    description={item.status === 'normal' ? '运行正常' : '需要关注'}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* 趋势图表 */}
      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="用户注册趋势">
            <ReactEcharts 
              option={getUserRegistrationOption()} 
              style={{ height: '300px' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="考试完成趋势">
            <ReactEcharts 
              option={getExamCompletionOption()} 
              style={{ height: '300px' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  // 渲染用户管理
  const renderUserManagement = () => (
    <div>
      <Card 
        title="用户管理" 
        extra={
          <Button type="primary" icon={<UserOutlined />}>
            添加用户
          </Button>
        }
      >
        <Alert
          message="用户管理功能"
          description="在这里可以查看、编辑、禁用用户账户，管理用户角色和权限。"
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        
        <Table
          columns={userColumns}
          dataSource={users}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>
    </div>
  );

  // 渲染题目审核
  const renderQuestionReview = () => (
    <div>
      <Card title="题目审核">
        <Alert
          message="待审核题目"
          description="请仔细审核题目内容、答案和解析，确保题目质量符合标准。"
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />
        
        <Table
          columns={questionColumns}
          dataSource={questions}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
          }}
        />
      </Card>
    </div>
  );

  // 渲染数据分析
  const renderDataAnalysis = () => (
    <div>
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="用户角色分布">
            <ReactEcharts 
              option={getUserRoleOption()} 
              style={{ height: '300px' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="题目难度分布">
            {systemStats?.distribution?.questionDifficulty && (
              <div>
                {systemStats.distribution.questionDifficulty.map((item: any, index: number) => {
                  if (!item) return null;
                  
                  // 获取难度名称和数量，支持不同数据格式
                  let difficultyName: string;
                  let count: number;
                  
                  // MongoDB 聚合格式: { _id: 'easy', count: 1138 }
                  if (item._id && typeof item.count === 'number') {
                    difficultyName = item._id === 'easy' ? '简单' : 
                                   item._id === 'medium' ? '中等' : '困难';
                    count = item.count;
                  }
                  // 简单对象格式: { name: '简单', value: 1138, color: '#52c41a' }
                  else if (item.name && typeof item.value === 'number') {
                    difficultyName = item.name;
                    count = item.value;
                  }
                  // 其他格式的后备处理
                  else {
                    difficultyName = item.label || item.type || `难度${index + 1}`;
                    count = item.count || item.value || 0;
                  }
                  
                  // 获取颜色
                  const getColor = (): string => {
                    if (item.color) return item.color;
                    if (difficultyName.includes('简单') || difficultyName === 'easy') return '#52c41a';
                    if (difficultyName.includes('中等') || difficultyName === 'medium') return '#faad14';
                    return '#ff4d4f';
                  };
                  
                  return (
                    <div key={item._id || item.name || index} style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <Text>{difficultyName}</Text>
                        <Text>{count}</Text>
                      </div>
                      <Progress 
                        percent={systemStats.overview.totalQuestions > 0 ? 
                          (count / systemStats.overview.totalQuestions) * 100 : 0
                        } 
                        strokeColor={getColor()}
                      />
                    </div>
                  );
                }).filter(item => item !== null)}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24}>
          <Card title="题目分类分布">
            {systemStats?.distribution?.questionCategory && (
              <Row gutter={16}>
                {systemStats.distribution.questionCategory.map((item: any, index: number) => {
                  if (!item) return null;
                  
                  // 获取分类名称和数量，支持不同数据格式
                  let categoryName: string;
                  let count: number;
                  
                  // MongoDB 聚合格式: { _id: 'football', count: 485 }
                  if (item._id && typeof item.count === 'number') {
                    categoryName = item._id;
                    count = item.count;
                  }
                  // 简单对象格式: { name: '足球', value: 485 }
                  else if (item.name && typeof item.value === 'number') {
                    categoryName = item.name;
                    count = item.value;
                  }
                  // 其他格式的后备处理
                  else {
                    categoryName = item.label || item.type || `分类${index + 1}`;
                    count = item.count || item.value || 0;
                  }
                  
                  return (
                    <Col xs={24} sm={12} md={8} lg={6} key={item._id || item.name || index} style={{ marginBottom: '16px' }}>
                      <Card size="small">
                        <Statistic
                          title={categoryName}
                          value={count}
                          prefix={<BookOutlined />}
                        />
                      </Card>
                    </Col>
                  );
                }).filter(item => item !== null)}
              </Row>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );

  // 渲染系统设置
  const renderSystemSettings = () => (
    <div>
      <Card title="系统设置">
        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <Card title="基础设置" size="small">
              <Form layout="vertical">
                <Form.Item label="系统名称">
                  <Input defaultValue="中小学生体育知识题库平台" />
                </Form.Item>
                <Form.Item label="每页显示数量">
                  <Select defaultValue={10}>
                    <Option value={10}>10</Option>
                    <Option value={20}>20</Option>
                    <Option value={50}>50</Option>
                  </Select>
                </Form.Item>
                <Form.Item label="允许用户注册">
                  <Switch defaultChecked />
                </Form.Item>
              </Form>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="AI设置" size="small">
              <Form layout="vertical">
                <Form.Item label="AI生成开关">
                  <Switch defaultChecked />
                </Form.Item>
                <Form.Item label="单次生成限制">
                  <Input type="number" defaultValue={10} />
                </Form.Item>
                <Form.Item label="API调用频率限制">
                  <Input defaultValue="100/分钟" />
                </Form.Item>
              </Form>
            </Card>
          </Col>
        </Row>

        <div style={{ textAlign: 'right', marginTop: '16px' }}>
          <Space>
            <Button>重置</Button>
            <Button type="primary">保存设置</Button>
          </Space>
        </div>
      </Card>
    </div>
  );

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
                <DashboardOutlined style={{ fontSize: '20px', color: primaryColor }} />
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
                  管理员面板
                </Title>
                <Text type="secondary" style={{ fontSize: '16px', marginLeft: '2px' }}>
                  系统管理和数据分析控制台
                </Text>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button
              type="default"
              icon={<ReloadOutlined />}
              onClick={refreshData}
              loading={loading}
              style={{
                borderRadius: '8px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                border: `1px solid ${isDark ? '#404040' : '#d9d9d9'}`,
                background: isDark ? '#1a1a1a' : '#ffffff'
              }}
            >
              刷新数据
            </Button>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="modern-card animate-slideUp" style={{
        animationDelay: '0.2s',
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
                系统概览
              </span>
            } 
            key="overview"
          >
            <div style={{ padding: '24px' }}>
              {renderOverview()}
            </div>
          </TabPane>
          
          <TabPane 
            tab={
              <span style={{ fontSize: '16px', fontWeight: '500' }}>
                <UserOutlined style={{ marginRight: '8px' }} />
                用户管理
              </span>
            } 
            key="users"
          >
            <div style={{ padding: '24px' }}>
              {renderUserManagement()}
            </div>
          </TabPane>
          
          <TabPane 
            tab={
              <span style={{ fontSize: '16px', fontWeight: '500' }}>
                <BookOutlined style={{ marginRight: '8px' }} />
                题目审核
                {questions.length > 0 && (
                  <Badge 
                    count={questions.length} 
                    style={{ 
                      marginLeft: '8px',
                      background: '#ff4d4f',
                      borderRadius: '10px'
                    }} 
                  />
                )}
              </span>
            } 
            key="review"
          >
            <div style={{ padding: '24px' }}>
              {renderQuestionReview()}
            </div>
          </TabPane>
          
          <TabPane 
            tab={
              <span style={{ fontSize: '16px', fontWeight: '500' }}>
                <LineChartOutlined style={{ marginRight: '8px' }} />
                数据分析
              </span>
            } 
            key="analytics"
          >
            <div style={{ padding: '24px' }}>
              {renderDataAnalysis()}
            </div>
          </TabPane>
          
          <TabPane 
            tab={
              <span style={{ fontSize: '16px', fontWeight: '500' }}>
                <SettingOutlined style={{ marginRight: '8px' }} />
                系统设置
              </span>
            } 
            key="settings"
          >
            <div style={{ padding: '24px' }}>
              {renderSystemSettings()}
            </div>
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel; 