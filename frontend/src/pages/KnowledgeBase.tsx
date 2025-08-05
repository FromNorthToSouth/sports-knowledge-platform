import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Button, Tabs, Tree, Table, Modal, Form, Input, Select, 
  Typography, Space, Tag, Tooltip, Badge, Avatar, Progress, Statistic,
  Upload, message, Drawer, Timeline, List, Empty, Popconfirm, Switch,
  Radio, Divider, Alert, Steps, Collapse, Rate, Image, Spin, Checkbox,
  InputNumber, notification
} from 'antd';
import {
  BookOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  FolderOutlined, FileOutlined, ShareAltOutlined, SettingOutlined,
  UserOutlined, BarChartOutlined, ClockCircleOutlined, CheckCircleOutlined,
  PlayCircleOutlined, DownloadOutlined, StarOutlined, CommentOutlined,
  BulbOutlined, NodeIndexOutlined, LinkOutlined, TeamOutlined,
  RocketOutlined, TrophyOutlined, FireOutlined, ThunderboltOutlined,
  HeartOutlined, GiftOutlined, CrownOutlined, AimOutlined,
  UploadOutlined, InboxOutlined, FileImageOutlined, VideoCameraOutlined,
  AudioOutlined, FilePdfOutlined, FileTextOutlined, BlockOutlined,
  RobotOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useTheme } from '../hooks/useTheme';
import api from '../services/api';
import '../styles/modern-theme.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Panel } = Collapse;
const { Step } = Steps;
const { Dragger } = Upload;

interface KnowledgeBase {
  id: string;
  title: string;
  description: string;
  cover?: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  status: 'draft' | 'published' | 'archived';
  isPublic: boolean;
  tags: string[];
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  contents?: KnowledgeBaseContent[]; // 添加内容字段
  stats: {
    knowledgePoints: number;
    resources: number;
    learners: number;
    completionRate: number;
    avgRating: number;
    totalViews: number;
    totalContentSize?: number;
    totalContentDuration?: number;
  };
  settings?: {
    allowDownload?: boolean;
    maxFileSize?: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface KnowledgePoint {
  id: string;
  title: string;
  description: string;
  type: 'concept' | 'skill' | 'practice' | 'assessment';
  parentId?: string;
  children?: KnowledgePoint[];
  resources: string[];
  prerequisites: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // 预计学习时间（分钟）
  completed: boolean;
  progress: number;
  order: number;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  knowledgePoints: string[];
  estimatedDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[];
  objectives: string[];
}

interface KnowledgeBaseContent {
  type: 'document' | 'video' | 'audio' | '3d_animation' | 'image' | 'presentation';
  fileId: string;
  filename: string;
  originalName: string;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl?: string;
  size: number;
  uploadedAt: string;
  order: number;
  tags: string[];
  isRequired: boolean;
  estimatedDuration?: number;
  metadata?: {
    duration?: number;
    bitrate?: number;
    format?: string;
    width?: number;
    height?: number;
    pageCount?: number;
    frameCount?: number;
    fps?: number;
    vertices?: number;
    faces?: number;
  };
}

const KnowledgeBase: React.FC = () => {
  // 状态管理
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [selectedKB, setSelectedKB] = useState<KnowledgeBase | null>(null);
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);

  // 弹窗控制
  const [createKBModalVisible, setCreateKBModalVisible] = useState(false);
  const [createKPModalVisible, setCreateKPModalVisible] = useState(false);
  const [createPathModalVisible, setCreatePathModalVisible] = useState(false);
  const [editKBModalVisible, setEditKBModalVisible] = useState(false);
  const [viewKBModalVisible, setViewKBModalVisible] = useState(false);
  const [editingKB, setEditingKB] = useState<KnowledgeBase | null>(null);
  const [settingsDrawerVisible, setSettingsDrawerVisible] = useState(false);
  const [analyticsDrawerVisible, setAnalyticsDrawerVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);

  // 内容创建相关状态
  const [contentCreationType, setContentCreationType] = useState<'upload' | 'ai' | 'url'>('upload'); // 内容创建方式
  const [uploadFiles, setUploadFiles] = useState<any[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadingKB, setUploadingKB] = useState<string | null>(null);
  
  // AI生成相关状态
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiRequirements, setAiRequirements] = useState('');
  const [aiContentType, setAiContentType] = useState<'text' | 'quiz' | 'guide'>('text');
  
  // 网址输入相关状态
  const [urlInput, setUrlInput] = useState('');
  const [urlFetching, setUrlFetching] = useState(false);
  const [fetchedUrlContent, setFetchedUrlContent] = useState<any>(null);

  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [aiKnowledgePointModalVisible, setAIKnowledgePointModalVisible] = useState(false);
  const [aiLearningPathModalVisible, setAILearningPathModalVisible] = useState(false);

  const [createKBForm] = Form.useForm();
  const [createKPForm] = Form.useForm();
  const [createPathForm] = Form.useForm();
  const [editKBForm] = Form.useForm();

  const { user } = useSelector((state: RootState) => state.auth);
  const { isDark, primaryColor } = useTheme();

  // 模拟知识库数据
  const mockKnowledgeBases: KnowledgeBase[] = [
    {
      id: '1',
      title: '足球基础技能训练',
      description: '从零开始学习足球基本技能，包括颠球、传球、射门等核心技术动作的完整训练体系。',
      cover: undefined, // 使用分类图标替代
      category: '足球',
      level: 'beginner',
      status: 'published',
      isPublic: true,
      tags: ['足球', '基础训练', '技能', '体育'],
      author: {
        id: user?.id || '1',
        name: user?.username || '张教练',
        avatar: undefined // 简化头像显示
      },
      stats: {
        knowledgePoints: 24,
        resources: 18,
        learners: 156,
        completionRate: 78,
        avgRating: 4.6,
        totalViews: 2341
      },
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-20T14:20:00Z'
    },
    {
      id: '2',
      title: '篮球进阶技术',
      description: '面向有一定基础的学员，深入学习篮球高级技术，包括变向运球、投篮技巧、战术配合等。',
      cover: undefined, // 使用分类图标替代
      category: '篮球',
      level: 'intermediate',
      status: 'published',
      isPublic: false,
      tags: ['篮球', '进阶', '技术', '战术'],
      author: {
        id: user?.id || '1',
        name: user?.username || '张教练', 
        avatar: undefined // 简化头像显示
      },
      stats: {
        knowledgePoints: 32,
        resources: 28,
        learners: 89,
        completionRate: 65,
        avgRating: 4.8,
        totalViews: 1567
      },
      createdAt: '2024-01-18T09:15:00Z',
      updatedAt: '2024-01-22T16:45:00Z'
    },
    {
      id: '3',
      title: '游泳安全与技能',
      description: '全面的游泳教学知识库，涵盖水中安全、基础泳姿、呼吸技巧等核心内容。',
      cover: undefined, // 使用分类图标替代
      category: '游泳',
      level: 'beginner',
      status: 'draft',
      isPublic: true,
      tags: ['游泳', '安全', '泳姿', '呼吸'],
      author: {
        id: user?.id || '1',
        name: user?.username || '张教练',
        avatar: undefined // 简化头像显示
      },
      stats: {
        knowledgePoints: 16,
        resources: 12,
        learners: 0,
        completionRate: 0,
        avgRating: 0,
        totalViews: 0
      },
      createdAt: '2024-01-22T11:30:00Z',
      updatedAt: '2024-01-22T11:30:00Z'
    }
  ];

  // 模拟知识点数据
  const mockKnowledgePoints: KnowledgePoint[] = [
    {
      id: '1',
      title: '足球基础知识',
      description: '了解足球运动的基本规则、场地设施和装备要求',
      type: 'concept',
      resources: ['1', '2'],
      prerequisites: [],
      difficulty: 'easy',
      estimatedTime: 30,
      completed: true,
      progress: 100,
      order: 1,
      children: [
        {
          id: '1-1',
          title: '足球规则详解',
          description: '详细学习足球比赛的各项规则',
          type: 'concept',
          parentId: '1',
          resources: ['1'],
          prerequisites: [],
          difficulty: 'easy',
          estimatedTime: 20,
          completed: true,
          progress: 100,
          order: 1
        },
        {
          id: '1-2',
          title: '场地与装备',
          description: '认识足球场地标准和基本装备',
          type: 'concept',
          parentId: '1',
          resources: ['2'],
          prerequisites: [],
          difficulty: 'easy',
          estimatedTime: 10,
          completed: true,
          progress: 100,
          order: 2
        }
      ]
    },
    {
      id: '2',
      title: '颠球技术',
      description: '掌握足球颠球的基本动作和练习方法',
      type: 'skill',
      resources: ['3', '4'],
      prerequisites: ['1'],
      difficulty: 'medium',
      estimatedTime: 60,
      completed: false,
      progress: 45,
      order: 2,
      children: [
        {
          id: '2-1',
          title: '脚背颠球',
          description: '学习用脚背进行颠球的技术要领',
          type: 'skill',
          parentId: '2',
          resources: ['3'],
          prerequisites: ['1-1'],
          difficulty: 'medium',
          estimatedTime: 30,
          completed: false,
          progress: 60,
          order: 1
        },
        {
          id: '2-2',
          title: '脚内侧颠球',
          description: '掌握脚内侧颠球的动作技巧',
          type: 'skill',
          parentId: '2',
          resources: ['4'],
          prerequisites: ['2-1'],
          difficulty: 'medium',
          estimatedTime: 30,
          completed: false,
          progress: 30,
          order: 2
        }
      ]
    },
    {
      id: '3',
      title: '实战练习',
      description: '通过实际练习巩固所学技能',
      type: 'practice',
      resources: ['5'],
      prerequisites: ['2'],
      difficulty: 'hard',
      estimatedTime: 90,
      completed: false,
      progress: 0,
      order: 3
    }
  ];

