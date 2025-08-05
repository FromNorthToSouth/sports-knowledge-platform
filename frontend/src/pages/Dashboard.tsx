import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Progress, Table, Typography, Tag, Button, Select, message, Spin, Avatar, Space, Tooltip } from 'antd';
import { 
  BookOutlined, 
  TrophyOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined,
  FireOutlined,
  RiseOutlined,
  UserOutlined,
  CalendarOutlined,
  ThunderboltOutlined,
  StarOutlined,
  LineChartOutlined,
  BulbOutlined,
  CrownOutlined,
  GiftOutlined,
  AimOutlined,
  SafetyOutlined,
  FileTextOutlined,
  BellOutlined,
  RocketOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import ReactEcharts from 'echarts-for-react';
import { RootState } from '../types';
import { statsAPI } from '../services/statsAPI';
import { examAPI } from '../services/examAPI';
import { useTheme } from '../hooks/useTheme';

const { Title, Text } = Typography;
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

interface ExamStats {
  stats: any;
  recentExams: any[];
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [learningStats, setLearningStats] = useState<LearningStats | null>(null);
  const [examStats, setExamStats] = useState<ExamStats | null>(null);
  const [leaderboard, setLeaderboard] = useState([]);
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { isDark, primaryColor } = useTheme();

  // 获取数据
  const fetchData = async () => {
    try {
      setLoading(true);
      const [learningRes, examRes, leaderRes] = await Promise.all([
        statsAPI.getLearningStats({ timeRange }),
        examAPI.getExamStats(),
        statsAPI.getLeaderboard({ limit: 10 })
      ]);
      
      setLearningStats(learningRes.data.data);
      setExamStats(examRes.data.data);
      setLeaderboard(leaderRes.data.data);
    } catch (error: any) {
      message.error('获取数据失败：' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  const isTeacher = user?.role === 'teacher';
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <div className="animate-fadeIn" style={{ padding: '24px', minHeight: '100vh' }}>
      {/* 现代化欢迎区域 */}
      <div className="glass-panel" style={{ 
        padding: '32px', 
        marginBottom: '32px',
        background: `linear-gradient(135deg, ${primaryColor}20 0%, ${primaryColor}10 100%)`,
        border: `1px solid ${primaryColor}30`,
        borderRadius: '16px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ 
          position: 'absolute',
          top: '-50%',
          right: '-10%',
          width: '200px',
          height: '200px',
          background: `radial-gradient(circle, ${primaryColor}20 0%, transparent 70%)`,
          borderRadius: '50%'
        }} />
        
        <Space direction="vertical" size="large" style={{ zIndex: 1, position: 'relative' }}>
          <div>
            <Title level={2} className="gradient-text" style={{ margin: 0, fontSize: '2rem' }}>
              {isTeacher ? (
                <>
                  <UserOutlined style={{ marginRight: '12px' }} />
                  教师工作台 - 欢迎回来，{user?.username}老师！
                </>
              ) : isAdmin ? (
                <>
                  <CrownOutlined style={{ marginRight: '12px' }} />
                  管理员控制台 - 欢迎，{user?.username}！
                </>
              ) : (
                <>
                  <BulbOutlined style={{ marginRight: '12px' }} />
          欢迎回来，{user?.username}！
                </>
              )}
        </Title>
            <Text type="secondary" style={{ fontSize: '16px', marginTop: '8px', display: 'block' }}>
              <CalendarOutlined style={{ marginRight: '8px' }} />
          今天是 {new Date().toLocaleDateString('zh-CN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
          })}
              {isTeacher && '，开始您的教学管理工作'}
              {isAdmin && '，系统运行状态良好'}
              {!isTeacher && !isAdmin && '，开始您的学习之旅'}
        </Text>
      </div>
          
          <Space>
            {isTeacher ? (
              <>
                <Button 
                  type="primary" 
                  size="large"
                  className="modern-button primary"
                  icon={<RocketOutlined />}
                  onClick={() => window.location.href = '/teacher-exam-publish'}
                >
                  考试发布
                </Button>
                <Button 
                  size="large"
                  className="modern-button"
                  icon={<BookOutlined />}
                  onClick={() => window.location.href = '/question-bank'}
                >
                  题库管理
                </Button>
                <Button 
                  size="large"
                  icon={<UserOutlined />}
                  onClick={() => window.location.href = '/class-management'}
                >
                  班级管理
                </Button>
                <Button 
                  size="large"
                  icon={<LineChartOutlined />}
                  onClick={() => window.location.href = '/student-progress'}
                >
                  学生分析
                </Button>
              </>
            ) : isAdmin ? (
              <>
                <Button 
                  type="primary" 
                  size="large"
                  className="modern-button primary"
                  icon={<CrownOutlined />}
                  onClick={() => window.location.href = '/admin'}
                >
                  系统管理
                </Button>
                <Button 
                  size="large"
                  icon={<BookOutlined />}
                  onClick={() => window.location.href = '/question-bank'}
                >
                  题库管理
                </Button>
              </>
            ) : (
              <>
                <Button 
                  type="primary" 
                  size="large"
                  className="modern-button primary"
                  icon={<ThunderboltOutlined />}
                  onClick={() => window.location.href = '/practice'}
                >
                  开始练习
                </Button>
                <Button 
                  size="large"
                  icon={<LineChartOutlined />}
                  onClick={() => window.location.href = '/my-progress'}
                >
                  查看进度
                </Button>
              </>
            )}
          </Space>
        </Space>

      {/* 时间范围选择 */}
        <div style={{ 
          position: 'absolute',
          top: '24px',
          right: '24px',
          zIndex: 2
        }}>
        <Select 
          value={timeRange} 
          onChange={setTimeRange}
            style={{ width: 140 }}
            size="large"
        >
          <Option value="7d">最近7天</Option>
          <Option value="30d">最近30天</Option>
          <Option value="90d">最近90天</Option>
        </Select>
        </div>
      </div>

      {/* 根据角色显示不同的统计卡片 */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        {isTeacher ? (
          <>
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
                  <BookOutlined style={{ 
                    fontSize: '24px', 
                    color: primaryColor, 
                    marginBottom: '12px',
                    position: 'relative',
                    zIndex: 1
                  }} />
                  <div className="stats-number" style={{ color: primaryColor }}>
                    {examStats?.stats?.totalQuestions || 156}
                  </div>
                  <div className="stats-label">题库总量</div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                    本周新增: 8题
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
                    {learningStats?.userStats?.totalStudents || 32}
                  </div>
                  <div className="stats-label">班级学生</div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                    活跃: 28人 | 本周在线: 30人
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
                  <FileTextOutlined style={{ 
                    fontSize: '24px', 
                    color: '#faad14', 
                    marginBottom: '12px',
                    position: 'relative',
                    zIndex: 1
                  }} />
                  <div className="stats-number" style={{ color: '#faad14' }}>
                    {examStats?.stats?.completedExams || 5}
                  </div>
                  <div className="stats-label">待批改</div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                    考试: 3份 | 练习: 2份
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
                  <TrophyOutlined style={{ 
                    fontSize: '24px', 
                    color: '#722ed1', 
                    marginBottom: '12px',
                    position: 'relative',
                    zIndex: 1
                  }} />
                  <div className="stats-number" style={{ color: '#722ed1' }}>
                    {learningStats?.userStats?.averageScore ? Math.round(learningStats.userStats.averageScore) : 78.5}
                  </div>
                  <div className="stats-label">班级平均分</div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                    较上周: +2.3分
                  </div>
                </div>
              </div>
        </Col>
          </>
        ) : (
          <>
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
                  <BookOutlined style={{ 
                    fontSize: '24px', 
                    color: primaryColor, 
                    marginBottom: '12px',
                    position: 'relative',
                    zIndex: 1
                  }} />
                                  <div className="stats-number" style={{ color: primaryColor }}>
                  {learningStats?.userStats?.totalQuestions || 247}
                </div>
                <div className="stats-label">总题目数</div>
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
                    {learningStats?.userStats?.correctAnswers || 198}
                  </div>
                  <div className="stats-label">正确答题</div>
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
                    {learningStats?.userStats?.accuracy ? Math.round(learningStats.userStats.accuracy) : 80}%
                  </div>
                  <div className="stats-label">正确率</div>
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="stats-card modern-card animate-slideUp" style={{ animationDelay: '0.4s' }}>
                <div style={{ 
                  background: 'linear-gradient(135deg, #ff4d4f15 0%, #ff4d4f05 100%)',
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
                    background: '#ff4d4f20',
                    borderRadius: '50%'
                  }} />
                  <FireOutlined style={{ 
                    fontSize: '24px', 
                    color: '#ff4d4f', 
                    marginBottom: '12px',
                    position: 'relative',
                    zIndex: 1
                  }} />
                  <div className="stats-number" style={{ color: '#ff4d4f' }}>
                    {learningStats?.userStats?.streak || 7}
                  </div>
                  <div className="stats-label">连续学习</div>
                </div>
              </div>
            </Col>
          </>
        )}
      </Row>

      {/* 简化的内容区域 */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <div className="modern-card animate-slideUp" style={{ 
            animationDelay: '0.7s',
            padding: '24px',
            borderRadius: '16px',
            border: `1px solid ${isDark ? '#404040' : '#e2e8f0'}`,
            background: isDark ? '#1a1a1a' : '#ffffff'
          }}>
            <Title level={4} style={{ marginBottom: '16px', color: primaryColor }}>
              {isTeacher ? '最近班级动态' : isAdmin ? '系统概览' : '学习概览'}
            </Title>
            {!isTeacher && !isAdmin ? (
              <div style={{ minHeight: '300px' }}>
                {/* 本周学习情况 */}
                <div style={{ marginBottom: '24px' }}>
                  <Title level={5} style={{ marginBottom: '12px', color: isDark ? '#ffffff' : '#1a202c' }}>
                    📊 本周学习情况
                  </Title>
                  <Row gutter={12}>
                    <Col span={12}>
                      <div style={{ 
                        padding: '12px', 
                        background: `linear-gradient(135deg, ${primaryColor}10 0%, ${primaryColor}05 100%)`,
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: primaryColor }}>5</div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>天</Text>
                        <div style={{ fontSize: '12px' }}>本周学习</div>
                      </div>
        </Col>
                    <Col span={12}>
                      <div style={{ 
                        padding: '12px', 
                        background: 'linear-gradient(135deg, #52c41a10 0%, #52c41a05 100%)',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>127</div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>题</Text>
                        <div style={{ fontSize: '12px' }}>完成练习</div>
                      </div>
        </Col>
      </Row>
                </div>

                {/* 薄弱知识点 */}
                <div style={{ marginBottom: '24px' }}>
                  <Title level={5} style={{ marginBottom: '12px', color: isDark ? '#ffffff' : '#1a202c' }}>
                    🎯 需要关注的知识点
                  </Title>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <Tag color="orange">足球越位规则 (65%)</Tag>
                    <Tag color="red">排球战术分析 (58%)</Tag>
                    <Tag color="orange">游泳转身技术 (72%)</Tag>
                  </div>
                </div>

                {/* 学习进展 */}
                <div style={{ marginBottom: '16px' }}>
                  <Title level={5} style={{ marginBottom: '12px', color: isDark ? '#ffffff' : '#1a202c' }}>
                    📈 近期进展
                  </Title>
                  <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ 
                        width: '6px', 
                        height: '6px', 
                        borderRadius: '50%', 
                        background: '#52c41a', 
                        marginRight: '8px' 
                      }}/>
                      <Text>篮球投篮技术掌握度提升至85%</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ 
                        width: '6px', 
                        height: '6px', 
                        borderRadius: '50%', 
                        background: '#1890ff', 
                        marginRight: '8px' 
                      }}/>
                      <Text>连续7天完成每日练习任务</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ 
                        width: '6px', 
                        height: '6px', 
                        borderRadius: '50%', 
                        background: '#faad14', 
                        marginRight: '8px' 
                      }}/>
                      <Text>在社区获得5个点赞</Text>
                    </div>
                  </div>
                </div>
              </div>
            ) : isTeacher ? (
              <div style={{ minHeight: '300px' }}>
                {/* 班级整体表现 */}
                <div style={{ marginBottom: '24px' }}>
                  <Title level={5} style={{ marginBottom: '12px', color: isDark ? '#ffffff' : '#1a202c' }}>
                    📊 班级整体表现
                  </Title>
                  <Row gutter={12}>
                    <Col span={8}>
                      <div style={{ 
                        padding: '12px', 
                        background: `linear-gradient(135deg, ${primaryColor}10 0%, ${primaryColor}05 100%)`,
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: primaryColor }}>32</div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>名学生</Text>
                        <div style={{ fontSize: '12px' }}>班级人数</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ 
                        padding: '12px', 
                        background: 'linear-gradient(135deg, #52c41a10 0%, #52c41a05 100%)',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#52c41a' }}>85.2%</div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>平均</Text>
                        <div style={{ fontSize: '12px' }}>完成率</div>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ 
                        padding: '12px', 
                        background: 'linear-gradient(135deg, #faad1410 0%, #faad1405 100%)',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#faad14' }}>78.5</div>
                        <Text type="secondary" style={{ fontSize: '12px' }}>分</Text>
                        <div style={{ fontSize: '12px' }}>平均成绩</div>
                      </div>
        </Col>
      </Row>
                </div>

                {/* 最近班级动态 */}
                <div style={{ marginBottom: '24px' }}>
                  <Title level={5} style={{ marginBottom: '12px', color: isDark ? '#ffffff' : '#1a202c' }}>
                    🔔 最近班级动态
                  </Title>
                  <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ 
                        width: '6px', 
                        height: '6px', 
                        borderRadius: '50%', 
                        background: '#52c41a', 
                        marginRight: '8px' 
                      }}/>
                      <Text>张小明完成了"足球基础知识测试"，获得92分</Text>
                      <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>2分钟前</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ 
                        width: '6px', 
                        height: '6px', 
                        borderRadius: '50%', 
                        background: '#1890ff', 
                        marginRight: '8px' 
                      }}/>
                      <Text>李小红在社区提出了关于"篮球规则"的问题</Text>
                      <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>15分钟前</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ 
                        width: '6px', 
                        height: '6px', 
                        borderRadius: '50%', 
                        background: '#faad14', 
                        marginRight: '8px' 
                      }}/>
                      <Text>王小强连续7天完成练习任务，获得"坚持不懈"徽章</Text>
                      <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>1小时前</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ 
                        width: '6px', 
                        height: '6px', 
                        borderRadius: '50%', 
                        background: '#f5222d', 
                        marginRight: '8px' 
                      }}/>
                      <Text>班级整体在"游泳安全知识"方面正确率较低(65%)</Text>
                      <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>2小时前</Text>
                    </div>
                  </div>
                </div>

                {/* 学习进度统计 */}
                <div>
                  <Title level={5} style={{ marginBottom: '12px', color: isDark ? '#ffffff' : '#1a202c' }}>
                    📈 本周学习统计
                  </Title>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: primaryColor }}>28</div>
                      <Text type="secondary">活跃学生</Text>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>156</div>
                      <Text type="secondary">完成练习</Text>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#faad14' }}>23</div>
                      <Text type="secondary">参与讨论</Text>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1890ff' }}>12</div>
                      <Text type="secondary">完成考试</Text>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  系统运行状态监控
                </Text>
              </div>
            )}
          </div>
        </Col>
        <Col xs={24} lg={8}>
          <div className="modern-card animate-slideUp" style={{ 
            animationDelay: '0.8s',
            padding: '24px',
            borderRadius: '16px',
            border: `1px solid ${isDark ? '#404040' : '#e2e8f0'}`,
            background: isDark ? '#1a1a1a' : '#ffffff'
          }}>
            <Title level={4} style={{ marginBottom: '16px', color: primaryColor }}>
              {isTeacher ? '待处理事项' : isAdmin ? '系统提醒' : '智能学习建议'}
            </Title>
            <div style={{ minHeight: '260px' }}>
              {isTeacher ? (
                <div>
                  {/* 考试管理提醒 */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: '12px' 
                    }}>
                      <RocketOutlined style={{ 
                        color: primaryColor, 
                        fontSize: '16px', 
                        marginRight: '8px' 
                      }} />
                      <Text strong style={{ color: primaryColor }}>考试管理</Text>
                    </div>
                    <div style={{ 
                      background: `linear-gradient(135deg, ${primaryColor}08 0%, ${primaryColor}03 100%)`,
                      padding: '12px',
                      borderRadius: '8px',
                      border: `1px solid ${primaryColor}20`,
                      marginBottom: '16px'
                    }}>
                      <Text style={{ fontSize: '14px' }}>
                        🎯 使用自动组卷功能，快速创建个性化考试
                      </Text>
                    </div>
                  </div>

                  {/* 教学任务 */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: '12px' 
                    }}>
                      <BookOutlined style={{ 
                        color: '#faad14', 
                        fontSize: '16px', 
                        marginRight: '8px' 
                      }} />
                      <Text strong style={{ color: '#faad14' }}>教学任务</Text>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <Text style={{ fontSize: '13px', color: isDark ? '#a1a1aa' : '#64748b' }}>
                        📝 待批改考试：3份
                      </Text>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <Text style={{ fontSize: '13px', color: isDark ? '#a1a1aa' : '#64748b' }}>
                        👥 班级管理：5个班级
                      </Text>
                    </div>
                    <div>
                      <Text style={{ fontSize: '13px', color: isDark ? '#a1a1aa' : '#64748b' }}>
                        📊 学生进度：待分析
                      </Text>
                    </div>
                  </div>

                  {/* 快捷操作 */}
                  <div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: '12px' 
                    }}>
                      <ThunderboltOutlined style={{ 
                        color: '#52c41a', 
                        fontSize: '16px', 
                        marginRight: '8px' 
                      }} />
                      <Text strong style={{ color: '#52c41a' }}>快捷操作</Text>
                    </div>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Button 
                        type="link" 
                        size="small" 
                        style={{ padding: 0, height: 'auto' }}
                        onClick={() => window.location.href = '/teacher-exam-publish'}
                      >
                        🚀 发布新考试
                      </Button>
                      <Button 
                        type="link" 
                        size="small" 
                        style={{ padding: 0, height: 'auto' }}
                        onClick={() => window.location.href = '/question-bank'}
                      >
                        📚 管理题库
                      </Button>
                      <Button 
                        type="link" 
                        size="small" 
                        style={{ padding: 0, height: 'auto' }}
                        onClick={() => window.location.href = '/class-management'}
                      >
                        👥 班级管理
                      </Button>
                    </Space>
                  </div>
                </div>
              ) : !isTeacher && !isAdmin ? (
                <div>
                  {/* 今日建议 */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: '12px' 
                    }}>
                      <BulbOutlined style={{ 
                        color: primaryColor, 
                        fontSize: '16px', 
                        marginRight: '8px' 
                      }} />
                      <Text strong style={{ color: primaryColor }}>今日学习建议</Text>
                    </div>
                    <div style={{ 
                      background: `linear-gradient(135deg, ${primaryColor}08 0%, ${primaryColor}03 100%)`,
                      padding: '12px',
                      borderRadius: '8px',
                      border: `1px solid ${primaryColor}20`,
                      marginBottom: '16px'
                    }}>
                      <Text style={{ fontSize: '14px' }}>
                        🎯 重点攻克"足球越位规则"，建议练习15题
                      </Text>
                    </div>
                  </div>

                  {/* 学习计划 */}
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: '12px' 
                    }}>
                      <CalendarOutlined style={{ 
                        color: '#52c41a', 
                        fontSize: '16px', 
                        marginRight: '8px' 
                      }} />
                      <Text strong style={{ color: '#52c41a' }}>本周学习计划</Text>
                    </div>
                    <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      <div style={{ marginBottom: '8px' }}>
                        ✅ 周一：篮球投篮技术 (已完成)
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        ✅ 周二：游泳安全知识 (已完成) 
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        🔄 周三：足球规则解析 (进行中)
                      </div>
                      <div style={{ marginBottom: '8px', color: '#8c8c8c' }}>
                        ⏳ 周四：排球技战术
                      </div>
                      <div style={{ color: '#8c8c8c' }}>
                        ⏳ 周五：田径项目规则
                      </div>
                    </div>
                  </div>

                  {/* 推荐资源 */}
                  <div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      marginBottom: '12px' 
                    }}>
                      <StarOutlined style={{ 
                        color: '#faad14', 
                        fontSize: '16px', 
                        marginRight: '8px' 
                      }} />
                      <Text strong style={{ color: '#faad14' }}>推荐资源</Text>
                    </div>
                    <div style={{ fontSize: '14px' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        marginBottom: '8px',
                        padding: '8px',
                        background: isDark ? '#2a2a2a' : '#f9f9f9',
                        borderRadius: '6px'
                      }}>
                        <div style={{ 
                          width: '4px', 
                          height: '16px', 
                          background: '#1890ff', 
                          marginRight: '8px',
                          borderRadius: '2px' 
                        }}/>
                        <Text>专家解答：足球越位规则详解</Text>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        padding: '8px',
                        background: isDark ? '#2a2a2a' : '#f9f9f9',
                        borderRadius: '6px'
                      }}>
                        <div style={{ 
                          width: '4px', 
                          height: '16px', 
                          background: '#52c41a', 
                          marginRight: '8px',
                          borderRadius: '2px' 
                        }}/>
                        <Text>错题集：排球常见规则误区</Text>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Text type="secondary">
                  • 系统运行正常\n• 数据备份完成\n• 用户活跃度上升
                </Text>
              )}
            </div>
          </div>
        </Col>
      </Row>

      {/* 积分成就系统 - 仅对学生显示 */}
      {!isTeacher && !isAdmin && (
        <Row gutter={[24, 24]} style={{ marginTop: '32px' }}>
          {/* 积分成就面板 */}
          <Col xs={24} lg={8}>
            <div className="modern-card animate-slideUp" style={{ 
              animationDelay: '0.9s',
              padding: '24px',
              borderRadius: '16px',
              border: `1px solid ${isDark ? '#404040' : '#e2e8f0'}`,
              background: isDark ? '#1a1a1a' : '#ffffff'
            }}>
              <Title level={4} style={{ marginBottom: '20px', color: primaryColor }}>
                <TrophyOutlined style={{ marginRight: '8px' }} />
                我的成就
              </Title>
              
              {/* 积分展示 */}
              <div style={{ 
                textAlign: 'center', 
                marginBottom: '24px',
                padding: '20px',
                background: `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}05 100%)`,
                borderRadius: '12px'
              }}>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: primaryColor }}>
                  {learningStats?.points || 1280}
              </div>
                <Text type="secondary">总积分</Text>
              </div>

              {/* 成就徽章 */}
              <div>
                <Text strong style={{ marginBottom: '12px', display: 'block' }}>最近获得徽章</Text>
                <Space wrap>
                  <Tooltip title="连续学习7天">
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: '#52c41a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '20px'
                    }}>
                      <FireOutlined />
                    </div>
                  </Tooltip>
                  <Tooltip title="答题达人">
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: '#1890ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '20px'
                    }}>
                      <BulbOutlined />
                    </div>
                  </Tooltip>
                  <Tooltip title="体育知识专家">
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: '#faad14',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '20px'
                    }}>
                      <CrownOutlined />
                    </div>
                  </Tooltip>
                </Space>
              </div>
            </div>
          </Col>

          {/* 每日任务 */}
          <Col xs={24} lg={8}>
            <div className="modern-card animate-slideUp" style={{ 
              animationDelay: '1.0s',
              padding: '24px',
              borderRadius: '16px',
              border: `1px solid ${isDark ? '#404040' : '#e2e8f0'}`,
              background: isDark ? '#1a1a1a' : '#ffffff'
            }}>
              <Title level={4} style={{ marginBottom: '20px', color: primaryColor }}>
                <CheckCircleOutlined style={{ marginRight: '8px' }} />
                每日任务
              </Title>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <Text>完成10道练习题</Text>
                  <Tag color="green">已完成</Tag>
                </div>
                <div style={{ width: '100%', height: '6px', background: '#f0f0f0', borderRadius: '3px' }}>
                  <div style={{ width: '100%', height: '100%', background: '#52c41a', borderRadius: '3px' }}></div>
                </div>
                <Text type="secondary" style={{ fontSize: '12px' }}>+50积分</Text>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <Text>连续学习3天</Text>
                  <Tag color="orange">进行中</Tag>
                </div>
                <div style={{ width: '100%', height: '6px', background: '#f0f0f0', borderRadius: '3px' }}>
                  <div style={{ width: '66%', height: '100%', background: '#faad14', borderRadius: '3px' }}></div>
                </div>
                <Text type="secondary" style={{ fontSize: '12px' }}>2/3天，+100积分</Text>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <Text>参与社区讨论</Text>
                  <Tag>未开始</Tag>
                </div>
                <div style={{ width: '100%', height: '6px', background: '#f0f0f0', borderRadius: '3px' }}>
                  <div style={{ width: '0%', height: '100%', background: '#1890ff', borderRadius: '3px' }}></div>
                </div>
                <Text type="secondary" style={{ fontSize: '12px' }}>0/1次，+30积分</Text>
              </div>

              <Button type="primary" block style={{ marginTop: '16px' }}>
                查看更多任务
              </Button>
            </div>
          </Col>

          {/* 排行榜 */}
          <Col xs={24} lg={8}>
            <div className="modern-card animate-slideUp" style={{ 
              animationDelay: '1.1s',
              padding: '24px',
              borderRadius: '16px',
              border: `1px solid ${isDark ? '#404040' : '#e2e8f0'}`,
              background: isDark ? '#1a1a1a' : '#ffffff'
            }}>
              <Title level={4} style={{ marginBottom: '20px', color: primaryColor }}>
                <StarOutlined style={{ marginRight: '8px' }} />
                本周排行榜
              </Title>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#faad14',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      marginRight: '12px'
                    }}>
                      1
                    </div>
                    <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: '8px' }} />
                    <Text strong>学霸小王</Text>
                  </div>
                  <Text type="secondary">2580分</Text>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#d9d9d9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      marginRight: '12px'
                    }}>
                      2
                    </div>
                    <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: '8px' }} />
                    <Text strong>运动达人</Text>
                  </div>
                  <Text type="secondary">2340分</Text>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#cd7f32',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      marginRight: '12px'
                    }}>
                      3
                    </div>
                    <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: '8px' }} />
                    <Text strong>体育小将</Text>
                  </div>
                  <Text type="secondary">2180分</Text>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: `${primaryColor}10`, borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: primaryColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      marginRight: '12px'
                    }}>
                      8
                    </div>
                    <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: '8px' }} />
                    <Text strong style={{ color: primaryColor }}>我</Text>
                  </div>
                  <Text style={{ color: primaryColor, fontWeight: 'bold' }}>1280分</Text>
                </div>
              </div>

              <Button block>
                查看完整排行榜
              </Button>
            </div>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default Dashboard; 