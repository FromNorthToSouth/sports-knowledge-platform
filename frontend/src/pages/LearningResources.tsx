import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Input, Select, Button, Tabs, Progress, Tag, Typography, 
  Space, Rate, Tooltip, Badge, Avatar, List, Modal, message, Divider,
  Slider, Switch, Empty, Spin, Statistic, Upload, Form, Radio,
  Table, Popconfirm, Image, Alert, Timeline, Drawer
} from 'antd';
import {
  PlayCircleOutlined, PauseCircleOutlined, SearchOutlined, FilterOutlined,
  HeartOutlined, StarOutlined, EyeOutlined, DownloadOutlined, ShareAltOutlined,
  UserOutlined, ClockCircleOutlined, BookOutlined, SoundOutlined,
  VideoCameraOutlined, FileTextOutlined, UploadOutlined, CheckCircleOutlined,
  EditOutlined, DeleteOutlined, PlusOutlined, AuditOutlined, GlobalOutlined,
  ExclamationCircleOutlined, FireOutlined, TrophyOutlined, TeamOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useTheme } from '../hooks/useTheme';
import '../styles/modern-theme.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { Search } = Input;
const { TextArea } = Input;
const { Dragger } = Upload;

interface LearningResource {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'audio' | 'document' | 'image';
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration?: number; // 持续时间（分钟）
  fileSize?: number; // 文件大小（MB）
  url: string;
  thumbnailUrl?: string;
  tags: string[];
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  status: 'draft' | 'pending' | 'published' | 'rejected';
  stats: {
    views: number;
    likes: number;
    favorites: number;
    downloads: number;
    rating: number;
    ratingCount: number;
  };
  uploadedAt: string;
  publishedAt?: string;
  reviewedBy?: string;
  reviewComment?: string;
}

interface ResourceStats {
  totalResources: number;
  publishedResources: number;
  pendingReview: number;
  totalViews: number;
  totalDownloads: number;
  avgRating: number;
  resourcesByType: {
    video: number;
    audio: number;
    document: number;
    image: number;
  };
}