  // 模拟学习路径数据
  const mockLearningPaths: LearningPath[] = [
    {
      id: '1',
      title: '新手入门路径',
      description: '适合零基础学员的完整学习路径',
      knowledgePoints: ['1', '2', '3'],
      estimatedDuration: 180,
      difficulty: 'beginner',
      prerequisites: [],
      objectives: [
        '掌握足球基本规则',
        '学会基础颠球技术',
        '能够进行简单的实战练习'
      ]
    },
    {
      id: '2',
      title: '技能强化路径',
      description: '针对已有基础的学员进行技能提升',
      knowledgePoints: ['2', '3'],
      estimatedDuration: 120,
      difficulty: 'intermediate',
      prerequisites: ['1'],
      objectives: [
        '精通各种颠球技术',
        '提高实战应用能力'
      ]
    }
  ];

  useEffect(() => {
    loadKnowledgeBases();
  }, []);

  const loadKnowledgeBases = async () => {
    setLoading(true);
    try {
      // 调用真实的API获取知识库列表
      const response = await api.get('/knowledge-bases');
      
      if (response.data.success) {
        setKnowledgeBases(response.data.data.knowledgeBases || []);
        
        // 如果有知识库，选择第一个作为当前选中的
        if (response.data.data.knowledgeBases && response.data.data.knowledgeBases.length > 0) {
          setSelectedKB(response.data.data.knowledgeBases[0]);
        }
      } else {
        console.error('获取知识库列表失败:', response.data.message);
        // 如果API失败，回退到模拟数据
        setKnowledgeBases(mockKnowledgeBases);
        setSelectedKB(mockKnowledgeBases[0]);
      }
      
      // 暂时仍使用模拟数据的知识点和学习路径
      setKnowledgePoints(mockKnowledgePoints);
      setLearningPaths(mockLearningPaths);
      
    } catch (error) {
      console.error('加载知识库数据失败:', error);
      // 发生错误时使用模拟数据
      setKnowledgeBases(mockKnowledgeBases);
      setKnowledgePoints(mockKnowledgePoints);
      setLearningPaths(mockLearningPaths);
      if (mockKnowledgeBases.length > 0) {
        setSelectedKB(mockKnowledgeBases[0]);
      }
      
      message.error('加载知识库数据失败，显示离线数据');
    } finally {
      setLoading(false);
    }
  };

  // 创建知识库
  const handleCreateKB = async (values: any) => {
    try {
      // 使用统一的API服务创建知识库
      const response = await api.post('/knowledge-bases', values);

      if (response.data.success) {
        message.success('知识库创建成功');
        
        const knowledgeBaseId = response.data.data.id || response.data.data._id;
        
        // 根据内容创建方式处理不同的内容
        switch (contentCreationType) {
          case 'upload':
            if (uploadFiles.length > 0) {
              await handleFileUpload(knowledgeBaseId);
            }
            break;
            
          case 'ai':
            if (aiTopic) {
              await handleAIGeneration(knowledgeBaseId);
            }
            break;
            
          case 'url':
            if (urlInput && fetchedUrlContent) {
              await handleUrlContent(knowledgeBaseId);
            }
            break;
        }
        
        // 重置表单和状态
        setCreateKBModalVisible(false);
        createKBForm.resetFields();
        resetContentCreationState();
        loadKnowledgeBases();
      } else {
        throw new Error(response.data.message || '创建失败');
      }
    } catch (error: any) {
      console.error('创建知识库失败:', error);
      message.error('创建失败: ' + (error.response?.data?.message || error.message));
    }
  };

  // 重置内容创建相关状态
  const resetContentCreationState = () => {
    setUploadFiles([]);
    setAiTopic('');
    setAiRequirements('');
    setAiContentType('text');
    setUrlInput('');
    setFetchedUrlContent(null);
    setContentCreationType('upload');
  };

  // AI内容生成处理
  const handleAIGeneration = async (knowledgeBaseId: string) => {
    setAiGenerating(true);
    try {
      const response = await api.post(`/knowledge-bases/${knowledgeBaseId}/ai-generate`, {
        topic: aiTopic,
        requirements: aiRequirements,
        contentType: aiContentType,
        difficulty: createKBForm.getFieldValue('level') || 'beginner',
        category: createKBForm.getFieldValue('category')
      });

      if (response.data.success) {
        notification.success({
          message: 'AI内容生成成功',
          description: `已为知识库生成${aiContentType === 'text' ? '知识文档' : aiContentType === 'quiz' ? '练习题目' : '教学指南'}内容`
        });
      } else {
        throw new Error(response.data.message || 'AI生成失败');
      }
    } catch (error: any) {
      console.error('AI内容生成失败:', error);
      notification.error({
        message: 'AI生成失败',
        description: error.response?.data?.message || error.message || '生成过程中发生错误'
      });
    } finally {
      setAiGenerating(false);
    }
  };

  // 网址内容处理
  const handleUrlContent = async (knowledgeBaseId: string) => {
    try {
      const response = await api.post(`/knowledge-bases/${knowledgeBaseId}/url-import`, {
        url: urlInput,
        extractOptions: {
          extractText: true,
          extractImages: false,
          extractVideos: false,
          aiSummary: false
        },
        fetchedContent: fetchedUrlContent
      });

      if (response.data.success) {
        notification.success({
          message: '网址内容导入成功',
          description: `已成功导入 ${fetchedUrlContent.title} 的内容`
        });
      } else {
        throw new Error(response.data.message || '网址导入失败');
      }
    } catch (error: any) {
      console.error('网址内容导入失败:', error);
      notification.error({
        message: '导入失败',
        description: error.response?.data?.message || error.message || '导入过程中发生错误'
      });
    }
  };

  // 创建知识点
  const handleCreateKP = async (values: any) => {
    try {
      message.success('知识点创建成功');
      setCreateKPModalVisible(false);
      createKPForm.resetFields();
    } catch (error) {
      message.error('创建失败');
    }
  };

  // 创建学习路径
  const handleCreatePath = async (values: any) => {
    try {
      message.success('学习路径创建成功');
      setCreatePathModalVisible(false);
      createPathForm.resetFields();
    } catch (error) {
      message.error('创建失败');
    }
  };

  // 编辑知识库
  const handleEditKB = (record: KnowledgeBase) => {
    setEditingKB(record);
    editKBForm.setFieldsValue({
      title: record.title,
      description: record.description,
      category: record.category,
      level: record.level,
      isPublic: record.isPublic,
      tags: record.tags
    });
    setEditKBModalVisible(true);
  };

  // 更新知识库
  const handleUpdateKB = async (values: any) => {
    try {
      if (editingKB) {
        // 更新模拟数据
        const updatedKBs = knowledgeBases.map(kb => 
          kb.id === editingKB.id ? { ...kb, ...values, updatedAt: new Date().toISOString() } : kb
        );
        setKnowledgeBases(updatedKBs);
        if (selectedKB?.id === editingKB.id) {
          setSelectedKB({ ...selectedKB, ...values });
        }
      }
      message.success('知识库更新成功');
      setEditKBModalVisible(false);
      setEditingKB(null);
      editKBForm.resetFields();
    } catch (error) {
      message.error('更新失败');
    }
  };

