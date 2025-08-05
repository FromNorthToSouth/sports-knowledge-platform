import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Tag,
  Timeline,
  Calendar,
  Badge,
  Tabs,
  Table,
  Avatar,
  Space,
  Typography,
  Tooltip,
  Button
} from 'antd';
import {
  TrophyOutlined,
  ClockCircleOutlined,
  BookOutlined,
  FireOutlined,
  StarOutlined,
  CalendarOutlined,
  RiseOutlined,
  ThunderboltOutlined,
  CrownOutlined,
  AimOutlined,
  BulbOutlined,
  GiftOutlined,
  LineChartOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useSelector } from 'react-redux';
import { RootState } from '../types';
import dayjs, { Dayjs } from 'dayjs';
import { useTheme } from '../hooks/useTheme';
import { achievementAPI } from '../services/achievementAPI';
import { Achievement as AchievementType } from '../types';
import { useNavigate } from 'react-router-dom';

const { TabPane } = Tabs;

interface LearningRecord {
  id: string;
  date: string;
  questionsAnswered: number;
  correctAnswers: number;
  accuracy: number;
  timeSpent: number;
  categories?: Array<{
    name: string;
    count: number;
    correct: number;
  }>;
  topics: string[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const MyProgress: React.FC = () => {
  // 丰富的学习记录数据
  const mockLearningRecords: LearningRecord[] = [
    {
      id: '1',
      date: '2024-01-15',
      questionsAnswered: 25,
      correctAnswers: 20,
      accuracy: 80.0,
      timeSpent: 35,
      categories: [
        { name: '足球', count: 10, correct: 8 },
        { name: '篮球', count: 8, correct: 7 },
        { name: '游泳', count: 7, correct: 5 }
      ],
      topics: ['规则理解', '技术动作', '安全知识']
    },
    {
      id: '2',
      date: '2024-01-14',
      questionsAnswered: 30,
      correctAnswers: 26,
      accuracy: 86.7,
      timeSpent: 42,
             categories: [
         { name: '排球', count: 12, correct: 11 },
         { name: '田径', count: 10, correct: 8 },
         { name: '乒乓球', count: 8, correct: 7 }
       ],
       topics: ['扣球技术', '跑步技巧', '旋转发球']
     },
     {
       id: '3',
       date: '2024-01-13',
       questionsAnswered: 20,
       correctAnswers: 15,
       accuracy: 75.0,
       timeSpent: 28,
       categories: [
         { name: '羽毛球', count: 8, correct: 6 },
         { name: '网球', count: 7, correct: 5 },
         { name: '健身', count: 5, correct: 4 }
       ],
       topics: ['双打配合', '正手击球', '力量训练']
     },
     {
       id: '4',
       date: '2024-01-12',
       questionsAnswered: 35,
       correctAnswers: 31,
       accuracy: 88.6,
       timeSpent: 45,
       categories: [
         { name: '体操', count: 15, correct: 14 },
         { name: '武术', count: 12, correct: 10 },
         { name: '举重', count: 8, correct: 7 }
       ],
       topics: ['动作标准', '太极拳法', '安全保护']
     },
     {
       id: '5',
       date: '2024-01-11',
       questionsAnswered: 22,
       correctAnswers: 18,
       accuracy: 81.8,
       timeSpent: 32,
       categories: [
         { name: '足球', count: 8, correct: 7 },
         { name: '篮球', count: 9, correct: 7 },
         { name: '排球', count: 5, correct: 4 }
       ],
       topics: ['战术理解', '投篮姿势', '传球技巧']
     },
     {
       id: '6',
       date: '2024-01-10',
       questionsAnswered: 18,
       correctAnswers: 14,
       accuracy: 77.8,
       timeSpent: 25,
       categories: [
         { name: '游泳', count: 10, correct: 8 },
         { name: '田径', count: 8, correct: 6 }
       ],
       topics: ['泳姿纠正', '起跑技术']
     },
     {
       id: '7',
       date: '2024-01-09',
       questionsAnswered: 28,
       correctAnswers: 24,
       accuracy: 85.7,
       timeSpent: 38,
       categories: [
         { name: '乒乓球', count: 12, correct: 10 },
         { name: '羽毛球', count: 10, correct: 9 },
         { name: '网球', count: 6, correct: 5 }
       ],
       topics: ['削球技术', '杀球力度', '底线抽球']
     }
  ];
  
  const [learningRecords] = useState<LearningRecord[]>(mockLearningRecords);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { isDark, primaryColor } = useTheme();
  const navigate = useNavigate();
  const { Title, Text } = Typography;

  // 模拟数据
  useEffect(() => {
    loadLearningData();
  }, []);

  const loadLearningData = async () => {
    setLoading(true);
    try {
      // 模拟学习记录
      const mockRecords: LearningRecord[] = [
        {
          id: '1',
          date: '2024-01-20',
          questionsAnswered: 25,
          correctAnswers: 20,
          accuracy: 80,
          timeSpent: 1800,
          topics: ['篮球规则', '田径知识']
        },
        {
          id: '2',
          date: '2024-01-19',
          questionsAnswered: 30,
          correctAnswers: 27,
          accuracy: 90,
          timeSpent: 2100,
          topics: ['游泳安全', '体操技巧']
        },
        {
          id: '3',
          date: '2024-01-18',
          questionsAnswered: 20,
          correctAnswers: 15,
          accuracy: 75,
          timeSpent: 1500,
          topics: ['足球规则']
        }
      ];
      // 数据已经在初始化时设置

      // 加载真实成就数据
      try {
        const achievementResponse = await achievementAPI.getUserAchievements();
        if (achievementResponse.data.success) {
          const apiAchievements = achievementResponse.data.data || [];
          // 转换API数据格式以匹配本地Achievement接口
          const localAchievements: Achievement[] = apiAchievements
            .filter((a: AchievementType) => a.isCompleted) // 只显示已完成的成就
            .map((a: AchievementType) => ({
              id: a.id,
              title: a.title,
              description: a.description,
              icon: a.icon,
              earnedAt: a.earnedAt || a.completedAt || '',
              rarity: a.rarity
            }));
          setAchievements(localAchievements);
        } else {
          // API调用失败时的回退数据
          const fallbackAchievements: Achievement[] = [
            {
              id: '1',
              title: '学习新手',
              description: '完成首次学习',
              icon: '🎯',
              earnedAt: '2024-01-15',
              rarity: 'common'
            }
          ];
          setAchievements(fallbackAchievements);
        }
      } catch (achievementError) {
        console.error('加载成就数据失败:', achievementError);
        // 错误时使用空数组
        setAchievements([]);
      }
    } catch (error) {
      console.error('加载学习数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取学习趋势图表配置
  const getLearningTrendOption = () => {
    const dates = learningRecords.map(record => dayjs(record.date).format('MM-DD'));
    const accuracyData = learningRecords.map(record => record.accuracy);
    const questionsData = learningRecords.map(record => record.questionsAnswered);

    return {
      title: {
        text: '学习趋势分析',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['正确率', '题目数量'],
        top: '10%'
      },
      xAxis: {
        type: 'category',
        data: dates.reverse()
      },
      yAxis: [
        {
          type: 'value',
          name: '正确率(%)',
          min: 0,
          max: 100,
          position: 'left'
        },
        {
          type: 'value',
          name: '题目数量',
          position: 'right'
        }
      ],
      series: [
        {
          name: '正确率',
          type: 'line',
          yAxisIndex: 0,
          data: accuracyData.reverse(),
          smooth: true,
          itemStyle: { color: '#1890ff' }
        },
        {
          name: '题目数量',
          type: 'bar',
          yAxisIndex: 1,
          data: questionsData.reverse(),
          itemStyle: { color: '#52c41a' }
        }
      ]
    };
  };

  // 获取能力雷达图配置
  const getAbilityRadarOption = () => {
    return {
      title: {
        text: '能力分析',
        left: 'center'
      },
      radar: {
        indicator: [
          { name: '篮球知识', max: 100 },
          { name: '足球知识', max: 100 },
          { name: '田径知识', max: 100 },
          { name: '游泳安全', max: 100 },
          { name: '体操技巧', max: 100 },
          { name: '规则理解', max: 100 }
        ]
      },
      series: [{
        name: '能力评估',
        type: 'radar',
        data: [{
          value: [85, 70, 90, 75, 60, 88],
          name: '当前能力'
        }],
        itemStyle: { color: '#1890ff' },
        areaStyle: { opacity: 0.3 }
      }]
    };
  };

  // 日历数据
  const getCalendarData = (date: Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    const record = learningRecords.find(r => r.date === dateStr);
    if (record) {
      return {
        type: record.accuracy >= 80 ? 'success' : record.accuracy >= 60 ? 'processing' : 'error',
        content: `${record.questionsAnswered}题 ${record.accuracy}%`
      };
    }
    return null;
  };

  const dateCellRender = (date: Dayjs) => {
    const data = getCalendarData(date);
    if (data) {
      return (
        <div style={{ fontSize: '12px' }}>
          <Badge status={data.type as any} text={data.content} />
        </div>
      );
    }
    return null;
  };

  // 学习记录表格列
  const recordColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: '题目数量',
      dataIndex: 'questionsAnswered',
      key: 'questionsAnswered',
      render: (count: number) => <Tag color="blue">{count}题</Tag>
    },
    {
      title: '正确率',
      key: 'accuracy',
      render: (record: LearningRecord) => (
        <Progress
          percent={record.accuracy}
          size="small"
          status={record.accuracy >= 80 ? 'success' : record.accuracy >= 60 ? 'normal' : 'exception'}
        />
      )
    },
    {
      title: '学习时长',
      dataIndex: 'timeSpent',
      key: 'timeSpent',
      render: (time: number) => `${Math.round(time / 60)}分钟`
    },
    {
      title: '学习主题',
      dataIndex: 'topics',
      key: 'topics',
      render: (topics: string[]) => (
        <Space wrap>
          {topics.map((topic, index) => (
            <Tag key={index} color="green">{topic}</Tag>
          ))}
        </Space>
      )
    }
  ];

  // 成就列
  const achievementColumns = [
    {
      title: '成就',
      key: 'achievement',
      render: (record: Achievement) => (
        <Space>
          <span style={{ fontSize: '24px' }}>{record.icon}</span>
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.title}</div>
            <div style={{ fontSize: '12px', color: '#999' }}>{record.description}</div>
          </div>
        </Space>
      )
    },
    {
      title: '稀有度',
      dataIndex: 'rarity',
      key: 'rarity',
      render: (rarity: string) => {
        const colors = {
          common: 'default',
          rare: 'blue',
          epic: 'purple',
          legendary: 'gold'
        };
        return <Tag color={colors[rarity as keyof typeof colors]}>{rarity.toUpperCase()}</Tag>;
      }
    },
    {
      title: '获得时间',
      dataIndex: 'earnedAt',
      key: 'earnedAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD')
    }
  ];

  return (
    <div className="animate-fadeIn" style={{ padding: '24px', minHeight: '100vh' }}>
      {/* 现代化标题区域 */}
      <div className="glass-panel" style={{
        padding: '40px',
        marginBottom: '32px',
        background: `linear-gradient(135deg, ${primaryColor}20 0%, ${primaryColor}10 100%)`,
        border: `1px solid ${primaryColor}30`,
        borderRadius: '20px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-40%',
          right: '-15%',
          width: '300px',
          height: '300px',
          background: `radial-gradient(circle, ${primaryColor}15 0%, transparent 70%)`,
          borderRadius: '50%'
        }} />
        
        <Row justify="space-between" align="middle" style={{ position: 'relative', zIndex: 1 }}>
          <Col>
            <Space direction="vertical" size="small">
              <Title level={1} className="gradient-text" style={{ margin: 0, fontSize: '2.5rem' }}>
                <LineChartOutlined style={{ marginRight: '16px' }} />
                我的学习进度
              </Title>
              <Text style={{ fontSize: '18px', color: isDark ? '#a1a1aa' : '#4a5568' }}>
                追踪您的学习轨迹，见证成长每一步
              </Text>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button 
                size="large"
                type="primary"
                icon={<FireOutlined />}
                style={{
                  borderRadius: '12px',
                  background: primaryColor,
                  border: 'none',
                  boxShadow: `0 4px 12px ${primaryColor}40`,
                  padding: '8px 24px',
                  height: '48px'
                }}
              >
                继续学习
              </Button>
              <Button 
                size="large"
                icon={<GiftOutlined />}
                onClick={() => navigate('/achievements')}
                style={{
                  borderRadius: '12px',
                  padding: '8px 24px',
                  height: '48px'
                }}
              >
                查看成就
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* 现代化统计概览 */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} lg={6}>
          <div className="stats-card modern-card animate-slideUp" style={{ animationDelay: '0.1s' }}>
            <div style={{
              background: `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}05 100%)`,
              borderRadius: '16px',
              padding: '24px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '-15px',
                right: '-15px',
                width: '80px',
                height: '80px',
                background: `${primaryColor}20`,
                borderRadius: '50%'
              }} />
              <CalendarOutlined style={{
                fontSize: '28px',
                color: primaryColor,
                marginBottom: '16px',
                position: 'relative',
                zIndex: 1
              }} />
              <div className="stats-number" style={{ color: primaryColor, fontSize: '2.5rem' }}>
                {learningRecords.length}
              </div>
              <div className="stats-label" style={{ fontSize: '16px' }}>总学习天数</div>
              <Progress 
                percent={Math.min(learningRecords.length * 10, 100)} 
                strokeColor={primaryColor}
                trailColor={`${primaryColor}20`}
                strokeWidth={6}
                showInfo={false}
                style={{ marginTop: '12px' }}
              />
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stats-card modern-card animate-slideUp" style={{ animationDelay: '0.2s' }}>
            <div style={{
              background: 'linear-gradient(135deg, #52c41a15 0%, #52c41a05 100%)',
              borderRadius: '16px',
              padding: '24px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '-15px',
                right: '-15px',
                width: '80px',
                height: '80px',
                background: '#52c41a20',
                borderRadius: '50%'
              }} />
              <BookOutlined style={{
                fontSize: '28px',
                color: '#52c41a',
                marginBottom: '16px',
                position: 'relative',
                zIndex: 1
              }} />
              <div className="stats-number" style={{ color: '#52c41a', fontSize: '2.5rem' }}>
                {learningRecords.reduce((sum, r) => sum + r.questionsAnswered, 0)}
              </div>
              <div className="stats-label" style={{ fontSize: '16px' }}>总题目数</div>
              <Progress 
                percent={Math.min(learningRecords.reduce((sum, r) => sum + r.questionsAnswered, 0) / 10, 100)} 
                strokeColor="#52c41a"
                trailColor="#52c41a20"
                strokeWidth={6}
                showInfo={false}
                style={{ marginTop: '12px' }}
              />
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stats-card modern-card animate-slideUp" style={{ animationDelay: '0.3s' }}>
            <div style={{
              background: 'linear-gradient(135deg, #faad1415 0%, #faad1405 100%)',
              borderRadius: '16px',
              padding: '24px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '-15px',
                right: '-15px',
                width: '80px',
                height: '80px',
                background: '#faad1420',
                borderRadius: '50%'
              }} />
              <TrophyOutlined style={{
                fontSize: '28px',
                color: '#faad14',
                marginBottom: '16px',
                position: 'relative',
                zIndex: 1
              }} />
              <div className="stats-number" style={{ color: '#faad14', fontSize: '2.5rem' }}>
                {learningRecords.length > 0 ? 
                  (learningRecords.reduce((sum, r) => sum + r.accuracy, 0) / learningRecords.length).toFixed(1) : 0}%
              </div>
              <div className="stats-label" style={{ fontSize: '16px' }}>平均正确率</div>
              <Progress 
                percent={learningRecords.length > 0 ? 
                  learningRecords.reduce((sum, r) => sum + r.accuracy, 0) / learningRecords.length : 0} 
                strokeColor="#faad14"
                trailColor="#faad1420"
                strokeWidth={6}
                showInfo={false}
                style={{ marginTop: '12px' }}
              />
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <div className="stats-card modern-card animate-slideUp" style={{ animationDelay: '0.4s' }}>
            <div style={{
              background: 'linear-gradient(135deg, #ff4d4f15 0%, #ff4d4f05 100%)',
              borderRadius: '16px',
              padding: '24px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '-15px',
                right: '-15px',
                width: '80px',
                height: '80px',
                background: '#ff4d4f20',
                borderRadius: '50%'
              }} />
              <FireOutlined style={{
                fontSize: '28px',
                color: '#ff4d4f',
                marginBottom: '16px',
                position: 'relative',
                zIndex: 1
              }} />
              <div className="stats-number" style={{ color: '#ff4d4f', fontSize: '2.5rem' }}>
                {user?.learningStats?.continuousLoginDays || 0}
              </div>
              <div className="stats-label" style={{ fontSize: '16px' }}>连续学习天数</div>
              <Progress 
                percent={Math.min((user?.learningStats?.continuousLoginDays || 0) * 5, 100)} 
                strokeColor="#ff4d4f"
                trailColor="#ff4d4f20"
                strokeWidth={6}
                showInfo={false}
                style={{ marginTop: '12px' }}
              />
            </div>
          </div>
        </Col>
      </Row>

        {/* 现代化数据展示区域 */}
        <div className="modern-card animate-slideUp" style={{ 
          animationDelay: '0.6s',
          borderRadius: '16px',
          border: `1px solid ${isDark ? '#404040' : '#e2e8f0'}`,
          background: isDark ? '#1a1a1a' : '#ffffff',
          overflow: 'hidden'
        }}>
        <Tabs defaultActiveKey="trend">
          <TabPane tab="学习趋势" key="trend">
            <Row gutter={16}>
              <Col span={12}>
                <Card title="学习趋势分析">
                  <ReactECharts option={getLearningTrendOption()} style={{ height: '300px' }} />
                </Card>
              </Col>
              <Col span={12}>
                <Card title="能力分析">
                  <ReactECharts option={getAbilityRadarOption()} style={{ height: '300px' }} />
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="学习日历" key="calendar">
            <Card title="学习日历">
              <Calendar
                dateCellRender={dateCellRender}
                onSelect={setSelectedDate}
                style={{ border: 'none' }}
              />
            </Card>
          </TabPane>

          <TabPane tab="学习记录" key="records">
            <Card title="学习记录">
              <Table
                columns={recordColumns}
                dataSource={learningRecords}
                rowKey="id"
                loading={loading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                }}
              />
            </Card>
          </TabPane>

          <TabPane tab="成就系统" key="achievements">
            <Card title="我的成就">
              <Row gutter={16} style={{ marginBottom: '16px' }}>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="已获得成就"
                      value={achievements.length}
                      prefix={<StarOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="稀有成就"
                      value={achievements.filter(a => a.rarity === 'rare' || a.rarity === 'epic').length}
                      prefix={<TrophyOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="传奇成就"
                      value={achievements.filter(a => a.rarity === 'legendary').length}
                      prefix={<RiseOutlined />}
                    />
                  </Card>
                </Col>
              </Row>
              
              <Table
                columns={achievementColumns}
                dataSource={achievements}
                rowKey="id"
                loading={loading}
                pagination={false}
              />
            </Card>
          </TabPane>
        </Tabs>
        </div>
    </div>
  );
};

export default MyProgress; 