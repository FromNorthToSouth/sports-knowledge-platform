import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Form, Input, Button, Avatar, Upload, message,
  Tabs, Statistic, Progress, Tag, List, Typography, Space, 
  Modal, Select, DatePicker, Divider, Alert, Timeline, Badge,
  Switch, Tooltip, Popconfirm, InputNumber, Radio
} from 'antd';
import {
  UserOutlined, EditOutlined, CameraOutlined, TrophyOutlined,
  BookOutlined, ClockCircleOutlined, FireOutlined, 
  BarChartOutlined, CalendarOutlined, StarOutlined,
  SafetyOutlined, FileTextOutlined, BulbOutlined, HistoryOutlined,
  SettingOutlined, EyeOutlined, LockOutlined, CheckCircleOutlined,
  GiftOutlined, ThunderboltOutlined, HeartOutlined, DashboardOutlined,
  PlusOutlined, RocketOutlined
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../types';
import { updateUserProfile, getUserProfile } from '../store/slices/authSlice';
import { statsAPI } from '../services/statsAPI';
import ReactEcharts from 'echarts-for-react';
import dayjs from 'dayjs';
import { useTheme } from '../hooks/useTheme';
import '../styles/modern-theme.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

interface LearningStats {
  userStats: any;
  points: number;
  achievements: string[];
  abilityProfile: any;
  periodStats: any;
  categoryProgress: any[];
  timeTrend: any[];
  weaknessAnalysis: any[];
}

const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState('info');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { isDark, primaryColor } = useTheme();

  // 丰富的学习统计数据  
  const mockLearningStats: LearningStats = {
    userStats: {
      totalQuestions: 1247,
      correctAnswers: 1056,
      accuracy: 84.7, // 添加正确率字段
      totalTime: 8472, // 分钟
      continuousLoginDays: 23,
      currentStreak: 7,
      maxStreak: 15,
      level: 8,
      nextLevelExp: 2400,
      currentExp: 1867
    },
    points: 3456,
    achievements: [
      '初学者', '勤奋练习者', '知识达人', '坚持不懈', '完美主义者',
      '速度之王', '全能选手', '体育专家'
    ],
    abilityProfile: {
      足球: 85,
      篮球: 78,
      游泳: 92,
      田径: 67,
      排球: 74,
      乒乓球: 89,
      体操: 56,
      健身: 81
    },
    periodStats: {
      thisWeek: { questions: 156, accuracy: 84.2, time: 327 },
      lastWeek: { questions: 142, accuracy: 81.7, time: 298 },
      thisMonth: { questions: 623, accuracy: 83.1, time: 1289 },
      lastMonth: { questions: 587, accuracy: 80.9, time: 1156 }
    },
    categoryProgress: [
      { category: '足球', completed: 189, total: 245, accuracy: 87.3 },
      { category: '篮球', completed: 156, total: 198, accuracy: 82.1 },
      { category: '游泳', completed: 134, total: 167, accuracy: 91.2 },
      { category: '田径', completed: 98, total: 156, accuracy: 76.4 },
      { category: '排球', completed: 78, total: 123, accuracy: 79.8 },
      { category: '乒乓球', completed: 167, total: 189, accuracy: 88.9 },
      { category: '体操', completed: 45, total: 98, accuracy: 65.2 },
      { category: '健身', completed: 123, total: 167, accuracy: 83.7 }
    ],
    timeTrend: [
      { date: '2024-01-14', questions: 23, accuracy: 82.6 },
      { date: '2024-01-15', questions: 18, accuracy: 85.4 },
      { date: '2024-01-16', questions: 31, accuracy: 79.3 },
      { date: '2024-01-17', questions: 27, accuracy: 88.1 },
      { date: '2024-01-18', questions: 35, accuracy: 83.7 },
      { date: '2024-01-19', questions: 29, accuracy: 86.2 },
      { date: '2024-01-20', questions: 42, accuracy: 84.8 }
    ],
    weaknessAnalysis: [
      { area: '体操基础动作', score: 56, improvement: '+12%' },
      { area: '田径规则理解', score: 64, improvement: '+8%' },
      { area: '排球战术分析', score: 71, improvement: '+15%' }
    ]
  };

  const [learningStats] = useState<LearningStats>(mockLearningStats);

  // 数据验证函数
  const validateLearningStats = (stats: LearningStats | null): LearningStats => {
    if (!stats) return mockLearningStats;
    
    return {
      userStats: {
        totalQuestions: stats.userStats?.totalQuestions || 0,
        correctAnswers: stats.userStats?.correctAnswers || 0,
        accuracy: stats.userStats?.accuracy || 0,
        totalTime: stats.userStats?.totalTime || 0,
        continuousLoginDays: stats.userStats?.continuousLoginDays || 0,
        currentStreak: stats.userStats?.currentStreak || 0,
        maxStreak: stats.userStats?.maxStreak || 0,
        level: stats.userStats?.level || 1,
        nextLevelExp: stats.userStats?.nextLevelExp || 100,
        currentExp: stats.userStats?.currentExp || 0
      },
      points: stats.points || 0,
      achievements: stats.achievements || [],
      abilityProfile: stats.abilityProfile || {},
      periodStats: stats.periodStats || {},
      categoryProgress: Array.isArray(stats.categoryProgress) 
        ? stats.categoryProgress.filter(item => item && (item.category || item._id))
        : [],
      timeTrend: Array.isArray(stats.timeTrend) ? stats.timeTrend : [],
      weaknessAnalysis: Array.isArray(stats.weaknessAnalysis) 
        ? stats.weaknessAnalysis.filter(item => item && (item.area || (item._id && item._id.category)))
        : []
    };
  };

  // 使用验证后的数据
  const validatedStats = validateLearningStats(learningStats);

  // 模拟数据加载
  const refreshData = async () => {
    setLoading(true);
    setTimeout(() => {
      message.success('数据刷新成功');
      setLoading(false);
    }, 800);
  };

  // 修改密码
  const changePassword = async (values: any) => {
    try {
      setLoading(true);
      // 模拟API调用
      setTimeout(() => {
        message.success('密码修改成功');
        setPasswordModalVisible(false);
        passwordForm.resetFields();
        setLoading(false);
      }, 1000);
    } catch (error: any) {
      message.error('密码修改失败');
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    if (user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        phone: user.phone,
        grade: user.grade,
        classInfo: user.classInfo,
      });
      setAvatarUrl(user.avatar || '');
    }
  }, [user, form]);

  // 更新个人信息
  const handleUpdateProfile = async (values: any) => {
    try {
      setLoading(true);
      await dispatch(updateUserProfile({
        ...values,
        avatar: avatarUrl
      }) as any);
      message.success('个人信息更新成功');
      setEditing(false);
    } catch (error: any) {
      message.error('更新失败：' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 头像上传
  const handleAvatarChange = (info: any) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }
    if (info.file.status === 'done') {
      // 这里应该处理上传成功的头像URL
      setAvatarUrl(info.file.response?.url || '');
      setLoading(false);
    }
  };

  // 能力雷达图配置
  const getAbilityRadarOption = () => {
    if (!validatedStats?.abilityProfile) return {};

    // 从实际的abilityProfile数据中获取前6个运动项目
    const abilityEntries = Object.entries(validatedStats.abilityProfile);
    const topSports = abilityEntries.slice(0, 6);

    const indicators = topSports.map(([sport, score]) => ({
      name: sport,
      max: 100
    }));

    const values = topSports.map(([sport, score]) => Number(score) || 0);

    return {
      title: {
        text: '能力分析',
        left: 'center',
        textStyle: {
          color: isDark ? '#ffffff' : '#1a202c',
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: isDark ? '#262626' : '#ffffff',
        borderColor: isDark ? '#404040' : '#e2e8f0',
        textStyle: {
          color: isDark ? '#ffffff' : '#1a202c'
        }
      },
      radar: {
        indicator: indicators,
        radius: 120,
        splitNumber: 5,
        name: {
          textStyle: {
            color: isDark ? '#a1a1aa' : '#4a5568',
            fontSize: 12
          }
        },
        splitLine: {
          lineStyle: {
            color: isDark ? '#404040' : '#e2e8f0'
          }
        },
        splitArea: {
          areaStyle: {
            color: isDark 
              ? ['rgba(255, 255, 255, 0.02)', 'rgba(255, 255, 255, 0.01)']
              : ['rgba(0, 0, 0, 0.02)', 'rgba(0, 0, 0, 0.01)']
          }
        },
        axisLine: {
          lineStyle: {
            color: isDark ? '#404040' : '#e2e8f0'
          }
        }
      },
      series: [{
        type: 'radar',
        data: [{
          value: values,
          name: '我的能力',
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: { 
            color: primaryColor,
            borderWidth: 2,
            borderColor: '#ffffff'
          },
          lineStyle: {
            color: primaryColor,
            width: 2
          },
          areaStyle: { 
            color: primaryColor + '20',
            opacity: 0.6
          },
          emphasis: {
            itemStyle: {
              color: primaryColor,
              shadowBlur: 10,
              shadowColor: primaryColor + '40'
            }
          }
        }]
      }]
    };
  };

  // 学习时间趋势图配置
  const getTimeTrendOption = () => {
    if (!validatedStats?.timeTrend?.length) return {};

    // 处理不同的数据结构格式
    const dates = validatedStats.timeTrend
      .filter(item => item != null) // 过滤掉 null 或 undefined 项
      .map((item: any) => {
        // 处理两种可能的数据格式
        if (item._id && item._id.month && item._id.day) {
          // MongoDB聚合查询格式: { _id: { month: 1, day: 15 }, ... }
          return `${item._id.month}/${item._id.day}`;
        } else if (item.date) {
          // 标准日期格式: { date: '2024-01-15', ... }
          return dayjs(item.date).format('MM/DD');
        } else {
          // 兜底格式
          return '未知';
        }
      });

    const times = validatedStats.timeTrend
      .filter(item => item != null)
      .map((item: any) => {
        // 处理不同字段名的时间数据
        return item.totalTime || item.studyTime || item.questions * 2 || 0; // 假设每题2分钟
      });

    const scores = validatedStats.timeTrend
      .filter(item => item != null) 
      .map((item: any) => {
        // 处理不同字段名的分数数据
        return item.averageScore || item.accuracy || 0;
      });

    return {
      title: {
        text: '学习时间趋势',
        left: 'center',
        textStyle: {
          color: isDark ? '#ffffff' : '#1a202c',
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? '#262626' : '#ffffff',
        borderColor: isDark ? '#404040' : '#e2e8f0',
        textStyle: {
          color: isDark ? '#ffffff' : '#1a202c'
        }
      },
      legend: {
        data: ['学习时间(分钟)', '准确率(%)'],
        top: 30,
        textStyle: {
          color: isDark ? '#a1a1aa' : '#4a5568'
        }
      },
      grid: {
        top: 60,
        left: 60,
        right: 60,
        bottom: 40
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLabel: {
          color: isDark ? '#a1a1aa' : '#64748b'
        },
        axisLine: {
          lineStyle: {
            color: isDark ? '#404040' : '#e2e8f0'
          }
        }
      },
      yAxis: [
        {
          type: 'value',
          name: '时间(分钟)',
          position: 'left',
          nameTextStyle: {
            color: isDark ? '#a1a1aa' : '#64748b'
          },
          axisLabel: {
            color: isDark ? '#a1a1aa' : '#64748b'
          },
          axisLine: {
            lineStyle: {
              color: isDark ? '#404040' : '#e2e8f0'
            }
          },
          splitLine: {
            lineStyle: {
              color: isDark ? '#404040' : '#f0f0f0'
            }
          }
        },
        {
          type: 'value',
          name: '准确率(%)',
          position: 'right',
          max: 100,
          nameTextStyle: {
            color: isDark ? '#a1a1aa' : '#64748b'
          },
          axisLabel: {
            color: isDark ? '#a1a1aa' : '#64748b',
            formatter: '{value}%'
          },
          axisLine: {
            lineStyle: {
              color: isDark ? '#404040' : '#e2e8f0'
            }
          },
          splitLine: {
            show: false
          }
        }
      ],
      series: [
        {
          name: '学习时间(分钟)',
          type: 'bar',
          data: times,
          itemStyle: { 
            color: primaryColor,
            borderRadius: [4, 4, 0, 0]
          },
          emphasis: {
            itemStyle: {
              color: primaryColor + 'dd'
            }
          }
        },
        {
          name: '准确率(%)',
          type: 'line',
          yAxisIndex: 1,
          data: scores,
          itemStyle: { color: '#52c41a' },
          lineStyle: { 
            color: '#52c41a',
            width: 3
          },
          symbol: 'circle',
          symbolSize: 6,
          smooth: true,
          emphasis: {
            itemStyle: {
              borderWidth: 2,
              borderColor: '#52c41a'
            }
          }
        }
      ]
    };
  };

  // 分类掌握情况图配置
  const getCategoryProgressOption = () => {
    if (!validatedStats?.categoryProgress?.length) return {};

    const categories = validatedStats.categoryProgress
      .filter(item => item != null)
      .map((item: any) => item.category || item._id || '未知');
    const accuracies = validatedStats.categoryProgress
      .filter(item => item != null)
      .map((item: any) => item.accuracy || 0);

    return {
      title: {
        text: '各类别掌握情况',
        left: 'center',
        textStyle: {
          color: isDark ? '#ffffff' : '#1a202c',
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: '{b}: {c}%',
        backgroundColor: isDark ? '#262626' : '#ffffff',
        borderColor: isDark ? '#404040' : '#e2e8f0',
        textStyle: {
          color: isDark ? '#ffffff' : '#1a202c'
        }
      },
      grid: {
        top: 60,
        left: 60,
        right: 40,
        bottom: 100
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: {
          rotate: 45,
          color: isDark ? '#a1a1aa' : '#64748b',
          fontSize: 12
        },
        axisLine: {
          lineStyle: {
            color: isDark ? '#404040' : '#e2e8f0'
          }
        }
      },
      yAxis: {
        type: 'value',
        max: 100,
        axisLabel: {
          formatter: '{value}%',
          color: isDark ? '#a1a1aa' : '#64748b'
        },
        axisLine: {
          lineStyle: {
            color: isDark ? '#404040' : '#e2e8f0'
          }
        },
        splitLine: {
          lineStyle: {
            color: isDark ? '#404040' : '#f0f0f0'
          }
        }
      },
      series: [{
        type: 'bar',
        data: accuracies,
        itemStyle: {
          color: function(params: any) {
            const value = params.value;
            if (value >= 85) return '#52c41a';  // 优秀 - 绿色
            if (value >= 75) return '#1890ff';  // 良好 - 蓝色
            if (value >= 60) return '#faad14';  // 及格 - 橙色
            return '#ff4d4f';                   // 不及格 - 红色
          },
          borderRadius: [4, 4, 0, 0]
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowOffsetY: 2,
            shadowColor: 'rgba(0, 0, 0, 0.2)'
          }
        },
        label: {
          show: true,
          position: 'top',
          formatter: '{c}%',
          color: isDark ? '#ffffff' : '#1a202c',
          fontSize: 11,
          fontWeight: 'bold'
        }
      }]
    };
  };

  // 渲染个人信息页面
  const renderPersonalInfo = () => (
    <Row gutter={24}>
      <Col xs={24} lg={8}>
        <Card>
          <div style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
              <Avatar 
                size={120} 
                src={avatarUrl} 
                icon={<UserOutlined />}
                style={{ border: '4px solid #f0f0f0' }}
              />
              {editing && (
                <Upload
                  name="avatar"
                  listType="picture-card"
                  className="avatar-uploader"
                  showUploadList={false}
                  action="/api/upload/avatar" // 需要后端支持
                  onChange={handleAvatarChange}
                  style={{ position: 'absolute', bottom: 0, right: 0 }}
                >
                  <Button 
                    shape="circle" 
                    icon={<CameraOutlined />} 
                    size="small"
                    style={{ 
                      position: 'absolute', 
                      bottom: '-10px', 
                      right: '-10px',
                      backgroundColor: '#1890ff',
                      color: 'white',
                      border: 'none'
                    }}
                  />
                </Upload>
              )}
            </div>
            <Title level={4}>{user?.username}</Title>
            <Tag color="blue">{user?.role === 'student' ? '学生' : user?.role}</Tag>
            <div style={{ marginTop: '16px' }}>
              <Text type="secondary">
                加入时间: {user?.createdAt ? dayjs(user.createdAt).format('YYYY-MM-DD') : '-'}
              </Text>
            </div>
          </div>
        </Card>

        <Card title="教学概况" style={{ marginTop: '16px' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Statistic 
                title="创建题目" 
                value={145}
                prefix={<BookOutlined style={{ color: '#52c41a' }} />}
              />
            </Col>
            <Col span={12}>
              <Statistic 
                title="发布考试" 
                value={23}
                prefix={<FileTextOutlined style={{ color: '#1890ff' }} />}
              />
            </Col>
            <Col span={12} style={{ marginTop: '16px' }}>
              <Statistic 
                title="学生参与" 
                value={567}
                prefix={<UserOutlined style={{ color: '#722ed1' }} />}
              />
            </Col>
            <Col span={12} style={{ marginTop: '16px' }}>
              <Statistic 
                title="平均得分" 
                value={82.5}
                precision={1}
                suffix="%"
                prefix={<TrophyOutlined style={{ color: '#faad14' }} />}
              />
            </Col>
          </Row>
        </Card>
      </Col>

      <Col xs={24} lg={16}>
        <Card 
          title="个人信息" 
          extra={
            <Button 
              type={editing ? 'default' : 'primary'} 
              icon={<EditOutlined />}
              onClick={() => setEditing(!editing)}
            >
              {editing ? '取消' : '编辑'}
            </Button>
          }
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdateProfile}
            disabled={!editing}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="username"
                  label="用户名"
                  rules={[{ required: true, message: '请输入用户名' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="email"
                  label="邮箱"
                  rules={[
                    { required: true, message: '请输入邮箱' },
                    { type: 'email', message: '请输入有效的邮箱地址' }
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="phone"
                  label="手机号"
                  rules={[
                    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="department" label="所属部门">
                  <Input placeholder="请输入所属部门" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="teachingSubject" label="教学科目">
              <Select mode="multiple" placeholder="请选择教学科目">
                <Option value="体育理论">体育理论</Option>
                <Option value="足球">足球</Option>
                <Option value="篮球">篮球</Option>
                <Option value="排球">排球</Option>
                <Option value="田径">田径</Option>
                <Option value="游泳">游泳</Option>
                <Option value="体操">体操</Option>
                <Option value="武术">武术</Option>
                <Option value="网球">网球</Option>
                <Option value="乒乓球">乒乓球</Option>
                <Option value="羽毛球">羽毛球</Option>
              </Select>
            </Form.Item>

            {editing && (
              <Form.Item style={{ textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => setEditing(false)}>
                    取消
                  </Button>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    保存
                  </Button>
                </Space>
              </Form.Item>
            )}
          </Form>
        </Card>


      </Col>
    </Row>
  );

  // 渲染学习报告页面
  const renderLearningReport = () => (
    <div>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="总学习时长"
              value={validatedStats?.userStats?.totalTime || 0}
              suffix="分钟"
              prefix={<ClockCircleOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="答题总数"
              value={validatedStats?.userStats?.totalQuestions || 0}
              prefix={<BookOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="正确题数"
              value={validatedStats?.userStats?.correctAnswers || 0}
              prefix={<StarOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="正确率"
              value={validatedStats?.userStats?.accuracy || 0}
              precision={1}
              suffix="%"
              prefix={<TrophyOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="学习时间趋势">
            <ReactEcharts 
              option={getTimeTrendOption()} 
              style={{ height: '300px' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="各类别掌握情况">
            <ReactEcharts 
              option={getCategoryProgressOption()} 
              style={{ height: '300px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 薄弱环节分析 */}
      {validatedStats?.weaknessAnalysis && validatedStats.weaknessAnalysis.length > 0 && (
        <Card title="薄弱环节分析" extra={<BulbOutlined />}>
          <Alert
            message="建议重点关注以下薄弱环节"
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
          <List
            dataSource={validatedStats.weaknessAnalysis}
            renderItem={(item: any, index: number) => {
              // 额外的安全检查
              if (!item) return null;
              
              const title = item._id?.category && item._id?.difficulty 
                ? `${item._id.category} - ${item._id.difficulty}` 
                : item.area || '未知领域';
              
              const description = item.count 
                ? `错误次数: ${item.count}` 
                : `掌握程度: ${item.score || 0}分 (${item.improvement || '无变化'})`;

              return (
                <List.Item key={index}>
                  <List.Item.Meta
                    avatar={<Avatar style={{ backgroundColor: '#ff4d4f' }}>{index + 1}</Avatar>}
                    title={title}
                    description={description}
                  />
                  <div>
                    <Button type="link" size="small">
                      针对练习
                    </Button>
                  </div>
                </List.Item>
              );
            }}
          />
        </Card>
      )}
    </div>
  );

  // 渲染能力分析页面
  const renderAbilityAnalysis = () => (
    <div>
      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="能力雷达图">
            <ReactEcharts 
              option={getAbilityRadarOption()} 
              style={{ height: '400px' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="能力详细分析">
            {validatedStats?.abilityProfile && (
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <Text strong>体育知识</Text>
                  <Progress
                    percent={validatedStats.abilityProfile.sportsKnowledge || 0}
                    strokeColor="#1890ff"
                    style={{ marginLeft: '16px' }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <Text strong>规则理解</Text>
                  <Progress
                    percent={validatedStats.abilityProfile.rulesUnderstanding || 0}
                    strokeColor="#52c41a"
                    style={{ marginLeft: '16px' }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <Text strong>技术技能</Text>
                  <Progress
                    percent={validatedStats.abilityProfile.technicalSkills || 0}
                    strokeColor="#faad14"
                    style={{ marginLeft: '16px' }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <Text strong>历史知识</Text>
                  <Progress
                    percent={validatedStats.abilityProfile.historyKnowledge || 0}
                    strokeColor="#722ed1"
                    style={{ marginLeft: '16px' }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <Text strong>裁判能力</Text>
                  <Progress
                    percent={validatedStats.abilityProfile.judgeAbility || 0}
                    strokeColor="#eb2f96"
                    style={{ marginLeft: '16px' }}
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <Text strong>安全意识</Text>
                  <Progress
                    percent={validatedStats.abilityProfile.safetyAwareness || 0}
                    strokeColor="#13c2c2"
                    style={{ marginLeft: '16px' }}
                  />
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Card title="能力提升建议" style={{ marginTop: '16px' }}>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <BookOutlined style={{ fontSize: '32px', color: '#1890ff', marginBottom: '8px' }} />
              <Title level={5}>体育知识</Title>
              <Text type="secondary">
                通过大量阅读体育相关书籍和资料，不断积累体育理论知识
              </Text>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <FileTextOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: '8px' }} />
              <Title level={5}>规则掌握</Title>
              <Text type="secondary">
                重点学习各项运动的竞赛规则，观看比赛加深理解
              </Text>
            </div>
          </Col>
          <Col xs={24} sm={8}>
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <SafetyOutlined style={{ fontSize: '32px', color: '#faad14', marginBottom: '8px' }} />
              <Title level={5}>安全意识</Title>
              <Text type="secondary">
                学习运动安全知识，掌握运动损伤的预防和处理方法
              </Text>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );

  // 渲染学习历史页面
  const renderLearningHistory = () => (
    <div>
      <Card title="学习时间线">
        <Timeline>
          <Timeline.Item 
            dot={<ClockCircleOutlined style={{ fontSize: '16px' }} />} 
            color="blue"
          >
            <Text strong>今天</Text>
            <br />
            <Text type="secondary">完成了足球规则练习，答对8/10题</Text>
          </Timeline.Item>
          <Timeline.Item 
            dot={<TrophyOutlined style={{ fontSize: '16px' }} />} 
            color="green"
          >
            <Text strong>昨天</Text>
            <br />
            <Text type="secondary">参加了篮球知识模拟考试，获得85分</Text>
          </Timeline.Item>
          <Timeline.Item 
            dot={<BookOutlined style={{ fontSize: '16px' }} />} 
            color="red"
          >
            <Text strong>3天前</Text>
            <br />
            <Text type="secondary">学习了田径基础知识，用时30分钟</Text>
          </Timeline.Item>
          <Timeline.Item 
            dot={<StarOutlined style={{ fontSize: '16px' }} />} 
            color="yellow"
          >
            <Text strong>一周前</Text>
            <br />
            <Text type="secondary">达成了"连续学习7天"的成就</Text>
          </Timeline.Item>
        </Timeline>
      </Card>
    </div>
  );

  // 渲染教学统计页面
  const renderTeachingReport = () => (
    <div>
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="创建题目数"
              value={145}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="发布考试数"
              value={23}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="学生参与数"
              value={567}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="平均得分"
              value={82.5}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>
      <Card title="教学活动统计" style={{ marginBottom: '24px' }}>
        <div style={{ height: '300px' }}>
          <ReactEcharts 
            option={getTimeTrendOption()} 
            style={{ height: '100%' }}
            theme={isDark ? 'dark' : 'light'}
          />
        </div>
      </Card>
    </div>
  );

  // 渲染系统设置页面
  const renderSystemSettings = () => (
    <div>
      <Card title="AI组卷设置" style={{ marginBottom: '24px' }}>
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="默认题目数量">
                <InputNumber min={5} max={100} defaultValue={20} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="默认考试时长（分钟）">
                <InputNumber min={10} max={300} defaultValue={60} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="默认难度偏好">
                <Select defaultValue="medium" style={{ width: '100%' }}>
                  <Select.Option value="easy">简单</Select.Option>
                  <Select.Option value="medium">中等</Select.Option>
                  <Select.Option value="hard">困难</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="自动保存草稿">
                <Switch defaultChecked />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
      
      <Card title="通知设置" style={{ marginBottom: '24px' }}>
        <Form layout="vertical">
          <Form.Item label="学生提交作业时通知">
            <Switch defaultChecked />
          </Form.Item>
          <Form.Item label="考试结束时通知">
            <Switch defaultChecked />
          </Form.Item>
          <Form.Item label="新用户注册时通知">
            <Switch />
          </Form.Item>
          <Form.Item label="系统维护通知">
            <Switch defaultChecked />
          </Form.Item>
        </Form>
      </Card>

      <Card title="界面设置">
        <Form layout="vertical">
          <Form.Item label="主题模式">
            <Radio.Group defaultValue="auto">
              <Radio value="light">浅色模式</Radio>
              <Radio value="dark">深色模式</Radio>
              <Radio value="auto">跟随系统</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item label="列表显示数量">
            <Select defaultValue="20" style={{ width: '200px' }}>
              <Select.Option value="10">10条/页</Select.Option>
              <Select.Option value="20">20条/页</Select.Option>
              <Select.Option value="50">50条/页</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );

  // 渲染操作历史页面
  const renderOperationHistory = () => (
    <div>
      <Card title="最近操作">
        <Timeline>
          <Timeline.Item 
            dot={<PlusOutlined style={{ fontSize: '16px' }} />} 
            color="green"
          >
            <div>
              <Text strong>创建了新题目</Text>
              <Badge count="AI生成" style={{ marginLeft: '8px' }} />
              <br />
              <Text type="secondary">2小时前 - 足球越位规则判断题</Text>
            </div>
          </Timeline.Item>
          <Timeline.Item 
            dot={<RocketOutlined style={{ fontSize: '16px' }} />} 
            color="blue"
          >
            <div>
              <Text strong>发布了考试</Text>
              <br />
              <Text type="secondary">5小时前 - 体育理论期中考试（面向2023级体育班）</Text>
            </div>
          </Timeline.Item>
          <Timeline.Item 
            dot={<EditOutlined style={{ fontSize: '16px' }} />} 
            color="orange"
          >
            <div>
              <Text strong>修改了题目</Text>
              <br />
              <Text type="secondary">1天前 - 篮球罚球技术要点分析</Text>
            </div>
          </Timeline.Item>
          <Timeline.Item 
            dot={<FileTextOutlined style={{ fontSize: '16px' }} />} 
            color="red"
          >
            <div>
              <Text strong>批量导入题目</Text>
              <Badge count="15题" style={{ marginLeft: '8px' }} />
              <br />
              <Text type="secondary">3天前 - 游泳安全知识题库</Text>
            </div>
          </Timeline.Item>
          <Timeline.Item 
            dot={<StarOutlined style={{ fontSize: '16px' }} />} 
            color="purple"
          >
            <div>
              <Text strong>获得成就</Text>
              <Badge count="出题达人" style={{ marginLeft: '8px' }} />
              <br />
              <Text type="secondary">1周前 - 累计创建100道优质题目</Text>
            </div>
          </Timeline.Item>
        </Timeline>
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
                <UserOutlined style={{ fontSize: '20px', color: primaryColor }} />
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
                  个人中心
                </Title>
                <Text type="secondary" style={{ fontSize: '16px', marginLeft: '2px' }}>
                  管理个人信息和教学设置
                </Text>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button
              type="default"
              icon={<LockOutlined />}
              onClick={() => setPasswordModalVisible(true)}
              style={{
                borderRadius: '8px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                border: `1px solid ${isDark ? '#404040' : '#d9d9d9'}`,
                background: isDark ? '#1a1a1a' : '#ffffff'
              }}
            >
              修改密码
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
                <UserOutlined style={{ marginRight: '8px' }} />
                个人信息
              </span>
            } 
            key="info"
          >
            <div style={{ padding: '24px' }}>
              {renderPersonalInfo()}
            </div>
          </TabPane>
          
          <TabPane 
            tab={
              <span style={{ fontSize: '16px', fontWeight: '500' }}>
                <BarChartOutlined style={{ marginRight: '8px' }} />
                教学统计
              </span>
            } 
            key="report"
          >
            <div style={{ padding: '24px' }}>
              {renderTeachingReport()}
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
          
          <TabPane 
            tab={
              <span style={{ fontSize: '16px', fontWeight: '500' }}>
                <HistoryOutlined style={{ marginRight: '8px' }} />
                操作历史
              </span>
            } 
            key="history"
          >
            <div style={{ padding: '24px' }}>
              {renderOperationHistory()}
            </div>
          </TabPane>
        </Tabs>
      </div>

      {/* 修改密码模态框 */}
      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false);
          passwordForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={changePassword}
        >
          <Form.Item
            label="当前密码"
            name="currentPassword"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password 
              size="large"
              placeholder="请输入当前密码"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>
          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6位字符' }
            ]}
          >
            <Input.Password 
              size="large"
              placeholder="请输入新密码"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>
          <Form.Item
            label="确认新密码"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password 
              size="large"
              placeholder="请确认新密码"
              style={{ borderRadius: '8px' }}
            />
          </Form.Item>
          <Form.Item style={{ marginTop: '24px', marginBottom: '0' }}>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button 
                onClick={() => {
                  setPasswordModalVisible(false);
                  passwordForm.resetFields();
                }}
                style={{ borderRadius: '8px' }}
              >
                取消
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={loading}
                style={{ borderRadius: '8px' }}
              >
                确认修改
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile; 