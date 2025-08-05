import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Button, Input, Select, Tag, Avatar, List, Space, Typography,
  Form, Modal, message, Badge, Tabs, Timeline, Tooltip, Divider,
  Empty, Spin, Pagination, FloatButton, BackTop
} from 'antd';
import {
  PlusOutlined, CommentOutlined, HeartOutlined, ShareAltOutlined,
  StarOutlined, UserOutlined, ClockCircleOutlined, EyeOutlined,
  QuestionCircleOutlined, BulbOutlined, TrophyOutlined, FireOutlined,
  MessageOutlined, LikeOutlined, SendOutlined, PictureOutlined,
  SafetyCertificateOutlined, CrownOutlined, ThunderboltOutlined, BookOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { RootState } from '../types';
import { useTheme } from '../hooks/useTheme';
import { discussionAPI } from '../services/discussionAPI';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Option } = Select;

interface Discussion {
  _id: string;
  title: string;
  content: string;
  type: 'question' | 'sharing' | 'experience' | 'expert_answer';
  category: string;
  tags: string[];
  author: {
    _id: string;
    username: string;
    avatar?: string;
    role: string;
    level: number;
  };
  likes: number;
  replies: number;
  views: number;
  isLiked: boolean;
  isStarred: boolean;
  createdAt: string;
  updatedAt: string;
  images?: string[];
  isExpert?: boolean;
  isFeatured?: boolean;
}

