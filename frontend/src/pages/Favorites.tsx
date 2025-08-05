import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Select,
  Space,
  Tag,
  message,
  Modal,
  Typography,
  Row,
  Col,
  Statistic,
  Empty,
  Popconfirm,
  Badge,
  Tooltip,
  Progress
} from 'antd';
import {
  StarOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  BookOutlined,
  TrophyOutlined,
  EyeOutlined,
  HeartOutlined,
  FireOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FilterOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../types';
import { favoriteAPI } from '../services/favoriteAPI';
import { useTheme } from '../hooks/useTheme';
import '../styles/modern-theme.css';

const { Title, Text } = Typography;
const { Option } = Select;

interface Favorite {
  _id: string;
  createdAt: string;
  question: {
    _id: string;
    title: string;
    content: string;
    type: string;
    category: {
      sport: string;
      knowledgeType: string;
    };
    difficulty: string;
    tags: string[];
    stats: {
      totalAttempts: number;
      accuracy: number;
    };
  };
}

const Favorites: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    difficulty: ''
  });
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    categories: {} as { [key: string]: number },
    difficulties: {} as { [key: string]: number },
    averageAccuracy: 0
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  const { user } = useSelector((state: RootState) => state.auth);
  const { isDark, primaryColor } = useTheme();
  const navigate = useNavigate();

  // 丰富的收藏数据
  const mockFavorites: Favorite[] = [
    {
      _id: '1',
      createdAt: '2024-01-15T10:30:00Z',
      question: {
        _id: 'q1',
        title: '足球越位规则判断',
        content: '在足球比赛中，当进攻球员接到队友传球时，如何判断是否构成越位？请详细说明越位规则的判定条件。',
        type: '单选题',
        category: {
          sport: '足球',
          knowledgeType: '规则理解'
        },
        difficulty: '中等',
        tags: ['越位', '规则', '判断'],
        stats: {
          totalAttempts: 1250,
          accuracy: 76.8
        }
      }
    },
    {
      _id: '2',
      createdAt: '2024-01-14T15:20:00Z',
      question: {
        _id: 'q2',
        title: '篮球三分线距离',
        content: '标准篮球场的三分线距离篮筐中心的距离是多少？不同年龄段是否有区别？',
        type: '单选题',
        category: {
          sport: '篮球',
          knowledgeType: '场地规格'
        },
        difficulty: '简单',
        tags: ['三分线', '距离', '标准'],
        stats: {
          totalAttempts: 980,
          accuracy: 85.2
        }
      }
    },
    {
      _id: '3',
      createdAt: '2024-01-13T09:45:00Z',
      question: {
        _id: 'q3',
        title: '游泳安全知识',
        content: '游泳时发生抽筋应该如何正确处理？请选择最安全有效的处理方法。',
        type: '多选题',
        category: {
          sport: '游泳',
          knowledgeType: '安全知识'
        },
        difficulty: '中等',
        tags: ['安全', '抽筋', '急救'],
        stats: {
          totalAttempts: 756,
          accuracy: 68.4
        }
      }
    },
    {
      _id: '4',
      createdAt: '2024-01-12T14:15:00Z',
      question: {
        _id: 'q4',
        title: '排球发球技术',
        content: '排球比赛中，上手发球的技术要点有哪些？请分析发球的准备动作、击球点和随挥动作。',
        type: '问答题',
        category: {
          sport: '排球',
          knowledgeType: '技术动作'
        },
        difficulty: '困难',
        tags: ['发球', '技术', '动作要领'],
        stats: {
          totalAttempts: 432,
          accuracy: 58.9
        }
      }
    },
    {
      _id: '5',
      createdAt: '2024-01-11T11:30:00Z',
      question: {
        _id: 'q5',
        title: '田径起跑技术',
        content: '短跑比赛中，蹲踞式起跑的技术要点包括哪些？各就位、预备、起跑三个阶段的动作要领是什么？',
        type: '问答题',
        category: {
          sport: '田径',
          knowledgeType: '技术动作'
        },
        difficulty: '中等',
        tags: ['起跑', '短跑', '技术'],
        stats: {
          totalAttempts: 623,
          accuracy: 72.1
        }
      }
    },
    {
      _id: '6',
      createdAt: '2024-01-10T16:45:00Z',
      question: {
        _id: 'q6',
        title: '乒乓球发球规则',
        content: '乒乓球比赛中，发球时球必须满足哪些条件才算合法？发球犯规的情况有哪些？',
        type: '单选题',
        category: {
          sport: '乒乓球',
          knowledgeType: '规则理解'
        },
        difficulty: '简单',
        tags: ['发球', '规则', '犯规'],
        stats: {
          totalAttempts: 892,
          accuracy: 81.7
        }
      }
    },
    {
      _id: '7',
      createdAt: '2024-01-09T13:20:00Z',
      question: {
        _id: 'q7',
        title: '体操安全保护',
        content: '在进行体操训练时，保护与帮助的基本原则是什么？如何有效预防运动损伤？',
        type: '多选题',
        category: {
          sport: '体操',
          knowledgeType: '安全知识'
        },
        difficulty: '中等',
        tags: ['保护', '安全', '预防'],
        stats: {
          totalAttempts: 345,
          accuracy: 64.3
        }
      }
    },
    {
      _id: '8',
      createdAt: '2024-01-08T08:10:00Z',
      question: {
        _id: 'q8',
        title: '健身器械使用',
        content: '使用哑铃进行训练时，正确的呼吸方法是什么？如何避免运动损伤？',
        type: '单选题',
        category: {
          sport: '健身',
          knowledgeType: '器械使用'
        },
        difficulty: '简单',
        tags: ['哑铃', '呼吸', '安全'],
        stats: {
          totalAttempts: 567,
          accuracy: 78.5
        }
      }
    }
  ];

  const [favorites, setFavorites] = useState<Favorite[]>([]);

  // 计算统计数据
  const calculateStats = (favoritesData: Favorite[]) => {
    if (!favoritesData || favoritesData.length === 0) {
      return {
        total: 0,
        categories: {},
        difficulties: {},
        averageAccuracy: 0
      };
    }

    const categories: { [key: string]: number } = {};
    const difficulties: { [key: string]: number } = {};
    let totalAccuracy = 0;

    favoritesData.forEach(favorite => {
      // 统计分类
      const sport = favorite.question.category.sport;
      categories[sport] = (categories[sport] || 0) + 1;

      // 统计难度
      const difficulty = favorite.question.difficulty;
      const difficultyLabel = difficulty === 'easy' ? '简单' : 
                             difficulty === 'medium' ? '中等' : 
                             difficulty === 'hard' ? '困难' : difficulty;
      difficulties[difficultyLabel] = (difficulties[difficultyLabel] || 0) + 1;

      // 累计正确率
      totalAccuracy += favorite.question.stats.accuracy;
    });

    return {
      total: favoritesData.length,
      categories,
      difficulties,
      averageAccuracy: favoritesData.length > 0 ? totalAccuracy / favoritesData.length : 0
    };
  };

  // 加载收藏统计数据
  const loadFavoriteStats = async () => {
    try {
      const response = await favoriteAPI.getFavoriteStats();
      const statsData = response.data.data;
      
      // 处理难度标签映射
      const difficultyMapping: { [key: string]: string } = {
        'easy': '简单',
        'medium': '中等', 
        'hard': '困难'
      };

      const processedDifficulties: { [key: string]: number } = {};
      Object.keys(statsData.difficultyStats || {}).forEach(key => {
        const label = difficultyMapping[key] || key;
        processedDifficulties[label] = statsData.difficultyStats[key];
      });

      setStats({
        total: statsData.total || 0,
        categories: statsData.categoryStats || {},
        difficulties: processedDifficulties,
        averageAccuracy: 0 // 后端统计暂不包含平均正确率，使用前端计算
      });
    } catch (error) {
      console.error('加载收藏统计失败:', error);
      // 如果API调用失败，使用本地计算的统计
      setStats(calculateStats(favorites));
    }
  };

  // 加载收藏数据
  const loadFavorites = async () => {
    setLoading(true);
    try {
      const response = await favoriteAPI.getFavorites();
      // 后端返回的数据结构: { success: true, data: { favorites: [...], pagination: {...} } }
      const responseData = response.data.data;
      const favoritesData = responseData?.favorites || responseData; // 兼容两种可能的数据结构
      const paginationData = responseData?.pagination;
      
      if (Array.isArray(favoritesData)) {
        setFavorites(favoritesData);
        
        // 更新分页信息
        if (paginationData) {
          setPagination({
            current: paginationData.current || 1,
            pageSize: paginationData.pageSize || 10,
            total: paginationData.total || favoritesData.length
          });
        } else {
          setPagination(prev => ({
            ...prev,
            total: favoritesData.length
          }));
        }

        // 计算并更新统计数据
        const calculatedStats = calculateStats(favoritesData);
        setStats(prev => ({
          ...calculatedStats,
          averageAccuracy: calculatedStats.averageAccuracy
        }));

        message.success('收藏列表加载成功');
      } else {
        console.warn('API返回的收藏数据不是数组格式:', responseData);
        // 如果API数据格式异常，回退到使用mock数据
        setFavorites(mockFavorites);
        setStats(calculateStats(mockFavorites));
        setPagination(prev => ({
          ...prev,
          total: mockFavorites.length
        }));
        message.info('使用模拟收藏数据');
      }
    } catch (error: any) {
      console.error('加载收藏列表失败:', error);
      // 如果API调用失败，回退到使用mock数据而不是空数组
      setFavorites(mockFavorites);
      setStats(calculateStats(mockFavorites));
      setPagination(prev => ({
        ...prev,
        total: mockFavorites.length
      }));
      message.info('收藏数据加载失败，已显示示例数据');
    } finally {
      setLoading(false);
    }
  };

  // 刷新数据
  const refreshData = () => {
    loadFavorites();
    // 可选：也可以单独加载统计数据
    // loadFavoriteStats();
  };

  useEffect(() => {
    loadFavorites();
  }, [filters]);

  // 取消收藏
  const handleRemoveFavorite = async (questionId: string) => {
    try {
      await favoriteAPI.removeFavorite(questionId);
      // 从本地状态中移除
      const newFavorites = favorites.filter(fav => fav.question._id !== questionId);
      setFavorites(newFavorites);
      
      // 重新计算统计数据
      setStats(calculateStats(newFavorites));
      
      // 更新分页总数
      setPagination(prev => ({
        ...prev,
        total: newFavorites.length
      }));
      
      message.success('取消收藏成功');
    } catch (error: any) {
      message.error('取消收藏失败：' + (error.response?.data?.message || error.message));
    }
  };

  // 预览题目
  const handlePreview = (question: any) => {
    setSelectedQuestion(question);
    setPreviewVisible(true);
  };

  // 开始练习收藏题目
  const handleStartPractice = () => {
    navigate('/practice?mode=favorites');
  };

  // 表格列配置
  const columns = [
    {
      title: '题目',
      dataIndex: ['question', 'title'],
      key: 'title',
      ellipsis: true,
      render: (title: string, record: Favorite) => (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{title}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.question.content.substring(0, 100)}...
          </div>
        </div>
      )
    },
    {
      title: '类型',
      dataIndex: ['question', 'type'],
      key: 'type',
      width: 100,
      render: (type: string) => {
        const typeMap: { [key: string]: string } = {
          'single_choice': '单选题',
          'multiple_choice': '多选题',
          'true_false': '判断题',
          'case_analysis': '案例分析',
          'fill_blank': '填空题'
        };
        return <Tag color="blue">{typeMap[type] || type}</Tag>;
      }
    },
    {
      title: '分类',
      key: 'category',
      width: 120,
      render: (_: any, record: Favorite) => (
        <div>
          <Tag color="green">{record.question.category.sport}</Tag>
          <Tag color="orange">{record.question.category.knowledgeType}</Tag>
        </div>
      )
    },
    {
      title: '难度',
      dataIndex: ['question', 'difficulty'],
      key: 'difficulty',
      width: 80,
      render: (difficulty: string) => {
        const colorMap: { [key: string]: string } = {
          'easy': 'green',
          'medium': 'orange',
          'hard': 'red'
        };
        const labelMap: { [key: string]: string } = {
          'easy': '简单',
          'medium': '中等',
          'hard': '困难'
        };
        return <Tag color={colorMap[difficulty]}>{labelMap[difficulty]}</Tag>;
      }
    },
    {
      title: '统计',
      key: 'stats',
      width: 120,
      render: (_: any, record: Favorite) => (
        <div style={{ fontSize: '12px' }}>
          <div>答题次数: {record.question.stats.totalAttempts}</div>
          <div>正确率: {record.question.stats.accuracy.toFixed(1)}%</div>
        </div>
      )
    },
    {
      title: '收藏时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: Favorite) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handlePreview(record.question)}
          >
            预览
          </Button>
          <Popconfirm
            title="确定要取消收藏吗？"
            onConfirm={() => handleRemoveFavorite(record.question._id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              取消收藏
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={2} style={{ margin: 0 }}>
            <StarOutlined style={{ color: '#faad14', marginRight: '8px' }} />
            我的收藏
          </Title>
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={refreshData}
              loading={loading}
            >
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleStartPractice}
              disabled={favorites.length === 0}
            >
              开始练习收藏题目
            </Button>
          </Space>
        </div>

        {/* 统计概览 */}
        {stats && (
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="收藏题目总数"
                  value={stats.total}
                  prefix={<StarOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="最多收藏分类"
                  value={Object.keys(stats.categories).length > 0 ? 
                    Object.keys(stats.categories).reduce((a, b) => 
                      (stats.categories as any)[a] > (stats.categories as any)[b] ? a : b
                    ) : '无'}
                  prefix={<BookOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="简单题目"
                  value={stats.difficulties.简单 || 0}
                  prefix={<TrophyOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="困难题目"
                  value={stats.difficulties.困难 || 0}
                  prefix={<TrophyOutlined />}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* 筛选器 */}
        <div style={{ marginBottom: '16px' }}>
          <Space>
            <Select
              placeholder="选择分类"
              style={{ width: 150 }}
              value={filters.category}
              onChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
              allowClear
            >
              <Option value="足球">足球</Option>
              <Option value="篮球">篮球</Option>
              <Option value="排球">排球</Option>
              <Option value="乒乓球">乒乓球</Option>
              <Option value="羽毛球">羽毛球</Option>
              <Option value="网球">网球</Option>
              <Option value="田径">田径</Option>
              <Option value="游泳">游泳</Option>
              <Option value="体操">体操</Option>
              <Option value="武术">武术</Option>
              <Option value="健身">健身</Option>
              <Option value="其他">其他</Option>
            </Select>
            <Select
              placeholder="选择难度"
              style={{ width: 120 }}
              value={filters.difficulty}
              onChange={(value) => setFilters(prev => ({ ...prev, difficulty: value }))}
              allowClear
            >
              <Option value="easy">简单</Option>
              <Option value="medium">中等</Option>
              <Option value="hard">困难</Option>
            </Select>
          </Space>
        </div>

        {/* 收藏列表 */}
        <Table
          columns={columns}
          dataSource={favorites}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无收藏题目"
              >
                <Text type="secondary">
                  在练习或考试中点击收藏按钮来收藏重点题目
                </Text>
              </Empty>
            )
          }}
        />
      </Card>

      {/* 题目预览模态框 */}
      <Modal
        title="题目预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={800}
      >
        {selectedQuestion && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <Space>
                <Tag color="blue">
                  {selectedQuestion.type === 'single_choice' ? '单选题' :
                   selectedQuestion.type === 'multiple_choice' ? '多选题' :
                   selectedQuestion.type === 'true_false' ? '判断题' :
                   selectedQuestion.type === 'fill_blank' ? '填空题' : '案例分析'}
                </Tag>
                <Tag color="green">{selectedQuestion.category.sport}</Tag>
                <Tag color="orange">{selectedQuestion.category.knowledgeType}</Tag>
                <Tag color={
                  selectedQuestion.difficulty === 'easy' ? 'green' :
                  selectedQuestion.difficulty === 'medium' ? 'orange' : 'red'
                }>
                  {selectedQuestion.difficulty === 'easy' ? '简单' :
                   selectedQuestion.difficulty === 'medium' ? '中等' : '困难'}
                </Tag>
              </Space>
            </div>

            <Title level={4}>{selectedQuestion.title}</Title>
            <div style={{ fontSize: '16px', marginBottom: '16px' }}>
              {selectedQuestion.content}
            </div>

            {selectedQuestion.tags && selectedQuestion.tags.length > 0 && (
              <div>
                <Text strong>标签：</Text>
                <Space wrap style={{ marginTop: '8px' }}>
                  {selectedQuestion.tags.map((tag: string, index: number) => (
                    <Tag key={index}>{tag}</Tag>
                  ))}
                </Space>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Favorites; 