  // 删除知识库
  const handleDeleteKB = async (record: KnowledgeBase) => {
    try {
      const updatedKBs = knowledgeBases.filter(kb => kb.id !== record.id);
      setKnowledgeBases(updatedKBs);
      if (selectedKB?.id === record.id) {
        setSelectedKB(updatedKBs[0] || null);
      }
      message.success('知识库删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 发布/取消发布知识库
  const handlePublishKB = async (record: KnowledgeBase, newStatus: 'draft' | 'published' | 'archived') => {
    try {
      const updatedKBs = knowledgeBases.map(kb => 
        kb.id === record.id ? { ...kb, status: newStatus, updatedAt: new Date().toISOString() } : kb
      );
      setKnowledgeBases(updatedKBs);
      if (selectedKB?.id === record.id) {
        setSelectedKB({ ...selectedKB, status: newStatus });
      }
      message.success(`知识库${newStatus === 'published' ? '发布' : '下线'}成功`);
    } catch (error) {
      message.error('操作失败');
    }
  };

  // 查看学习路径详情
  const handleViewPathDetail = (path: LearningPath) => {
    setSelectedPath(path);
    setDetailDrawerVisible(true);
  };

  // 编辑学习路径
  const handleEditPath = (path: LearningPath) => {
    createPathForm.setFieldsValue({
      title: path.title,
      description: path.description,
      difficulty: path.difficulty,
      objectives: path.objectives,
      knowledgePoints: path.knowledgePoints
    });
    setCreatePathModalVisible(true);
  };

  // 获取状态信息
  const getStatusInfo = (status: string) => {
    const statusMap = {
      draft: { color: '#8c8c8c', name: '草稿' },
      published: { color: '#52c41a', name: '已发布' },
      archived: { color: '#ff4d4f', name: '已归档' }
    };
    return statusMap[status as keyof typeof statusMap] || { color: '#8c8c8c', name: '未知' };
  };

  // 获取难度信息
  const getDifficultyInfo = (difficulty: string) => {
    const difficultyMap = {
      beginner: { color: '#52c41a', name: '初级', icon: '🌱' },
      intermediate: { color: '#faad14', name: '中级', icon: '🌿' },
      advanced: { color: '#ff4d4f', name: '高级', icon: '🌳' },
      easy: { color: '#52c41a', name: '简单', icon: '😊' },
      medium: { color: '#faad14', name: '中等', icon: '😐' },
      hard: { color: '#ff4d4f', name: '困难', icon: '😤' }
    };
    return difficultyMap[difficulty as keyof typeof difficultyMap] || { 
      color: '#8c8c8c', name: '未知', icon: '❓' 
    };
  };

  // 获取知识点类型信息
  const getKPTypeInfo = (type: string) => {
    const typeMap = {
      concept: { color: '#1890ff', name: '概念', icon: <BulbOutlined /> },
      skill: { color: '#52c41a', name: '技能', icon: <RocketOutlined /> },
      practice: { color: '#faad14', name: '实践', icon: <AimOutlined /> },
      assessment: { color: '#722ed1', name: '评估', icon: <TrophyOutlined /> }
    };
    return typeMap[type as keyof typeof typeMap] || { 
      color: '#8c8c8c', name: '其他', icon: <FileOutlined /> 
    };
  };

  // 渲染知识点树
  const renderKnowledgeTree = () => {
    const convertToTreeData = (points: KnowledgePoint[]): any[] => {
      return points.map(point => ({
        key: point.id,
        title: (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: getKPTypeInfo(point.type).color, marginRight: '8px' }}>
                {getKPTypeInfo(point.type).icon}
              </span>
              <Text strong={!point.parentId}>{point.title}</Text>
              <Progress
                size="small"
                percent={point.progress}
                style={{ 
                  marginLeft: '12px', 
                  width: '80px',
                  display: point.parentId ? 'none' : 'block'
                }}
                strokeColor={point.progress === 100 ? '#52c41a' : primaryColor}
              />
            </div>
            <Space size="small">
              <Tag color={getDifficultyInfo(point.difficulty).color} style={{ fontSize: '10px' }}>
                {getDifficultyInfo(point.difficulty).icon} {getDifficultyInfo(point.difficulty).name}
              </Tag>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {point.estimatedTime}min
              </Text>
            </Space>
          </div>
        ),
        children: point.children ? convertToTreeData(point.children) : undefined
      }));
    };

    return (
      <Tree
        showLine
        defaultExpandAll
        treeData={convertToTreeData(knowledgePoints.filter(kp => !kp.parentId))}
        style={{ background: 'transparent' }}
      />
    );
  };

  // 知识库概览表格列
  const kbColumns = [
    {
      title: '知识库信息',
      key: 'info',
      width: 300,
      render: (record: KnowledgeBase) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* 使用分类图标替代封面图片 */}
          <div style={{
            width: '60px',
            height: '40px',
            backgroundColor: `${primaryColor}08`,
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '12px',
            border: `1px solid ${primaryColor}20`
          }}>
            {getKnowledgeBaseCategoryIcon(record.category, 20)}
          </div>
          <div>
            <Text strong style={{ fontSize: '14px', display: 'block' }}>
              {record.title}
            </Text>
            <Space size="small" style={{ marginTop: '4px' }}>
              <Tag color="blue" style={{ fontSize: '10px' }}>
                {record.category}
              </Tag>
              <Tag color={getDifficultyInfo(record.level).color} style={{ fontSize: '10px' }}>
                {getDifficultyInfo(record.level).name}
              </Tag>
            </Space>
          </div>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string, record: KnowledgeBase) => (
        <Space direction="vertical" size="small">
          <Tag color={getStatusInfo(status).color} style={{ fontSize: '11px' }}>
            {getStatusInfo(status).name}
          </Tag>
          {record.isPublic ? (
            <Tag color="green" style={{ fontSize: '10px' }}>公开</Tag>
          ) : (
            <Tag color="orange" style={{ fontSize: '10px' }}>私有</Tag>
          )}
        </Space>
      )
    },
    {
      title: '数据统计',
      key: 'stats',
      width: 150,
      render: (record: KnowledgeBase) => (
        <div>
          <div style={{ fontSize: '11px', marginBottom: '2px' }}>
            <BookOutlined style={{ marginRight: '4px' }} />
            知识点: {record.stats.knowledgePoints}
          </div>
          <div style={{ fontSize: '11px', marginBottom: '2px' }}>
            <UserOutlined style={{ marginRight: '4px' }} />
            学员: {record.stats.learners}
          </div>
          <div style={{ fontSize: '11px' }}>
            <StarOutlined style={{ marginRight: '4px' }} />
            评分: {record.stats.avgRating.toFixed(1)}
          </div>
        </div>
      )
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 120,
      render: (date: string) => (
        <Text style={{ fontSize: '12px' }}>
          {new Date(date).toLocaleDateString()}
        </Text>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (record: KnowledgeBase) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => setSelectedKB(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditKB(record)}
            />
          </Tooltip>
          {record.status === 'draft' ? (
            <Tooltip title="发布">
              <Button
                type="text"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handlePublishKB(record, 'published')}
                style={{ color: '#52c41a' }}
              />
            </Tooltip>
          ) : (
            <Tooltip title="下线">
              <Button
                type="text"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handlePublishKB(record, 'draft')}
                style={{ color: '#faad14' }}
              />
            </Tooltip>
          )}
          <Tooltip title="设置">
            <Button
              type="text"
              size="small"
              icon={<SettingOutlined />}
              onClick={() => setSettingsDrawerVisible(true)}
            />
          </Tooltip>
          <Tooltip title="分析">
            <Button
              type="text"
              size="small"
              icon={<BarChartOutlined />}
              onClick={() => setAnalyticsDrawerVisible(true)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定删除此知识库吗？"
              onConfirm={() => handleDeleteKB(record)}
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
      )
    }
  ];

  // 获取文件类型图标
  const getFileTypeIcon = (type: string, size: number = 16) => {
    const iconStyle = { fontSize: size, marginRight: '8px' };
    switch (type) {
      case 'image':
        return <FileImageOutlined style={{ ...iconStyle, color: '#52c41a' }} />;
      case 'video':
        return <VideoCameraOutlined style={{ ...iconStyle, color: '#1890ff' }} />;
      case 'audio':
        return <AudioOutlined style={{ ...iconStyle, color: '#722ed1' }} />;
      case 'document':
        return <FilePdfOutlined style={{ ...iconStyle, color: '#ff4d4f' }} />;
      case 'presentation':
        return <FileTextOutlined style={{ ...iconStyle, color: '#fa8c16' }} />;
      case '3d_animation':
        return <BlockOutlined style={{ ...iconStyle, color: '#13c2c2' }} />;
      default:
        return <FileOutlined style={{ ...iconStyle, color: '#8c8c8c' }} />;
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化时长
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}分钟`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}小时${mins > 0 ? mins + '分钟' : ''}`;
  };

  // 处理文件上传
  const handleFileUpload = async (knowledgeBaseId: string) => {
    if (uploadFiles.length === 0) {
      message.warning('请先选择要上传的文件');
      return;
    }

    setUploadingKB(knowledgeBaseId);
    const formData = new FormData();

    // 添加文件和相关信息
    uploadFiles.forEach((file, index) => {
      formData.append('files', file.file);
      formData.append(`contentTitle_${index}`, file.title || file.file.name);
      formData.append(`contentDescription_${index}`, file.description || '');
      formData.append(`contentTags_${index}`, JSON.stringify(file.tags || []));
      formData.append(`isRequired_${index}`, file.isRequired ? 'true' : 'false');
      if (file.estimatedDuration) {
        formData.append(`estimatedDuration_${index}`, file.estimatedDuration.toString());
      }
    });

    try {
      // 使用正确的API路径格式
      const response = await api.post(`/knowledge-bases/${knowledgeBaseId}/contents/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        notification.success({
          message: '上传成功',
          description: `成功上传 ${response.data.data.totalFiles} 个文件，总大小 ${formatFileSize(response.data.data.totalSize)}`,
        });
        
        // 清空上传文件列表
        setUploadFiles([]);
        
        // 刷新知识库数据
        loadKnowledgeBases();
      } else {
        throw new Error(response.data.message || '上传失败');
      }
    } catch (error: any) {
      console.error('文件上传失败:', error);
      
      // 提供更详细的错误信息
      let errorMessage = '文件上传过程中发生错误';
      if (error.response?.status === 404) {
        errorMessage = '上传接口不存在，请检查后端服务';
      } else if (error.response?.status === 403) {
        errorMessage = '没有权限上传文件';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      notification.error({
        message: '上传失败',
        description: errorMessage,
      });
    } finally {
      setUploadingKB(null);
    }
  };

  // 自定义上传组件
  const customUploadProps = {
    multiple: true,
    beforeUpload: (file: any) => {
      // 检查文件类型
      const allowedTypes = [
        // 图片
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        // 视频
        'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm',
        // 音频
        'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac',
        // 文档
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'text/csv',
        // 演示文稿
        'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        // 3D文件
        'model/gltf+json', 'model/gltf-binary', 'application/octet-stream'
      ];

      const isAllowedType = allowedTypes.includes(file.type) || 
                           file.name.toLowerCase().endsWith('.gltf') ||
                           file.name.toLowerCase().endsWith('.glb') ||
                           file.name.toLowerCase().endsWith('.fbx') ||
                           file.name.toLowerCase().endsWith('.obj') ||
                           file.name.toLowerCase().endsWith('.dae') ||
                           file.name.toLowerCase().endsWith('.3ds') ||
                           file.name.toLowerCase().endsWith('.ply') ||
                           file.name.toLowerCase().endsWith('.stl');

      if (!isAllowedType) {
        message.error('不支持的文件类型');
        return Upload.LIST_IGNORE;
      }

      // 检查文件大小 (100MB)
      const isLt100M = file.size / 1024 / 1024 < 100;
      if (!isLt100M) {
        message.error('文件大小不能超过 100MB');
        return Upload.LIST_IGNORE;
      }

      // 添加到上传列表
      const newFile = {
        file,
        title: file.name,
        description: '',
        tags: [],
        isRequired: false,
        estimatedDuration: undefined,
        uid: file.uid,
      };

      setUploadFiles(prev => [...prev, newFile]);
      return false; // 阻止自动上传
    },
    onRemove: (file: any) => {
      setUploadFiles(prev => prev.filter(f => f.uid !== file.uid));
    },
    fileList: uploadFiles.map(f => ({
      uid: f.uid,
      name: f.file.name,
      status: 'done' as const,
      size: f.file.size,
      type: f.file.type,
    })),
  };

  // 获取知识库分类图标
  const getKnowledgeBaseCategoryIcon = (category: string, size: number = 18) => {
    const iconStyle = { fontSize: size, color: primaryColor };
    
    switch (category?.toLowerCase()) {
      case '足球':
        return <span style={{ ...iconStyle, fontSize: size + 2 }}>⚽</span>;
      case '篮球':
        return <span style={{ ...iconStyle, fontSize: size + 2 }}>🏀</span>;
      case '排球':
        return <span style={{ ...iconStyle, fontSize: size + 2 }}>🏐</span>;
      case '网球':
        return <span style={{ ...iconStyle, fontSize: size + 2 }}>🎾</span>;
      case '乒乓球':
        return <span style={{ ...iconStyle, fontSize: size + 2 }}>🏓</span>;
      case '羽毛球':
        return <span style={{ ...iconStyle, fontSize: size + 2 }}>🏸</span>;
      case '游泳':
        return <span style={{ ...iconStyle, fontSize: size + 2 }}>🏊</span>;
      case '田径':
        return <span style={{ ...iconStyle, fontSize: size + 2 }}>🏃</span>;
      case '体操':
        return <span style={{ ...iconStyle, fontSize: size + 2 }}>🤸</span>;
      case '武术':
        return <span style={{ ...iconStyle, fontSize: size + 2 }}>🥋</span>;
      case '健身':
        return <span style={{ ...iconStyle, fontSize: size + 2 }}>💪</span>;
      case '瑜伽':
        return <span style={{ ...iconStyle, fontSize: size + 2 }}>🧘</span>;
      case '跆拳道':
        return <span style={{ ...iconStyle, fontSize: size + 2 }}>🥋</span>;
      case '拳击':
        return <span style={{ ...iconStyle, fontSize: size + 2 }}>🥊</span>;
      case '滑冰':
        return <span style={{ ...iconStyle, fontSize: size + 2 }}>⛸️</span>;
      case '滑雪':
        return <span style={{ ...iconStyle, fontSize: size + 2 }}>🎿</span>;
      case '棒球':
        return <span style={{ ...iconStyle, fontSize: size + 2 }}>⚾</span>;
      case '高尔夫':
        return <span style={{ ...iconStyle, fontSize: size + 2 }}>⛳</span>;
      case '自行车':
        return <span style={{ ...iconStyle, fontSize: size + 2 }}>🚴</span>;
      case '跑步':
        return <span style={{ ...iconStyle, fontSize: size + 2 }}>🏃</span>;
      default:
        return <BookOutlined style={iconStyle} />;
    }
  };

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
                  知识库管理
                </Title>
                <Text type="secondary" style={{ fontSize: '16px', marginLeft: '2px' }}>
                  构建系统化的学习知识体系
                </Text>
              </div>
            </div>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            size="large"
            onClick={() => setCreateKBModalVisible(true)}
            style={{
              borderRadius: '8px',
              height: '40px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            创建知识库
          </Button>
        </div>
      </div>

      {/* 统计卡片区域 */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={6}>
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
                {knowledgeBases.length}
              </div>
              <div className="stats-label">知识库总数</div>
            </div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stats-card modern-card animate-slideUp" style={{ animationDelay: '0.1s' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #52c41a15 0%, #52c41a05 100%)',
              borderRadius: '12px',
              padding: '20px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <NodeIndexOutlined style={{ 
                fontSize: '24px', 
                color: '#52c41a', 
                marginBottom: '12px'
              }} />
              <div className="stats-number" style={{ color: '#52c41a' }}>
                {knowledgePoints.length}
              </div>
              <div className="stats-label">知识点数量</div>
            </div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stats-card modern-card animate-slideUp" style={{ animationDelay: '0.2s' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #faad1415 0%, #faad1405 100%)',
              borderRadius: '12px',
              padding: '20px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <UserOutlined style={{ 
                fontSize: '24px', 
                color: '#faad14', 
                marginBottom: '12px'
              }} />
              <div className="stats-number" style={{ color: '#faad14' }}>
                {knowledgeBases.reduce((sum, kb) => sum + kb.stats.learners, 0)}
              </div>
              <div className="stats-label">学习人数</div>
            </div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className="stats-card modern-card animate-slideUp" style={{ animationDelay: '0.3s' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #722ed115 0%, #722ed105 100%)',
              borderRadius: '12px',
              padding: '20px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <TrophyOutlined style={{ 
                fontSize: '24px', 
                color: '#722ed1', 
                marginBottom: '12px'
              }} />
              <div className="stats-number" style={{ color: '#722ed1' }}>
                {Math.round(knowledgeBases.reduce((sum, kb) => sum + kb.stats.completionRate, 0) / knowledgeBases.length)}%
              </div>
              <div className="stats-label">平均完成率</div>
            </div>
          </div>
        </Col>
      </Row>

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
          {/* 概览标签页 */}
          <TabPane 
            tab={
              <span style={{ fontSize: '16px', fontWeight: '500' }}>
                <BookOutlined style={{ marginRight: '8px' }} />
                知识库概览
              </span>
            } 
            key="overview"
          >
            <div style={{ padding: '24px' }}>
              <Table
                columns={kbColumns}
                dataSource={knowledgeBases}
                rowKey="id"
                loading={loading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                }}
              />
            </div>
          </TabPane>

          {/* 知识点管理标签页 */}
          <TabPane 
            tab={
              <span style={{ fontSize: '16px', fontWeight: '500' }}>
                <NodeIndexOutlined style={{ marginRight: '8px' }} />
                知识点管理
              </span>
            } 
            key="knowledge-points"
          >
            <div style={{ padding: '24px' }}>
              {selectedKB ? (
                <div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '24px',
                    padding: '16px',
                    background: `linear-gradient(135deg, ${primaryColor}08 0%, ${primaryColor}04 100%)`,
                    borderRadius: '12px',
                    border: `1px solid ${primaryColor}20`
                  }}>
                    <div>
                      <Title level={4} style={{ margin: 0, color: primaryColor }}>
                        {selectedKB.title}
                      </Title>
                      <Text type="secondary">
                        共 {selectedKB.stats.knowledgePoints} 个知识点
                      </Text>
                    </div>
                    <Space>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setCreateKPModalVisible(true)}
                      >
                        添加知识点
                      </Button>
                      <Button
                        type="default"
                        icon={<BulbOutlined />}
                        onClick={() => setAIKnowledgePointModalVisible(true)}
                        style={{
                          background: 'linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%)',
                          color: 'white',
                          border: 'none'
                        }}
                      >
                        AI生成知识点
                      </Button>
                    </Space>
                  </div>
                  {renderKnowledgeTree()}
                </div>
              ) : (
                <Empty
                  description="请先选择一个知识库"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </div>
          </TabPane>

          {/* 学习路径标签页 */}
          <TabPane 
            tab={
              <span style={{ fontSize: '16px', fontWeight: '500' }}>
                <LinkOutlined style={{ marginRight: '8px' }} />
                学习路径
              </span>
            } 
            key="learning-paths"
          >
            <div style={{ padding: '24px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <div>
                  <Title level={4} style={{ margin: 0 }}>学习路径设计</Title>
                  <Text type="secondary">为学员制定系统化的学习计划</Text>
                </div>
                <Space>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setCreatePathModalVisible(true)}
                  >
                    创建学习路径
                  </Button>
                  <Button
                    type="default"
                    icon={<BulbOutlined />}
                    onClick={() => setAILearningPathModalVisible(true)}
                    style={{
                      background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    AI生成路径
                  </Button>
                </Space>
              </div>

              <Row gutter={[16, 16]}>
                {learningPaths.map((path) => (
                  <Col xs={24} sm={12} lg={8} key={path.id}>
                    <Card
                      hoverable
                      style={{
                        borderRadius: '12px',
                        border: `1px solid ${isDark ? '#404040' : '#e2e8f0'}`
                      }}
                      bodyStyle={{ padding: '20px' }}
                    >
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                          <LinkOutlined style={{ color: primaryColor, marginRight: '8px' }} />
                          <Text strong style={{ fontSize: '16px' }}>{path.title}</Text>
                        </div>
                        <Paragraph 
                          ellipsis={{ rows: 2 }} 
                          style={{ fontSize: '14px', color: '#8c8c8c', margin: 0 }}
                        >
                          {path.description}
                        </Paragraph>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <Space wrap>
                          <Tag color={getDifficultyInfo(path.difficulty).color}>
                            {getDifficultyInfo(path.difficulty).name}
                          </Tag>
                          <Tag color="blue">
                            <ClockCircleOutlined style={{ marginRight: '4px' }} />
                            {Math.floor(path.estimatedDuration / 60)}h {path.estimatedDuration % 60}m
                          </Tag>
                          <Tag color="green">
                            {path.knowledgePoints.length} 个知识点
                          </Tag>
                        </Space>
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <Text strong style={{ fontSize: '12px', color: '#8c8c8c' }}>学习目标：</Text>
                        <ul style={{ margin: '8px 0 0 0', paddingLeft: '16px' }}>
                          {path.objectives.slice(0, 2).map((objective, index) => (
                            <li key={index} style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>
                              {objective}
                            </li>
                          ))}
                          {path.objectives.length > 2 && (
                            <li style={{ fontSize: '12px', color: '#8c8c8c' }}>
                              ...还有 {path.objectives.length - 2} 个目标
                            </li>
                          )}
                        </ul>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space>
                          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewPathDetail(path)}>
                            查看详情
                          </Button>
                          <Button size="small" icon={<EditOutlined />} onClick={() => handleEditPath(path)}>
                            编辑
                          </Button>
                        </Space>
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          {path.prerequisites.length} 个前置条件
                        </Text>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>

              {learningPaths.length === 0 && (
                <Empty
                  description="暂无学习路径"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </div>
          </TabPane>

          {/* 内容管理标签页 */}
          <TabPane 
            tab={
              <span style={{ fontSize: '16px', fontWeight: '500' }}>
                <FileOutlined style={{ marginRight: '8px' }} />
                内容管理
              </span>
            } 
            key="content-management"
          >
            <div style={{ padding: '24px' }}>
              {selectedKB ? (
                <div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '24px',
                    padding: '16px',
                    background: `linear-gradient(135deg, ${primaryColor}08 0%, ${primaryColor}04 100%)`,
                    borderRadius: '12px',
                    border: `1px solid ${primaryColor}20`
                  }}>
                    <div>
                      <Title level={4} style={{ margin: 0, color: primaryColor }}>
                        {selectedKB.title} - 多媒体内容
                      </Title>
                      <Text type="secondary">
                        管理知识库中的文档、音频、视频、3D动画等学习内容
                      </Text>
                    </div>
                    <Space>
                      <Button
                        type="primary"
                        icon={<UploadOutlined />}
                        onClick={() => {
                          // 打开内容上传弹窗
                          Modal.info({
                            title: '上传新内容',
                            width: 800,
                            content: (
                              <div style={{ marginTop: '16px' }}>
                                <Dragger {...customUploadProps}>
                                  <p className="ant-upload-drag-icon">
                                    <InboxOutlined />
                                  </p>
                                  <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
                                  <p className="ant-upload-hint">
                                    支持多种格式：PDF、DOC、PPT、MP4、MP3、GLTF、GLB等
                                  </p>
                                </Dragger>
                                {uploadFiles.length > 0 && (
                                  <div style={{ marginTop: '16px' }}>
                                    <Button 
                                      type="primary" 
                                      loading={uploadingKB === selectedKB.id}
                                      onClick={() => handleFileUpload(selectedKB.id)}
                                    >
                                      上传内容
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ),
                            onOk() {
                              setUploadFiles([]);
                            },
                          });
                        }}
                      >
                        上传内容
                      </Button>
                    </Space>
                  </div>

                  {/* 内容列表 */}
                  <div>
                    {selectedKB.contents && selectedKB.contents.length > 0 ? (
                      <Row gutter={[16, 16]}>
                        {selectedKB.contents.map((content) => (
                          <Col xs={24} sm={12} lg={8} xl={6} key={content.fileId}>
                            <Card
                              hoverable
                              style={{
                                borderRadius: '12px',
                                border: `1px solid ${isDark ? '#404040' : '#e2e8f0'}`
                              }}
                              cover={
                                // 统一使用文件类型图标，避免缩略图加载失败
                                <div style={{ 
                                  height: '120px', 
                                  background: `linear-gradient(135deg, ${primaryColor}20 0%, ${primaryColor}10 100%)`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexDirection: 'column',
                                  position: 'relative'
                                }}>
                                  {getFileTypeIcon(content.type, 32)}
                                  <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px' }}>
                                    {content.type.toUpperCase()}
                                  </Text>
                                  {/* 文件类型标签 */}
                                  <div style={{
                                    position: 'absolute',
                                    top: '8px',
                                    right: '8px',
                                    background: 'rgba(0,0,0,0.6)',
                                    borderRadius: '4px',
                                    padding: '2px 6px',
                                    color: 'white',
                                    fontSize: '10px'
                                  }}>
                                    {content.originalName?.split('.').pop()?.toUpperCase() || 'FILE'}
                                  </div>
                                </div>
                              }
                              actions={[
                                <Tooltip key="preview" title="预览">
                                  <Button type="text" icon={<EyeOutlined />} size="small" />
                                </Tooltip>,
                                <Tooltip key="download" title="下载">
                                  <Button 
                                    type="text" 
                                    icon={<DownloadOutlined />} 
                                    size="small"
                                    onClick={() => window.open(content.url, '_blank')}
                                  />
                                </Tooltip>,
                                <Tooltip key="delete" title="删除">
                                  <Popconfirm
                                    title="确定删除此内容吗？"
                                    onConfirm={() => {
                                      // TODO: 实现删除功能
                                      message.success('内容删除成功');
                                    }}
                                    okText="确定"
                                    cancelText="取消"
                                  >
                                    <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                                  </Popconfirm>
                                </Tooltip>
                              ]}
                            >
                              <Card.Meta
                                title={
                                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                    <Text strong ellipsis style={{ fontSize: '14px' }}>
                                      {content.title}
                                    </Text>
                                    {content.isRequired && (
                                      <Tag color="red" style={{ fontSize: '10px', marginLeft: '8px' }}>
                                        必修
                                      </Tag>
                                    )}
                                  </div>
                                }
                                description={
                                  <div>
                                    {content.description && (
                                      <Paragraph 
                                        ellipsis={{ rows: 2 }} 
                                        style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '8px' }}
                                      >
                                        {content.description}
                                      </Paragraph>
                                    )}
                                    <Space size="small" wrap>
                                      <Tag color="blue" style={{ fontSize: '10px' }}>
                                        {formatFileSize(content.size)}
                                      </Tag>
                                      {content.estimatedDuration && (
                                        <Tag color="green" style={{ fontSize: '10px' }}>
                                          <ClockCircleOutlined style={{ marginRight: '2px' }} />
                                          {formatDuration(content.estimatedDuration)}
                                        </Tag>
                                      )}
                                      {content.metadata?.duration && (
                                        <Tag color="purple" style={{ fontSize: '10px' }}>
                                          {Math.ceil(content.metadata.duration / 60)}分钟
                                        </Tag>
                                      )}
                                    </Space>
                                    {content.tags && content.tags.length > 0 && (
                                      <div style={{ marginTop: '8px' }}>
                                        {content.tags.slice(0, 2).map(tag => (
                                          <Tag key={tag} color="default" style={{ fontSize: '10px' }}>
                                            {tag}
                                          </Tag>
                                        ))}
                                        {content.tags.length > 2 && (
                                          <Tag color="default" style={{ fontSize: '10px' }}>
                                            +{content.tags.length - 2}
                                          </Tag>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                }
                              />
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    ) : (
                      <Empty
                        description="暂无上传内容"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      >
                        <Button 
                          type="primary" 
                          icon={<UploadOutlined />}
                          onClick={() => {
                            // 打开上传弹窗的逻辑
                          }}
                        >
                          上传第一个内容
                        </Button>
                      </Empty>
                    )}
                  </div>
                </div>
              ) : (
                <Empty
                  description="请先选择一个知识库"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </div>
          </TabPane>
        </Tabs>
      </div>

      {/* 创建知识库弹窗 */}
      <Modal
        title="创建知识库"
        open={createKBModalVisible}
        onCancel={() => {
          setCreateKBModalVisible(false);
          createKBForm.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={createKBForm}
          layout="vertical"
          onFinish={handleCreateKB}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="知识库标题"
                name="title"
                rules={[{ required: true, message: '请输入知识库标题' }]}
              >
                <Input placeholder="请输入知识库标题" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="运动分类"
                name="category"
                rules={[{ required: true, message: '请选择运动分类' }]}
              >
                <Select placeholder="请选择运动分类">
                  <Select.Option value="足球">足球</Select.Option>
                  <Select.Option value="篮球">篮球</Select.Option>
                  <Select.Option value="游泳">游泳</Select.Option>
                  <Select.Option value="田径">田径</Select.Option>
                  <Select.Option value="排球">排球</Select.Option>
                  <Select.Option value="乒乓球">乒乓球</Select.Option>
                  <Select.Option value="体操">体操</Select.Option>
                  <Select.Option value="健身">健身</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="难度级别"
                name="level"
                rules={[{ required: true, message: '请选择难度级别' }]}
              >
                <Select placeholder="请选择难度级别">
                  <Select.Option value="beginner">初级</Select.Option>
                  <Select.Option value="intermediate">中级</Select.Option>
                  <Select.Option value="advanced">高级</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="可见性"
                name="isPublic"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch checkedChildren="公开" unCheckedChildren="私有" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="知识库描述"
            name="description"
            rules={[{ required: true, message: '请输入知识库描述' }]}
          >
            <TextArea rows={4} placeholder="请详细描述知识库的内容和目标" />
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

          {/* 内容创建方式选择 */}
          <Divider orientation="left">内容创建方式</Divider>
          
          <Form.Item label="选择内容来源">
            <Radio.Group 
              value={contentCreationType} 
              onChange={(e) => {
                setContentCreationType(e.target.value);
                // 清理之前的数据
                setUploadFiles([]);
                setAiTopic('');
                setAiRequirements('');
                setUrlInput('');
                setFetchedUrlContent(null);
              }}
              style={{ width: '100%' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Radio value="upload">
                  <Space>
                    <InboxOutlined style={{ color: primaryColor }} />
                    <div>
                      <Text strong>上传文件</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        上传文档、音频、视频、3D动画等文件
                      </Text>
                    </div>
                  </Space>
                </Radio>
                <Radio value="ai">
                  <Space>
                    <RobotOutlined style={{ color: primaryColor }} />
                    <div>
                      <Text strong>AI智能生成</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        根据主题和要求，由AI生成知识内容
                      </Text>
                    </div>
                  </Space>
                </Radio>
                <Radio value="url">
                  <Space>
                    <LinkOutlined style={{ color: primaryColor }} />
                    <div>
                      <Text strong>网址导入</Text>  
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        从网页链接抓取内容并整理
                      </Text>
                    </div>
                  </Space>
                </Radio>
              </Space>
            </Radio.Group>
          </Form.Item>

          {/* 内容创建区域 - 根据选择的方式显示不同内容 */}
          {contentCreationType === 'upload' && (
            <>
              <Divider orientation="left">多媒体内容上传</Divider>
              
              <Form.Item
                label="知识库内容"
                help="支持上传文档、音频、视频、3D动画等多种格式的学习内容"
              >
                <Dragger {...customUploadProps}>
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
                  <p className="ant-upload-hint">
                    支持多种格式：PDF、DOC、PPT、MP4、MP3、GLTF、GLB等
                  </p>
                </Dragger>
              </Form.Item>

              {/* 上传文件列表配置 */}
              {uploadFiles.length > 0 && (
                <Form.Item label="内容配置">
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {uploadFiles.map((file, index) => (
                      <Card
                        key={file.uid}
                        size="small"
                        style={{ marginBottom: '12px' }}
                        title={
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {getFileTypeIcon(file.file.type.startsWith('image/') ? 'image' :
                                            file.file.type.startsWith('video/') ? 'video' :
                                            file.file.type.startsWith('audio/') ? 'audio' :
                                            file.file.name.toLowerCase().match(/\.(gltf|glb|fbx|obj|dae|3ds|ply|stl)$/) ? '3d_animation' :
                                            file.file.type.includes('presentation') || file.file.name.toLowerCase().match(/\.(ppt|pptx|odp)$/) ? 'presentation' :
                                            'document')}
                            <Text strong>{file.file.name}</Text>
                            <Tag color="blue" style={{ marginLeft: '8px' }}>
                              {formatFileSize(file.file.size)}
                            </Tag>
                          </div>
                        }
                        extra={
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => setUploadFiles(prev => prev.filter(f => f.uid !== file.uid))}
                          />
                        }
                      >
                        <Row gutter={16}>
                          <Col span={12}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                              <div>
                                <Text strong>内容标题：</Text>
                                <Input
                                  size="small"
                                  value={file.title}
                                  onChange={(e) =>
                                    setUploadFiles(prev =>
                                      prev.map(f =>
                                        f.uid === file.uid ? { ...f, title: e.target.value } : f
                                      )
                                    )
                                  }
                                  placeholder="请输入内容标题"
                                />
                              </div>
                              <div>
                                <Text strong>内容描述：</Text>
                                <TextArea
                                  size="small"
                                  rows={2}
                                  value={file.description}
                                  onChange={(e) =>
                                    setUploadFiles(prev =>
                                      prev.map(f =>
                                        f.uid === file.uid ? { ...f, description: e.target.value } : f
                                      )
                                    )
                                  }
                                  placeholder="请输入内容描述"
                                />
                              </div>
                            </Space>
                          </Col>
                          <Col span={12}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                              <div>
                                <Text strong>内容标签：</Text>
                                <Select
                                  mode="tags"
                                  size="small"
                                  style={{ width: '100%' }}
                                  value={file.tags}
                                  onChange={(tags) =>
                                    setUploadFiles(prev =>
                                      prev.map(f =>
                                        f.uid === file.uid ? { ...f, tags } : f
                                      )
                                    )
                                  }
                                  placeholder="添加标签"
                                />
                              </div>
                              <div>
                                <Text strong>预计学习时长（分钟）：</Text>
                                <InputNumber
                                  size="small"
                                  style={{ width: '100%' }}
                                  min={1}
                                  max={600}
                                  value={file.estimatedDuration}
                                  onChange={(value) =>
                                    setUploadFiles(prev =>
                                      prev.map(f =>
                                        f.uid === file.uid ? { ...f, estimatedDuration: value } : f
                                      )
                                    )
                                  }
                                  placeholder="可选"
                                />
                              </div>
                              <div>
                                <Checkbox
                                  checked={file.isRequired}
                                  onChange={(e) =>
                                    setUploadFiles(prev =>
                                      prev.map(f =>
                                        f.uid === file.uid ? { ...f, isRequired: e.target.checked } : f
                                      )
                                    )
                                  }
                                >
                                  必修内容
                                </Checkbox>
                              </div>
                            </Space>
                          </Col>
                        </Row>
                      </Card>
                    ))}
                  </div>
                </Form.Item>
              )}
            </>
          )}

          {contentCreationType === 'ai' && (
            <>
              <Divider orientation="left">AI智能生成配置</Divider>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="生成内容类型"
                    name="aiContentType"
                    initialValue="text"
                  >
                    <Select
                      value={aiContentType}
                      onChange={setAiContentType}
                      placeholder="选择要生成的内容类型"
                    >
                      <Select.Option value="text">
                        <Space>
                          <FileTextOutlined />
                          知识文档
                        </Space>
                      </Select.Option>
                      <Select.Option value="quiz">
                        <Space>
                          <EditOutlined />
                          练习题目
                        </Space>
                      </Select.Option>
                      <Select.Option value="guide">
                        <Space>
                          <BookOutlined />
                          教学指南
                        </Space>
                      </Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="内容难度"
                    name="aiDifficulty"
                    initialValue="beginner"
                  >
                    <Select placeholder="选择内容难度">
                      <Select.Option value="beginner">初学者</Select.Option>
                      <Select.Option value="intermediate">进阶者</Select.Option>
                      <Select.Option value="advanced">专业级</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="生成主题"
                name="aiTopic"
                rules={[{ required: contentCreationType === 'ai', message: '请输入生成主题' }]}
              >
                <Input
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="例如：足球基础运球技巧"
                  suffix={<RobotOutlined style={{ color: primaryColor }} />}
                />
              </Form.Item>

              <Form.Item
                label="具体要求"
                name="aiRequirements"
                help="详细描述您希望AI生成的内容特点、重点、风格等"
              >
                <TextArea
                  rows={4}
                  value={aiRequirements}
                  onChange={(e) => setAiRequirements(e.target.value)}
                  placeholder="例如：包含基础动作要领、常见错误纠正、练习方法推荐，语言通俗易懂，适合初学者理解..."
                />
              </Form.Item>

              {aiGenerating && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '20px',
                  background: `${primaryColor}08`,
                  borderRadius: '8px',
                  border: `1px solid ${primaryColor}20`
                }}>
                  <Spin size="large" />
                  <div style={{ marginTop: '12px' }}>
                    <Text>AI正在生成内容，请稍候...</Text>
                  </div>
                </div>
              )}
            </>
          )}

          {contentCreationType === 'url' && (
            <>
              <Divider orientation="left">网址内容导入</Divider>
              
              <Form.Item
                label="网页链接"
                name="urlInput"
                rules={[
                  { required: contentCreationType === 'url', message: '请输入网页链接' },
                  { type: 'url', message: '请输入有效的网址' }
                ]}
              >
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/sports-guide"
                  suffix={
                    <Button
                      type="text"
                      size="small"
                      loading={urlFetching}
                      onClick={async () => {
                        if (!urlInput) {
                          message.warning('请先输入网址');
                          return;
                        }
                        
                        setUrlFetching(true);
                        try {
                          // 这里应该调用后端API来获取网页内容
                          await new Promise(resolve => setTimeout(resolve, 2000)); // 模拟API调用
                          setFetchedUrlContent({
                            title: '网页标题示例',
                            content: '抓取到的网页内容...',
                            images: ['image1.jpg', 'image2.jpg']
                          });
                          message.success('网页内容获取成功');
                        } catch (error) {
                          message.error('获取网页内容失败');
                        } finally {
                          setUrlFetching(false);
                        }
                      }}
                      icon={<LinkOutlined />}
                    >
                      抓取内容
                    </Button>
                  }
                />
              </Form.Item>

              <Form.Item label="内容处理选项">
                <Checkbox.Group style={{ width: '100%' }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Checkbox value="extractText" defaultChecked>
                        提取文本内容
                      </Checkbox>
                    </Col>
                    <Col span={12}>
                      <Checkbox value="extractImages">
                        下载相关图片
                      </Checkbox>
                    </Col>
                    <Col span={12}>
                      <Checkbox value="extractVideos">
                        下载视频内容
                      </Checkbox>
                    </Col>
                    <Col span={12}>
                      <Checkbox value="aiSummary">
                        AI智能摘要
                      </Checkbox>
                    </Col>
                  </Row>
                </Checkbox.Group>
              </Form.Item>

              {fetchedUrlContent && (
                <div style={{
                  padding: '16px',
                  background: `${primaryColor}08`,
                  borderRadius: '8px',
                  border: `1px solid ${primaryColor}20`
                }}>
                  <Text strong>预览抓取内容：</Text>
                  <div style={{ marginTop: '8px' }}>
                    <Text>标题：{fetchedUrlContent.title}</Text>
                    <br />
                    <Text type="secondary">
                      内容预览：{fetchedUrlContent.content.substring(0, 100)}...
                    </Text>
                  </div>
                </div>
              )}
            </>
          )}

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button 
                onClick={() => {
                  setCreateKBModalVisible(false);
                  createKBForm.resetFields();
                  resetContentCreationState();
                }}
              >
                                取消
              </Button>
              <Button type="primary" htmlType="submit">
                创建知识库
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 创建知识点弹窗 */}
      <Modal
        title="添加知识点"
        open={createKPModalVisible}
        onCancel={() => {
          setCreateKPModalVisible(false);
          createKPForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={createKPForm}
          layout="vertical"
          onFinish={handleCreateKP}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="知识点标题"
                name="title"
                rules={[{ required: true, message: '请输入知识点标题' }]}
              >
                <Input placeholder="请输入知识点标题" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="知识点类型"
                name="type"
                rules={[{ required: true, message: '请选择知识点类型' }]}
              >
                <Select placeholder="请选择知识点类型">
                  <Select.Option value="concept">概念理论</Select.Option>
                  <Select.Option value="skill">技能训练</Select.Option>
                  <Select.Option value="practice">实践练习</Select.Option>
                  <Select.Option value="assessment">能力评估</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="难度等级"
                name="difficulty"
                rules={[{ required: true, message: '请选择难度等级' }]}
              >
                <Select placeholder="请选择难度等级">
                  <Select.Option value="easy">简单</Select.Option>
                  <Select.Option value="medium">中等</Select.Option>
                  <Select.Option value="hard">困难</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="预计学习时间（分钟）"
                name="estimatedTime"
                rules={[{ required: true, message: '请输入预计学习时间' }]}
              >
                <Input type="number" placeholder="请输入预计学习时间" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="知识点描述"
            name="description"
            rules={[{ required: true, message: '请输入知识点描述' }]}
          >
            <TextArea rows={3} placeholder="请详细描述知识点的内容和要求" />
          </Form.Item>

          <Form.Item
            label="前置知识点"
            name="prerequisites"
          >
            <Select
              mode="multiple"
              placeholder="选择前置知识点（可选）"
              style={{ width: '100%' }}
            >
              {knowledgePoints.map(kp => (
                <Select.Option key={kp.id} value={kp.id}>
                  {kp.title}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button 
                onClick={() => {
                  setCreateKPModalVisible(false);
                  createKPForm.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                添加知识点
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 创建学习路径弹窗 */}
      <Modal
        title="创建学习路径"
        open={createPathModalVisible}
        onCancel={() => {
          setCreatePathModalVisible(false);
          createPathForm.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={createPathForm}
          layout="vertical"
          onFinish={handleCreatePath}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="路径标题"
                name="title"
                rules={[{ required: true, message: '请输入路径标题' }]}
              >
                <Input placeholder="请输入学习路径标题" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="适用级别"
                name="difficulty"
                rules={[{ required: true, message: '请选择适用级别' }]}
              >
                <Select placeholder="请选择适用级别">
                  <Select.Option value="beginner">初学者</Select.Option>
                  <Select.Option value="intermediate">进阶者</Select.Option>
                  <Select.Option value="advanced">高级者</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="路径描述"
            name="description"
            rules={[{ required: true, message: '请输入路径描述' }]}
          >
            <TextArea rows={3} placeholder="请描述学习路径的内容和目标" />
          </Form.Item>

          <Form.Item
            label="包含知识点"
            name="knowledgePoints"
            rules={[{ required: true, message: '请选择知识点' }]}
          >
            <Select
              mode="multiple"
              placeholder="选择组成路径的知识点"
              style={{ width: '100%' }}
            >
              {knowledgePoints.map(kp => (
                <Select.Option key={kp.id} value={kp.id}>
                  {kp.title}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="学习目标"
            name="objectives"  
          >
            <Select
              mode="tags"
              placeholder="添加学习目标（按回车确认）"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button 
                onClick={() => {
                  setCreatePathModalVisible(false);
                  createPathForm.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                创建路径
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑知识库弹窗 */}
      <Modal
        title="编辑知识库"
        open={editKBModalVisible}
        onCancel={() => {
          setEditKBModalVisible(false);
          setEditingKB(null);
          editKBForm.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={editKBForm}
          layout="vertical"
          onFinish={handleUpdateKB}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="知识库标题"
                name="title"
                rules={[{ required: true, message: '请输入知识库标题' }]}
              >
                <Input placeholder="请输入知识库标题" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="运动分类"
                name="category"
                rules={[{ required: true, message: '请选择运动分类' }]}
              >
                <Select placeholder="请选择运动分类">
                  <Select.Option value="足球">足球</Select.Option>
                  <Select.Option value="篮球">篮球</Select.Option>
                  <Select.Option value="游泳">游泳</Select.Option>
                  <Select.Option value="田径">田径</Select.Option>
                  <Select.Option value="排球">排球</Select.Option>
                  <Select.Option value="乒乓球">乒乓球</Select.Option>
                  <Select.Option value="体操">体操</Select.Option>
                  <Select.Option value="健身">健身</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="难度级别"
                name="level"
                rules={[{ required: true, message: '请选择难度级别' }]}
              >
                <Select placeholder="请选择难度级别">
                  <Select.Option value="beginner">初级</Select.Option>
                  <Select.Option value="intermediate">中级</Select.Option>
                  <Select.Option value="advanced">高级</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="可见性"
                name="isPublic"
                valuePropName="checked"
              >
                <Switch checkedChildren="公开" unCheckedChildren="私有" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="知识库描述"
            name="description"
            rules={[{ required: true, message: '请输入知识库描述' }]}
          >
            <TextArea rows={4} placeholder="请详细描述知识库的内容和目标" />
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

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button 
                onClick={() => {
                  setEditKBModalVisible(false);
                  setEditingKB(null);
                  editKBForm.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                更新知识库
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 设置抽屉 */}
      <Drawer
        title="知识库设置"
        placement="right"
        onClose={() => setSettingsDrawerVisible(false)}
        open={settingsDrawerVisible}
        width={400}
      >
        <div>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Card title="基本设置" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>自动发布新内容</Text>
                  <Switch defaultChecked={false} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>允许评论</Text>
                  <Switch defaultChecked={true} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>需要审核</Text>
                  <Switch defaultChecked={true} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text>跟踪学习进度</Text>
                  <Switch defaultChecked={true} />
                </div>
              </Space>
            </Card>
            
            <Card title="权限设置" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>协作者</Text>
                  <Button type="link" size="small" icon={<PlusOutlined />}>
                    添加协作者
                  </Button>
                </div>
                <Empty description="暂无协作者" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </Space>
            </Card>
          </Space>
        </div>
      </Drawer>

      {/* 分析抽屉 */}
      <Drawer
        title="数据分析"
        placement="right"
        onClose={() => setAnalyticsDrawerVisible(false)}
        open={analyticsDrawerVisible}
        width={500}
      >
        <div>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="总浏览量" value={2341} />
              </Col>
              <Col span={12}>
                <Statistic title="今日浏览" value={156} />
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="学习人数" value={89} />
              </Col>
              <Col span={12}>
                <Statistic title="完成率" value={78} suffix="%" />
              </Col>
            </Row>

            <Card title="学习趋势" size="small">
              <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Text type="secondary">图表数据加载中...</Text>
              </div>
            </Card>

            <Card title="热门知识点" size="small">
              <List
                size="small"
                dataSource={[
                  { name: '足球基础知识', views: 234 },
                  { name: '颠球技术', views: 189 },
                  { name: '实战练习', views: 156 }
                ]}
                renderItem={(item) => (
                  <List.Item>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                      <Text>{item.name}</Text>
                      <Text type="secondary">{item.views} 次浏览</Text>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </Space>
        </div>
      </Drawer>

      {/* 学习路径详情抽屉 */}
      <Drawer
        title="学习路径详情"
        placement="right"
        onClose={() => setDetailDrawerVisible(false)}
        open={detailDrawerVisible}
        width={600}
      >
        {selectedPath && (
          <div>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Title level={4}>{selectedPath?.title}</Title>
                <Paragraph>{selectedPath?.description}</Paragraph>
                <Space wrap>
                  <Tag color={getDifficultyInfo(selectedPath?.difficulty || 'beginner').color}>
                    {getDifficultyInfo(selectedPath?.difficulty || 'beginner').name}
                  </Tag>
                  <Tag color="blue">
                    <ClockCircleOutlined style={{ marginRight: '4px' }} />
                    {Math.floor((selectedPath?.estimatedDuration || 0) / 60)}h {(selectedPath?.estimatedDuration || 0) % 60}m
                  </Tag>
                  <Tag color="green">
                    {selectedPath?.knowledgePoints?.length || 0} 个知识点
                  </Tag>
                </Space>
              </div>

              <Card title="学习目标" size="small">
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {(selectedPath?.objectives || []).map((objective, index) => (
                    <li key={index} style={{ marginBottom: '8px' }}>
                      {objective}
                    </li>
                  ))}
                </ul>
              </Card>

              <Card title="知识点安排" size="small">
                <Steps
                  direction="vertical"
                  size="small"
                  current={-1}
                  items={(selectedPath?.knowledgePoints || []).map((kp, index) => ({
                    title: `步骤 ${index + 1}`,
                    description: `知识点 ID: ${kp}${(selectedPath?.prerequisites?.length || 0) > 0 && index === 0 ? ' (需要前置条件)' : ''}`
                  }))}
                />
              </Card>

              <Card title="学习统计" size="small">
                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic title="学习人数" value={23} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="完成人数" value={18} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="平均用时" value={selectedPath.estimatedDuration} suffix="分钟" />
                  </Col>
                </Row>
              </Card>
            </Space>
          </div>
        )}
      </Drawer>

      {/* AI生成知识点模态框 */}
      <Modal
        title={<span><BulbOutlined style={{ color: '#ff6b6b', marginRight: '8px' }} />AI生成知识点</span>}
        open={aiKnowledgePointModalVisible}
        onCancel={() => setAIKnowledgePointModalVisible(false)}
        footer={null}
        width={600}
      >
        <Alert
          message="AI知识点生成"
          description="根据运动项目和学习目标，AI将为您生成结构化的知识点体系"
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />
        <Form layout="vertical">
          <Form.Item label="运动项目" required>
            <Select placeholder="选择运动项目">
              <Select.Option value="足球">足球</Select.Option>
              <Select.Option value="篮球">篮球</Select.Option>
              <Select.Option value="排球">排球</Select.Option>
              <Select.Option value="田径">田径</Select.Option>
              <Select.Option value="游泳">游泳</Select.Option>
              <Select.Option value="体操">体操</Select.Option>
              <Select.Option value="武术">武术</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="学习层级" required>
            <Radio.Group>
              <Radio value="basic">基础入门</Radio>
              <Radio value="intermediate">进阶提高</Radio>
              <Radio value="advanced">高级专业</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item label="知识点数量" required>
            <Select placeholder="选择生成数量">
              <Select.Option value={5}>5个知识点</Select.Option>
              <Select.Option value={10}>10个知识点</Select.Option>
              <Select.Option value={15}>15个知识点</Select.Option>
              <Select.Option value={20}>20个知识点</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="学习目标">
            <TextArea rows={3} placeholder="描述学习目标和要求，AI将据此生成相关知识点" />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setAIKnowledgePointModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" loading={loading}>
                生成知识点
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* AI生成学习路径模态框 */}
      <Modal
        title={<span><BulbOutlined style={{ color: '#52c41a', marginRight: '8px' }} />AI生成学习路径</span>}
        open={aiLearningPathModalVisible}
        onCancel={() => setAILearningPathModalVisible(false)}
        footer={null}
        width={700}
      >
        <Alert
          message="AI学习路径生成"
          description="AI将根据您的设置生成科学的学习路径，包含知识点安排、学习目标和时间规划"
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />
        <Form layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="运动项目" required>
                <Select placeholder="选择运动项目">
                  <Select.Option value="足球">足球</Select.Option>
                  <Select.Option value="篮球">篮球</Select.Option>
                  <Select.Option value="排球">排球</Select.Option>
                  <Select.Option value="田径">田径</Select.Option>
                  <Select.Option value="游泳">游泳</Select.Option>
                  <Select.Option value="体操">体操</Select.Option>
                  <Select.Option value="武术">武术</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="难度级别" required>
                <Select placeholder="选择难度级别">
                  <Select.Option value="beginner">初学者</Select.Option>
                  <Select.Option value="intermediate">中级</Select.Option>
                  <Select.Option value="advanced">高级</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="学习周期" required>
                <Select placeholder="选择学习周期">
                  <Select.Option value={30}>1个月</Select.Option>
                  <Select.Option value={60}>2个月</Select.Option>
                  <Select.Option value={90}>3个月</Select.Option>
                  <Select.Option value={180}>6个月</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="每周学习时间" required>
                <Select placeholder="选择每周学习时间">
                  <Select.Option value={3}>3小时/周</Select.Option>
                  <Select.Option value={5}>5小时/周</Select.Option>
                  <Select.Option value={8}>8小时/周</Select.Option>
                  <Select.Option value={12}>12小时/周</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="学习重点">
            <Checkbox.Group>
              <Row gutter={[16, 8]}>
                <Col span={8}><Checkbox value="theory">理论知识</Checkbox></Col>
                <Col span={8}><Checkbox value="technique">技术动作</Checkbox></Col>
                <Col span={8}><Checkbox value="tactics">战术理解</Checkbox></Col>
                <Col span={8}><Checkbox value="rules">规则裁判</Checkbox></Col>
                <Col span={8}><Checkbox value="physical">体能训练</Checkbox></Col>
                <Col span={8}><Checkbox value="psychology">心理素质</Checkbox></Col>
              </Row>
            </Checkbox.Group>
          </Form.Item>

          <Form.Item label="特殊要求">
            <TextArea rows={3} placeholder="描述任何特殊要求或期望，如特定技能重点、考试准备等" />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setAILearningPathModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" loading={loading}>
                生成学习路径
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default KnowledgeBase; 