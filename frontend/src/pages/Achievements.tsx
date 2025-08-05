import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Badge,
  Tag,
  List,
  Button,
  message,
  Tabs,
  Avatar,
  Empty,
  Tooltip,
  Progress,
  Modal,
  Typography
} from 'antd';
import {
  TrophyOutlined,
  StarOutlined,
  FireOutlined,
  BulbOutlined,
  CrownOutlined,
  ThunderboltOutlined,
  GiftOutlined,
  ReloadOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { achievementAPI } from '../services/achievementAPI';
import { Achievement, AchievementStats } from '../types';
import { useTheme } from '../hooks/useTheme';
import '../styles/modern-theme.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const Achievements: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const { isDark, primaryColor } = useTheme();

  useEffect(() => {
    loadAchievements();
    loadStats();
  }, []);

  // 加载成就列表
  const loadAchievements = async () => {
    setLoading(true);
    try {
      const response = await achievementAPI.getAllAchievements();
      if (response.data.success) {
        const achievementsData = response.data.data;
        // 确保数据是数组
        if (Array.isArray(achievementsData)) {
          setAchievements(achievementsData);
        } else {
          console.warn('成就数据不是数组格式:', achievementsData);
          setAchievements([]);
          message.warning('成就数据格式异常，请联系管理员');
        }
      } else {
        setAchievements([]);
        message.error('加载成就失败：' + (response.data.message || '未知错误'));
      }
    } catch (error: any) {
      console.error('加载成就失败:', error);
      setAchievements([]); // 确保在错误时设置为空数组
      
      // 改进认证错误处理
      if (error.response?.status === 401) {
        message.error('请先登录后再查看成就');
        // 可以在这里跳转到登录页面
        // window.location.href = '/login';
      } else if (error.response?.status === 403) {
        message.error('无权限访问成就功能');
      } else {
        message.error('加载成就失败：' + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  // 加载统计数据
  const loadStats = async () => {
    try {
      const response = await achievementAPI.getAchievementStats();
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error: any) {
      console.error('加载统计失败:', error);
    }
  };

  // 手动检查成就
  const checkAchievements = async () => {
    setLoading(true);
    try {
      const response = await achievementAPI.checkAchievements();
      if (response.data.success) {
        const earnedCount = response.data.data.count || 0;
        if (earnedCount > 0) {
          message.success(`恭喜！您获得了 ${earnedCount} 个新成就！`);
          loadAchievements();
          loadStats();
        } else {
          message.info('暂无新成就获得');
        }
      }
    } catch (error: any) {
      message.error('检查成就失败：' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 获取稀有度颜色
  const getRarityColor = (rarity: string) => {
    const colors = {
      common: '#52c41a',
      rare: '#1890ff',
      epic: '#722ed1',
      legendary: '#faad14'
    };
    return colors[rarity as keyof typeof colors] || '#52c41a';
  };

  // 获取稀有度标签
  const getRarityLabel = (rarity: string) => {
    const labels = {
      common: '普通',
      rare: '稀有',
      epic: '史诗',
      legendary: '传奇'
    };
    return labels[rarity as keyof typeof labels] || '普通';
  };

  // 获取分类图标
  const getCategoryIcon = (category: string) => {
    const icons = {
      learning: <BulbOutlined />,
      streak: <FireOutlined />,
      accuracy: <StarOutlined />,
      time: <ThunderboltOutlined />,
      quiz: <TrophyOutlined />,
      exam: <CrownOutlined />,
      social: <GiftOutlined />,
      special: <CheckCircleOutlined />
    };
    return icons[category as keyof typeof icons] || <TrophyOutlined />;
  };

  // 过滤成就
  const filteredAchievements = Array.isArray(achievements) 
    ? (activeCategory === 'all' 
        ? achievements 
        : achievements.filter(a => a.category === activeCategory))
    : [];

  // 完成的成就
  const completedAchievements = Array.isArray(filteredAchievements) 
    ? filteredAchievements.filter(a => a.isCompleted) 
    : [];
  const uncompletedAchievements = Array.isArray(filteredAchievements) 
    ? filteredAchievements.filter(a => !a.isCompleted) 
    : [];

  // 查看成就详情
  const viewAchievementDetail = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setDetailModalVisible(true);
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>
          <TrophyOutlined style={{ color: '#faad14', marginRight: '8px' }} />
          成就系统
        </Title>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={checkAchievements}
          loading={loading}
        >
          检查新成就
        </Button>
      </div>

      {/* 统计概览 */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="获得成就"
                value={stats.completed || 0}
                suffix={`/ ${stats.total || 0}`}
                prefix={<TrophyOutlined style={{ color: '#faad14' }} />}
              />
              <Progress 
                percent={parseFloat(stats.completionRate || '0')} 
                size="small" 
                strokeColor={primaryColor}
                style={{ marginTop: '8px' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="获得积分"
                value={stats.totalPoints || 0}
                prefix={<StarOutlined style={{ color: '#52c41a' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="稀有成就"
                value={(stats.byRarity?.rare || 0) + (stats.byRarity?.epic || 0)}
                prefix={<CrownOutlined style={{ color: '#1890ff' }} />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="传奇成就"
                value={stats.byRarity?.legendary || 0}
                prefix={<FireOutlined style={{ color: '#722ed1' }} />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 成就分类标签页 */}
      <Card>
        <Tabs activeKey={activeCategory} onChange={setActiveCategory}>
          <TabPane tab="全部" key="all" />
          <TabPane tab={<span><BulbOutlined /> 学习</span>} key="learning" />
          <TabPane tab={<span><FireOutlined /> 连击</span>} key="streak" />
          <TabPane tab={<span><StarOutlined /> 准确</span>} key="accuracy" />
          <TabPane tab={<span><ThunderboltOutlined /> 时间</span>} key="time" />
          <TabPane tab={<span><TrophyOutlined /> 练习</span>} key="quiz" />
          <TabPane tab={<span><CrownOutlined /> 考试</span>} key="exam" />
          <TabPane tab={<span><GiftOutlined /> 社交</span>} key="social" />
          <TabPane tab={<span><CheckCircleOutlined /> 特殊</span>} key="special" />
        </Tabs>

        <div style={{ marginTop: '16px' }}>
          {/* 统一的成就展示 */}
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4} style={{ margin: 0 }}>
              成就展示 ({filteredAchievements.length})
            </Title>
            <div style={{ fontSize: '14px', color: '#666' }}>
              <span style={{ color: '#52c41a', marginRight: '16px' }}>
                ✅ 已完成: {completedAchievements.length}
              </span>
              <span style={{ color: '#faad14', marginRight: '16px' }}>
                🔄 进行中: {uncompletedAchievements.filter(a => (a.progress || 0) > 0).length}
              </span>
              <span style={{ color: '#d9d9d9' }}>
                ⭕ 未开始: {uncompletedAchievements.filter(a => (a.progress || 0) === 0).length}
              </span>
            </div>
          </div>

          <List
            grid={{ 
              gutter: 16, 
              xs: 1, 
              sm: 2, 
              md: 3, 
              lg: 4, 
              xl: 4, 
              xxl: 5 
            }}
            dataSource={filteredAchievements}
            loading={loading}
            renderItem={(item) => {
              const isCompleted = item.isCompleted || item.status === 'completed';
              const isInProgress = (item.progress || 0) > 0 && !isCompleted;
              const progressPercentage = item.progressPercentage || 0;
              
              return (
                <List.Item>
                  <Badge.Ribbon 
                    text={isCompleted ? getRarityLabel(item.rarity) : `${progressPercentage}%`} 
                    color={isCompleted ? getRarityColor(item.rarity) : (isInProgress ? '#faad14' : '#d9d9d9')}
                    style={{ 
                      display: isCompleted || isInProgress ? 'block' : 'none'
                    }}
                  >
                    <Card
                      hoverable
                      onClick={() => viewAchievementDetail(item)}
                      style={{
                        textAlign: 'center',
                        border: isCompleted 
                          ? `2px solid ${getRarityColor(item.rarity)}` 
                          : `2px solid ${isInProgress ? '#faad14' : '#f0f0f0'}`,
                        background: isCompleted
                          ? (isDark 
                              ? `linear-gradient(145deg, #1f1f1f, #2d2d2d)`
                              : `linear-gradient(145deg, #fafafa, #ffffff)`)
                          : (isDark 
                              ? `linear-gradient(145deg, #1a1a1a, #262626)`
                              : `linear-gradient(145deg, #f5f5f5, #fafafa)`),
                        opacity: isCompleted ? 1 : (isInProgress ? 0.8 : 0.5),
                        filter: isCompleted ? 'none' : `grayscale(${isInProgress ? '30%' : '70%'})`,
                        transform: isCompleted ? 'scale(1)' : 'scale(0.98)',
                        transition: 'all 0.3s ease',
                        boxShadow: isCompleted 
                          ? `0 4px 12px ${getRarityColor(item.rarity)}30`
                          : (isInProgress ? '0 2px 8px rgba(250, 173, 20, 0.2)' : '0 1px 4px rgba(0,0,0,0.1)')
                      }}
                      bodyStyle={{ padding: '16px' }}
                    >
                      <div style={{ 
                        fontSize: '32px', 
                        marginBottom: '8px',
                        filter: isCompleted ? 'none' : `brightness(${isInProgress ? '0.7' : '0.4'})`
                      }}>
                        {isCompleted && <span style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '16px' }}>✨</span>}
                        {item.icon}
                      </div>
                      
                      <Title level={5} ellipsis style={{ 
                        margin: '8px 0',
                        color: isCompleted ? undefined : (isInProgress ? '#faad14' : '#999')
                      }}>
                        {item.title}
                      </Title>
                      
                      <Text type="secondary" style={{ 
                        fontSize: '12px',
                        opacity: isCompleted ? 1 : (isInProgress ? 0.8 : 0.6)
                      }}>
                        {item.description}
                      </Text>
                      
                      {/* 进度条 */}
                      {isInProgress && (
                        <div style={{ margin: '8px 0' }}>
                          <Progress 
                            percent={progressPercentage} 
                            size="small" 
                            status={progressPercentage === 100 ? 'success' : 'active'}
                            showInfo={false}
                          />
                          <Text style={{ fontSize: '10px', color: '#faad14' }}>
                            {item.progress || 0}/{item.targetValue || item.maxProgress || 100}
                          </Text>
                        </div>
                      )}
                      
                      <div style={{ marginTop: '8px' }}>
                        <Tag 
                          color={isCompleted ? getRarityColor(item.rarity) : (isInProgress ? '#faad14' : '#d9d9d9')} 
                          icon={getCategoryIcon(item.category)}
                          style={{ opacity: isCompleted ? 1 : (isInProgress ? 0.8 : 0.6) }}
                        >
                          +{item.points} 积分
                        </Tag>
                      </div>
                      
                      {item.completedAt && (
                        <div style={{ marginTop: '8px', fontSize: '10px', color: '#52c41a' }}>
                          🎉 {new Date(item.completedAt).toLocaleDateString()}
                        </div>
                      )}
                      
                      {!isCompleted && !isInProgress && (
                        <div style={{ marginTop: '8px', fontSize: '10px', color: '#999' }}>
                          🔒 尚未开始
                        </div>
                      )}
                    </Card>
                  </Badge.Ribbon>
                </List.Item>
              );
            }}
          />
        </div>
      </Card>

      {/* 成就详情模态框 */}
      <Modal
        title="成就详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={500}
      >
        {selectedAchievement && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>
              {selectedAchievement.icon}
            </div>
            <Title level={3}>{selectedAchievement.title}</Title>
            <Tag 
              color={getRarityColor(selectedAchievement.rarity)} 
              style={{ marginBottom: '16px' }}
            >
              {getRarityLabel(selectedAchievement.rarity)}
            </Tag>
            <Paragraph style={{ fontSize: '16px', marginBottom: '16px' }}>
              {selectedAchievement.description}
            </Paragraph>
            
            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="奖励积分"
                    value={selectedAchievement.points}
                    prefix={<StarOutlined />}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="状态"
                    value={selectedAchievement.isCompleted ? '已获得' : '未获得'}
                    valueStyle={{ 
                      color: selectedAchievement.isCompleted ? '#52c41a' : '#999' 
                    }}
                  />
                </Card>
              </Col>
            </Row>

            {selectedAchievement.progress !== undefined && selectedAchievement.maxProgress !== undefined && (
              <div style={{ marginBottom: '16px' }}>
                <Text strong>进度</Text>
                <Progress
                  percent={Math.round((selectedAchievement.progress / selectedAchievement.maxProgress) * 100)}
                  format={(percent) => `${selectedAchievement.progress}/${selectedAchievement.maxProgress} (${percent}%)`}
                  style={{ marginTop: '8px' }}
                />
              </div>
            )}

            {selectedAchievement.completedAt && (
              <div>
                <Text type="secondary">
                  获得时间: {new Date(selectedAchievement.completedAt).toLocaleString()}
                </Text>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Achievements; 