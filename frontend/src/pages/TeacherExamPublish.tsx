import React, { useState, useEffect } from 'react';
import {
  Card, Form, Input, Button, Select, DatePicker, InputNumber, Switch, 
  Steps, Row, Col, Typography, Space, Tag, Modal, Table, Alert,
  Checkbox, Radio, Tabs, Divider, Tooltip, message, Spin, Progress,
  Timeline, Statistic, Badge, Empty
} from 'antd';
import {
  PlusOutlined, RocketOutlined, SettingOutlined, EyeOutlined,
  CalendarOutlined, ClockCircleOutlined, TeamOutlined, TrophyOutlined,
  BulbOutlined, ThunderboltOutlined, CheckOutlined, ExclamationCircleOutlined,
  UserOutlined, BookOutlined, CompassOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useTheme } from '../hooks/useTheme';
import { examAPI } from '../services/examAPI';
import { classAPI } from '../services/classAPI';
import { questionAPI } from '../services/questionAPI';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import '../styles/modern-theme.css';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { Step } = Steps;

// 接口定义
interface ExamConfig {
  title: string;
  description?: string;
  examConfig: {
    timeLimit: number;
    allowReview: boolean;
    randomOrder: boolean;
    allowRetake: boolean;
    maxAttempts: number;
  };
  autoGeneration: {
    enabled: boolean;
    criteria: {
      questionCount: number;
      difficulty: string[];
      categories: string[];
      knowledgeTypes: string[];
      questionTypes: string[];
      balanceStrategy: string;
      useAI: boolean;
    };
    questionIds?: string[];
  };
  targetAudience: {
    type?: string;
    classIds?: string[];
    gradeIds?: string[];
    studentIds?: string[];
    specificUsers?: string[];
  };
  schedule: {
    startTime: string;
    endTime: string;
    timezone: string;
  };
  grading: {
    passingScore: number;
    showScore: boolean;
    showAnswers: boolean;
    showAnalysis: boolean;
  };
}