const Community: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [currentPage, setCurrentPage] = useState(1);
  
  // 发帖相关状态
  const [showPostModal, setShowPostModal] = useState(false);
  const [postForm] = Form.useForm();
  const [postLoading, setPostLoading] = useState(false);
  
  // 回复相关状态
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState<Discussion | null>(null);
  const [replyContent, setReplyContent] = useState('');
  
  // 讨论数据状态
  const [discussions, setDiscussions] = useState<Discussion[]>([]);

  const { user } = useSelector((state: RootState) => state.auth);
  const { isDark, primaryColor } = useTheme();
  
  // 初始化讨论数据
  useEffect(() => {
    setDiscussions(mockDiscussions);
  }, []);

  // 丰富的模拟讨论数据
  const mockDiscussions: Discussion[] = [
    {
      _id: '1',
      title: '关于足球越位规则的疑问',
      content: '在观看比赛时，经常看到边裁举旗示意越位，但有时候感觉球员并没有越位。想请教一下越位规则的具体判定标准，特别是在什么情况下不构成越位？希望专业的教练能够详细解答一下。',
      type: 'question',
      category: 'football',
      tags: ['足球', '规则', '越位', '裁判'],
      author: {
        _id: 'user1',
        username: '小明同学',
        avatar: '',
        role: 'student',
        level: 120
      },
      likes: 15,
      replies: 8,
      views: 156,
      isLiked: false,
      isStarred: false,
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:30:00Z',
      isExpert: false,
      isFeatured: false
    },
    {
      _id: '2',
      title: '篮球投篮技巧分享：如何提高罚球命中率',
      content: '作为一名篮球爱好者，我想分享一些提高罚球命中率的技巧。首先是投篮姿势要标准，双脚与肩同宽，持球手型要正确。其次是要保持心理状态的稳定，建立投篮节奏。最后是要多加练习，形成肌肉记忆。大家有什么其他的心得可以一起交流！',
      type: 'sharing',
      category: 'basketball',
      tags: ['篮球', '投篮', '技巧', '罚球'],
      author: {
        _id: 'teacher1',
        username: '王教练',
        avatar: '',
        role: 'teacher',
        level: 500
      },
      likes: 42,
      replies: 18,
      views: 324,
      isLiked: true,
      isStarred: true,
      createdAt: '2024-01-14T16:45:00Z',
      updatedAt: '2024-01-14T16:45:00Z',
      isExpert: true,
      isFeatured: true
    },
    {
      _id: '3',
      title: '游泳安全知识：如何预防溺水事故',
      content: '夏天到了，游泳成为热门运动。但是游泳安全不容忽视，我来分享一些预防溺水的重要知识点：1.下水前要做充分的热身运动 2.不要在不熟悉的水域游泳 3.避免单独游泳 4.学会基本的自救技能 5.了解水中抽筋的处理方法。安全第一，快乐游泳！',
      type: 'experience',
      category: 'swimming',
      tags: ['游泳', '安全', '预防', '急救'],
      author: {
        _id: 'user2',
        username: '安全小助手',
        avatar: '',
        role: 'student',
        level: 280
      },
      likes: 28,
      replies: 12,
      views: 198,
      isLiked: false,
      isStarred: false,
      createdAt: '2024-01-13T14:20:00Z',
      updatedAt: '2024-01-13T14:20:00Z',
      isExpert: false,
      isFeatured: false
    },
    {
      _id: '4',
      title: '田径训练中如何防止运动损伤？',
      content: '最近开始练习短跑，但是担心会受伤。请问在田径训练中应该注意哪些方面来防止运动损伤？特别是在跑步过程中如何保护膝盖和脚踝？',
      type: 'question',
      category: 'athletics',
      tags: ['田径', '训练', '损伤预防', '安全'],
      author: {
        _id: 'user3',
        username: '跑步新手',
        avatar: '',
        role: 'student',
        level: 85
      },
      likes: 23,
      replies: 15,
      views: 267,
      isLiked: true,
      isStarred: false,
      createdAt: '2024-01-12T09:15:00Z',
      updatedAt: '2024-01-12T09:15:00Z',
      isExpert: false,
      isFeatured: false
    },
    {
      _id: '5',
      title: '排球扣球技术要领详解',
      content: '排球扣球是得分的主要手段，今天我来详细讲解一下扣球的技术要领：1.助跑要有节奏，最后一步要大 2.起跳时机要准确，双臂协调摆动 3.击球点要高，在身体前上方 4.手法要正确，全掌击球 5.落地要安全，双脚着地。希望对初学者有帮助！',
      type: 'sharing',
      category: 'volleyball',
      tags: ['排球', '扣球', '技术', '教学'],
      author: {
        _id: 'teacher2',
        username: '李教练',
        avatar: '',
        role: 'teacher',
        level: 780
      },
      likes: 56,
      replies: 22,
      views: 445,
      isLiked: false,
      isStarred: true,
      createdAt: '2024-01-11T14:30:00Z',
      updatedAt: '2024-01-11T14:30:00Z',
      isExpert: true,
      isFeatured: true
    },
    {
      _id: '6',
      title: '我的健身房训练心得分享',
      content: '健身一年多了，想分享一些心得体会。刚开始的时候盲目追求重量，结果受了伤。后来学会了正确的训练方法：循序渐进、注重动作标准、合理安排休息。现在不仅身体素质提高了，心理状态也更好了。运动真的可以改变生活！',
      type: 'experience',
      category: 'fitness',
      tags: ['健身', '心得', '训练方法', '生活'],
      author: {
        _id: 'user4',
        username: '健身达人小王',
        avatar: '',
        role: 'student',
        level: 420
      },
      likes: 34,
      replies: 19,
      views: 289,
      isLiked: false,
      isStarred: false,
      createdAt: '2024-01-10T16:20:00Z',
      updatedAt: '2024-01-10T16:20:00Z',
      isExpert: false,
      isFeatured: false
    },
    {
      _id: '7',
      title: '乒乓球发球技术问题求教',
      content: '请教各位高手，乒乓球发球时总是发不出旋转，球的弧线也不够好。我知道要用手腕发力，但是具体的动作要领是什么？还有怎样才能发出更多种类的旋转球？',
      type: 'question',
      category: 'rules',
      tags: ['乒乓球', '发球', '旋转', '技术'],
      author: {
        _id: 'user5',
        username: '乒乓球爱好者',
        avatar: '',
        role: 'student',
        level: 195
      },
      likes: 18,
      replies: 11,
      views: 178,
      isLiked: false,
      isStarred: false,
      createdAt: '2024-01-09T11:45:00Z',
      updatedAt: '2024-01-09T11:45:00Z',
      isExpert: false,
      isFeatured: false
    },
    {
      _id: '8',
      title: '体育营养学：运动前后的饮食搭配',
      content: '作为体育营养师，我经常被问到运动前后应该吃什么。今天详细分享一下：运动前2-3小时：以碳水化合物为主，少量蛋白质，避免高脂肪食物。运动中：及时补充水分和电解质。运动后30分钟内：蛋白质+碳水化合物黄金比例3:1。营养搭配合理，运动效果更佳！',
      type: 'sharing',
      category: 'technique',
      tags: ['营养', '饮食', '运动科学', '健康'],
      author: {
        _id: 'expert1',
        username: '营养师张老师',
        avatar: '',
        role: 'teacher',
        level: 950
      },
      likes: 67,
      replies: 25,
      views: 512,
      isLiked: true,
      isStarred: true,
      createdAt: '2024-01-08T13:10:00Z',
      updatedAt: '2024-01-08T13:10:00Z',
      isExpert: true,
      isFeatured: true
    },
    {
      _id: '9',
      title: '学校体育课改革的一些思考',
      content: '作为一名体育老师，我觉得现在的体育课需要更多创新。不能只是跑跑步、做做操，应该增加更多趣味性和实用性的项目。比如可以加入一些新兴运动，或者结合科技手段让学生更有兴趣。大家觉得体育课应该怎么改革呢？',
      type: 'experience',
      category: 'experience',
      tags: ['体育教学', '课程改革', '教育', '创新'],
      author: {
        _id: 'teacher3',
        username: '体育老师陈老师',
        avatar: '',
        role: 'teacher',
        level: 680
      },
      likes: 39,
      replies: 31,
      views: 378,
      isLiked: false,
      isStarred: false,
      createdAt: '2024-01-07T10:25:00Z',
      updatedAt: '2024-01-07T10:25:00Z',
      isExpert: true,
      isFeatured: false
    },
    {
      _id: '10',
      title: '羽毛球双打配合技巧',
      content: '羽毛球双打和单打完全不同，配合非常重要。请问在双打中应该如何站位？什么时候该前场什么时候该后场？如何与搭档建立默契？希望有经验的球友能指点一下！',
      type: 'question',
      category: 'technique',
      tags: ['羽毛球', '双打', '配合', '战术'],
      author: {
        _id: 'user6',
        username: '羽毛球新手',
        avatar: '',
        role: 'student',
        level: 156
      },
      likes: 21,
      replies: 14,
      views: 234,
      isLiked: false,
      isStarred: false,
      createdAt: '2024-01-06T15:40:00Z',
      updatedAt: '2024-01-06T15:40:00Z',
      isExpert: false,
      isFeatured: false
    }
  ];

  // 讨论分类
  const categories = [
    { key: 'all', label: '全部', icon: <FireOutlined /> },
    { key: 'football', label: '足球', icon: <BookOutlined /> },
    { key: 'basketball', label: '篮球', icon: <BookOutlined /> },
    { key: 'volleyball', label: '排球', icon: <BookOutlined /> },
    { key: 'athletics', label: '田径', icon: <BookOutlined /> },
    { key: 'swimming', label: '游泳', icon: <BookOutlined /> },
    { key: 'fitness', label: '健身', icon: <BookOutlined /> },
    { key: 'rules', label: '规则讨论', icon: <QuestionCircleOutlined /> },
    { key: 'technique', label: '技术交流', icon: <BulbOutlined /> },
    { key: 'experience', label: '经验分享', icon: <TrophyOutlined /> }
  ];

  // 帖子类型
  const postTypes = [
    { value: 'question', label: '提问求助', icon: <QuestionCircleOutlined />, color: '#1890ff' },
    { value: 'sharing', label: '知识分享', icon: <BulbOutlined />, color: '#52c41a' },
    { value: 'experience', label: '经验心得', icon: <TrophyOutlined />, color: '#faad14' }
  ];

  // 排序选项
  const sortOptions = [
    { value: 'latest', label: '最新发布' },
    { value: 'hot', label: '热门讨论' },
    { value: 'likes', label: '点赞最多' },
    { value: 'replies', label: '回复最多' }
  ];

  // 发布讨论
  const handlePost = async (values: any) => {
    try {
      setPostLoading(true);
      
      // 调用真实API
      const response = await discussionAPI.createDiscussion(values);
      const newDiscussion = response.data.data;
      
      // 添加到讨论列表
      setDiscussions(prev => [newDiscussion, ...prev]);
      
      message.success('发布成功！');
      setShowPostModal(false);
      postForm.resetFields();
    } catch (error: any) {
      message.error('发布失败：' + (error.response?.data?.message || error.message));
    } finally {
      setPostLoading(false);
    }
  };

  // 点赞/取消点赞
  const handleLike = async (discussionId: string, isLiked: boolean) => {
    try {
      await discussionAPI.likeDiscussion(discussionId);
      
      // 更新本地状态
      setDiscussions(prev => prev.map(discussion => 
        discussion._id === discussionId 
          ? { 
              ...discussion, 
              isLiked: !isLiked,
              likes: isLiked ? discussion.likes - 1 : discussion.likes + 1
            }
          : discussion
      ));
      
      message.success(isLiked ? '取消点赞' : '点赞成功');
    } catch (error: any) {
      message.error('操作失败：' + (error.response?.data?.message || error.message));
    }
  };

  // 收藏/取消收藏
  const handleStar = async (discussionId: string, isStarred: boolean) => {
    try {
      if (isStarred) {
        await discussionAPI.unstarDiscussion(discussionId);
      } else {
        await discussionAPI.starDiscussion(discussionId);
      }
      
      // 更新本地状态
      setDiscussions(prev => prev.map(discussion => 
        discussion._id === discussionId 
          ? { ...discussion, isStarred: !isStarred }
          : discussion
      ));
      
      message.success(isStarred ? '取消收藏' : '收藏成功');
    } catch (error: any) {
      message.error('操作失败：' + (error.response?.data?.message || error.message));
    }
  };

  // 查看详情和回复
  const handleViewDetail = (discussion: Discussion) => {
    // 增加浏览量
    setDiscussions(prev => prev.map(d => 
      d._id === discussion._id 
        ? { ...d, views: d.views + 1 }
        : d
    ));
    
    setSelectedDiscussion(discussion);
    setShowReplyModal(true);
  };

  // 发送回复
  const handleReply = async () => {
    if (!replyContent.trim()) return;
    
    try {
      if (selectedDiscussion) {
        await discussionAPI.addReply(selectedDiscussion._id, replyContent);
        
        // 更新回复数量
        setDiscussions(prev => prev.map(discussion => 
          discussion._id === selectedDiscussion._id 
            ? { ...discussion, replies: discussion.replies + 1 }
            : discussion
        ));
      }
      
      message.success('回复成功！');
      setReplyContent('');
      setShowReplyModal(false);
    } catch (error: any) {
      message.error('回复失败：' + (error.response?.data?.message || error.message));
    }
  };

  // 获取用户等级标识
  const getUserLevelBadge = (level: number, role: string) => {
    if (role === 'teacher' || role === 'admin') {
      return <CrownOutlined style={{ color: '#faad14', marginLeft: '4px' }} />;
    }
    
    const badges = [
      { min: 0, max: 100, icon: <UserOutlined />, color: '#d9d9d9' },
      { min: 100, max: 500, icon: <BookOutlined />, color: '#52c41a' },
      { min: 500, max: 1000, icon: <TrophyOutlined />, color: '#1890ff' },
      { min: 1000, max: Infinity, icon: <CrownOutlined />, color: '#722ed1' }
    ];
    
    const badge = badges.find(b => level >= b.min && level < b.max);
    return badge ? React.cloneElement(badge.icon, { 
      style: { color: badge.color, marginLeft: '4px' } 
    }) : null;
  };

  // 渲染讨论卡片
  const renderDiscussionCard = (discussion: Discussion) => (
    <Card 
      key={discussion._id}
      className="modern-card animate-slideUp"
      style={{ 
        marginBottom: '16px',
        border: `1px solid ${isDark ? '#404040' : '#e2e8f0'}`,
        borderRadius: '12px',
        overflow: 'hidden'
      }}
      bodyStyle={{ padding: '20px' }}
    >
      {/* 帖子头部 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            src={discussion.author.avatar} 
            icon={<UserOutlined />}
            size={40}
            style={{ 
              border: `2px solid ${primaryColor}20`,
              marginRight: '12px'
            }}
          />
          <div>
            <Space align="center">
              <Text strong style={{ fontSize: '16px' }}>
                {discussion.author.username}
              </Text>
              {getUserLevelBadge(discussion.author.level, discussion.author.role)}
              {discussion.isExpert && (
                <Tag color="gold" icon={<SafetyCertificateOutlined />}>专家</Tag>
              )}
            </Space>
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                <ClockCircleOutlined style={{ marginRight: '4px' }} />
                {new Date(discussion.createdAt).toLocaleString()}
              </Text>
            </div>
          </div>
        </div>
        
        {discussion.isFeatured && (
          <Tag color="red" icon={<FireOutlined />}>精华</Tag>
        )}
      </div>

      {/* 帖子内容 */}
      <div style={{ marginBottom: '16px' }}>
        <Title level={4} style={{ margin: '0 0 8px 0', cursor: 'pointer' }} 
               onClick={() => handleViewDetail(discussion)}>
          {discussion.title}
        </Title>
        
        <Paragraph 
          ellipsis={{ rows: 3, expandable: false }}
          style={{ color: isDark ? '#a1a1aa' : '#64748b', margin: 0 }}
        >
          {discussion.content}
        </Paragraph>
      </div>

      {/* 标签 */}
      {discussion.tags && discussion.tags.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          {discussion.tags.map(tag => (
            <Tag key={tag} style={{ marginBottom: '4px' }}>
              #{tag}
            </Tag>
          ))}
        </div>
      )}

      {/* 操作按钮 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space size="large">
          <Button
            type="text"
            size="small"
            icon={<LikeOutlined style={{ color: discussion.isLiked ? primaryColor : undefined }} />}
            onClick={() => handleLike(discussion._id, discussion.isLiked)}
            style={{ color: discussion.isLiked ? primaryColor : undefined }}
          >
            {discussion.likes}
          </Button>
          
          <Button
            type="text"
            size="small"
            icon={<CommentOutlined />}
            onClick={() => handleViewDetail(discussion)}
          >
            {discussion.replies}
          </Button>
          
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
            >
            {discussion.views}
            </Button>
          
            <Button
              type="text"
              size="small"
            icon={<StarOutlined style={{ color: discussion.isStarred ? '#faad14' : undefined }} />}
            onClick={() => handleStar(discussion._id, discussion.isStarred)}
            style={{ color: discussion.isStarred ? '#faad14' : undefined }}
          >
            收藏
            </Button>
          </Space>
        
              <Space>
          <Tag color={
            discussion.type === 'question' ? 'blue' :
            discussion.type === 'sharing' ? 'green' : 'orange'
          }>
            {postTypes.find(t => t.value === discussion.type)?.label}
                </Tag>
                </Space>
              </div>
    </Card>
    );

  return (
    <div className="animate-fadeIn" style={{ padding: '24px', minHeight: '100vh' }}>
      {/* 页面标题 */}
      <div className="glass-panel" style={{ 
        padding: '32px', 
        marginBottom: '32px',
        background: `linear-gradient(135deg, ${primaryColor}20 0%, ${primaryColor}10 100%)`,
        border: `1px solid ${primaryColor}30`,
        borderRadius: '16px'
      }}>
        <Space align="center" size="large">
          <MessageOutlined style={{ fontSize: '48px', color: primaryColor }} />
          <div>
            <Title level={2} style={{ margin: 0, color: isDark ? '#ffffff' : '#1a202c' }}>
              体育知识讨论社区
          </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              与同学交流学习心得，向专家请教疑难问题，分享体育知识与经验
            </Text>
          </div>
        </Space>
        
          <Button
            type="primary"
          size="large"
            icon={<PlusOutlined />}
          onClick={() => setShowPostModal(true)}
          style={{ 
            position: 'absolute',
            top: '32px',
            right: '32px'
          }}
        >
          发布新帖
          </Button>
        </div>

      <Row gutter={24}>
        {/* 侧边栏 */}
        <Col xs={24} lg={6}>
          {/* 分类导航 */}
          <Card 
            title="讨论分类" 
            className="modern-card"
            style={{ 
              marginBottom: '24px',
              border: `1px solid ${isDark ? '#404040' : '#e2e8f0'}`,
              borderRadius: '12px'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categories.map(category => (
                <Button
                  key={category.key}
                  type={selectedCategory === category.key ? 'primary' : 'text'}
                  block
                  style={{ 
                    textAlign: 'left',
                    height: '40px',
                    justifyContent: 'flex-start'
                  }}
                  icon={category.icon}
                  onClick={() => setSelectedCategory(category.key)}
                >
                  {category.label}
                </Button>
              ))}
            </div>
              </Card>

          {/* 热门话题 */}
          <Card 
            title="热门话题" 
            className="modern-card"
            style={{ 
              border: `1px solid ${isDark ? '#404040' : '#e2e8f0'}`,
              borderRadius: '12px'
            }}
          >
            <Timeline>
              <Timeline.Item color="red">
                <Text strong>#世界杯规则解读</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>256人讨论</Text>
              </Timeline.Item>
              <Timeline.Item color="blue">
                <Text strong>#篮球投篮技巧</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>189人讨论</Text>
              </Timeline.Item>
              <Timeline.Item color="green">
                <Text strong>#游泳安全知识</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>167人讨论</Text>
              </Timeline.Item>
              <Timeline.Item color="orange">
                <Text strong>#田径训练方法</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>145人讨论</Text>
              </Timeline.Item>
              <Timeline.Item color="purple">
                <Text strong>#排球战术分析</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>134人讨论</Text>
              </Timeline.Item>
              <Timeline.Item>
                <Text strong>#乒乓球发球技巧</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>89人讨论</Text>
              </Timeline.Item>
            </Timeline>
              </Card>
            </Col>

        {/* 主内容区 */}
        <Col xs={24} lg={18}>
          {/* 筛选和排序 */}
          <Card 
            className="modern-card"
            style={{ 
              marginBottom: '24px',
              border: `1px solid ${isDark ? '#404040' : '#e2e8f0'}`,
              borderRadius: '12px'
            }}
            bodyStyle={{ padding: '16px 24px' }}
          >
            <Row justify="space-between" align="middle">
              <Col>
                <Tabs 
                  activeKey={activeTab} 
                  onChange={setActiveTab}
                  type="card"
                  size="small"
                >
                  <TabPane tab="全部" key="all" />
                  <TabPane tab="提问" key="question" />
                  <TabPane tab="分享" key="sharing" />
                  <TabPane tab="心得" key="experience" />
                  <TabPane tab="专家解答" key="expert_answer" />
                </Tabs>
            </Col>
              <Col>
              <Select
                  value={sortBy}
                  onChange={setSortBy}
                  style={{ width: 120 }}
                  size="small"
                >
                  {sortOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                  </Option>
                ))}
              </Select>
            </Col>
            </Row>
          </Card>

          {/* 讨论列表 */}
                          {discussions.map(renderDiscussionCard)}
              
          {/* 分页 */}
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
                          <Pagination
                current={currentPage}
                total={discussions.length}
                pageSize={10}
                onChange={setCurrentPage}
                showSizeChanger={false}
                showQuickJumper
                showTotal={(total, range) => 
                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条讨论`
                }
              />
          </div>
            </Col>
          </Row>

      {/* 发帖模态框 */}
      <Modal
        title="发布新讨论"
        open={showPostModal}
        onCancel={() => setShowPostModal(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={postForm}
          layout="vertical"
          onFinish={handlePost}
        >
          <Form.Item
            name="type"
            label="帖子类型"
            rules={[{ required: true, message: '请选择帖子类型' }]}
          >
            <Select placeholder="选择帖子类型">
              {postTypes.map(type => (
                    <Option key={type.value} value={type.value}>
                      <Space>
                        {type.icon}
                        {type.label}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

          <Form.Item
            name="category"
            label="讨论分类"
            rules={[{ required: true, message: '请选择讨论分类' }]}
          >
            <Select placeholder="选择讨论分类">
              {categories.slice(1).map(category => (
                <Option key={category.key} value={category.key}>
                  <Space>
                    {category.icon}
                    {category.label}
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="标题"
            rules={[
              { required: true, message: '请输入标题' },
              { max: 100, message: '标题不能超过100个字符' }
            ]}
          >
            <Input placeholder="请输入讨论标题" />
          </Form.Item>

          <Form.Item
            name="content"
            label="内容"
            rules={[
              { required: true, message: '请输入内容' },
              { min: 10, message: '内容至少10个字符' },
              { max: 5000, message: '内容不能超过5000个字符' }
            ]}
          >
            <TextArea
              rows={6}
              placeholder="请详细描述您的问题或想要分享的内容..."
              showCount
              maxLength={5000}
            />
          </Form.Item>

          <Form.Item
            name="tags"
            label="标签"
          >
            <Select
              mode="tags"
              placeholder="添加相关标签，最多5个"
              maxTagCount={5}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setShowPostModal(false)}>
                取消
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={postLoading}
              >
                发布
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情和回复模态框 */}
      <Modal
        title="讨论详情"
        open={showReplyModal}
        onCancel={() => setShowReplyModal(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        {selectedDiscussion && (
          <div>
            {/* 主讨论内容 */}
            <div style={{ marginBottom: '24px', padding: '20px', 
                          background: isDark ? '#1a1a1a' : '#f9f9f9', 
                          borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <Avatar 
                  src={selectedDiscussion.author.avatar} 
                  icon={<UserOutlined />}
                  size={40}
                  style={{ marginRight: '12px' }}
                />
                <div>
                  <Text strong>{selectedDiscussion.author.username}</Text>
                  {getUserLevelBadge(selectedDiscussion.author.level, selectedDiscussion.author.role)}
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {new Date(selectedDiscussion.createdAt).toLocaleString()}
                  </Text>
                </div>
              </div>
              
              <Title level={4}>{selectedDiscussion.title}</Title>
              <Paragraph>{selectedDiscussion.content}</Paragraph>
              
              {selectedDiscussion.tags && (
                <div>
                  {selectedDiscussion.tags.map(tag => (
                    <Tag key={tag}>#{tag}</Tag>
                  ))}
                </div>
              )}
            </div>

            {/* 回复列表 */}
            <div style={{ marginBottom: '24px' }}>
              <Title level={5}>回复 (0)</Title>
              <Empty description="暂无回复" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>

            {/* 回复输入框 */}
            <div>
              <TextArea
                rows={4}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="写下您的回复..."
                style={{ marginBottom: '12px' }}
              />
              <div style={{ textAlign: 'right' }}>
                <Button 
                  type="primary" 
                  icon={<SendOutlined />}
                  onClick={handleReply}
                  disabled={!replyContent.trim()}
                >
                  发送回复
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 浮动按钮 */}
      <FloatButton.Group>
        <FloatButton 
          icon={<PlusOutlined />} 
          tooltip="发布新帖"
          onClick={() => setShowPostModal(true)}
        />
        <BackTop />
      </FloatButton.Group>
    </div>
  );
};

export default Community; 