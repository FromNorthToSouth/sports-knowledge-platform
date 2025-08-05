import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Select,
  DatePicker,
  Space,
  Tag,
  Avatar,
  Progress,
  Row,
  Col,
  Statistic,
  Button,
  Modal,
  Tabs,
  Typography,
  Badge,
  Tooltip,
  message
} from 'antd';
import {
  UserOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  BookOutlined,
  EyeOutlined,
  BarChartOutlined,
  TeamOutlined,
  StarOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  FireOutlined,
  CalendarOutlined,
  LineChartOutlined,
  PieChartOutlined,
  DashboardOutlined,
  GiftOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useSelector } from 'react-redux';
import { RootState } from '../types';
import { useTheme } from '../hooks/useTheme';
import '../styles/modern-theme.css';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Title, Text } = Typography;

interface StudentProgressData {
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
    weeklyProgress: number[];
    strongAreas: string[];
    weakAreas: string[];
  };
  points: number;
  rank: number;
  isActive: boolean;
}

const StudentProgress: React.FC = () => {
  const [students, setStudents] = useState<StudentProgressData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<StudentProgressData | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { isDark, primaryColor } = useTheme();

  // 模拟数据
  useEffect(() => {
    loadStudentProgress();
  }, [selectedClass]);

  const loadStudentProgress = async () => {
    setLoading(true);
    // 模拟API延迟
    setTimeout(() => {
      const mockStudents: StudentProgressData[] = [
        {
          id: '1',
          username: '张小明',
          email: 'zhangxiaoming@student.com',
          avatar: '',
          grade: '三年级',
          classInfo: '三年级1班',
          learningStats: {
            totalQuestions: 245,
            correctAnswers: 196,
            accuracy: 80,
            totalTime: 7200,
            continuousLoginDays: 12,
            lastLoginDate: '2024-01-20',
            weeklyProgress: [65, 72, 78, 80, 85, 82, 88],
            strongAreas: ['篮球规则', '田径知识', '体操技巧'],
            weakAreas: ['游泳安全', '足球战术']
          },
          points: 2450,
          rank: 3,
          isActive: true
        },
        {
          id: '2',
          username: '李小红',
          email: 'lixiaohong@student.com',
          avatar: '',
          grade: '三年级',
          classInfo: '三年级1班',
          learningStats: {
            totalQuestions: 312,
            correctAnswers: 281,
            accuracy: 90,
            totalTime: 9360,
            continuousLoginDays: 18,
            lastLoginDate: '2024-01-20',
            weeklyProgress: [75, 80, 85, 88, 90, 92, 95],
            strongAreas: ['游泳安全', '体操技巧', '田径知识', '排球规则'],
            weakAreas: ['足球规则']
          },
          points: 3120,
          rank: 1,
          isActive: true
        },
        {
          id: '3',
          username: '王小华',
          email: 'wangxiaohua@student.com',
          avatar: '',
          grade: '三年级',
          classInfo: '三年级2班',
          learningStats: {
            totalQuestions: 189,
            correctAnswers: 132,
            accuracy: 70,
            totalTime: 5670,
            continuousLoginDays: 5,
            lastLoginDate: '2024-01-19',
            weeklyProgress: [60, 65, 68, 70, 72, 70, 75],
            strongAreas: ['足球规则', '乒乓球技术'],
            weakAreas: ['篮球规则', '游泳安全', '田径知识']
          },
          points: 1890,
          rank: 8,
          isActive: true
        },
        {
          id: '4',
          username: '刘小美',
          email: 'liuxiaomei@student.com',
          avatar: '',
          grade: '三年级',
          classInfo: '三年级1班',
          learningStats: {
            totalQuestions: 267,
            correctAnswers: 227,
            accuracy: 85,
            totalTime: 8010,
            continuousLoginDays: 15,
            lastLoginDate: '2024-01-20',
            weeklyProgress: [70, 75, 80, 82, 85, 87, 90],
            strongAreas: ['田径知识', '体操技巧', '健身常识'],
            weakAreas: ['足球战术', '篮球技术']
          },
          points: 2670,
          rank: 2,
          isActive: true
        },
        {
          id: '5',  
          username: '陈小军',
          email: 'chenxiaojun@student.com',
          avatar: '',
          grade: '四年级',
          classInfo: '四年级1班',
          learningStats: {
            totalQuestions: 298,
            correctAnswers: 238,
            accuracy: 80,
            totalTime: 8940,
            continuousLoginDays: 9,
            lastLoginDate: '2024-01-20',
            weeklyProgress: [68, 72, 75, 78, 80, 82, 85],
            strongAreas: ['足球规则', '篮球技术', '排球规则'],
            weakAreas: ['游泳技术', '体操动作']
          },
          points: 2980,
          rank: 4,
          isActive: true
        },
        {
          id: '6',
          username: '周小花',
          email: 'zhouxiaohua@student.com',
          avatar: '',
          grade: '四年级',
          classInfo: '四年级2班',
          learningStats: {
            totalQuestions: 223,
            correctAnswers: 178,
            accuracy: 80,
            totalTime: 6690,
            continuousLoginDays: 21,
            lastLoginDate: '2024-01-20',
            weeklyProgress: [65, 70, 75, 78, 80, 83, 88],
            strongAreas: ['游泳安全', '健身常识', '乒乓球技术'],
            weakAreas: ['足球战术', '排球技术']
          },
          points: 2230,
          rank: 5,
          isActive: true
        },
        {
          id: '7',
          username: '吴小亮',
          email: 'wuxiaoliang@student.com',
          avatar: '',
          grade: '五年级',
          classInfo: '五年级1班',
          learningStats: {
            totalQuestions: 334,
            correctAnswers: 284,
            accuracy: 85,
            totalTime: 10020,
            continuousLoginDays: 14,
            lastLoginDate: '2024-01-20',
            weeklyProgress: [75, 78, 80, 83, 85, 88, 92],
            strongAreas: ['田径知识', '篮球技术', '足球规则', '体操技巧'],
            weakAreas: ['游泳技术']
          },
          points: 3340,
          rank: 6,
          isActive: true
        },
        {
          id: '8',
          username: '赵小芳',
          email: 'zhaoxiaofang@student.com',
          avatar: '',
          grade: '五年级',
          classInfo: '五年级2班',
          learningStats: {
            totalQuestions: 201,
            correctAnswers: 161,
            accuracy: 80,
            totalTime: 6030,
            continuousLoginDays: 7,
            lastLoginDate: '2024-01-19',
            weeklyProgress: [62, 68, 72, 75, 78, 80, 85],
            strongAreas: ['健身常识', '乒乓球技术'],
            weakAreas: ['足球规则', '篮球技术', '游泳安全']
          },
          points: 2010,
          rank: 7,
          isActive: true
        }
      ];
      setStudents(mockStudents);
      setLoading(false);
    }, 800);
  };

  const showStudentDetail = (student: StudentProgressData) => {
    setSelectedStudent(student);
    setDetailModalVisible(true);
    message.success(`查看 ${student.username} 的详细进度`);
  };

  const exportStudentData = () => {
    message.success('学生数据导出成功');
  };

  const sendMessage = (student: StudentProgressData) => {
    message.success(`已向 ${student.username} 发送消息`);
  };

  const refreshData = () => {
    loadStudentProgress();
    message.success('数据刷新成功');
  };

  const getProgressChartOption = (student: StudentProgressData) => {
    return {
      backgroundColor: 'transparent',
      title: {
        text: `${student.username} - 学习进度趋势`,
        left: 'center',
        textStyle: {
          color: isDark ? '#ffffff' : '#1a202c',
          fontSize: 16,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? '#2a2a2a' : '#ffffff',
        borderColor: isDark ? '#404040' : '#e2e8f0',
        textStyle: {
          color: isDark ? '#ffffff' : '#1a202c'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        axisLine: {
          lineStyle: {
            color: isDark ? '#404040' : '#e2e8f0'
          }
        },
        axisLabel: {
          color: isDark ? '#a1a1aa' : '#64748b'
        }
      },
      yAxis: {
        type: 'value',
        min: 0,
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
            color: isDark ? '#404040' : '#e2e8f0'
          }
        }
      },
      series: [{
        data: student.learningStats.weeklyProgress,
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        itemStyle: {
          color: primaryColor,
          borderWidth: 2,
          borderColor: '#ffffff'
        },
        lineStyle: {
          color: primaryColor,
          width: 3
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0, color: `${primaryColor}40`
            }, {
              offset: 1, color: `${primaryColor}10`
            }]
          }
        }
      }]
    };
  };

  const getClassOverviewChartOption = () => {
    const classData = students.reduce((acc: any, student) => {
      const className = student.classInfo;
      if (!acc[className]) {
        acc[className] = { total: 0, avgAccuracy: 0, accuracySum: 0 };
      }
      acc[className].total += 1;
      acc[className].accuracySum += student.learningStats.accuracy;
      acc[className].avgAccuracy = acc[className].accuracySum / acc[className].total;
      return acc;
    }, {});

    return {
      title: {
        text: '各班级学习表现对比',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      xAxis: {
        type: 'category',
        data: Object.keys(classData)
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: 100,
        axisLabel: {
          formatter: '{value}%'
        }
      },
      series: [{
        name: '平均正确率',
        type: 'bar',
        data: Object.values(classData).map((item: any) => item.avgAccuracy.toFixed(1)),
        itemStyle: {
          color: '#52c41a'
        }
      }]
    };
  };

  const columns = [
    {
      title: '学生信息',
      key: 'student',
      width: 250,
      render: (record: StudentProgressData) => (
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
      key: 'progress',
      width: 200,
      render: (record: StudentProgressData) => (
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
      key: 'rank',
      width: 120,
      render: (record: StudentProgressData) => (
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
            <TrophyOutlined style={{ fontSize: '18px', color: '#faad14' }} />
          </div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#faad14' }}>
            {record.points}
          </div>
          <div style={{ fontSize: '10px', color: '#8c8c8c' }}>
            第{record.rank}名
          </div>
        </div>
      )
    },
    {
      title: '活跃度',
      key: 'activity',
      width: 120,
      render: (record: StudentProgressData) => (
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
      width: 140,
      render: (record: StudentProgressData) => (
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
      width: 120,
      render: (record: StudentProgressData) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => showStudentDetail(record)}
              style={{
                borderRadius: '6px',
                color: primaryColor
              }}
            >
              详情
            </Button>
          </Tooltip>
          <Tooltip title="发送消息">
            <Button
              type="text"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => sendMessage(record)}
              style={{ borderRadius: '6px' }}
            >
              消息
            </Button>
          </Tooltip>
        </Space>
      ),
    },
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
              <DashboardOutlined style={{ 
                fontSize: '32px', 
                color: primaryColor, 
                marginRight: '16px' 
              }} />
              <div>
                <Title level={2} style={{ margin: 0, color: isDark ? '#ffffff' : '#1a202c' }}>
                  学生进度监控
                </Title>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  实时监测学生学习进度和表现
                </Text>
              </div>
            </div>
          </div>
          
          <Space size="large">
            <Select
              value={selectedClass}
              onChange={setSelectedClass}
              style={{ width: 200 }}
              size="large"
              placeholder="选择班级"
            >
              <Option value="all">全部班级</Option>
              <Option value="三年级1班">三年级1班</Option>
              <Option value="三年级2班">三年级2班</Option>
              <Option value="四年级1班">四年级1班</Option>
              <Option value="四年级2班">四年级2班</Option>
              <Option value="五年级1班">五年级1班</Option>
              <Option value="五年级2班">五年级2班</Option>
            </Select>
            <Button 
              type="primary" 
              icon={<BarChartOutlined />}
              onClick={exportStudentData}
              size="large"
              style={{
                background: primaryColor,
                border: 'none',
                borderRadius: '8px'
              }}
            >
              导出数据
            </Button>
            <Button 
              icon={<RiseOutlined />}
              onClick={refreshData}
              size="large"
              style={{ borderRadius: '8px' }}
            >
              刷新
            </Button>
          </Space>
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
              <UserOutlined style={{ 
                fontSize: '24px', 
                color: primaryColor, 
                marginBottom: '12px',
                position: 'relative',
                zIndex: 1
              }} />
              <div className="stats-number" style={{ color: primaryColor }}>
                {students.length}
              </div>
              <div className="stats-label">学生总数</div>
              <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                活跃: {students.filter(s => s.isActive).length}人
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
              <TrophyOutlined style={{ 
                fontSize: '24px', 
                color: '#52c41a', 
                marginBottom: '12px',
                position: 'relative',
                zIndex: 1
              }} />
              <div className="stats-number" style={{ color: '#52c41a' }}>
                {students.length > 0 ? (students.reduce((sum, s) => sum + s.learningStats.accuracy, 0) / students.length).toFixed(1) : 0}%
              </div>
              <div className="stats-label">平均正确率</div>
              <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                最高: {students.length > 0 ? Math.max(...students.map(s => s.learningStats.accuracy)) : 0}%
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
              <StarOutlined style={{ 
                fontSize: '24px', 
                color: '#faad14', 
                marginBottom: '12px',
                position: 'relative',
                zIndex: 1
              }} />
              <div className="stats-number" style={{ color: '#faad14' }}>
                {students.reduce((sum, s) => sum + s.points, 0)}
              </div>
              <div className="stats-label">总积分</div>
              <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                平均: {students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.points, 0) / students.length) : 0}分
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
              <ClockCircleOutlined style={{ 
                fontSize: '24px', 
                color: '#722ed1', 
                marginBottom: '12px',
                position: 'relative',
                zIndex: 1
              }} />
              <div className="stats-number" style={{ color: '#722ed1' }}>
                {Math.round(students.reduce((sum, s) => sum + s.learningStats.totalTime, 0) / 3600)}
              </div>
              <div className="stats-label">总学习时长(小时)</div>
              <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                平均: {students.length > 0 ? Math.round(students.reduce((sum, s) => sum + s.learningStats.totalTime, 0) / students.length / 60) : 0}分钟
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
                <UserOutlined style={{ marginRight: '8px' }} />
                学生列表
              </span>
            } 
            key="overview"
          >
            <div style={{ padding: '24px' }}>
              <Table
                columns={columns}
                dataSource={students}
                rowKey="id"
                loading={loading}
                size="large"
                style={{
                  background: 'transparent'
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
          
          <TabPane 
            tab={
              <span style={{ fontSize: '16px', fontWeight: '500' }}>
                <BarChartOutlined style={{ marginRight: '8px' }} />
                班级对比
              </span>
            } 
            key="comparison"
          >
            <div style={{ padding: '24px' }}>
              <ReactECharts 
                option={getClassOverviewChartOption()} 
                style={{ height: '400px' }}
                theme={isDark ? 'dark' : 'light'}
              />
            </div>
          </TabPane>
        </Tabs>
      </div>

      {/* 学生详情模态框 */}
      <Modal
        title={`${selectedStudent?.username} - 学习详情`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={800}
        footer={null}
      >
        {selectedStudent && (
          <div>
            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="总题数"
                    value={selectedStudent.learningStats.totalQuestions}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="正确率"
                    value={selectedStudent.learningStats.accuracy}
                    suffix="%"
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="总积分"
                    value={selectedStudent.points}
                  />
                </Card>
              </Col>
            </Row>

            <ReactECharts 
              option={getProgressChartOption(selectedStudent)} 
              style={{ height: '300px', marginBottom: '24px' }} 
            />

            <Row gutter={16}>
              <Col span={12}>
                <Card title="优势领域" size="small">
                  <Space wrap>
                    {selectedStudent.learningStats.strongAreas.map((area, index) => (
                      <Tag key={index} color="green">{area}</Tag>
                    ))}
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="薄弱环节" size="small">
                  <Space wrap>
                    {selectedStudent.learningStats.weakAreas.map((area, index) => (
                      <Tag key={index} color="red">{area}</Tag>
                    ))}
                  </Space>
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StudentProgress; 