const TeacherExamPublish: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [examConfig, setExamConfig] = useState<Partial<ExamConfig>>({});
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [availableClasses, setAvailableClasses] = useState<any[]>([]);
  const [availableGrades, setAvailableGrades] = useState<any[]>([]);
  const [classByGrade, setClassByGrade] = useState<Record<string, any[]>>({});
  const [selectedStudents, setSelectedStudents] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [publishedExams, setPublishedExams] = useState<any[]>([]);

  const { user, theme } = useSelector((state: RootState) => ({
    user: state.auth.user,
    theme: state.ui.theme
  }));
  
  const { isDark, primaryColor } = useTheme();
  const [form] = Form.useForm();

  // 在组件顶层使用Form.useWatch
  const currentType = Form.useWatch('type', form);
  const useAIValue = Form.useWatch('useAI', form);

  // 加载数据
  useEffect(() => {
    loadAvailableClasses();
    loadPublishedExams();
    loadAllStudents();
  }, []);

  // 获取可用班级
  const loadAvailableClasses = async () => {
    try {
      const response = await classAPI.getClasses({ 
        page: 1, 
        pageSize: 100,
        teacherId: user?.id 
      });
      
      if (response.data.success) {
        const classes = response.data.data.classes || response.data.data || [];
        setAvailableClasses(classes);
        
        // 按年级分组
        const groupedByGrade: Record<string, any[]> = {};
        const grades = new Set<string>();
        
        classes.forEach((cls: any) => {
          const grade = cls.grade || '未分年级';
          grades.add(grade);
          if (!groupedByGrade[grade]) {
            groupedByGrade[grade] = [];
          }
          groupedByGrade[grade].push(cls);
        });
        
        setClassByGrade(groupedByGrade);
        setAvailableGrades(Array.from(grades));
        
        if (classes.length === 0) {
          message.warning('暂无可用班级，请先创建班级');
        }
      } else {
        message.error('获取班级列表失败: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('获取班级列表失败:', error);
      message.error('获取班级列表失败');
    }
  };

  // 获取所有学生
  const loadAllStudents = async () => {
    try {
      // 这里需要实现获取所有学生的API
      setAllStudents([
        { id: '1', username: '张三', className: '三年级一班', grade: '三年级' },
        { id: '2', username: '李四', className: '三年级二班', grade: '三年级' }
      ]);
    } catch (error: any) {
      console.error('加载学生数据失败:', error);
    }
  };

  // 加载已发布考试
  const loadPublishedExams = async () => {
    try {
      // 这里需要实现获取已发布考试的API
      setPublishedExams([]);
    } catch (error: any) {
      console.error('加载考试列表失败:', error);
    }
  };

  // 发布考试
  const handlePublishExam = async () => {
    try {
      setLoading(true);
      
      // 获取表单数据
      const formValues = form.getFieldsValue();
      console.log('表单数据:', formValues);
      console.log('examConfig数据:', examConfig);
      
      // 验证必要字段
      if (!formValues.title && !examConfig.title) {
        message.error('请填写考试名称');
        setCurrentStep(0);
        return;
      }

      // 验证时间设置
      if (!formValues.startTime) {
        message.error('请选择考试开始时间');
        setCurrentStep(0);
        return;
      }

      if (!formValues.endTime) {
        message.error('请选择考试结束时间');
        setCurrentStep(0);
        return;
      }

      if (!formValues.validDays) {
        message.error('请设置考试有效时间');
        setCurrentStep(0);
        return;
      }

      // 验证AI组卷
      const useAI = formValues.useAI !== false; // 默认启用AI组卷
      if (useAI && generatedQuestions.length === 0) {
        message.error('请先生成题目');
        setCurrentStep(1);
        return;
      }

      if (useAI && selectedQuestions.length === 0) {
        message.error('请至少选择一道题目');
        setCurrentStep(1);
        return;
      }

      // 验证发布范围
      const targetType = formValues.type || examConfig.targetAudience?.type;
      if (!targetType) {
        message.error('请选择发布范围');
        setCurrentStep(2);
        return;
      }

      // 根据发布类型验证具体选择
      if (targetType === 'class') {
        const classIds = formValues.classIds || examConfig.targetAudience?.classIds || [];
        if (classIds.length === 0) {
          message.error('请至少选择一个班级');
          setCurrentStep(2);
          return;
        }
      } else if (targetType === 'grade') {
        const gradeIds = formValues.gradeIds || examConfig.targetAudience?.gradeIds || [];
        if (gradeIds.length === 0) {
          message.error('请至少选择一个年级');
          setCurrentStep(2);
          return;
        }
      } else if (targetType === 'specific') {
        const studentIds = formValues.studentIds || examConfig.targetAudience?.studentIds || [];
        if (studentIds.length === 0) {
          message.error('请至少选择一名学生');
          setCurrentStep(2);
          return;
        }
      }
      
      const examData = {
        title: formValues.title || examConfig.title,
        description: formValues.description || examConfig.description,
        examConfig: {
          timeLimit: formValues.timeLimit || 60,
          allowReview: formValues.allowReview || true,
          randomOrder: formValues.randomOrder || false,
          allowRetake: formValues.allowRetake || false,
          maxAttempts: formValues.maxAttempts || 1
        },
        targetAudience: {
          type: targetType,
          classIds: formValues.classIds || examConfig.targetAudience?.classIds || [],
          gradeIds: formValues.gradeIds || examConfig.targetAudience?.gradeIds || [],
          studentIds: formValues.studentIds || examConfig.targetAudience?.studentIds || [],
          specificUsers: formValues.specificUsers || examConfig.targetAudience?.specificUsers || []
        },
        schedule: {
          startTime: formValues.startTime ? formValues.startTime.toISOString() : new Date().toISOString(),
          endTime: formValues.endTime ? formValues.endTime.toISOString() : new Date(Date.now() + 3600000).toISOString(),
          validDays: formValues.validDays || 7,
          timezone: 'Asia/Shanghai'
        },
        grading: {
          passingScore: formValues.passingScore || 60,
          showScore: formValues.showScore || true,
          showAnswers: formValues.showAnswers || false,
          showAnalysis: formValues.showAnalysis || true
        },
        autoGeneration: {
          enabled: true,
          criteria: {
            questionCount: formValues.questionCount || 20,
            difficulty: formValues.difficulty || ['medium'],
            categories: formValues.categories || [],
            knowledgeTypes: formValues.knowledgeTypes || [],
            questionTypes: formValues.questionTypes || ['single_choice'],
            balanceStrategy: formValues.balanceStrategy || 'balanced',
            useAI: formValues.useAI || false
          },
          questionIds: selectedQuestions.length > 0 ? selectedQuestions : 
                       generatedQuestions.map(q => q.id)
        }
      };

      // 调用真实API发布考试
      console.log('发布考试数据:', examData);
      const response = await examAPI.publishExam(examData);
      
      if (response.data.success) {
        message.success(`考试发布成功！已通知 ${response.data.data.participantCount || 0} 名学生`);
        
        // 重置表单
        form.resetFields();
        setCurrentStep(0);
        setExamConfig({});
        setGeneratedQuestions([]);
        setSelectedQuestions([]);
        
        // 可选：跳转到考试监控页面
        setTimeout(() => {
          navigate('/exam-monitor');
        }, 1500);
      } else {
        message.error('考试发布失败：' + response.data.message);
      }
      
    } catch (error: any) {
      message.error('发布考试失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 步骤配置
  const steps = [
    { title: '基本信息', description: '考试信息和时间设置', icon: <BookOutlined /> },
    { title: 'AI智能组卷', description: '配置AI组卷参数', icon: <BulbOutlined /> },
    { title: '选择范围', description: '选择考试对象', icon: <TeamOutlined /> },
    { title: '发布考试', description: '确认并发布', icon: <RocketOutlined /> }
  ];

  // AI组卷相关配置选项
  const balanceStrategies = [
    { value: 'balanced', label: '难度均衡', description: '各难度题目平均分配' },
    { value: 'category_balanced', label: '分类均衡', description: '各知识分类平均分配' },
    { value: 'difficulty_focused', label: '难度集中', description: '集中在指定难度' },
    { value: 'weakness_focused', label: '薄弱环节', description: '针对学生薄弱知识点' },
    { value: 'random', label: '随机组卷', description: '完全随机选择题目' }
  ];

  const questionTypes = [
    { value: 'single_choice', label: '单选题' },
    { value: 'multiple_choice', label: '多选题' },
    { value: 'true_false', label: '判断题' },
    { value: 'fill_blank', label: '填空题' },
    { value: 'essay', label: '简答题' }
  ];

  const categoryOptions = ['足球', '篮球', '排球', '乒乓球', '羽毛球', '网球', '田径', '游泳', '体操', '武术'];
  const knowledgeTypeOptions = ['规则', '技术', '战术', '历史', '安全', '体能'];
  const difficultyOptions = [
    { value: 'easy', label: '简单', color: 'green' },
    { value: 'medium', label: '中等', color: 'orange' },
    { value: 'hard', label: '困难', color: 'red' }
  ];

  // AI自动组卷函数
  const handleAutoGeneration = async () => {
    setLoading(true);
    try {
      const formValues = form.getFieldsValue();
      console.log('组卷参数:', formValues);
      
      // 暂时使用模拟数据，直到后端API实现
      const mockQuestions = [
        {
          id: '1',
          title: '足球越位规则的定义是什么？',
          type: 'single_choice',
          difficulty: 'medium',
          category: { sport: '足球', knowledgeType: '规则' },
          estimatedTime: 2,
          options: ['A. 当进攻球员在最后一名防守球员前面时', 'B. 当进攻球员接球时位置超前', 'C. 当进攻球员在对方半场接球', 'D. 当进攻球员跑位过快时'],
          correctAnswer: 'B'
        },
        {
          id: '2', 
          title: '篮球罚球线距离篮筐多少米？',
          type: 'single_choice',
          difficulty: 'easy',
          category: { sport: '篮球', knowledgeType: '基础知识' },
          estimatedTime: 1,
          options: ['A. 4.6米', 'B. 5.8米', 'C. 6.0米', 'D. 6.25米'],
          correctAnswer: 'B'
        },
        {
          id: '3',
          title: '游泳自由泳的基本动作要领包括哪些？',
          type: 'multiple_choice',
          difficulty: 'hard',
          category: { sport: '游泳', knowledgeType: '技术' },
          estimatedTime: 3,
          options: ['A. 手臂划水动作', 'B. 腿部打水动作', 'C. 呼吸技巧', 'D. 身体姿态', 'E. 节奏控制'],
          correctAnswer: ['A', 'B', 'C', 'D']
        },
        {
          id: '4',
          title: '排球扣球时，起跳的最佳时机是什么？',
          type: 'single_choice',
          difficulty: 'medium',
          category: { sport: '排球', knowledgeType: '技术' },
          estimatedTime: 2,
          options: ['A. 传球刚离手时', 'B. 球到达最高点时', 'C. 球开始下降时', 'D. 球接近头顶时'],
          correctAnswer: 'C'
        },
        {
          id: '5',
          title: '田径100米短跑起跑技术中，"各就各位"阶段的要求是什么？',
          type: 'single_choice',
          difficulty: 'medium',
          category: { sport: '田径', knowledgeType: '技术' },
          estimatedTime: 2,
          options: ['A. 双手撑地，重心前移', 'B. 身体放松，准备起跑', 'C. 双脚踩稳起跑器，身体稳定', 'D. 抬头看前方'],
          correctAnswer: 'C'
        },
        {
          id: '6',
          title: '乒乓球发球时，球拍应该如何握持？',
          type: 'single_choice',
          difficulty: 'easy',
          category: { sport: '乒乓球', knowledgeType: '技术' },
          estimatedTime: 1,
          options: ['A. 拇指和食指夹住拍柄', 'B. 五指紧握拍柄', 'C. 只用拇指和食指', 'D. 手掌握住拍面'],
          correctAnswer: 'A'
        },
        {
          id: '7',
          title: '羽毛球比赛中，每局几分制？',
          type: 'single_choice',
          difficulty: 'easy',
          category: { sport: '羽毛球', knowledgeType: '规则' },
          estimatedTime: 1,
          options: ['A. 15分制', 'B. 21分制', 'C. 25分制', 'D. 30分制'],
          correctAnswer: 'B'
        },
        {
          id: '8',
          title: '网球比赛中，"Love"代表什么分数？',
          type: 'single_choice',
          difficulty: 'medium',
          category: { sport: '网球', knowledgeType: '规则' },
          estimatedTime: 2,
          options: ['A. 0分', 'B. 15分', 'C. 30分', 'D. 40分'],
          correctAnswer: 'A'
        },
        {
          id: '9',
          title: '体操运动对身体协调性的要求包括哪些方面？',
          type: 'multiple_choice',
          difficulty: 'hard',
          category: { sport: '体操', knowledgeType: '技术' },
          estimatedTime: 3,
          options: ['A. 平衡能力', 'B. 柔韧性', 'C. 力量控制', 'D. 节奏感', 'E. 空间感知'],
          correctAnswer: ['A', 'B', 'C', 'D', 'E']
        },
        {
          id: '10',
          title: '武术练习中，"马步"的主要作用是什么？',
          type: 'single_choice',
          difficulty: 'medium',
          category: { sport: '武术', knowledgeType: '技术' },
          estimatedTime: 2,
          options: ['A. 锻炼腿部力量', 'B. 提高平衡能力', 'C. 增强下盘稳定性', 'D. 以上都是'],
          correctAnswer: 'D'
        }
      ];

      // 根据用户设置的题目数量和难度偏好调整题目
      const questionCount = formValues.questionCount || 20;
      const selectedDifficulty = formValues.difficulty || ['medium'];
      const selectedCategories = formValues.categories || [];
      const selectedTypes = formValues.questionTypes || ['single_choice'];

      let filteredQuestions = mockQuestions;

      // 根据难度筛选
      if (selectedDifficulty.length > 0) {
        filteredQuestions = filteredQuestions.filter(q => 
          selectedDifficulty.includes(q.difficulty)
        );
      }

      // 根据分类筛选
      if (selectedCategories.length > 0) {
        filteredQuestions = filteredQuestions.filter(q => 
          selectedCategories.includes(q.category.sport)
        );
      }

      // 根据题目类型筛选
      if (selectedTypes.length > 0) {
        filteredQuestions = filteredQuestions.filter(q => 
          selectedTypes.includes(q.type)
        );
      }

      // 如果筛选后题目不够，使用所有题目
      if (filteredQuestions.length === 0) {
        filteredQuestions = mockQuestions;
      }

      // 生成指定数量的题目
      const expandedQuestions = [];
      for (let i = 0; i < questionCount; i++) {
        const baseIndex = i % filteredQuestions.length;
        const baseQuestion = filteredQuestions[baseIndex];
        expandedQuestions.push({
          ...baseQuestion,
          id: `${baseQuestion.id}_${i}`,
          title: i < filteredQuestions.length ? baseQuestion.title : `${baseQuestion.title} (变题${i + 1})`
        });
      }

      setGeneratedQuestions(expandedQuestions);
      setSelectedQuestions(expandedQuestions.map(q => q.id));
      
      message.success(`AI智能组卷成功！生成了 ${expandedQuestions.length} 道题目`);
      
    } catch (error: any) {
      console.error('AI组卷失败:', error);
      message.error('AI组卷失败：' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card title="考试基本信息">
            <Form.Item 
              name="title" 
              label="考试名称" 
              rules={[{ required: true, message: '请输入考试名称' }]}
            >
              <Input 
                placeholder="请输入考试名称，如：体育理论期中考试"
              />
            </Form.Item>

            <Form.Item name="description" label="考试描述">
              <TextArea 
                rows={3}
                placeholder="请输入考试描述，如：本次考试主要考查体育理论知识和运动技能理解"
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="timeLimit" label="考试时长（分钟）">
                  <InputNumber min={10} max={300} defaultValue={60} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="questionCount" label="题目数量">
                  <InputNumber min={5} max={100} defaultValue={20} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="validDays" label="有效时间（天）" rules={[{ required: true, message: '请设置考试有效时间' }]}>
                  <InputNumber min={1} max={365} defaultValue={7} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="startTime" label="开始时间" rules={[{ required: true, message: '请选择考试开始时间' }]}>
                  <DatePicker 
                    showTime
                    format="YYYY-MM-DD HH:mm"
                    style={{ width: '100%' }}
                    placeholder="选择考试开始时间"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="endTime" label="结束时间" rules={[{ required: true, message: '请选择考试结束时间' }]}>
                  <DatePicker 
                    showTime
                    format="YYYY-MM-DD HH:mm"
                    style={{ width: '100%' }}
                    placeholder="选择考试结束时间"
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        );

      case 1:
        return (
          <Card title="AI智能组卷">
            <Form.Item name="useAI" label="启用AI组卷" valuePropName="checked">
              <Switch 
                checkedChildren="是" 
                unCheckedChildren="否" 
                defaultChecked 
              />
            </Form.Item>

                         {useAIValue !== false && (
              <>
                <Form.Item name="questionCount" label="题目数量" rules={[{ required: true, message: '请设置题目数量' }]}>
                  <InputNumber min={5} max={100} defaultValue={20} style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item name="balanceStrategy" label="难度/分类平衡策略" rules={[{ required: true, message: '请选择平衡策略' }]}>
                  <Select 
                    style={{ width: '100%' }}
                    placeholder="选择难度/分类平衡策略"
                  >
                    {balanceStrategies.map(strategy => (
                      <Option key={strategy.value} value={strategy.value}>
                        {strategy.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item name="difficulty" label="题目难度" rules={[{ required: true, message: '请选择题目难度' }]}>
                  <Select 
                    mode="multiple"
                    style={{ width: '100%' }}
                    placeholder="选择题目难度"
                  >
                    {difficultyOptions.map(option => (
                      <Option key={option.value} value={option.value}>
                        <Badge color={option.color}>{option.label}</Badge>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item name="categories" label="题目分类" rules={[{ required: true, message: '请选择题目分类' }]}>
                  <Select 
                    mode="multiple"
                    style={{ width: '100%' }}
                    placeholder="选择题目分类"
                  >
                    {categoryOptions.map(category => (
                      <Option key={category} value={category}>
                        <Tag color="blue">{category}</Tag>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item name="knowledgeTypes" label="知识点类型" rules={[{ required: true, message: '请选择知识点类型' }]}>
                  <Select 
                    mode="multiple"
                    style={{ width: '100%' }}
                    placeholder="选择知识点类型"
                  >
                    {knowledgeTypeOptions.map(type => (
                      <Option key={type} value={type}>
                        <Tag color="purple">{type}</Tag>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item name="questionTypes" label="题目类型" rules={[{ required: true, message: '请选择题目类型' }]}>
                  <Select 
                    mode="multiple"
                    style={{ width: '100%' }}
                    placeholder="选择题目类型"
                  >
                    {questionTypes.map(type => (
                      <Option key={type.value} value={type.value}>
                        {type.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item name="autoGeneration" label="生成题目" style={{ marginTop: '24px' }}>
                  <Button 
                    type="primary" 
                    icon={<BulbOutlined />} 
                    loading={loading} 
                    onClick={handleAutoGeneration}
                  >
                    生成题目
                  </Button>
                </Form.Item>

                {/* 生成的题目预览 */}
                {generatedQuestions.length > 0 && (
                  <div style={{ marginTop: '24px' }}>
                    <Alert
                      message={`AI组卷完成！已生成 ${generatedQuestions.length} 道题目`}
                      description="您可以预览生成的题目，或者直接进入下一步选择目标群体。"
                      type="success"
                      showIcon
                      style={{ marginBottom: '16px' }}
                    />
                    
                    <Table
                      dataSource={generatedQuestions.slice(0, 10)} // 只显示前10道题
                      size="small"
                      rowKey="id"
                      rowSelection={{
                        selectedRowKeys: selectedQuestions,
                        onChange: (selectedRowKeys: React.Key[]) => {
                          setSelectedQuestions(selectedRowKeys.map(key => String(key)));
                        },
                        getCheckboxProps: () => ({
                          disabled: false
                        })
                      }}
                      columns={[
                        {
                          title: '题目',
                          dataIndex: 'title',
                          ellipsis: true,
                          render: (title, record) => (
                            <div>
                              <Text strong>{title}</Text>
                              <br />
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {record.category?.sport} - {record.category?.knowledgeType}
                              </Text>
                            </div>
                          )
                        },
                        {
                          title: '类型',
                          dataIndex: 'type',
                          width: 80,
                          render: (type) => {
                            const typeMap: any = {
                              'single_choice': '单选',
                              'multiple_choice': '多选',
                              'true_false': '判断',
                              'fill_blank': '填空',
                              'essay': '简答'
                            };
                            return <Tag color="blue">{typeMap[type] || type}</Tag>;
                          }
                        },
                        {
                          title: '难度',
                          dataIndex: 'difficulty',
                          width: 80,
                          render: (difficulty) => {
                            const colorMap: any = {
                              'easy': 'green',
                              'medium': 'orange',
                              'hard': 'red'
                            };
                            const labelMap: any = {
                              'easy': '简单',
                              'medium': '中等',
                              'hard': '困难'
                            };
                            return <Tag color={colorMap[difficulty]}>{labelMap[difficulty]}</Tag>;
                          }
                        },
                        {
                          title: '预计时间',
                          dataIndex: 'estimatedTime',
                          width: 100,
                          render: (time) => `${time} 分钟`
                        }
                      ]}
                      pagination={{
                        pageSize: 5,
                        showSizeChanger: false,
                        showQuickJumper: false,
                        showTotal: (total, range) => `显示第 ${range[0]}-${range[1]} 题，共 ${generatedQuestions.length} 题`
                      }}
                      style={{ marginTop: '16px' }}
                    />
                    
                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                      <Space>
                        <Button 
                          icon={<EyeOutlined />}
                          onClick={() => setPreviewVisible(true)}
                        >
                          预览所有题目
                        </Button>
                        <Text type="secondary">
                          已选择 {selectedQuestions.length} / {generatedQuestions.length} 道题目
                        </Text>
                      </Space>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>
        );

      case 2:
        return (
          <Card title="选择目标群体" className="modern-card">
            <Form.Item name="type" label="发布范围">
              <Radio.Group>
                <Space direction="vertical">
                  <Radio value="class">
                    <Space>
                      <TeamOutlined />
                      <span>按班级发布</span>
                    </Space>
                  </Radio>
                  <Radio value="grade">
                    <Space>
                      <BookOutlined />
                      <span>按年级发布</span>
                    </Space>
                  </Radio>
                  <Radio value="specific">
                    <Space>
                      <UserOutlined />
                      <span>指定学生</span>
                    </Space>
                  </Radio>
                  <Radio value="all">
                    <Space>
                      <CompassOutlined />
                      <span>全校发布</span>
                    </Space>
                  </Radio>
                </Space>
              </Radio.Group>
            </Form.Item>

            {/* 按班级发布 */}
            <Form.Item 
              name="classIds" 
              label="选择班级"
              style={{ 
                display: currentType === 'class' ? 'block' : 'none' 
              }}
            >
              <div>
                <Text strong style={{ marginBottom: '12px', display: 'block' }}>
                  请选择要发布考试的班级：
                </Text>
                
                {Object.keys(classByGrade).length > 0 ? (
                  <div>
                    {Object.entries(classByGrade).map(([grade, classes]) => (
                      <div key={grade} style={{ marginBottom: '16px' }}>
                        <Text strong style={{ 
                          color: primaryColor, 
                          fontSize: '14px',
                          marginBottom: '8px',
                          display: 'block'
                        }}>
                          📚 {grade}
                        </Text>
                        <Checkbox.Group style={{ width: '100%' }}>
                          <Row gutter={[12, 12]}>
                            {classes.map(cls => (
                              <Col span={12} key={cls.id || cls._id}>
                                <Checkbox 
                                  value={cls.id || cls._id}
                                  style={{ 
                                    width: '100%',
                                    padding: '8px 12px',
                                    border: '1px solid #e8e8e8',
                                    borderRadius: '6px',
                                    background: '#fafafa'
                                  }}
                                >
                                  <Space>
                                    <TeamOutlined />
                                    <div>
                                      <div style={{ fontWeight: 500 }}>{cls.name}</div>
                                      <Text type="secondary" style={{ fontSize: '12px' }}>
                                        {cls.studentCount || 0}名学生
                                      </Text>
                                    </div>
                                  </Space>
                                </Checkbox>
                              </Col>
                            ))}
                          </Row>
                        </Checkbox.Group>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Empty 
                    description="暂无可用班级" 
                    style={{ margin: '20px 0' }}
                  />
                )}
              </div>
            </Form.Item>

            {/* 按年级发布 */}
            <Form.Item 
              name="gradeIds" 
              label="选择年级"
              style={{ 
                display: currentType === 'grade' ? 'block' : 'none' 
              }}
            >
              <div>
                <Text strong style={{ marginBottom: '12px', display: 'block' }}>
                  请选择要发布考试的年级：
                </Text>
                
                <Checkbox.Group style={{ width: '100%' }}>
                  <Row gutter={[16, 16]}>
                    {availableGrades.map(grade => {
                      const gradeClasses = classByGrade[grade] || [];
                      const totalStudents = gradeClasses.reduce((sum, cls) => sum + (cls.studentCount || 0), 0);
                      
                      return (
                        <Col span={8} key={grade}>
                          <Checkbox 
                            value={grade}
                            style={{ 
                              width: '100%',
                              padding: '12px',
                              border: '1px solid #e8e8e8',
                              borderRadius: '8px',
                              background: '#fafafa'
                            }}
                          >
                            <Space direction="vertical" size={4}>
                              <div style={{ fontWeight: 500, fontSize: '14px' }}>
                                📚 {grade}
                              </div>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {gradeClasses.length}个班级 · {totalStudents}名学生
                              </Text>
                            </Space>
                          </Checkbox>
                        </Col>
                      );
                    })}
                  </Row>
                </Checkbox.Group>
              </div>
            </Form.Item>

            {/* 指定学生 */}
            <Form.Item 
              name="studentIds" 
              label="选择学生"
              style={{ 
                display: currentType === 'specific' ? 'block' : 'none' 
              }}
            >
              <div>
                <Text strong style={{ marginBottom: '12px', display: 'block' }}>
                  请选择参与考试的学生：
                </Text>
                
                <Table
                  size="small"
                  dataSource={allStudents}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  rowSelection={{
                    type: 'checkbox'
                  }}
                  columns={[
                    {
                      title: '学生姓名',
                      dataIndex: 'username',
                      render: (name) => (
                        <Space>
                          <UserOutlined />
                          <span>{name}</span>
                        </Space>
                      )
                    },
                    {
                      title: '班级',
                      dataIndex: 'className',
                      render: (className) => (
                        <Tag color="blue">{className || '未分班'}</Tag>
                      )
                    },
                    {
                      title: '年级',
                      dataIndex: 'grade',
                      render: (grade) => (
                        <Tag color="green">{grade || '未分年级'}</Tag>
                      )
                    }
                  ]}
                />
              </div>
            </Form.Item>
          </Card>
        );

      case 3:
        return (
          <Card title="确认发布" className="modern-card">
            <Alert
              message="考试发布确认"
              description="请确认考试信息无误后点击发布按钮。发布后将立即通知所有参与学生。"
              type="info"
              showIcon
              style={{ marginBottom: '24px' }}
            />
            
            <div style={{ textAlign: 'center' }}>
              <Button
                type="primary"
                size="large"
                icon={<RocketOutlined />}
                loading={loading}
                onClick={handlePublishExam}
              >
                立即发布考试
              </Button>
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{
      padding: '24px',
      background: isDark ? '#1a1a1a' : '#f5f5f5',
      minHeight: '100vh'
    }}>
      {/* 页面标题 */}
      <div style={{
        background: isDark ? '#1a1a1a' : '#ffffff',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px',
        border: `1px solid ${isDark ? '#404040' : '#e2e8f0'}`
      }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space align="center" size="large">
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                border: `2px solid ${isDark ? '#404040' : '#d9d9d9'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                background: isDark ? '#262626' : '#fafafa'
              }}>
                🤖
              </div>
              <div>
                <Title level={2} style={{ margin: 0, color: isDark ? '#ffffff' : '#1a1a1a' }}>
                  考试AI组卷系统
                </Title>
                <Text type="secondary" style={{ fontSize: '16px' }}>
                  智能组卷 · 精准测评 · 高效管理
                </Text>
              </div>
            </Space>
          </Col>
        </Row>
      </div>

      {/* 主要内容区域 */}
      <div style={{
        background: isDark ? '#1a1a1a' : '#ffffff',
        borderRadius: '8px',
        padding: '24px',
        border: `1px solid ${isDark ? '#404040' : '#e2e8f0'}`
      }}>
        {/* 步骤指示器 */}
        <Steps 
          current={currentStep} 
          style={{ marginBottom: '32px' }}
          size="small"
        >
          {steps.map((step, index) => (
            <Step
              key={index}
              title={step.title}
              description={step.description}
              icon={step.icon}
            />
          ))}
        </Steps>

        {/* 统一的表单 */}
        <Form
          form={form}
          layout="vertical"
          onValuesChange={(changedValues, allValues) => {
            console.log('表单值变化:', changedValues, allValues);
            setExamConfig(prev => ({
              ...prev,
              ...allValues,
              targetAudience: {
                ...prev.targetAudience,
                ...allValues
              }
            }));
          }}
          initialValues={{
            type: 'class',
            timeLimit: 60,
            questionCount: 20,
            validDays: 7,
            useAI: true,
            balanceStrategy: 'balanced',
            difficulty: ['medium'],
            categories: ['足球', '篮球'],
            knowledgeTypes: ['规则', '技术'],
            questionTypes: ['single_choice', 'multiple_choice']
          }}
        >
          {renderStepContent()}
        </Form>

        {/* 步骤导航 */}
        <div style={{ 
          marginTop: '32px', 
          textAlign: 'center',
          borderTop: `1px solid ${isDark ? '#404040' : '#e2e8f0'}`,
          paddingTop: '24px'
        }}>
          <Space size="large">
            {currentStep > 0 && (
              <Button 
                size="large"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                上一步
              </Button>
            )}
            {currentStep < steps.length - 1 && (
              <Button 
                type="primary" 
                size="large"
                onClick={() => setCurrentStep(currentStep + 1)}
              >
                下一步
              </Button>
            )}
          </Space>
        </div>
      </div>

      {/* 题目预览模态框 */}
      <Modal
        title="题目预览"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>
        ]}
      >
        <div style={{ maxHeight: '500px', overflow: 'auto' }}>
          {generatedQuestions.map((question, index) => (
            <Card 
              key={question.id} 
              size="small" 
              style={{ marginBottom: '16px' }}
              title={
                <Space>
                  <Text strong>第 {index + 1} 题</Text>
                  <Tag color="blue">{
                    question.type === 'single_choice' ? '单选题' :
                    question.type === 'multiple_choice' ? '多选题' :
                    question.type === 'true_false' ? '判断题' :
                    question.type === 'fill_blank' ? '填空题' : '简答题'
                  }</Tag>
                  <Tag color={
                    question.difficulty === 'easy' ? 'green' :
                    question.difficulty === 'medium' ? 'orange' : 'red'
                  }>
                    {question.difficulty === 'easy' ? '简单' :
                     question.difficulty === 'medium' ? '中等' : '困难'}
                  </Tag>
                </Space>
              }
              extra={
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  预计 {question.estimatedTime} 分钟
                </Text>
              }
            >
              <div>
                <Text strong style={{ fontSize: '14px' }}>{question.title}</Text>
                {question.options && (
                  <div style={{ marginTop: '12px' }}>
                    {question.options.map((option: string, optIndex: number) => (
                      <div key={optIndex} style={{ marginBottom: '4px' }}>
                        <Text>{option}</Text>
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#8c8c8c' }}>
                  分类: {question.category?.sport} - {question.category?.knowledgeType}
                </div>
              </div>
            </Card>
          ))}
          
          {generatedQuestions.length === 0 && (
            <Empty 
              description="暂无生成题目" 
              style={{ padding: '40px 0' }}
            />
          )}
        </div>
      </Modal>
    </div>
  );
};

export default TeacherExamPublish; 