const LearningResources: React.FC = () => {
  const [activeTab, setActiveTab] = useState('browse');
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedResource, setSelectedResource] = useState<LearningResource | null>(null);
  const [resourceModalVisible, setResourceModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    level: 'all',
    status: 'published'
  });
  const [stats, setStats] = useState<ResourceStats | null>(null);

  const [uploadForm] = Form.useForm();
  const [reviewForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const { user } = useSelector((state: RootState) => state.auth);
  const { isDark, primaryColor } = useTheme();

  // 创建默认缩略图
  const createDefaultThumbnail = (text: string, bgColor: string, textColor: string = '#ffffff') => {
    const svg = `
      <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${bgColor}88;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="300" height="200" fill="url(#bg)"/>
        <text x="150" y="100" text-anchor="middle" dominant-baseline="middle" 
              fill="${textColor}" font-family="Arial, sans-serif" font-size="20" font-weight="bold">
          ${text}
        </text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  };

  // 创建默认头像
  const createDefaultAvatar = (text: string, bgColor: string, textColor: string = '#ffffff') => {
    const svg = `
      <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="20" fill="${bgColor}"/>
        <text x="20" y="20" text-anchor="middle" dominant-baseline="middle" 
              fill="${textColor}" font-family="Arial, sans-serif" font-size="16" font-weight="bold">
          ${text}
        </text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  };

  // 创建高清图片（用于详情页）
  const createHighResImage = (text: string, bgColor: string, textColor: string = '#ffffff') => {
    const svg = `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg-hd" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${bgColor}66;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="800" height="600" fill="url(#bg-hd)"/>
        <text x="400" y="300" text-anchor="middle" dominant-baseline="middle" 
              fill="${textColor}" font-family="Arial, sans-serif" font-size="48" font-weight="bold">
          ${text}
        </text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  };

  const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'institution_admin';

  // 模拟学习资源数据
  const mockResources: LearningResource[] = [
    {
      id: '1',
      title: '足球颠球技巧详解',
      description: '详细讲解足球颠球的基本动作要领、练习方法和常见错误',
      type: 'video',
      category: '足球',
      level: 'beginner',
      thumbnailUrl: createDefaultThumbnail('⚽ 足球颠球', '#1890ff'),
      duration: 15,
      fileSize: 120,
      url: 'https://example.com/video1.mp4',
      tags: ['足球', '基础技巧', '颠球', '训练'],
      author: {
        id: '1',
        name: '张教练',
        avatar: createDefaultAvatar('张', '#52c41a')
      },
      status: 'published',
      stats: {
        views: 1245,
        likes: 89,
        favorites: 34,
        downloads: 56,
        rating: 4.6,
        ratingCount: 47
      },
      uploadedAt: '2024-01-15T10:30:00Z',
      publishedAt: '2024-01-16T14:20:00Z'
    },
    {
      id: '2',
      title: '篮球规则详解',
      description: '篮球比赛规则的完整文档，包括场地规格、比赛时间、犯规判罚等内容。',
      type: 'document',
      category: '篮球',
      level: 'intermediate',
      fileSize: 5.2,
      url: 'https://example.com/basketball-rules.pdf',
      tags: ['篮球', '规则', '裁判', '比赛'],
      author: {
        id: '2',
        name: '李老师',
        avatar: createDefaultAvatar('李', '#faad14')
      },
      status: 'published',
      stats: {
        views: 892,
        likes: 67,
        favorites: 45,
        downloads: 234,
        rating: 4.8,
        ratingCount: 34
      },
      uploadedAt: '2024-01-18T09:15:00Z',
      publishedAt: '2024-01-19T11:00:00Z'
    },
    {
      id: '3',
      title: '游泳呼吸技巧音频指导',
      description: '专业游泳教练语音指导游泳时的正确呼吸方法，配合节拍练习。',
      type: 'audio',
      category: '游泳',
      level: 'beginner',
      duration: 8,
      fileSize: 12.5,
      url: 'https://example.com/swimming-breathing.mp3',
      tags: ['游泳', '呼吸', '技巧', '音频指导'],
      author: {
        id: '3',
        name: '王教练',
        avatar: createDefaultAvatar('王', '#1890ff')
      },
      status: 'published',
      stats: {
        views: 567,
        likes: 43,
        favorites: 28,
        downloads: 89,
        rating: 4.4,
        ratingCount: 23
      },
      uploadedAt: '2024-01-20T16:45:00Z',
      publishedAt: '2024-01-21T10:30:00Z'
    },
    {
      id: '4',
      title: '田径起跑姿势示意图',
      description: '标准的田径起跑姿势图解，包括预备、各就各位、起跑等动作要点。',
      type: 'image',
      category: '田径',
      level: 'beginner',
      fileSize: 2.8,
      url: createHighResImage('田径起跑', '#52c41a'),
      tags: ['田径', '起跑', '姿势', '图解'],
      author: {
        id: '4',
        name: '陈老师',
        avatar: createDefaultAvatar('陈', '#722ed1')
      },
      status: 'published',
      stats: {
        views: 734,
        likes: 52,
        favorites: 31,
        downloads: 67,
        rating: 4.5,
        ratingCount: 29
      },
      uploadedAt: '2024-01-17T14:20:00Z',
      publishedAt: '2024-01-18T09:45:00Z'
    },
    {
      id: '5',
      title: '排球发球技术详解',
      description: '全面讲解排球发球的各种技术，包括上手发球、下手发球、跳发球等。',
      type: 'video',
      category: '排球',
      level: 'advanced',
      duration: 25,
      fileSize: 280,
      url: 'https://example.com/volleyball-serve.mp4',
      tags: ['排球', '发球', '技术', '高级'],
      author: {
        id: '2',
        name: '李老师',
        avatar: createDefaultAvatar('李', '#faad14')
      },
      status: 'pending',
      stats: {
        views: 0,
        likes: 0,
        favorites: 0,
        downloads: 0,
        rating: 0,
        ratingCount: 0
      },
      uploadedAt: '2024-01-22T11:30:00Z'
    }
  ];

  // 模拟统计数据
  const mockStats: ResourceStats = {
    totalResources: 156,
    publishedResources: 142,
    pendingReview: 8,
    totalViews: 45678,
    totalDownloads: 8934,
    avgRating: 4.6,
    resourcesByType: {
      video: 67,
      audio: 28,
      document: 45,
      image: 16
    }
  };

  useEffect(() => {
    loadResources();
    if (isTeacherOrAdmin) {
      loadStats();
    }
  }, []);

  const loadResources = async () => {
    setLoading(true);
    setTimeout(() => {
      setResources(mockResources);
      setLoading(false);
    }, 800);
  };

  const loadStats = async () => {
    setTimeout(() => {
      setStats(mockStats);
    }, 500);
  };

  // 获取资源类型图标和颜色
  const getResourceTypeInfo = (type: string) => {
    const typeMap = {
      video: { icon: <VideoCameraOutlined />, color: '#1890ff', name: '视频' },
      audio: { icon: <SoundOutlined />, color: '#52c41a', name: '音频' },
      document: { icon: <FileTextOutlined />, color: '#faad14', name: '文档' },
      image: { icon: <BookOutlined />, color: '#722ed1', name: '图片' }
    };
    return typeMap[type as keyof typeof typeMap] || { 
      icon: <FileTextOutlined />, 
      color: '#8c8c8c', 
      name: '其他' 
    };
  };

  // 获取难度级别信息
  const getLevelInfo = (level: string) => {
    const levelMap = {
      beginner: { color: '#52c41a', name: '初级' },
      intermediate: { color: '#faad14', name: '中级' },
      advanced: { color: '#ff4d4f', name: '高级' }
    };
    return levelMap[level as keyof typeof levelMap] || { 
      color: '#8c8c8c', 
      name: '未知' 
    };
  };

  // 获取状态信息
  const getStatusInfo = (status: string) => {
    const statusMap = {
      draft: { color: '#8c8c8c', name: '草稿' },
      pending: { color: '#faad14', name: '待审核' },
      published: { color: '#52c41a', name: '已发布' },
      rejected: { color: '#ff4d4f', name: '已拒绝' }
    };
    return statusMap[status as keyof typeof statusMap] || { 
      color: '#8c8c8c', 
      name: '未知' 
    };
  };

  // 格式化文件大小
  const formatFileSize = (sizeInMB: number) => {
    if (sizeInMB < 1) {
      return `${(sizeInMB * 1024).toFixed(1)} KB`;
    }
    return `${sizeInMB.toFixed(1)} MB`;
  };

  // 格式化持续时间
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // 处理资源上传
  const handleUpload = async (values: any) => {
    try {
      message.success('资源上传成功，等待审核');
      setUploadModalVisible(false);
      uploadForm.resetFields();
      loadResources();
    } catch (error) {
      message.error('上传失败');
    }
  };

  // 处理资源审核
  const handleReview = async (values: any) => {
    try {
      message.success(`资源${values.action === 'approve' ? '审核通过' : '审核拒绝'}`);
      setReviewModalVisible(false);
      reviewForm.resetFields();
      setSelectedResource(null);
      loadResources();
    } catch (error) {
      message.error('审核失败');
    }
  };

  // 处理资源删除
  const handleDelete = async (resource: LearningResource) => {
    try {
      message.success('资源删除成功');
      loadResources();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 处理资源编辑
  const handleEdit = (resource: LearningResource) => {
    setSelectedResource(resource);
    editForm.setFieldsValue({
      title: resource.title,
      description: resource.description,
      category: resource.category,
      level: resource.level,
      tags: resource.tags
    });
    setEditModalVisible(true);
  };

  // 保存编辑的资源
  const handleSaveEdit = async (values: any) => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 更新本地数据
      const updatedResources = resources.map(r => 
        r.id === selectedResource?.id 
          ? { ...r, ...values, updatedAt: new Date().toISOString() }
          : r
      );
      setResources(updatedResources);
      
      message.success('资源更新成功');
      setEditModalVisible(false);
      editForm.resetFields();
      setSelectedResource(null);
    } catch (error) {
      message.error('更新失败');
    }
  };

  // 筛选资源
  const getFilteredResources = () => {
    return resources.filter(resource => {
      if (filters.type !== 'all' && resource.type !== filters.type) return false;
      if (filters.category !== 'all' && resource.category !== filters.category) return false;
      if (filters.level !== 'all' && resource.level !== filters.level) return false;
      if (filters.status !== 'all' && resource.status !== filters.status) return false;
      return true;
    });
  };

  // 管理表格列
  const managementColumns = [
    {
      title: '资源信息',
      key: 'resource',
      width: 300,
      render: (record: LearningResource) => {
        const typeInfo = getResourceTypeInfo(record.type);
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {record.thumbnailUrl ? (
              <Image
                width={60}
                height={40}
                src={record.thumbnailUrl}
                style={{ marginRight: '12px', borderRadius: '6px' }}
                preview={false}
              />
            ) : (
              <div style={{
                width: '60px',
                height: '40px',
                backgroundColor: `${typeInfo.color}20`,
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px'
              }}>
                <span style={{ color: typeInfo.color, fontSize: '18px' }}>
                  {typeInfo.icon}
                </span>
              </div>
            )}
            <div style={{ flex: 1 }}>
              <Text strong style={{ fontSize: '14px', display: 'block' }}>
                {record.title}
              </Text>
              <Space size="small" style={{ marginTop: '4px' }}>
                <Tag color={typeInfo.color} style={{ fontSize: '10px', padding: '1px 4px' }}>
                  {typeInfo.name}
                </Tag>
                <Tag color="blue" style={{ fontSize: '10px', padding: '1px 4px' }}>
                  {record.category}
                </Tag>
                <Tag color={getLevelInfo(record.level).color} style={{ fontSize: '10px', padding: '1px 4px' }}>
                  {getLevelInfo(record.level).name}
                </Tag>
              </Space>
            </div>
          </div>
        );
      }
    },
    {
      title: '作者',
      key: 'author',
      width: 120,
      render: (record: LearningResource) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            size={28}
            src={record.author.avatar}
            icon={<UserOutlined />}
            style={{ marginRight: '8px' }}
          />
          <Text style={{ fontSize: '12px' }}>{record.author.name}</Text>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const info = getStatusInfo(status);
        return (
          <Tag color={info.color} style={{ fontSize: '11px' }}>
            {info.name}
          </Tag>
        );
      }
    },
    {
      title: '统计',
      key: 'stats',
      width: 120,
      render: (record: LearningResource) => (
        <div>
          <div style={{ fontSize: '11px', marginBottom: '2px' }}>
            <EyeOutlined style={{ marginRight: '4px' }} />
            {record.stats.views}
          </div>
          <div style={{ fontSize: '11px', marginBottom: '2px' }}>
            <HeartOutlined style={{ marginRight: '4px' }} />
            {record.stats.likes}
          </div>
          <div style={{ fontSize: '11px' }}>
            <DownloadOutlined style={{ marginRight: '4px' }} />
            {record.stats.downloads}
          </div>
        </div>
      )
    },
    {
      title: '上传时间',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      width: 120,
      render: (date: string) => (
        <Text style={{ fontSize: '12px' }}>
          {new Date(date).toLocaleDateString()}
        </Text>
      ),
      sorter: (a: LearningResource, b: LearningResource) => 
        new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime(),
      defaultSortOrder: 'descend' as const
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (record: LearningResource) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedResource(record);
                setDetailDrawerVisible(true);
              }}
            />
          </Tooltip>
          {record.status === 'pending' && (
            <Tooltip title="审核">
              <Button
                type="text"
                size="small"
                icon={<AuditOutlined />}
                onClick={() => {
                  setSelectedResource(record);
                  setReviewModalVisible(true);
                }}
              />
            </Tooltip>
          )}
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定删除此资源吗？"
              onConfirm={() => handleDelete(record)}
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

  const filteredResources = getFilteredResources();

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
                <BookOutlined style={{ fontSize: '20px', color: primaryColor }} />
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
                  知识学习
                </Title>
                <Text type="secondary" style={{ fontSize: '16px', marginLeft: '2px' }}>
                  多媒体学习资源中心
                </Text>
              </div>
            </div>
          </div>
          {isTeacherOrAdmin && (
            <Button
              type="primary"
              icon={<UploadOutlined />}
              onClick={() => setUploadModalVisible(true)}
              style={{
                borderRadius: '8px',
                height: '40px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              上传资源
            </Button>
          )}
        </div>
      </div>

      {/* 统计卡片区域 - 仅教师和管理员可见 */}
      {isTeacherOrAdmin && stats && (
        <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
          <Col xs={12} sm={8} lg={6}>
            <div className="stats-card modern-card animate-slideUp">
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
                  {stats.totalResources}
                </div>
                <div className="stats-label">总资源数</div>
                <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                  已发布: {stats.publishedResources}
                </div>
              </div>
            </div>
          </Col>
          <Col xs={12} sm={8} lg={6}>
            <div className="stats-card modern-card animate-slideUp" style={{ animationDelay: '0.1s' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #faad1415 0%, #faad1405 100%)',
                borderRadius: '12px',
                padding: '20px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <AuditOutlined style={{ 
                  fontSize: '24px', 
                  color: '#faad14', 
                  marginBottom: '12px'
                }} />
                <div className="stats-number" style={{ color: '#faad14' }}>
                  {stats.pendingReview}
                </div>
                <div className="stats-label">待审核</div>
                <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                  需要处理
                </div>
              </div>
            </div>
          </Col>
          <Col xs={12} sm={8} lg={6}>
            <div className="stats-card modern-card animate-slideUp" style={{ animationDelay: '0.2s' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #52c41a15 0%, #52c41a05 100%)',
                borderRadius: '12px',
                padding: '20px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <EyeOutlined style={{ 
                  fontSize: '24px', 
                  color: '#52c41a', 
                  marginBottom: '12px'
                }} />
                <div className="stats-number" style={{ color: '#52c41a' }}>
                  {(stats.totalViews / 1000).toFixed(1)}K
                </div>
                <div className="stats-label">总浏览量</div>
                <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                  下载: {(stats.totalDownloads / 1000).toFixed(1)}K
                </div>
              </div>
            </div>
          </Col>
          <Col xs={12} sm={8} lg={6}>
            <div className="stats-card modern-card animate-slideUp" style={{ animationDelay: '0.3s' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #722ed115 0%, #722ed105 100%)',
                borderRadius: '12px',
                padding: '20px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <StarOutlined style={{ 
                  fontSize: '24px', 
                  color: '#722ed1', 
                  marginBottom: '12px'
                }} />
                <div className="stats-number" style={{ color: '#722ed1' }}>
                  {stats.avgRating.toFixed(1)}
                </div>
                <div className="stats-label">平均评分</div>
                <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: '4px' }}>
                  用户评价
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
                <GlobalOutlined style={{ marginRight: '8px' }} />
                资源浏览
              </span>
            } 
            key="browse"
          >
            <div style={{ padding: '24px' }}>
              {/* 筛选区域 */}
              <div style={{ marginBottom: '24px' }}>
                <Row gutter={16} align="middle">
                  <Col span={6}>
                    <Select
                      value={filters.type}
                      onChange={(value) => setFilters({ ...filters, type: value })}
                      style={{ width: '100%' }}
                      placeholder="资源类型"
                    >
                      <Option value="all">全部类型</Option>
                      <Option value="video">视频</Option>
                      <Option value="audio">音频</Option>
                      <Option value="document">文档</Option>
                      <Option value="image">图片</Option>
                    </Select>
                  </Col>
                  <Col span={6}>
                    <Select
                      value={filters.category}
                      onChange={(value) => setFilters({ ...filters, category: value })}
                      style={{ width: '100%' }}
                      placeholder="运动分类"
                    >
                      <Option value="all">全部分类</Option>
                      <Option value="足球">足球</Option>
                      <Option value="篮球">篮球</Option>
                      <Option value="游泳">游泳</Option>
                      <Option value="田径">田径</Option>
                      <Option value="排球">排球</Option>
                    </Select>
                  </Col>
                  <Col span={6}>
                    <Select
                      value={filters.level}
                      onChange={(value) => setFilters({ ...filters, level: value })}
                      style={{ width: '100%' }}
                      placeholder="难度级别"
                    >
                      <Option value="all">全部级别</Option>
                      <Option value="beginner">初级</Option>
                      <Option value="intermediate">中级</Option>
                      <Option value="advanced">高级</Option>
                    </Select>
                  </Col>
                  <Col span={6}>
                    <Search
                      placeholder="搜索资源..."
                      allowClear
                      style={{ width: '100%' }}
                      onSearch={(value) => console.log(value)}
                    />
                  </Col>
                </Row>
              </div>

              {/* 资源列表 */}
              <Row gutter={[16, 16]}>
                {filteredResources.map((resource) => {
                  const typeInfo = getResourceTypeInfo(resource.type);
                  const levelInfo = getLevelInfo(resource.level);
                  
                  return (
                    <Col xs={24} sm={12} lg={8} xl={6} key={resource.id}>
                      <div 
                        className="modern-card"
                        style={{
                          height: '300px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          border: `1px solid ${isDark ? '#404040' : '#e2e8f0'}`,
                          borderRadius: '12px',
                          overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)';
                          e.currentTarget.style.boxShadow = `0 8px 24px ${primaryColor}20`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                        onClick={() => {
                          setSelectedResource(resource);
                          setDetailDrawerVisible(true);
                        }}
                      >
                        {/* 缩略图 */}
                        <div style={{ 
                          height: '120px',
                          position: 'relative',
                          background: resource.thumbnailUrl ? 'none' : `linear-gradient(135deg, ${typeInfo.color}20 0%, ${typeInfo.color}10 100%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {resource.thumbnailUrl ? (
                            <img
                              src={resource.thumbnailUrl}
                              alt={resource.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <span style={{ fontSize: '32px', color: typeInfo.color }}>
                              {typeInfo.icon}
                            </span>
                          )}
                          
                          {/* 类型标签 */}
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            left: '8px',
                            background: 'rgba(0, 0, 0, 0.7)',
                            color: '#ffffff',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {typeInfo.icon}
                            {typeInfo.name}
                          </div>

                          {/* 时长/大小 */}
                          {(resource.duration || resource.fileSize) && (
                            <div style={{
                              position: 'absolute',
                              bottom: '8px',
                              right: '8px',
                              background: 'rgba(0, 0, 0, 0.7)',
                              color: '#ffffff',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px'
                            }}>
                              {resource.duration ? formatDuration(resource.duration) : formatFileSize(resource.fileSize!)}
                            </div>
                          )}
                        </div>

                        {/* 内容区域 */}
                        <div style={{ padding: '12px' }}>
                          <div style={{ marginBottom: '8px' }}>
                            <Text strong style={{ fontSize: '14px', lineHeight: '1.4' }}>
                              {resource.title}
                            </Text>
                          </div>
                          
                          <div style={{ marginBottom: '8px' }}>
                            <Text 
                              type="secondary" 
                              style={{ 
                                fontSize: '12px', 
                                lineHeight: '1.4',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden'
                              }}
                            >
                              {resource.description}
                            </Text>
                          </div>

                          <div style={{ marginBottom: '8px' }}>
                            <Space size="small">
                              <Tag color={typeInfo.color} style={{ fontSize: '10px', padding: '1px 4px' }}>
                                {resource.category}
                              </Tag>
                              <Tag color={levelInfo.color} style={{ fontSize: '10px', padding: '1px 4px' }}>
                                {levelInfo.name}
                              </Tag>
                            </Space>
                          </div>

                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            fontSize: '11px',
                            color: '#8c8c8c'
                          }}>
                            <Space size="small">
                              <span><EyeOutlined /> {resource.stats.views}</span>
                              <span><HeartOutlined /> {resource.stats.likes}</span>
                            </Space>
                            <Rate
                              disabled
                              value={resource.stats.rating}
                              style={{ fontSize: '10px' }}
                            />
                          </div>

                          <div style={{ 
                            marginTop: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '11px',
                            color: '#8c8c8c'
                          }}>
                            <Avatar 
                              size={16}
                              src={resource.author.avatar}
                              icon={<UserOutlined />}
                              style={{ marginRight: '4px' }}
                            />
                            {resource.author.name}
                          </div>
                        </div>
                      </div>
                    </Col>
                  );
                })}
              </Row>

              {filteredResources.length === 0 && (
                <Empty
                  description="暂无资源"
                  style={{ margin: '40px 0' }}
                />
              )}
            </div>
          </TabPane>

          {isTeacherOrAdmin && (
            <TabPane 
              tab={
                <span style={{ fontSize: '16px', fontWeight: '500' }}>
                  <EditOutlined style={{ marginRight: '8px' }} />
                  资源管理
                  {stats && stats.pendingReview > 0 && (
                    <Badge 
                      count={stats.pendingReview} 
                      style={{ 
                        marginLeft: '8px',
                        background: '#faad14'
                      }} 
                    />
                  )}
                </span>
              } 
              key="management"
            >
              <div style={{ padding: '24px' }}>
                {/* 状态筛选 */}
                <div style={{ marginBottom: '16px' }}>
                  <Space>
                    <Select
                      value={filters.status}
                      onChange={(value) => setFilters({ ...filters, status: value })}
                      style={{ width: 120 }}
                    >
                      <Option value="all">全部状态</Option>
                      <Option value="draft">草稿</Option>
                      <Option value="pending">待审核</Option>
                      <Option value="published">已发布</Option>
                      <Option value="rejected">已拒绝</Option>
                    </Select>
                    <Select
                      value={filters.type}
                      onChange={(value) => setFilters({ ...filters, type: value })}
                      style={{ width: 120 }}
                    >
                      <Option value="all">全部类型</Option>
                      <Option value="video">视频</Option>
                      <Option value="audio">音频</Option>
                      <Option value="document">文档</Option>
                      <Option value="image">图片</Option>
                    </Select>
                  </Space>
                </div>

                <Table
                  columns={managementColumns}
                  dataSource={filteredResources}
                  rowKey="id"
                  loading={loading}
                  size="middle"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                  }}
                />
              </div>
            </TabPane>
          )}
        </Tabs>
      </div>

      {/* 资源上传模态框 */}
      <Modal
        title="上传学习资源"
        open={uploadModalVisible}
        onCancel={() => {
          setUploadModalVisible(false);
          uploadForm.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={uploadForm}
          layout="vertical"
          onFinish={handleUpload}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="资源标题"
                name="title"
                rules={[{ required: true, message: '请输入资源标题' }]}
              >
                <Input placeholder="请输入资源标题" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="资源类型"
                name="type"
                rules={[{ required: true, message: '请选择资源类型' }]}
              >
                <Select placeholder="请选择资源类型">
                  <Option value="video">视频</Option>
                  <Option value="audio">音频</Option>
                  <Option value="document">文档</Option>
                  <Option value="image">图片</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="运动分类"
                name="category"
                rules={[{ required: true, message: '请选择运动分类' }]}
              >
                <Select placeholder="请选择运动分类">
                  <Option value="足球">足球</Option>
                  <Option value="篮球">篮球</Option>
                  <Option value="游泳">游泳</Option>
                  <Option value="田径">田径</Option>
                  <Option value="排球">排球</Option>
                  <Option value="乒乓球">乒乓球</Option>
                  <Option value="体操">体操</Option>
                  <Option value="健身">健身</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="难度级别"
                name="level"
                rules={[{ required: true, message: '请选择难度级别' }]}
              >
                <Select placeholder="请选择难度级别">
                  <Option value="beginner">初级</Option>
                  <Option value="intermediate">中级</Option>
                  <Option value="advanced">高级</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="时长（分钟）"
                name="duration"
              >
                <Input type="number" placeholder="视频/音频时长" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="资源描述"
            name="description"
            rules={[{ required: true, message: '请输入资源描述' }]}
          >
            <TextArea rows={3} placeholder="请详细描述学习资源的内容和要点" />
          </Form.Item>

          <Form.Item
            label="标签"
            name="tags"
          >
            <Select
              mode="tags"
              placeholder="添加标签（按回车确认）"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            label="上传文件"
            name="file"
            rules={[{ required: true, message: '请上传文件' }]}
          >
            <Dragger
              name="file"
              multiple={false}
              action="/api/upload"
              beforeUpload={() => false}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
              <p className="ant-upload-hint">
                支持视频(MP4/AVI)、音频(MP3/WAV)、文档(PDF/DOC)、图片(JPG/PNG)格式
              </p>
            </Dragger>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button 
                onClick={() => {
                  setUploadModalVisible(false);
                  uploadForm.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                上传资源
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 资源审核模态框 */}
      <Modal
        title="资源审核"
        open={reviewModalVisible}
        onCancel={() => {
          setReviewModalVisible(false);
          reviewForm.resetFields();
          setSelectedResource(null);
        }}
        footer={null}
        width={600}
      >
        {selectedResource && (
          <div>
            <Alert
              message={`审核资源: ${selectedResource.title}`}
              description={`作者: ${selectedResource.author.name} | 类型: ${getResourceTypeInfo(selectedResource.type).name} | 分类: ${selectedResource.category}`}
              type="info"
              showIcon
              style={{ marginBottom: '20px' }}
            />

            <Form
              form={reviewForm}
              layout="vertical"
              onFinish={handleReview}
            >
              <Form.Item
                label="审核结果"
                name="action"
                rules={[{ required: true, message: '请选择审核结果' }]}
              >
                <Radio.Group>
                  <Radio value="approve">通过审核</Radio>
                  <Radio value="reject">拒绝审核</Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                label="审核意见"
                name="comment"
              >
                <TextArea 
                  rows={4} 
                  placeholder="请输入审核意见（可选）"
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Space>
                  <Button 
                    onClick={() => {
                      setReviewModalVisible(false);
                      reviewForm.resetFields();
                      setSelectedResource(null);
                    }}
                  >
                    取消
                  </Button>
                  <Button type="primary" htmlType="submit">
                    提交审核
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* 资源编辑模态框 */}
      <Modal
        title="编辑资源"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          editForm.resetFields();
          setSelectedResource(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleSaveEdit}
        >
          <Form.Item
            label="资源标题"
            name="title"
            rules={[{ required: true, message: '请输入资源标题' }]}
          >
            <Input placeholder="请输入资源标题" />
          </Form.Item>

          <Form.Item
            label="资源描述"
            name="description"
            rules={[{ required: true, message: '请输入资源描述' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="请详细描述资源内容和特点"
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="资源分类"
                name="category"
                rules={[{ required: true, message: '请选择资源分类' }]}
              >
                <Select placeholder="请选择分类">
                  <Select.Option value="足球">足球</Select.Option>
                  <Select.Option value="篮球">篮球</Select.Option>
                  <Select.Option value="游泳">游泳</Select.Option>
                  <Select.Option value="网球">网球</Select.Option>
                  <Select.Option value="田径">田径</Select.Option>
                  <Select.Option value="体操">体操</Select.Option>
                  <Select.Option value="健身">健身</Select.Option>
                  <Select.Option value="其他">其他</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="难度级别"
                name="level"
                rules={[{ required: true, message: '请选择难度级别' }]}
              >
                <Select placeholder="请选择难度">
                  <Select.Option value="beginner">初级</Select.Option>
                  <Select.Option value="intermediate">中级</Select.Option>
                  <Select.Option value="advanced">高级</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="标签"
            name="tags"
          >
            <Select
              mode="tags"
              placeholder="添加标签，按回车确认"
              tokenSeparators={[',']}
            >
              <Select.Option value="技术训练">技术训练</Select.Option>
              <Select.Option value="战术分析">战术分析</Select.Option>
              <Select.Option value="体能训练">体能训练</Select.Option>
              <Select.Option value="理论知识">理论知识</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button 
                onClick={() => {
                  setEditModalVisible(false);
                  editForm.resetFields();
                  setSelectedResource(null);
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                保存更改
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 资源详情抽屉 */}
      <Drawer
        title="资源详情"
        placement="right"
        onClose={() => setDetailDrawerVisible(false)}
        open={detailDrawerVisible}
        width={600}
      >
        {selectedResource && (
          <div>
            {/* 资源信息 */}
            <Card size="small" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '16px' }}>
                {selectedResource.thumbnailUrl ? (
                  <Image
                    width={120}
                    height={80}
                    src={selectedResource.thumbnailUrl}
                    style={{ marginRight: '16px', borderRadius: '8px' }}
                  />
                ) : (
                  <div style={{
                    width: '120px',
                    height: '80px',
                    backgroundColor: `${getResourceTypeInfo(selectedResource.type).color}20`,
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '16px'
                  }}>
                    <span style={{ 
                      color: getResourceTypeInfo(selectedResource.type).color, 
                      fontSize: '32px' 
                    }}>
                      {getResourceTypeInfo(selectedResource.type).icon}
                    </span>
                  </div>
                )}
                
                <div style={{ flex: 1 }}>
                  <Title level={4} style={{ marginBottom: '8px' }}>
                    {selectedResource.title}
                  </Title>
                  <Space wrap style={{ marginBottom: '8px' }}>
                    <Tag color={getResourceTypeInfo(selectedResource.type).color}>
                      {getResourceTypeInfo(selectedResource.type).name}
                    </Tag>
                    <Tag color="blue">{selectedResource.category}</Tag>
                    <Tag color={getLevelInfo(selectedResource.level).color}>
                      {getLevelInfo(selectedResource.level).name}
                    </Tag>
                    <Tag color={getStatusInfo(selectedResource.status).color}>
                      {getStatusInfo(selectedResource.status).name}
                    </Tag>
                  </Space>
                  <Paragraph style={{ fontSize: '14px', marginBottom: '8px' }}>
                    {selectedResource.description}
                  </Paragraph>
                </div>
              </div>

              {/* 统计信息 */}
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic 
                    title="浏览量" 
                    value={selectedResource.stats.views}
                    prefix={<EyeOutlined />}
                    valueStyle={{ fontSize: '16px' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic 
                    title="点赞数" 
                    value={selectedResource.stats.likes}
                    prefix={<HeartOutlined />}
                    valueStyle={{ fontSize: '16px' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic 
                    title="收藏数" 
                    value={selectedResource.stats.favorites}
                    prefix={<StarOutlined />}
                    valueStyle={{ fontSize: '16px' }}
                  />
                </Col>
                <Col span={6}>
                  <Statistic 
                    title="下载量" 
                    value={selectedResource.stats.downloads}
                    prefix={<DownloadOutlined />}
                    valueStyle={{ fontSize: '16px' }}
                  />
                </Col>
              </Row>
            </Card>

            {/* 作者信息 */}
            <Card title="作者信息" size="small" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  size={48}
                  src={selectedResource.author.avatar}
                  icon={<UserOutlined />}
                  style={{ marginRight: '12px' }}
                />
                <div>
                  <Text strong style={{ fontSize: '16px' }}>
                    {selectedResource.author.name}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    上传时间: {new Date(selectedResource.uploadedAt).toLocaleString()}
                  </Text>
                </div>
              </div>
            </Card>

            {/* 资源详情 */}
            <Card title="资源详情" size="small" style={{ marginBottom: '16px' }}>
              <Row gutter={[16, 8]}>
                {selectedResource.duration && (
                  <Col span={12}>
                    <Text>时长: </Text>
                    <Text strong>{formatDuration(selectedResource.duration)}</Text>
                  </Col>
                )}
                {selectedResource.fileSize && (
                  <Col span={12}>
                    <Text>大小: </Text>
                    <Text strong>{formatFileSize(selectedResource.fileSize)}</Text>
                  </Col>
                )}
                <Col span={12}>
                  <Text>评分: </Text>
                  <Rate disabled value={selectedResource.stats.rating} style={{ fontSize: '14px' }} />
                  <Text style={{ marginLeft: '8px' }}>
                    ({selectedResource.stats.ratingCount})
                  </Text>
                </Col>
              </Row>
            </Card>

            {/* 标签 */}
            {selectedResource.tags.length > 0 && (
              <Card title="标签" size="small" style={{ marginBottom: '16px' }}>
                <Space wrap>
                  {selectedResource.tags.map((tag, index) => (
                    <Tag key={index} color="blue">{tag}</Tag>
                  ))}
                </Space>
              </Card>
            )}

            {/* 操作按钮 */}
            <div style={{ textAlign: 'center' }}>
              <Space>
                <Button type="primary" icon={<PlayCircleOutlined />}>
                  开始学习
                </Button>
                <Button icon={<HeartOutlined />}>
                  点赞
                </Button>
                <Button icon={<StarOutlined />}>
                  收藏
                </Button>
                <Button icon={<DownloadOutlined />}>
                  下载
                </Button>
                <Button icon={<ShareAltOutlined />}>
                  分享
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default LearningResources; 