import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, Select, Row, Col,
  Typography, Space, Tag, message, Statistic, Progress, Radio,
  Checkbox, Alert, Result, List, Avatar, Divider, Tabs, Badge
} from 'antd';
import {
  PlusOutlined, PlayCircleOutlined, EyeOutlined, ClockCircleOutlined,
  TrophyOutlined, FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined,
  HistoryOutlined, CalendarOutlined, BarChartOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { RootState } from '../types';
import { examAPI } from '../services/examAPI';
import ReactEcharts from 'echarts-for-react';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface Exam {
  _id: string;
  title: string;
  description?: string;
  config: {
    timeLimit: number;
    questionCount: number;
    passingScore: number;
  };
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  examType: 'practice' | 'mock_exam' | 'competition' | 'assessment';
  startedAt?: string;
  completedAt?: string;
  result?: {
    score: number;
    accuracy: number;
    totalTime: number;
    passed: boolean;
  };
  answers?: any[];
}

const ExamPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [loading, setLoading] = useState(false);
  const [examStats, setExamStats] = useState<any>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  
  // 丰富的考试数据
  const mockExams: Exam[] = [
    {
      _id: '1',
      title: '足球基础知识测试',
      description: '涵盖足球基本规则、技术要领和战术理解',
      config: {
        timeLimit: 60,
        questionCount: 20,
        passingScore: 70
      },
      status: 'completed',
      examType: 'assessment',
      startedAt: '2024-01-15T10:00:00Z',
      completedAt: '2024-01-15T10:45:00Z',
      result: {
        score: 85,
        accuracy: 85.0,
        totalTime: 2700,
        passed: true
      }
    },
    {
      _id: '2',
      title: '篮球技能综合考试',
      description: '篮球技术动作、规则理解和比赛战术分析',
      config: {
        timeLimit: 90,
        questionCount: 30,
        passingScore: 75
      },
      status: 'completed',
      examType: 'mock_exam',
      startedAt: '2024-01-12T14:00:00Z',
      completedAt: '2024-01-12T15:20:00Z',
      result: {
        score: 78,
        accuracy: 78.0,
        totalTime: 4800,
        passed: true
      }
    },
    {
      _id: '3',
      title: '游泳安全知识考核',
      description: '游泳安全知识、急救技能和泳池规则',
      config: {
        timeLimit: 45,
        questionCount: 15,
        passingScore: 80
      },
      status: 'not_started',
      examType: 'practice',
      startedAt: undefined,
      completedAt: undefined
    },
    {
      _id: '4',
      title: '排球规则与技术测试',
      description: '排球比赛规则、技术要领和裁判知识',
      config: {
        timeLimit: 75,
        questionCount: 25,
        passingScore: 72
      },
      status: 'in_progress',
      examType: 'assessment',
      startedAt: '2024-01-16T09:30:00Z',
      completedAt: undefined
    },
    {
      _id: '5',
      title: '田径运动基础考试',
      description: '短跑、长跑、跳跃和投掷项目的基础知识',
      config: {
        timeLimit: 60,
        questionCount: 20,
        passingScore: 70
      },
      status: 'completed',
      examType: 'competition',
      startedAt: '2024-01-10T16:00:00Z',
      completedAt: '2024-01-10T16:52:00Z',
      result: {
        score: 92,
        accuracy: 92.0,
        totalTime: 3120,
        passed: true
      }
    },
         {
       _id: '6', 
       title: '乒乓球技术与规则',
       description: '乒乓球技术动作、比赛规则和器材知识',
       config: {
         timeLimit: 50,
         questionCount: 18,
         passingScore: 75
       },
       status: 'not_started',
       examType: 'practice',
       startedAt: undefined,
       completedAt: undefined
     },
     // 教师创建的考试
     {
       _id: '7',
       title: '体操基本动作技能测试',
       description: '体操基本动作的技术要领和安全知识考核',
       config: {
         timeLimit: 40,
         questionCount: 15,
         passingScore: 80
       },
       status: 'not_started',
       examType: 'assessment',
       startedAt: undefined,
       completedAt: undefined
     },
     {
       _id: '8',
       title: '羽毛球双打战术分析',
       description: '羽毛球双打战术、配合技巧和比赛策略',
       config: {
         timeLimit: 55,
         questionCount: 22,
         passingScore: 72
       },
       status: 'not_started',
       examType: 'competition',
       startedAt: undefined,
       completedAt: undefined
     },
     {
       _id: '9',
       title: '网球技术综合评估',
       description: '网球基本技术、规则理解和比赛战术',
       config: {
         timeLimit: 70,
         questionCount: 25,
         passingScore: 75
       },
       status: 'not_started',
       examType: 'mock_exam',
       startedAt: undefined,
       completedAt: undefined
     },
     {
       _id: '10',
       title: '健身器械使用安全考试',
       description: '健身房器械正确使用方法和安全注意事项',
       config: {
         timeLimit: 35,
         questionCount: 12,
         passingScore: 85
       },
       status: 'not_started',
       examType: 'assessment',
       startedAt: undefined,
       completedAt: undefined
     }
  ];

  const [exams] = useState<Exam[]>(mockExams);

  const { user } = useSelector((state: RootState) => state.auth);
  const isTeacher = user?.role === 'teacher';
  const isAdmin = user?.role === 'admin';
  
  // 弹窗状态
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [examDetailVisible, setExamDetailVisible] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  
  // 考试进行状态
  const [currentExam, setCurrentExam] = useState<any>(null);
  const [examQuestions, setExamQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: any }>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [examStartTime, setExamStartTime] = useState<Date | null>(null);
  
  const [createForm] = Form.useForm();

  // 考试类型选项
  const examTypes = [
    { value: 'practice', label: '练习考试', color: 'blue' },
    { value: 'mock_exam', label: '模拟考试', color: 'green' },
    { value: 'competition', label: '竞赛考试', color: 'gold' },
    { value: 'assessment', label: '评估考试', color: 'purple' }
  ];

  // 分类选项
  const categoryOptions = [
    '足球', '篮球', '排球', '乒乓球', '羽毛球', '网球',
    '田径', '游泳', '体操', '武术', '健身', '其他'
  ];

  // 难度选项
  const difficultyOptions = [
    { value: 'easy', label: '简单' },
    { value: 'medium', label: '中等' },
    { value: 'hard', label: '困难' }
  ];

  // 获取考试列表（使用模拟数据）
  const fetchExams = async () => {
    setLoading(true);
    // 模拟API延迟
    setTimeout(() => {
      setPagination(prev => ({
        ...prev,
        total: mockExams.length
      }));
      setLoading(false);
    }, 500);
  };

  // 获取考试统计
  const fetchExamStats = async () => {
    try {
      const response = await examAPI.getExamStats();
      setExamStats(response.data.data);
    } catch (error: any) {
      message.error('获取考试统计失败：' + (error.response?.data?.message || error.message));
    }
  };

  useEffect(() => {
    fetchExams();
    fetchExamStats();
  }, [pagination.current, pagination.pageSize]);

  // 计时器
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (currentExam && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // 时间到，自动提交
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentExam, timeLeft]);

  // 创建考试
  const handleCreateExam = async (values: any) => {
    try {
      setLoading(true);
      await examAPI.createExam(values);
      message.success('考试创建成功');
      setCreateModalVisible(false);
      createForm.resetFields();
      fetchExams();
    } catch (error: any) {
      message.error('创建考试失败：' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 开始考试
  const handleStartExam = async (exam: Exam) => {
    try {
      setLoading(true);
      const response = await examAPI.startExam(exam._id);
      const examData = response.data.data;
      
      setCurrentExam(examData);
      setExamQuestions(examData.answers || []);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setTimeLeft(examData.config.timeLimit * 60); // 转换为秒
      setExamStartTime(new Date());
      setActiveTab('taking');
    } catch (error: any) {
      message.error('开始考试失败：' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 提交答案
  const handleSubmitAnswer = async (questionId: string, answer: any) => {
    try {
      const timeSpent = examStartTime ? 
        Math.floor((new Date().getTime() - examStartTime.getTime()) / 1000) : 0;
      
      await examAPI.submitAnswer(currentExam._id, {
        questionId,
        answer,
        timeSpent
      });
      
      setAnswers(prev => ({ ...prev, [questionId]: answer }));
    } catch (error: any) {
      message.error('提交答案失败：' + (error.response?.data?.message || error.message));
    }
  };

  // 提交考试
  const handleSubmitExam = async () => {
    try {
      setLoading(true);
      const response = await examAPI.finishExam(currentExam._id);
      
      // 显示考试结果
      setSelectedExam({
        ...currentExam,
        status: 'completed' as const,
        result: response.data.data.result,
        answers: response.data.data.answers
      });
      setActiveTab('result');
      fetchExams();
      fetchExamStats();
    } catch (error: any) {
      message.error('提交考试失败：' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 查看考试详情
  const handleViewExamDetail = async (exam: Exam) => {
    try {
      const response = await examAPI.getExam(exam._id);
      setSelectedExam(response.data.data);
      setExamDetailVisible(true);
    } catch (error: any) {
      message.error('获取考试详情失败：' + (error.response?.data?.message || error.message));
    }
  };

  // 编辑考试
  const handleEditExam = async (exam: Exam) => {
    try {
      // 设置表单值
      createForm.setFieldsValue({
        title: exam.title,
        description: exam.description,
        examType: exam.examType,
        config: exam.config
      });
      setSelectedExam(exam);
      setCreateModalVisible(true);
    } catch (error: any) {
      message.error('获取考试信息失败：' + (error.response?.data?.message || error.message));
    }
  };

  // 删除考试
  const handleDeleteExam = (exam: Exam) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除考试"${exam.title}"吗？此操作不可恢复。`,
      okText: '确定',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          // 模拟删除API调用
          await new Promise(resolve => setTimeout(resolve, 1000));
          message.success('删除成功');
          fetchExams();
        } catch (error: any) {
          message.error('删除失败');
        }
      }
    });
  };

  // 格式化时间
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 统计图表配置
  const getStatsChartOption = () => {
    if (!examStats) return {};

    const recentExams = examStats.recentExams || [];
    const dates = recentExams.map((exam: any) => 
      new Date(exam.completedAt).toLocaleDateString()
    );
    const scores = recentExams.map((exam: any) => exam.result.score);

    return {
      title: {
        text: '最近考试成绩趋势',
        left: 'center'
      },
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: dates
      },
      yAxis: {
        type: 'value',
        max: 100,
        axisLabel: {
          formatter: '{value}分'
        }
      },
      series: [{
        type: 'line',
        data: scores,
        itemStyle: { color: '#1890ff' },
        areaStyle: { opacity: 0.3 }
      }]
    };
  };

  // 考试列表表格列
  const examColumns = [
    {
      title: '考试名称',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: '类型',
      dataIndex: 'examType',
      key: 'examType',
      render: (type: string) => {
        const config = examTypes.find(t => t.value === type);
        return <Tag color={config?.color}>{config?.label || type}</Tag>;
      },
    },
    {
      title: '题目数量',
      dataIndex: ['config', 'questionCount'],
      key: 'questionCount',
      render: (count: number) => `${count}题`,
    },
    {
      title: '时长',
      dataIndex: ['config', 'timeLimit'],
      key: 'timeLimit',
      render: (time: number) => `${time}分钟`,
    },
    {
      title: '及格分',
      dataIndex: ['config', 'passingScore'],
      key: 'passingScore',
      render: (score: number) => `${score}分`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: Exam) => {
        const statusMap: any = {
          not_started: { text: '未开始', color: 'default' },
          in_progress: { text: '进行中', color: 'processing' },
          completed: { text: '已完成', color: 'success' },
          abandoned: { text: '已放弃', color: 'error' }
        };
        const config = statusMap[status] || { text: status, color: 'default' };
        return (
          <Badge status={config.color} text={config.text} />
        );
      },
    },
    {
      title: '成绩',
      key: 'score',
      render: (record: Exam) => {
        if (record.result) {
          return (
            <Text style={{ color: record.result.passed ? '#52c41a' : '#ff4d4f' }}>
              {record.result.score}分
            </Text>
          );
        }
        return <Text type="secondary">-</Text>;
      },
    },
    {
      title: '完成时间',
      dataIndex: 'completedAt',
      key: 'completedAt',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-',
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: Exam) => (
        <Space>
          {/* 学生操作 */}
          {!isTeacher && !isAdmin && (
            <>
              {record.status === 'not_started' && (
                <Button 
                  type="primary" 
                  size="small" 
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleStartExam(record)}
                >
                  开始考试
                </Button>
              )}
              {record.status === 'in_progress' && (
                <Button 
                  type="primary" 
                  size="small" 
                  icon={<PlayCircleOutlined />}
                  onClick={() => handleStartExam(record)}
                >
                  继续考试
                </Button>
              )}
              {record.status === 'completed' && (
                <Button 
                  size="small" 
                  icon={<EyeOutlined />}
                  onClick={() => handleViewExamDetail(record)}
                >
                  查看成绩
                </Button>
              )}
            </>
          )}
          
          {/* 教师/管理员操作 */}
          {(isTeacher || isAdmin) && (
            <>
              <Button 
                size="small" 
                icon={<EyeOutlined />}
                onClick={() => handleViewExamDetail(record)}
              >
                查看详情
              </Button>
              <Button 
                size="small" 
                onClick={() => handleEditExam(record)}
              >
                编辑
              </Button>
              <Button 
                size="small" 
                type="text"
                danger
                onClick={() => handleDeleteExam(record)}
              >
                删除
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  // 渲染考试列表
  const renderExamList = () => (
    <div>
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col span={(isTeacher || isAdmin) ? 18 : 24}>
          <Card>
            <Row gutter={16}>
              <Col span={6}>
                <Statistic 
                  title="总考试数" 
                  value={mockExams.length}
                  prefix={<FileTextOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="已完成" 
                  value={mockExams.filter(exam => exam.status === 'completed').length}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="平均分" 
                  value={83.5}
                  precision={1}
                  prefix={<TrophyOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="通过数" 
                  value={mockExams.filter(exam => exam.result?.passed).length}
                  prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        {(isTeacher || isAdmin) && (
          <Col span={6}>
            <Card style={{ textAlign: 'center' }}>
              <Button 
                type="primary" 
                size="large" 
                icon={<PlusOutlined />}
                onClick={() => setCreateModalVisible(true)}
                block
              >
                创建考试
              </Button>
            </Card>
          </Col>
        )}
      </Row>

      <Card title={isTeacher || isAdmin ? "考试管理" : "我的考试"}>
        <Table
          columns={examColumns}
          dataSource={exams}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            onChange: (page, size) => {
              setPagination(prev => ({ ...prev, current: page, pageSize: size! }));
            },
          }}
        />
      </Card>
    </div>
  );

  // 渲染正在考试界面
  const renderTakingExam = () => {
    if (!currentExam || !examQuestions.length) return null;

    const currentQuestion = examQuestions[currentQuestionIndex];
    const question = currentQuestion?.questionId;
    const progress = ((currentQuestionIndex + 1) / examQuestions.length) * 100;
    const currentAnswer = answers[question?._id];

    return (
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* 考试头部信息 */}
        <Card style={{ marginBottom: '16px' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={4} style={{ margin: 0 }}>
                {currentExam.title}
              </Title>
            </Col>
            <Col>
              <Space size="large">
                <Text>
                  <ClockCircleOutlined style={{ marginRight: '4px' }} />
                  剩余时间: <Text strong style={{ color: timeLeft < 300 ? '#ff4d4f' : '#1890ff' }}>
                    {formatTime(timeLeft)}
                  </Text>
                </Text>
                <Text>
                  题目: {currentQuestionIndex + 1} / {examQuestions.length}
                </Text>
              </Space>
            </Col>
          </Row>
          <Progress 
            percent={progress} 
            strokeColor={timeLeft < 300 ? '#ff4d4f' : '#1890ff'}
            style={{ marginTop: '8px' }}
          />
        </Card>

        {/* 题目内容 */}
        {question && (
          <Card>
            <div style={{ marginBottom: '16px' }}>
              <Space>
                <Tag color="blue">
                  {question.type === 'single_choice' ? '单选题' :
                   question.type === 'multiple_choice' ? '多选题' :
                   question.type === 'true_false' ? '判断题' :
                   question.type === 'fill_blank' ? '填空题' : '案例分析'}
                </Tag>
                <Tag color="cyan">
                  {typeof question.category === 'string' 
                    ? question.category 
                    : `${(question.category as any)?.sport || ''} - ${(question.category as any)?.knowledgeType || ''}`}
                </Tag>
                <Tag color={
                  question.difficulty === 'easy' ? 'green' :
                  question.difficulty === 'medium' ? 'orange' : 'red'
                }>
                  {question.difficulty === 'easy' ? '简单' :
                   question.difficulty === 'medium' ? '中等' : '困难'}
                </Tag>
              </Space>
            </div>

            <Title level={4}>{question.title}</Title>
            <div style={{ fontSize: '16px', marginBottom: '24px' }}>
              {question.content}
            </div>

            {/* 答题区域 */}
            {question.type === 'single_choice' && question.options && (
              <Radio.Group 
                value={currentAnswer} 
                onChange={(e) => {
                  const answer = e.target.value;
                  setAnswers(prev => ({ ...prev, [question._id]: answer }));
                  handleSubmitAnswer(question._id, answer);
                }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {question.options.map((option: string, index: number) => (
                    <Radio key={index} value={option} style={{ fontSize: '16px', padding: '8px 0' }}>
                      {String.fromCharCode(65 + index)}. {option}
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            )}

            {question.type === 'multiple_choice' && question.options && (
              <Checkbox.Group 
                value={currentAnswer || []} 
                onChange={(values) => {
                  setAnswers(prev => ({ ...prev, [question._id]: values }));
                  handleSubmitAnswer(question._id, values);
                }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {question.options.map((option: string, index: number) => (
                    <Checkbox key={index} value={option} style={{ fontSize: '16px', padding: '8px 0' }}>
                      {String.fromCharCode(65 + index)}. {option}
                    </Checkbox>
                  ))}
                </Space>
              </Checkbox.Group>
            )}

            {question.type === 'true_false' && (
              <Radio.Group 
                value={currentAnswer} 
                onChange={(e) => {
                  const answer = e.target.value;
                  setAnswers(prev => ({ ...prev, [question._id]: answer }));
                  handleSubmitAnswer(question._id, answer);
                }}
              >
                <Space size="large">
                  <Radio value="正确" style={{ fontSize: '16px' }}>
                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '4px' }} />
                    正确
                  </Radio>
                  <Radio value="错误" style={{ fontSize: '16px' }}>
                    <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: '4px' }} />
                    错误
                  </Radio>
                </Space>
              </Radio.Group>
            )}

            {/* 导航按钮 */}
            <div style={{ marginTop: '32px', textAlign: 'center' }}>
              <Space size="large">
                <Button 
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                >
                  上一题
                </Button>
                
                {currentQuestionIndex === examQuestions.length - 1 ? (
                  <Button 
                    type="primary" 
                    onClick={handleSubmitExam}
                    loading={loading}
                  >
                    提交考试
                  </Button>
                ) : (
                  <Button 
                    type="primary" 
                    onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                  >
                    下一题
                  </Button>
                )}
              </Space>
            </div>
          </Card>
        )}
      </div>
    );
  };

  // 渲染考试结果
  const renderExamResult = () => {
    if (!selectedExam || !selectedExam.result) return null;

    const { result, answers: examAnswers } = selectedExam;
    const passed = result.passed;

    return (
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <Card>
          <Result
            icon={passed ? 
              <TrophyOutlined style={{ color: '#52c41a' }} /> : 
              <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
            }
            title={passed ? '考试通过！' : '考试未通过'}
            subTitle={passed ? '恭喜您通过了本次考试' : '继续努力，下次一定能通过'}
          />

          <Row gutter={16} style={{ marginBottom: '24px', textAlign: 'center' }}>
            <Col span={6}>
              <Statistic title="得分" value={result.score} suffix="分" />
            </Col>
            <Col span={6}>
              <Statistic 
                title="正确率" 
                value={result.accuracy} 
                precision={1} 
                suffix="%" 
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="用时" 
                value={result.totalTime} 
                suffix="分钟" 
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="状态" 
                value={passed ? "通过" : "未通过"}
                valueStyle={{ color: passed ? '#52c41a' : '#ff4d4f' }}
              />
            </Col>
          </Row>

          <div style={{ textAlign: 'center' }}>
            <Space>
              <Button onClick={() => setActiveTab('list')}>
                返回列表
              </Button>
              <Button type="primary" onClick={() => setCreateModalVisible(true)}>
                再次考试
              </Button>
            </Space>
          </div>
        </Card>
      </div>
    );
  };

  // 渲染统计页面
  const renderStats = () => (
    <div>
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col span={24}>
          <Card title="考试统计概览">
            <Row gutter={16}>
              <Col span={6}>
                <Statistic 
                  title="总考试数" 
                  value={examStats?.stats?.totalExams || 0}
                  prefix={<FileTextOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="完成考试数" 
                  value={examStats?.stats?.completedExams || 0}
                  prefix={<CheckCircleOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="平均分数" 
                  value={examStats?.stats?.averageScore || 0}
                  precision={1}
                  suffix="分"
                  prefix={<BarChartOutlined />}
                />
              </Col>
              <Col span={6}>
                <Statistic 
                  title="通过考试数" 
                  value={examStats?.stats?.passedExams || 0}
                  prefix={<TrophyOutlined style={{ color: '#52c41a' }} />}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="成绩趋势">
            <ReactEcharts 
              option={getStatsChartOption()} 
              style={{ height: '300px' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="最近考试记录">
            <List
              dataSource={examStats?.recentExams || []}
              renderItem={(item: any, index: number) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar style={{ 
                        backgroundColor: item.result.passed ? '#52c41a' : '#ff4d4f' 
                      }}>
                        {item.result.score}
                      </Avatar>
                    }
                    title={item.title}
                    description={
                      <Space>
                        <Text type="secondary">
                          {new Date(item.completedAt).toLocaleDateString()}
                        </Text>
                        <Tag color={item.result.passed ? 'success' : 'error'}>
                          {item.result.passed ? '通过' : '未通过'}
                        </Tag>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  return (
    <div style={{ padding: '24px' }}>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane 
          tab={
            <span>
              <FileTextOutlined />
              考试列表
            </span>
          } 
          key="list"
        >
          {renderExamList()}
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <PlayCircleOutlined />
              正在考试
            </span>
          } 
          key="taking"
        >
          {renderTakingExam()}
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <TrophyOutlined />
              考试结果
            </span>
          } 
          key="result"
        >
          {renderExamResult()}
        </TabPane>
        
        <TabPane 
          tab={
            <span>
              <BarChartOutlined />
              统计分析
            </span>
          } 
          key="stats"
        >
          {renderStats()}
        </TabPane>
      </Tabs>

      {/* 创建考试弹窗 */}
      <Modal
        title="创建考试"
        open={createModalVisible}
        onCancel={() => {
          setCreateModalVisible(false);
          createForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateExam}
          initialValues={{
            examType: 'practice',
            timeLimit: 60,
            questionCount: 20,
            passingScore: 60
          }}
        >
          <Form.Item
            name="title"
            label="考试名称"
            rules={[{ required: true, message: '请输入考试名称' }]}
          >
            <Input placeholder="请输入考试名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="考试描述"
          >
            <TextArea rows={3} placeholder="请输入考试描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="examType"
                label="考试类型"
                rules={[{ required: true, message: '请选择考试类型' }]}
              >
                <Select>
                  {examTypes.map(type => (
                    <Option key={type.value} value={type.value}>
                      <Tag color={type.color}>{type.label}</Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="timeLimit"
                label="考试时长(分钟)"
                rules={[{ required: true, message: '请输入考试时长' }]}
              >
                <Input type="number" min={10} max={180} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="questionCount"
                label="题目数量"
                rules={[{ required: true, message: '请输入题目数量' }]}
              >
                <Input type="number" min={5} max={100} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="passingScore"
                label="及格分数"
                rules={[{ required: true, message: '请输入及格分数' }]}
              >
                <Input type="number" min={0} max={100} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="sports"
            label="运动分类"
          >
            <Select mode="multiple" placeholder="选择运动分类（不选则包含所有）">
              {categoryOptions.map(cat => (
                <Option key={cat} value={cat}>{cat}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="difficulty"
            label="难度等级"
          >
            <Select mode="multiple" placeholder="选择难度等级（不选则包含所有）">
              {difficultyOptions.map(diff => (
                <Option key={diff.value} value={diff.value}>{diff.label}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => {
                setCreateModalVisible(false);
                createForm.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                创建考试
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ExamPage; 