import React, { useState, useEffect } from 'react';
import {
  Table, Card, Button, Input, Select, Space, Tag, Modal, Form, 
  message, Popconfirm, Upload, Drawer, Radio, Checkbox, Divider,
  Row, Col, Statistic, Tooltip, Badge, Typography, Avatar, Progress, Alert
} from 'antd';
import {
  PlusOutlined, SearchOutlined, FilterOutlined, EditOutlined,
  DeleteOutlined, EyeOutlined, UploadOutlined, DownloadOutlined,
  RobotOutlined, ExclamationCircleOutlined, BulbOutlined,
  FireOutlined, ThunderboltOutlined, StarOutlined, TrophyOutlined,
  BookOutlined, FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { RootState } from '../types';
import { questionAPI } from '../services/questionAPI';
import { useTheme } from '../hooks/useTheme';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { confirm } = Modal;

interface Question {
  _id: string;
  title: string;
  content: string;
  type: 'single_choice' | 'multiple_choice' | 'true_false' | 'fill_blank' | 'case_analysis';
  options?: string[] | Array<{text: string; isCorrect: boolean; explanation?: string; _id?: string}>;
  correctAnswer: string | string[];
  explanation: string;
  category: string | { sport: string; knowledgeType: string; subCategory?: string };
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'draft' | 'pending_review' | 'published' | 'rejected';
  creator: any;
  tags: string[];
  createdAt: string;
  stats?: any;
  statistics?: any;
}

// 辅助函数：格式化分类信息
const formatCategory = (category: string | { sport: string; knowledgeType: string; subCategory?: string } | undefined): string => {
  if (!category) return '';
  if (typeof category === 'string') return category;
  return `${category.sport || ''} - ${category.knowledgeType || ''}`;
};

// 辅助函数：格式化选项文本
const formatOptionText = (option: string | {text: string; isCorrect: boolean; explanation?: string; _id?: string}): string => {
  if (typeof option === 'string') return option;
  return (option as any).text || '';
};

const QuestionBank: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // 丰富的样例题库数据（临时简化以修复运行时错误）
  const mockQuestions: Question[] = [
    {
      _id: '1',
      title: '足球比赛中的越位规则',
      content: '在足球比赛中，以下哪种情况不构成越位？',
      type: 'single_choice',
      options: [
        '球员接到队友传球时位置在对方半场',
        '球员接到队友传球时身后有对方防守队员',
        '球员在中场接到队友传球',
        '球员在角球区域接到队友传球'
      ],
      correctAnswer: '球员在中场接到队友传球',
      explanation: '越位规则只适用于对方半场，在中场接球不构成越位。此外，角球、界外球、球门球等定位球情况下也不构成越位。',
      category: '足球',
      difficulty: 'medium',
      status: 'published',
      creator: { username: '王教练', role: 'teacher' },
      tags: ['规则', '越位', '足球'],
      createdAt: '2024-01-15T10:30:00Z',
      stats: { totalAttempts: 324, correctAttempts: 256, accuracy: 79.0, averageTime: 45 }
    },
    {
      _id: '2',
      title: '篮球罚球技术要点',
      content: '篮球罚球时，以下哪个技术要点最重要？',
      type: 'single_choice',
      options: [
        '投篮力度要大',
        '投篮姿势要标准',
        '快速出手',
        '闭眼投篮'
      ],
      correctAnswer: '投篮姿势要标准',
      explanation: '标准的投篮姿势是罚球成功的关键，包括站位、持球手型、瞄准方式等都需要规范。',
      category: '篮球',
      difficulty: 'easy',
      status: 'published',
      creator: { username: '李老师', role: 'teacher' },
      tags: ['技术', '罚球', '篮球'],
      createdAt: '2024-01-14T16:45:00Z',
      stats: { totalAttempts: 189, correctAttempts: 167, accuracy: 88.4, averageTime: 35 }
    },
    {
      _id: '3',
      title: '游泳安全知识',
      content: '游泳时发生抽筋应该如何处理？（多选题）',
      type: 'multiple_choice',
      options: [
        '立即停止游泳动作',
        '深呼吸并放松身体',
        '按摩抽筋部位',
        '继续游泳直到岸边',
        '向他人求助'
      ],
      correctAnswer: ['立即停止游泳动作', '深呼吸并放松身体', '按摩抽筋部位', '向他人求助'],
      explanation: '游泳时抽筋要立即停止动作，保持冷静，通过深呼吸和按摩缓解，同时向他人求助确保安全。',
      category: '游泳',
      difficulty: 'medium',
      status: 'published',
      creator: { username: '张教练', role: 'teacher' },
      tags: ['安全', '急救', '游泳'],
      createdAt: '2024-01-13T14:20:00Z',
      statistics: { answeredCount: 156, correctCount: 124, accuracy: 79.5 }
    },
    {
      _id: '4',
      title: '奥运会历史知识',
      content: '现代奥运会是哪一年开始举办的？',
      type: 'single_choice',
      options: ['1892年', '1896年', '1900年', '1904年'],
      correctAnswer: '1896年',
      explanation: '现代奥运会由法国教育家皮埃尔·德·顾拜旦发起，首届现代奥运会于1896年在希腊雅典举行。',
      category: '体育历史',
      difficulty: 'easy',
      status: 'published',
      creator: { username: '刘老师', role: 'teacher' },
      tags: ['历史', '奥运会', '知识'],
      createdAt: '2024-01-12T09:15:00Z',
      statistics: { answeredCount: 278, correctCount: 245, accuracy: 88.1 }
    },
    {
      _id: '5',
      title: '田径运动规则',
      content: '100米短跑比赛中，运动员抢跑几次会被取消比赛资格？',
      type: 'single_choice',
      options: ['1次', '2次', '3次', '不会取消'],
      correctAnswer: '1次',
      explanation: '根据国际田联规则，在100米等短距离项目中，运动员抢跑1次即被取消比赛资格。',
      category: '田径',
      difficulty: 'medium',
      status: 'published',
      creator: { username: '陈教练', role: 'teacher' },
      tags: ['规则', '短跑', '田径'],
      createdAt: '2024-01-11T11:30:00Z',
      statistics: { answeredCount: 203, correctCount: 145, accuracy: 71.4 }
    },
    {
      _id: '6',
      title: '排球技术分析',
      content: '排球比赛中，自由防守队员（利贝罗）不能进行哪些动作？',
      type: 'multiple_choice',
      options: [
        '扣球',
        '拦网',
        '发球',
        '传球',
        '救球'
      ],
      correctAnswer: ['扣球', '拦网', '发球'],
      explanation: '自由防守队员主要负责后排防守，不能进行攻击性动作，包括扣球、拦网和发球。',
      category: '排球',
      difficulty: 'hard',
      status: 'published',
      creator: { username: '赵老师', role: 'teacher' },
      tags: ['技术', '规则', '排球'],
      createdAt: '2024-01-10T15:45:00Z',
      statistics: { answeredCount: 167, correctCount: 89, accuracy: 53.3 }
    },
    {
      _id: '7',
      title: '体育营养学基础',
      content: '运动前2-3小时应该如何安排饮食？',
      type: 'case_analysis',
      options: [],
      correctAnswer: '应该摄入易消化的碳水化合物，避免高脂肪和高纤维食物，确保充足的水分补充。',
      explanation: '运动前的饮食安排对运动表现至关重要，需要平衡营养摄入和消化时间。',
      category: '运动营养',
      difficulty: 'hard',
      status: 'published',
      creator: { username: '孙医生', role: 'teacher' },
      tags: ['营养', '饮食', '运动科学'],
      createdAt: '2024-01-09T13:20:00Z',
      statistics: { answeredCount: 134, correctCount: 87, accuracy: 64.9 }
    },
    {
      _id: '8',
      title: '乒乓球发球规则',
      content: '乒乓球发球时，球必须抛起多高？',
      type: 'true_false',
      options: [],
      correctAnswer: '正确',
      explanation: '根据国际乒联规则，发球时球必须从手掌上垂直抛起至少16厘米。',
      category: '乒乓球',
      difficulty: 'easy',
      status: 'published',
      creator: { username: '马教练', role: 'teacher' },
      tags: ['规则', '发球', '乒乓球'],
      createdAt: '2024-01-08T16:00:00Z',
      statistics: { answeredCount: 245, correctCount: 198, accuracy: 80.8 }
    },
    {
      _id: '9',
      title: '健身训练计划制定',
      content: '制定个人健身训练计划时需要考虑哪些因素？请详细分析。',
      type: 'case_analysis',
      options: [],
      correctAnswer: '需要考虑个人体质、健身目标、时间安排、运动基础、身体状况等多个因素进行综合分析。',
      explanation: '科学的训练计划需要个性化定制，综合考虑多种因素才能达到最佳效果。',
      category: '健身',
      difficulty: 'hard',
      status: 'published',
      creator: { username: '健身专家', role: 'teacher' },
      tags: ['健身', '训练', '计划'],
      createdAt: '2024-01-07T10:30:00Z',
      statistics: { answeredCount: 98, correctCount: 72, accuracy: 73.5 }
    },
    {
      _id: '10',
      title: '羽毛球裁判规则',
      content: '羽毛球比赛中，以下哪种情况属于违例？',
      type: 'single_choice',
      options: [
        '球拍触网',
        '球员跨过中线',
        '连续击球两次',
        '以上都是'
      ],
      correctAnswer: '以上都是',
      explanation: '羽毛球比赛中，球拍触网、跨越中线、连续击球都属于违例行为。',
      category: '羽毛球',
      difficulty: 'medium',
      status: 'published',
      creator: { username: '林教练', role: 'teacher' },
      tags: ['规则', '裁判', '羽毛球'],
      createdAt: '2024-01-06T14:15:00Z',
      statistics: { answeredCount: 178, correctCount: 134, accuracy: 75.3 }
    }
  ];

  const [questions, setQuestions] = useState<Question[]>(mockQuestions);
  const [total, setTotal] = useState(mockQuestions.length);
  
  // 搜索和过滤状态
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // 默认显示所有状态的题目
  const [typeFilter, setTypeFilter] = useState('');
  
  // 弹窗状态
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAIModalVisible, setIsAIModalVisible] = useState(false);
  const [isImportModalVisible, setIsImportModalVisible] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // 抽屉状态
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [viewQuestion, setViewQuestion] = useState<Question | null>(null);
  
  const [form] = Form.useForm();
  const [aiForm] = Form.useForm();
  const [baseOnKnowledge, setBaseOnKnowledge] = useState(false);
  const [knowledgeFiles, setKnowledgeFiles] = useState<any[]>([]);
  const { user } = useSelector((state: RootState) => state.auth);
  const { isDark, primaryColor } = useTheme();

  // 题目类型选项
  const questionTypes = [
    { value: 'single_choice', label: '单选题' },
    { value: 'multiple_choice', label: '多选题' },
    { value: 'true_false', label: '判断题' },
    { value: 'fill_blank', label: '填空题' },
    { value: 'case_analysis', label: '案例分析题' }
  ];

  // 难度选项
  const difficultyOptions = [
    { value: 'easy', label: '简单', color: 'green' },
    { value: 'medium', label: '中等', color: 'orange' },
    { value: 'hard', label: '困难', color: 'red' }
  ];

  // 状态选项
  const statusOptions = [
    { value: 'draft', label: '草稿', color: 'default' },
    { value: 'pending_review', label: '待审核', color: 'processing' },
    { value: 'published', label: '已发布', color: 'success' },
    { value: 'rejected', label: '已拒绝', color: 'error' }
  ];

  // 分类选项
  const categoryOptions = [
    '足球', '篮球', '排球', '乒乓球', '羽毛球', '网球',
    '田径', '游泳', '体操', '武术', '健身', '其他'
  ];

  // 加载知识库文件列表
  const loadKnowledgeFiles = async () => {
    try {
      // 模拟知识库文件数据
      const mockFiles = [
        { id: '1', name: '足球基础理论.pdf', size: '2.3MB', uploadTime: '2024-01-15' },
        { id: '2', name: '篮球技术要点.docx', size: '1.8MB', uploadTime: '2024-01-14' },
        { id: '3', name: '田径运动规则手册.pdf', size: '4.2MB', uploadTime: '2024-01-13' },
        { id: '4', name: '游泳安全知识.docx', size: '1.5MB', uploadTime: '2024-01-12' },
        { id: '5', name: '排球战术分析.pdf', size: '3.1MB', uploadTime: '2024-01-11' },
        { id: '6', name: '体操动作规范.pdf', size: '2.8MB', uploadTime: '2024-01-10' },
        { id: '7', name: '武术基本功训练.docx', size: '2.0MB', uploadTime: '2024-01-09' },
        { id: '8', name: '网球发球技巧.pdf', size: '1.9MB', uploadTime: '2024-01-08' }
      ];
      setKnowledgeFiles(mockFiles);
    } catch (error) {
      console.error('加载知识库文件失败:', error);
      message.error('加载知识库文件失败');
    }
  };

  // 获取题目列表（从后端API获取真实数据）
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      // 构建查询参数对象
      const params: any = {
        page: currentPage,
        limit: pageSize,
      };
      
      if (searchText) params.search = searchText;
      if (categoryFilter) params.category = categoryFilter;
      if (difficultyFilter) params.difficulty = difficultyFilter;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;

      console.log('获取题目列表，参数:', params);
      const response = await questionAPI.getQuestions(params);
      
      if (response.data.success) {
        const questionList = response.data.data.questions || [];
        const totalCount = response.data.data.pagination?.totalCount || questionList.length;
        
        // 确保questionList是数组格式
        if (Array.isArray(questionList)) {
          console.log('API返回的题目列表:', questionList.map((q: any) => ({
            id: q._id,
            title: q.title,
            status: q.status,
            isAIGenerated: q.isAIGenerated
          })));
          
          setQuestions(questionList);
          setTotal(totalCount);
          console.log('成功获取题目列表:', questionList.length, '道题目，总计:', totalCount);
        } else {
          console.warn('API返回的题目数据不是数组格式:', questionList);
          setQuestions(mockQuestions);
          setTotal(mockQuestions.length);
          message.warning('题目数据格式异常，已显示模拟数据');
        }
      } else {
        message.error('获取题目列表失败');
        // 如果API失败，使用模拟数据作为备用
        setQuestions(mockQuestions);
        setTotal(mockQuestions.length);
      }
    } catch (error: any) {
      console.error('获取题目列表失败:', error);
      message.error('获取题目列表失败：' + (error.response?.data?.message || error.message));
      // 如果API失败，使用模拟数据作为备用
      setQuestions(mockQuestions);
      setTotal(mockQuestions.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [currentPage, pageSize, searchText, categoryFilter, difficultyFilter, statusFilter, typeFilter]);

  useEffect(() => {
    loadKnowledgeFiles();
  }, []);

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  // 清除过滤器
  const clearFilters = () => {
    setSearchText('');
    setCategoryFilter('');
    setDifficultyFilter('');
    setStatusFilter('');
    setTypeFilter('');
    setCurrentPage(1);
  };

  // 打开新增/编辑弹窗
  const openModal = (question?: Question) => {
    setSelectedQuestion(question || null);
    setIsEditing(!!question);
    setIsModalVisible(true);
    
    if (question) {
      form.setFieldsValue({
        ...question,
        tags: question.tags.join(', ')
      });
    } else {
      form.resetFields();
    }
  };

  // 保存题目
  const handleSave = async (values: any) => {
    try {
      const data = {
        ...values,
        tags: values.tags ? values.tags.split(',').map((tag: string) => tag.trim()) : []
      };

      if (isEditing && selectedQuestion) {
        await questionAPI.updateQuestion(selectedQuestion._id, data);
        message.success('题目更新成功');
      } else {
        await questionAPI.createQuestion(data);
        message.success('题目创建成功');
      }

      setIsModalVisible(false);
      fetchQuestions();
    } catch (error: any) {
      message.error('保存失败：' + (error.response?.data?.message || error.message));
    }
  };

  // 删除题目
  const handleDelete = async (id: string) => {
    try {
      await questionAPI.deleteQuestion(id);
      message.success('删除成功');
      fetchQuestions();
    } catch (error: any) {
      message.error('删除失败：' + (error.response?.data?.message || error.message));
    }
  };

  // 查看题目详情
  const handleView = (question: Question) => {
    setViewQuestion(question);
    setDrawerVisible(true);
  };

  // AI生成题目
  const handleAIGenerate = async (values: any) => {
    try {
      setLoading(true);
      
      // 构建生成请求数据
      const generateData = {
        sport: values.sport,
        category: values.sport, // 兼容后端，将sport映射为category
        knowledgePoints: Array.isArray(values.knowledgePoint) ? values.knowledgePoint : [values.knowledgePoint],
        topic: values.topic,
        type: values.type,
        difficulty: values.difficulty,
        count: parseInt(values.count) || 1,
        baseOnKnowledge: values.baseOnKnowledge || false, // 是否基于知识库生成
        knowledgeSource: values.baseOnKnowledge ? 'knowledge_base' : 'ai_generation', // 知识来源
        knowledgeFileIds: values.baseOnKnowledge ? (values.knowledgeFileIds || []) : [] // 选择的知识库文件ID
      };

      console.log('发送AI生成请求:', generateData);

      // 设置前端超时处理（45秒）
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('请求超时，请检查网络连接后重试')), 45000);
      });

      const response = await Promise.race([
        questionAPI.generateQuestion(generateData),
        timeoutPromise
      ]);
      
      message.success(`AI成功生成 ${generateData.count} 道题目！`);
      setIsAIModalVisible(false);
      aiForm.resetFields();
      
      // 调用诊断API查看数据库状态
      try {
        const debugResponse = await questionAPI.debugQuestions();
        console.log('数据库诊断结果:', debugResponse.data);
      } catch (debugError) {
        console.error('诊断API调用失败:', debugError);
      }
      
      // 刷新题目列表
      await fetchQuestions();
    } catch (error: any) {
      console.error('AI生成失败:', error);
      
      let errorMessage = '生成失败，请检查参数后重试';
      if (error.message === '请求超时，请检查网络连接后重试') {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      message.error('AI生成失败：' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 批量导入题目
  const handleImport = async (file: any) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      await questionAPI.importQuestions(formData);
      message.success('批量导入成功');
      setIsImportModalVisible(false);
      fetchQuestions();
      return false; // 阻止默认上传行为
    } catch (error: any) {
      message.error('导入失败：' + (error.response?.data?.message || error.message));
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 审核题目
  const handleReview = (id: string, status: 'published' | 'rejected', reason?: string) => {
    confirm({
      title: `确认${status === 'published' ? '通过' : '拒绝'}这道题目吗？`,
      icon: <ExclamationCircleOutlined />,
      content: status === 'rejected' ? '请输入拒绝原因：' : '',
      onOk: async () => {
        try {
          await questionAPI.reviewQuestion(id, { status, reason });
          message.success(`审核${status === 'published' ? '通过' : '拒绝'}成功`);
          fetchQuestions();
        } catch (error: any) {
          message.error('审核失败：' + (error.response?.data?.message || error.message));
        }
      }
    });
  };

  // 表格列配置
  const columns = [
    {
      title: '题目',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: {
        showTitle: false,
      },
      render: (title: string, record: Question) => (
        <Tooltip title={title}>
          <a onClick={() => handleView(record)}>{title}</a>
        </Tooltip>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        const typeConfig = questionTypes.find(t => t.value === type);
        return <Tag color="blue">{typeConfig?.label || type}</Tag>;
      },
    },
    {
      title: '分类',
      key: 'category',
      width: 100,
      render: (record: Question) => (
        <Tag color="cyan">{formatCategory(record.category)}</Tag>
      ),
    },
    {
      title: '难度',
      dataIndex: 'difficulty',
      key: 'difficulty',
      width: 80,
      render: (difficulty: string) => {
        const config = difficultyOptions.find(d => d.value === difficulty);
        return <Tag color={config?.color}>{config?.label || difficulty}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config = statusOptions.find(s => s.value === status);
        return <Badge status={config?.color as any} text={config?.label || status} />;
      },
    },
    {
      title: '统计',
      key: 'statistics',
      width: 120,
      render: (record: Question) => (
        <div>
          <Text type="secondary">
            答题: {record.stats?.totalAttempts || 0}
          </Text>
          <br />
          <Text type="secondary">
            正确率: {record.stats?.accuracy ? record.stats.accuracy.toFixed(1) : '0.0'}%
          </Text>
        </div>
      ),
    },
    {
      title: '创建者',
      dataIndex: ['creator', 'username'],
      key: 'creator',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (record: Question) => (
        <Space size="small">
          <Tooltip title="查看">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => handleView(record)}
            />
          </Tooltip>
          
          {(user?.role === 'admin' || user?.role === 'super_admin' || 
            user?.role === 'content_manager' || record.creator._id === user?.id) && (
            <Tooltip title="编辑">
              <Button 
                type="text" 
                icon={<EditOutlined />} 
                onClick={() => openModal(record)}
              />
            </Tooltip>
          )}
          
          {(user?.role === 'admin' || user?.role === 'super_admin' || 
            user?.role === 'content_manager') && record.status === 'pending_review' && (
            <>
              <Tooltip title="通过">
                <Button 
                  type="text" 
                  style={{ color: '#52c41a' }}
                  onClick={() => handleReview(record._id, 'published')}
                >
                  ✓
                </Button>
              </Tooltip>
              <Tooltip title="拒绝">
                <Button 
                  type="text" 
                  danger
                  onClick={() => handleReview(record._id, 'rejected')}
                >
                  ✗
                </Button>
              </Tooltip>
            </>
          )}
          
          {(user?.role === 'admin' || user?.role === 'super_admin' || 
            record.creator._id === user?.id) && (
            <Popconfirm
              title="确认删除这道题目吗？"
              onConfirm={() => handleDelete(record._id)}
            >
              <Tooltip title="删除">
                <Button type="text" danger icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="animate-fadeIn" style={{ padding: '24px', minHeight: '100vh' }}>
      {/* 现代化标题区域 */}
      <div className="glass-panel" style={{
        padding: '32px',
        marginBottom: '24px',
        background: `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}05 100%)`,
        border: `1px solid ${primaryColor}30`,
        borderRadius: '16px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-30%',
          right: '-10%',
          width: '200px',
          height: '200px',
          background: `radial-gradient(circle, ${primaryColor}20 0%, transparent 70%)`,
          borderRadius: '50%'
        }} />
        
        <Row justify="space-between" align="middle" style={{ position: 'relative', zIndex: 1 }}>
          <Col>
            <Space direction="vertical" size="small">
              <Title level={2} className="gradient-text" style={{ margin: 0, fontSize: '2rem' }}>
                <BookOutlined style={{ marginRight: '12px' }} />
                智能题库管理
              </Title>
              <Text style={{ fontSize: '16px', color: isDark ? '#a1a1aa' : '#4a5568' }}>
                AI驱动的题目创建与管理平台
              </Text>
            </Space>
          </Col>
          <Col>
            <Space size="large">
              <Button 
                type="primary" 
                size="large"
                className="modern-button primary"
                icon={<PlusOutlined />}
                onClick={() => openModal()}
                style={{
                  borderRadius: '12px',
                  background: primaryColor,
                  border: 'none',
                  boxShadow: `0 4px 12px ${primaryColor}40`,
                  padding: '8px 24px',
                  height: '48px'
                }}
              >
                创建题目
              </Button>
              <Button 
                size="large"
                className="modern-button"
                icon={<RobotOutlined />}
                onClick={() => setIsAIModalVisible(true)}
                style={{
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%)',
                  color: 'white',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(255, 107, 107, 0.4)',
                  padding: '8px 24px',
                  height: '48px'
                }}
              >
                AI智能生成
              </Button>
              <Button 
                size="large"
                icon={<UploadOutlined />}
                onClick={() => setIsImportModalVisible(true)}
                style={{
                  borderRadius: '12px',
                  padding: '8px 20px',
                  height: '48px'
                }}
              >
                批量导入
              </Button>
              <Button 
                size="large"
                icon={<DownloadOutlined />}
                style={{
                  borderRadius: '12px',
                  padding: '8px 20px',
                  height: '48px'
                }}
              >
                导出数据
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* 统计卡片区域 */}
      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }}>
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
              <FileTextOutlined style={{
                fontSize: '24px',
                color: primaryColor,
                marginBottom: '12px',
                position: 'relative',
                zIndex: 1
              }} />
              <div className="stats-number" style={{ color: primaryColor }}>
                {total}
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
              <CheckCircleOutlined style={{
                fontSize: '24px',
                color: '#52c41a',
                marginBottom: '12px',
                position: 'relative',
                zIndex: 1
              }} />
              <div className="stats-number" style={{ color: '#52c41a' }}>
                {questions.filter(q => q.status === 'published').length}
              </div>
              <div className="stats-label">已发布</div>
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
              <ClockCircleOutlined style={{
                fontSize: '24px',
                color: '#faad14',
                marginBottom: '12px',
                position: 'relative',
                zIndex: 1
              }} />
              <div className="stats-number" style={{ color: '#faad14' }}>
                {questions.filter(q => q.status === 'pending_review').length}
              </div>
              <div className="stats-label">待审核</div>
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
                {questions.reduce((acc, q) => acc + (q.stats?.totalAttempts || 0), 0)}
              </div>
              <div className="stats-label">答题总数</div>
            </div>
          </div>
        </Col>
      </Row>

             {/* 现代化搜索过滤区域 */}
       <div className="modern-card animate-slideUp" style={{ 
         animationDelay: '0.5s',
         marginBottom: '24px',
         padding: '24px',
         borderRadius: '16px',
         border: `1px solid ${isDark ? '#404040' : '#e2e8f0'}`,
         background: isDark ? '#1a1a1a' : '#ffffff'
       }}>
         <Title level={4} style={{ marginBottom: '16px', color: primaryColor }}>
           <SearchOutlined style={{ marginRight: '8px' }} />
           筛选条件
         </Title>

        {/* 搜索和过滤器 */}
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col xs={24} sm={8} md={6}>
            <Input.Search
              placeholder="搜索题目标题或内容"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={handleSearch}
              allowClear
            />
          </Col>
          <Col xs={12} sm={4} md={3}>
            <Select
              placeholder="分类"
              value={categoryFilter}
              onChange={setCategoryFilter}
              allowClear
              style={{ width: '100%' }}
            >
              {categoryOptions.map(cat => (
                <Option key={cat} value={cat}>{cat}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={4} md={3}>
            <Select
              placeholder="难度"
              value={difficultyFilter}
              onChange={setDifficultyFilter}
              allowClear
              style={{ width: '100%' }}
            >
              {difficultyOptions.map(diff => (
                <Option key={diff.value} value={diff.value}>{diff.label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={4} md={3}>
            <Select
              placeholder="状态"
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              style={{ width: '100%' }}
            >
              {statusOptions.map(status => (
                <Option key={status.value} value={status.value}>{status.label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={4} md={3}>
            <Select
              placeholder="类型"
              value={typeFilter}
              onChange={setTypeFilter}
              allowClear
              style={{ width: '100%' }}
            >
              {questionTypes.map(type => (
                <Option key={type.value} value={type.value}>{type.label}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Space>
              <Button onClick={clearFilters}>清除过滤器</Button>
              <Text type="secondary">共 {total} 条记录</Text>
            </Space>
          </Col>
        </Row>

        {/* 题目表格 */}
        </div>

        {/* 现代化数据表格 */}
        <div className="modern-card animate-slideUp" style={{ 
          animationDelay: '0.6s',
          borderRadius: '16px',
          overflow: 'hidden',
          border: `1px solid ${isDark ? '#404040' : '#e2e8f0'}`,
          background: isDark ? '#1a1a1a' : '#ffffff'
        }}>
        <Table
          columns={columns}
          dataSource={questions}
          rowKey="_id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: currentPage,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            onChange: (page, size) => {
              setCurrentPage(page);
              setPageSize(size!);
            },
          }}
        />
        </div>

      {/* 新建/编辑题目弹窗 */}
      <Modal
        title={isEditing ? '编辑题目' : '新建题目'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            type: 'single_choice',
            difficulty: 'medium',
            status: 'draft'
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="title"
                label="标题"
                rules={[{ required: true, message: '请输入题目标题' }]}
              >
                <Input placeholder="请输入题目标题" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="type"
                label="题目类型"
                rules={[{ required: true, message: '请选择题目类型' }]}
              >
                <Select>
                  {questionTypes.map(type => (
                    <Option key={type.value} value={type.value}>{type.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="content"
            label="题目内容"
            rules={[{ required: true, message: '请输入题目内容' }]}
          >
            <TextArea rows={4} placeholder="请输入题目内容" />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.type !== currentValues.type
            }
          >
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              return (
                <>
                  {(type === 'single_choice' || type === 'multiple_choice') && (
                    <Form.List name="options">
                      {(fields, { add, remove }) => (
                        <>
                          <Form.Item label="选项">
                            {fields.map(({ key, name, ...restField }) => (
                              <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                <Form.Item
                                  {...restField}
                                  name={[name]}
                                  rules={[{ required: true, message: '请输入选项内容' }]}
                                  style={{ flex: 1 }}
                                >
                                  <Input placeholder={`选项 ${String.fromCharCode(65 + name)}`} />
                                </Form.Item>
                                <Button type="link" onClick={() => remove(name)}>
                                  删除
                                </Button>
                              </Space>
                            ))}
                            <Button type="dashed" onClick={() => add()} block>
                              添加选项
                            </Button>
                          </Form.Item>
                        </>
                      )}
                    </Form.List>
                  )}
                </>
              );
            }}
          </Form.Item>

          <Form.Item
            name="correctAnswer"
            label="正确答案"
            rules={[{ required: true, message: '请设置正确答案' }]}
          >
            <Input placeholder="请输入正确答案" />
          </Form.Item>

          <Form.Item
            name="explanation"
            label="答案解析"
          >
            <TextArea rows={3} placeholder="请输入答案解析" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="category"
                label="分类"
                rules={[{ required: true, message: '请选择分类' }]}
              >
                <Select>
                  {categoryOptions.map(cat => (
                    <Option key={cat} value={cat}>{cat}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="difficulty"
                label="难度"
                rules={[{ required: true, message: '请选择难度' }]}
              >
                <Select>
                  {difficultyOptions.map(diff => (
                    <Option key={diff.value} value={diff.value}>{diff.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="status"
                label="状态"
              >
                <Select>
                  {statusOptions.map(status => (
                    <Option key={status.value} value={status.value}>{status.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="tags"
            label="标签"
          >
            <Input placeholder="请输入标签，用逗号分隔" />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* AI生成题目弹窗 */}
      <Modal
        title={<span><BulbOutlined style={{ color: primaryColor, marginRight: '8px' }} />AI智能生成题目</span>}
        open={isAIModalVisible}
        onCancel={() => {
          setIsAIModalVisible(false);
          aiForm.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Alert
          message="AI生成提示"
          description={
            <div>
              <p>请填写详细的运动项目、知识点和题目描述，AI将根据您的要求生成高质量的体育题目。</p>
              <div style={{ marginTop: '8px' }}>
                <span style={{ color: '#666', fontSize: '12px' }}>快速示例：</span>
                <Button 
                  type="link" 
                  size="small"
                  onClick={() => {
                    aiForm.setFieldsValue({
                      sport: '足球',
                      knowledgePoint: ['越位规则', '裁判规则'],
                      topic: '生成关于足球越位规则判断的题目，包含具体的比赛场景，要求学生能够正确判断是否构成越位',
                      type: 'single_choice',
                      difficulty: 'medium',
                      count: 3
                    });
                  }}
                >
                  足球越位规则
                </Button>
                <Button 
                  type="link" 
                  size="small"
                  onClick={() => {
                    aiForm.setFieldsValue({
                      sport: '篮球',
                      knowledgePoint: ['投篮技巧', '技术动作'],
                      topic: '生成关于篮球投篮技术的题目，包含不同投篮方式的技术要点和注意事项',
                      type: 'multiple_choice',
                      difficulty: 'easy',
                      count: 2
                    });
                  }}
                >
                  篮球投篮技巧
                </Button>
              </div>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />
        <Form
          form={aiForm}
          layout="vertical"
          onFinish={handleAIGenerate}
          initialValues={{
            sport: '',
            knowledgePoint: [],
            baseOnKnowledge: false,
            topic: '',
            type: 'single_choice',
            difficulty: 'medium',
            count: 1
          }}
        >
          <Form.Item
            name="sport"
            label="运动项目"
            rules={[{ required: true, message: '请选择运动项目' }]}
          >
            <Select placeholder="请选择运动项目">
              {categoryOptions.map(cat => (
                <Option key={cat} value={cat}>{cat}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="knowledgePoint"
            label={
              <span>
                知识点内容
                <Tooltip title="选择或输入具体的知识点，可以多选。这将帮助AI生成更精准的题目内容。">
                  <QuestionCircleOutlined style={{ marginLeft: '4px', color: '#999' }} />
                </Tooltip>
              </span>
            }
            rules={[{ required: true, message: '请输入具体的知识点内容' }]}
          >
            <Select
              mode="tags"
              allowClear
              placeholder="请输入知识点，如：越位规则、投篮技巧、发球规则等"
              tokenSeparators={[',']}
            >
              <Option value="基本规则">基本规则</Option>
              <Option value="技术动作">技术动作</Option>
              <Option value="战术配合">战术配合</Option>
              <Option value="裁判规则">裁判规则</Option>
              <Option value="安全防护">安全防护</Option>
              <Option value="器材使用">器材使用</Option>
              <Option value="训练方法">训练方法</Option>
              <Option value="比赛规程">比赛规程</Option>
              <Option value="历史发展">历史发展</Option>
              <Option value="运动损伤">运动损伤</Option>
              <Option value="营养补充">营养补充</Option>
              <Option value="心理训练">心理训练</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="baseOnKnowledge"
            label="生成方式"
            rules={[{ required: true, message: '请选择生成方式' }]}
          >
            <Radio.Group 
              onChange={(e) => setBaseOnKnowledge(e.target.value)}
            >
              <Radio value={false}>自由生成</Radio>
              <Radio value={true}>基于知识库内容生成</Radio>
            </Radio.Group>
          </Form.Item>

          {baseOnKnowledge && (
            <Form.Item
              name="knowledgeFileIds"
              label="选择知识库文件"
              rules={[{ required: true, message: '请至少选择一个知识库文件' }]}
            >
              <Select
                mode="multiple"
                placeholder="请选择要基于的知识库文件"
                style={{ width: '100%' }}
                showSearch
                filterOption={(input, option) =>
                  (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {knowledgeFiles.map(file => (
                  <Option key={file.id} value={file.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{file.name}</span>
                      <span style={{ color: '#999', fontSize: '12px', marginLeft: '8px' }}>
                        {file.size} · {file.uploadTime}
                      </span>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="topic"
            label="详细描述"
            rules={[{ required: true, message: '请详细描述想要生成的题目内容' }]}
          >
            <TextArea 
              rows={3} 
              placeholder="请详细描述题目要求，例如：生成关于足球越位规则判断的选择题，包含具体的比赛场景和判断要点" 
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="type"
                label="题目类型"
                rules={[{ required: true, message: '请选择题目类型' }]}
              >
                <Select placeholder="请选择题目类型">
                  {questionTypes.map(type => (
                    <Option key={type.value} value={type.value}>{type.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="difficulty"
                label="难度级别"
                rules={[{ required: true, message: '请选择难度级别' }]}
              >
                <Select placeholder="请选择难度级别">
                  {difficultyOptions.map(diff => (
                    <Option key={diff.value} value={diff.value}>{diff.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="count"
                label="生成数量"
                rules={[{ required: true, message: '请输入生成数量' }]}
              >
                <Select placeholder="选择生成数量">
                  <Option value={1}>1题</Option>
                  <Option value={2}>2题</Option>
                  <Option value={3}>3题</Option>
                  <Option value={5}>5题</Option>
                  <Option value={10}>10题</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>



          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => {
                setIsAIModalVisible(false);
                aiForm.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                生成题目
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量导入弹窗 */}
      <Modal
        title="批量导入题目"
        open={isImportModalVisible}
        onCancel={() => setIsImportModalVisible(false)}
        footer={null}
        width={500}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Upload.Dragger
            accept=".xlsx,.xls,.csv"
            beforeUpload={handleImport}
            showUploadList={false}
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            </p>
            <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
            <p className="ant-upload-hint">
              支持 Excel (.xlsx, .xls) 和 CSV 格式文件
            </p>
          </Upload.Dragger>
          
          <Divider />
          
          <Button type="link" icon={<DownloadOutlined />}>
            下载导入模板
          </Button>
        </div>
      </Modal>

      {/* 题目详情抽屉 */}
      <Drawer
        title="题目详情"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={600}
      >
        {viewQuestion && (
          <div>
            <Title level={4}>{viewQuestion.title}</Title>
            
            <Row gutter={16} style={{ marginBottom: '16px' }}>
              <Col span={8}>
                <Statistic title="类型" value={
                  questionTypes.find(t => t.value === viewQuestion.type)?.label || viewQuestion.type
                } />
              </Col>
              <Col span={8}>
                <Statistic title="分类" value={formatCategory(viewQuestion.category)} />
              </Col>
              <Col span={8}>
                <Statistic title="难度" value={
                  difficultyOptions.find(d => d.value === viewQuestion.difficulty)?.label || viewQuestion.difficulty
                } />
              </Col>
            </Row>

            <Divider>题目内容</Divider>
            <div style={{ marginBottom: '16px' }}>
              <Text>{viewQuestion.content}</Text>
            </div>

            {viewQuestion.options && viewQuestion.options.length > 0 && (
              <>
                <Divider>选项</Divider>
                <div style={{ marginBottom: '16px' }}>
                  {viewQuestion.options.map((option, index) => (
                    <div key={index} style={{ marginBottom: '8px' }}>
                      <Text>
                        {String.fromCharCode(65 + index)}. {formatOptionText(option)}
                      </Text>
                    </div>
                  ))}
                </div>
              </>
            )}

            <Divider>正确答案</Divider>
            <div style={{ marginBottom: '16px' }}>
              <Text strong style={{ color: '#52c41a' }}>
                {Array.isArray(viewQuestion.correctAnswer) 
                  ? viewQuestion.correctAnswer.join(', ') 
                  : viewQuestion.correctAnswer}
              </Text>
            </div>

            {viewQuestion.explanation && (
              <>
                <Divider>答案解析</Divider>
                <div style={{ marginBottom: '16px' }}>
                  <Text>{viewQuestion.explanation}</Text>
                </div>
              </>
            )}

            {viewQuestion.tags && viewQuestion.tags.length > 0 && (
              <>
                <Divider>标签</Divider>
                <div style={{ marginBottom: '16px' }}>
                  {viewQuestion.tags.map(tag => (
                    <Tag key={tag} color="blue">{tag}</Tag>
                  ))}
                </div>
              </>
            )}

            <Divider>统计信息</Divider>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic title="答题人数" value={viewQuestion.stats?.totalAttempts || 0} />
              </Col>
              <Col span={8}>
                <Statistic title="答对人数" value={viewQuestion.stats?.correctAttempts || 0} />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="正确率" 
                  value={viewQuestion.stats?.accuracy || 0} 
                  suffix="%" 
                  precision={1}
                />
              </Col>
            </Row>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default QuestionBank; 