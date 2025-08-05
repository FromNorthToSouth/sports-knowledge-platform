import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Button, Select, Radio, Checkbox, Progress, 
  Typography, Space, Tag, message, Modal, Result, Statistic,
  Divider, Alert, Spin, Timeline, List, Avatar, Tooltip, Badge
} from 'antd';
import {
  PlayCircleOutlined, ReloadOutlined, CheckCircleOutlined,
  CloseCircleOutlined, ClockCircleOutlined, TrophyOutlined,
  BookOutlined, FireOutlined, BulbOutlined, HistoryOutlined,
  StarOutlined, OrderedListOutlined, ThunderboltOutlined,
  AimOutlined, SafetyOutlined, RocketOutlined, CrownOutlined,
  HeartOutlined, VideoCameraOutlined, EyeOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../types';
import { questionAPI } from '../services/questionAPI';
import { examAPI } from '../services/examAPI';
import { favoriteAPI } from '../services/favoriteAPI';
import { useTheme } from '../hooks/useTheme';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Group } = Radio;
const { confirm } = Modal;

interface Question {
  _id: string;
  title: string;
  content: string;
  type: 'single_choice' | 'multiple_choice' | 'true_false' | 'fill_blank' | 'case_analysis' | 'image_choice' | 'video_analysis';
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  category: string;
  subCategory?: string; // 二级分类
  knowledgePoint?: string; // 知识点标签
  difficulty: 'easy' | 'medium' | 'hard';
  tags?: string[]; // 题目标签
  media?: {
    type: 'image' | 'video';
    url: string;
    description?: string;
  }; // 多媒体内容
  points?: number; // 题目分值
}

interface PracticeSession {
  questions: Question[];
  currentIndex: number;
  answers: { [key: string]: any };
  startTime: Date;
  timeSpent: { [key: string]: number };
}

const Practice: React.FC = () => {
  const navigate = useNavigate();
  const [practiceMode, setPracticeMode] = useState<'random' | 'category' | 'difficulty' | 'wrong' | 'favorites' | 'sequential'>('random');
  const [practiceConfig, setPracticeConfig] = useState({
    category: '',
    subCategory: '',
    knowledgePoint: '',
    difficulty: '',
    questionCount: 10,
    timeLimit: 0, // 时间限制（分钟），0表示无限制
    showExplanation: true // 是否显示解析
  });
  
  // 练习状态
  const [isConfiguring, setIsConfiguring] = useState(true);
  const [isPracticing, setIsPracticing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // 练习会话数据
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState<any>(null);
  const [questionStartTime, setQuestionStartTime] = useState<Date>(new Date());
  
  // 结果数据
  const [practiceResult, setPracticeResult] = useState<any>(null);
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { isDark, primaryColor } = useTheme();

  // 创建默认学习资源图片
  const createDefaultResourceImage = (text: string, bgColor: string, textColor: string = '#ffffff') => {
    const svg = `
      <svg width="120" height="68" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${bgColor}88;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="120" height="68" rx="6" fill="url(#bg)"/>
        <text x="60" y="34" text-anchor="middle" dominant-baseline="middle" 
              fill="${textColor}" font-family="Arial, sans-serif" font-size="12" font-weight="bold">
          ${text}
        </text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  };

  // 现代化练习模式选项
  const practiceModes = [
    { 
      value: 'random', 
      label: '智能随机', 
      icon: <ThunderboltOutlined />,
      description: '从所有题目中随机选择，全面提升',
      color: primaryColor,
      gradient: `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}05 100%)`
    },
    { 
      value: 'category', 
      label: '专项训练', 
      icon: <AimOutlined />,
      description: '按运动分类专项训练，针对性强',
      color: '#52c41a',
      gradient: 'linear-gradient(135deg, #52c41a15 0%, #52c41a05 100%)'
    },
    { 
      value: 'difficulty', 
      label: '进阶挑战', 
      icon: <RocketOutlined />,
      description: '按难度等级循序渐进练习',
      color: '#faad14',
      gradient: 'linear-gradient(135deg, #faad1415 0%, #faad1405 100%)'
    },
    { 
      value: 'wrong', 
      label: '错题克星', 
      icon: <ReloadOutlined />,
      description: '针对历史错题重新练习',
      color: '#ff4d4f',
      gradient: 'linear-gradient(135deg, #ff4d4f15 0%, #ff4d4f05 100%)'
    },
    { 
      value: 'favorites', 
      label: '精选收藏', 
      icon: <HeartOutlined />,
      description: '练习收藏的重点题目',
      color: '#eb2f96',
      gradient: 'linear-gradient(135deg, #eb2f9615 0%, #eb2f9605 100%)'
    },
    { 
      value: 'sequential', 
      label: '系统学习', 
      icon: <OrderedListOutlined />,
      description: '按题库顺序逐题练习',
      color: '#722ed1',
      gradient: 'linear-gradient(135deg, #722ed115 0%, #722ed105 100%)'
    }
  ];

  // 运动分类选项（根据产品文档要求）
  const sportCategories = {
    '球类运动': {
      '足球': ['规则理解', '技术动作', '战术分析', '历史文化', '裁判知识'],
      '篮球': ['规则理解', '技术动作', '战术分析', '历史文化', '裁判知识'],
      '排球': ['规则理解', '技术动作', '战术分析', '历史文化', '裁判知识'],
      '乒乓球': ['规则理解', '技术动作', '战术分析', '历史文化', '器材知识'],
      '羽毛球': ['规则理解', '技术动作', '战术分析', '历史文化', '器材知识'],
      '网球': ['规则理解', '技术动作', '战术分析', '历史文化', '器材知识']
    },
    '田径运动': {
      '短跑': ['技术要领', '训练方法', '竞赛规则', '历史发展'],
      '长跑': ['技术要领', '训练方法', '竞赛规则', '营养知识'],
      '跳远': ['技术要领', '训练方法', '竞赛规则', '安全知识'],
      '跳高': ['技术要领', '训练方法', '竞赛规则', '安全知识'],
      '投掷': ['技术要领', '训练方法', '竞赛规则', '器材知识']
    },
    '水上运动': {
      '游泳': ['泳姿技术', '安全知识', '竞赛规则', '训练方法'],
      '跳水': ['技术要领', '安全知识', '竞赛规则', '训练方法']
    },
    '体操运动': {
      '竞技体操': ['技术动作', '评分规则', '器械知识', '安全防护'],
      '艺术体操': ['技术动作', '评分规则', '器械知识', '音乐配合']
    },
    '武术运动': {
      '太极拳': ['技术要领', '养生知识', '文化内涵', '历史发展'],
      '散打': ['技术要领', '规则理解', '安全防护', '训练方法']
    },
    '健身运动': {
      '健美操': ['动作技术', '音乐节拍', '健身效果', '安全知识'],
      '器械健身': ['器械使用', '训练计划', '安全知识', '营养搭配']
    }
  };

  // 获取所有运动类型
  const getAllSports = () => {
    const sports: string[] = [];
    Object.values(sportCategories).forEach(category => {
      sports.push(...Object.keys(category));
    });
    return sports;
  };

  // 获取知识点选项
  const getKnowledgePoints = (sport: string): string[] => {
    for (const category of Object.values(sportCategories)) {
      if ((category as any)[sport]) {
        return (category as any)[sport];
      }
    }
    return [];
  };

  // 难度选项
  const difficultyOptions = [
    { value: 'easy', label: '简单', color: 'green' },
    { value: 'medium', label: '中等', color: 'orange' },
    { value: 'hard', label: '困难', color: 'red' }
  ];

  // 开始练习
  const startPractice = async () => {
    try {
      setLoading(true);
      
      let questions: Question[] = [];
      
      switch (practiceMode) {
        case 'category':
          if (!practiceConfig.category) {
            message.error('请选择练习分类');
            return;
          }
          const categoryResponse = await questionAPI.getQuestions({
            category: practiceConfig.category,
            limit: practiceConfig.questionCount
          });
          questions = categoryResponse.data.data.questions;
          break;
          
        case 'difficulty':
          if (!practiceConfig.difficulty) {
            message.error('请选择练习难度');
            return;
          }
          const difficultyResponse = await questionAPI.getQuestions({
            difficulty: practiceConfig.difficulty,
            limit: practiceConfig.questionCount
          });
          questions = difficultyResponse.data.data.questions;
          break;
          
        case 'wrong':
          // 模拟错题数据
          questions = [
            {
              _id: 'wrong1',
              title: '足球越位规则判断',
              content: '球员在接球瞬间，身后有一名对方防守队员，此时是否构成越位？',
              type: 'true_false' as const,
              correctAnswer: '错误',
              explanation: '越位规则要求球员身后至少有两名对方球员（通常包括守门员），只有一名防守队员时构成越位。',
              category: '足球',
              difficulty: 'medium' as const
            },
            {
              _id: 'wrong2',
              title: '篮球犯规类型',
              content: '以下哪种情况属于技术犯规？',
              type: 'single_choice' as const,
              options: ['身体接触犯规', '向裁判抗议', '走步违例', '三秒违例'],
              correctAnswer: '向裁判抗议',
              explanation: '技术犯规是指队员或教练员的不当行为，包括向裁判抗议、不服从裁判等。',
              category: '篮球',
              difficulty: 'medium' as const
            },
            {
              _id: 'wrong3',
              title: '游泳安全知识',
              content: '游泳时发生抽筋的正确处理方法是什么？',
              type: 'multiple_choice' as const,
              options: ['立即停止游泳', '深呼吸放松', '按摩抽筋部位', '继续游泳', '呼救求助'],
              correctAnswer: ['立即停止游泳', '深呼吸放松', '按摩抽筋部位', '呼救求助'],
              explanation: '游泳抽筋时要立即停止游泳动作，通过深呼吸放松身体，按摩抽筋部位，同时向他人求助。',
              category: '游泳',
              difficulty: 'medium' as const
            }
          ].slice(0, practiceConfig.questionCount);
          break;
          
        case 'favorites':
          const favoritesResponse = await favoriteAPI.getFavorites({
            limit: practiceConfig.questionCount
          });
          questions = favoritesResponse.data.data.favorites.map((fav: any) => fav.question);
          break;
          
        case 'sequential':
          const sequentialResponse = await questionAPI.getQuestions({
            sort: 'createdAt',
            order: 'asc',
            limit: practiceConfig.questionCount
          });
          questions = sequentialResponse.data.data.questions;
          break;
          
        default: // random
          const randomResponse = await questionAPI.getQuestions({
            limit: practiceConfig.questionCount
          });
          questions = randomResponse.data.data.questions;
          break;
      }

      if (questions.length === 0) {
        message.warning('没有找到符合条件的题目');
        return;
      }

      // 创建练习会话
      const newSession: PracticeSession = {
        questions: questions.slice(0, practiceConfig.questionCount),
        currentIndex: 0,
        answers: {},
        startTime: new Date(),
        timeSpent: {}
      };

      setSession(newSession);
      setCurrentAnswer(null);
      setQuestionStartTime(new Date());
      setIsConfiguring(false);
      setIsPracticing(true);
      setIsCompleted(false);
    } catch (error: any) {
      message.error('开始练习失败：' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 提交答案
  const submitAnswer = () => {
    if (!session || currentAnswer === null || currentAnswer === undefined) {
      message.warning('请先选择答案');
      return;
    }

    const currentQuestion = session.questions[session.currentIndex];
    const now = new Date();
    const timeSpent = Math.floor((now.getTime() - questionStartTime.getTime()) / 1000);

    // 更新会话数据
    const updatedSession = {
      ...session,
      answers: {
        ...session.answers,
        [currentQuestion._id]: currentAnswer
      },
      timeSpent: {
        ...session.timeSpent,
        [currentQuestion._id]: timeSpent
      }
    };

    setSession(updatedSession);

    // 检查是否为最后一题
    if (session.currentIndex === session.questions.length - 1) {
      // 完成练习
      finishPractice(updatedSession);
    } else {
      // 下一题
      nextQuestion(updatedSession);
    }
  };

  // 下一题
  const nextQuestion = (updatedSession: PracticeSession) => {
    const newSession = {
      ...updatedSession,
      currentIndex: updatedSession.currentIndex + 1
    };
    setSession(newSession);
    setCurrentAnswer(null);
    setQuestionStartTime(new Date());
  };

  // 上一题
  const prevQuestion = () => {
    if (!session || session.currentIndex === 0) return;
    
    const newSession = {
      ...session,
      currentIndex: session.currentIndex - 1
    };
    setSession(newSession);
    
    // 恢复之前的答案
    const prevQuestion = session.questions[session.currentIndex - 1];
    setCurrentAnswer(session.answers[prevQuestion._id] || null);
  };

  // 完成练习
  const finishPractice = async (finalSession: PracticeSession) => {
    try {
      // 计算结果
      let correctCount = 0;
      let totalTime = 0;
      const results = finalSession.questions.map((question, index) => {
        const userAnswer = finalSession.answers[question._id];
        const isCorrect = userAnswer === question.correctAnswer ||
          (Array.isArray(question.correctAnswer) && 
           Array.isArray(userAnswer) && 
           userAnswer.length === question.correctAnswer.length &&
           userAnswer.every((ans: any) => question.correctAnswer.includes(ans)));
        
        if (isCorrect) correctCount++;
        totalTime += finalSession.timeSpent[question._id] || 0;

        return {
          question,
          userAnswer,
          isCorrect,
          timeSpent: finalSession.timeSpent[question._id] || 0
        };
      });

      const accuracy = (correctCount / finalSession.questions.length) * 100;
      const avgTime = totalTime / finalSession.questions.length;

      const result = {
        totalQuestions: finalSession.questions.length,
        correctCount,
        accuracy,
        totalTime,
        avgTime,
        results,
        startTime: finalSession.startTime,
        endTime: new Date()
      };

      setPracticeResult(result);
      setIsPracticing(false);
      setIsCompleted(true);

      // 记录练习结果到后端
      // TODO: 调用API保存练习记录

    } catch (error: any) {
      message.error('保存练习结果失败：' + (error.response?.data?.message || error.message));
    }
  };

  // 重新开始
  const restart = () => {
    setIsConfiguring(true);
    setIsPracticing(false);
    setIsCompleted(false);
    setSession(null);
    setCurrentAnswer(null);
    setPracticeResult(null);
  };

  // 渲染现代化练习配置界面
  const renderConfiguration = () => (
    <div className="animate-fadeIn" style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', minHeight: '100vh' }}>
      {/* 现代化标题区域 */}
      <div className="glass-panel" style={{ 
        padding: '40px', 
        marginBottom: '32px',
        background: `linear-gradient(135deg, ${primaryColor}20 0%, ${primaryColor}10 100%)`,
        border: `1px solid ${primaryColor}30`,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ 
          position: 'absolute',
          top: '-50%',
          left: '-10%',
          width: '200px',
          height: '200px',
          background: `radial-gradient(circle, ${primaryColor}20 0%, transparent 70%)`,
          borderRadius: '50%'
        }} />
        
        <Title level={1} className="gradient-text" style={{ margin: 0, fontSize: '2.5rem' }}>
          <RocketOutlined style={{ marginRight: '12px' }} />
          智能练习中心
        </Title>
        <Text style={{ fontSize: '18px', marginTop: '12px', display: 'block' }}>
          选择最适合您的练习模式，开启个性化学习之旅
        </Text>
      </div>

      {/* 现代化模式选择卡片 */}
      <Row gutter={[24, 24]} style={{ marginBottom: '40px' }}>
                 {practiceModes.map((mode, index) => (
           <Col xs={24} sm={12} lg={8} key={mode.value}>
             <div 
               className={`modern-card animate-slideUp ${practiceMode === mode.value ? 'selected-mode' : ''}`}
               style={{ 
                 animationDelay: `${index * 0.1}s`,
                 cursor: 'pointer',
                 transition: 'all 0.3s ease',
                 transform: practiceMode === mode.value ? 'translateY(-8px)' : 'translateY(0)',
                 border: practiceMode === mode.value ? `2px solid ${mode.color}` : '2px solid transparent',
                 background: practiceMode === mode.value ? mode.gradient : 'var(--color-bg-container)',
                 boxShadow: practiceMode === mode.value ? 
                   `0 20px 40px ${mode.color}30` : 
                   'var(--shadow-md)'
               }}
               onClick={() => setPracticeMode(mode.value as any)}
             >
               <div style={{ 
                 padding: '32px 24px',
                 textAlign: 'center',
                 position: 'relative'
               }}>
                 {practiceMode === mode.value && (
                   <Badge 
                     count={<CheckCircleOutlined style={{ color: mode.color }} />}
                     style={{ position: 'absolute', top: '12px', right: '12px' }}
                   />
                 )}
                 
                 <div style={{ 
                   fontSize: '48px', 
                   marginBottom: '16px', 
                   color: mode.color,
                   filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                 }}>
                   {mode.icon}
                 </div>
                 
                 <Title level={3} style={{ 
                   marginBottom: '12px', 
                   color: practiceMode === mode.value ? mode.color : 'inherit'
                 }}>
                   {mode.label}
                 </Title>
                 
                 <Text style={{ 
                   fontSize: '14px',
                   lineHeight: '1.6',
                   color: 'var(--color-text-secondary)'
                 }}>
                   {mode.description}
                 </Text>
               </div>
             </div>
           </Col>
         ))}
       </Row>

      {/* 现代化练习配置 */}
      <div className="modern-card animate-slideUp" style={{ animationDelay: '0.8s', marginBottom: '32px' }}>
        <Card 
          title={
            <Space>
              <SafetyOutlined style={{ color: primaryColor }} />
              <span className="gradient-text">练习配置</span>
            </Space>
          }
          style={{ 
            border: `1px solid ${primaryColor}20`,
            borderRadius: '16px'
          }}
          bodyStyle={{ padding: '32px' }}
        >
          <Row gutter={24}>
            {practiceMode === 'category' && (
              <>
                <Col span={8}>
                  <div style={{ marginBottom: '12px' }}>
                    <Text strong style={{ fontSize: '16px' }}>选择运动分类</Text>
                  </div>
                  <Select
                    size="large"
                    style={{ width: '100%' }}
                    placeholder="请选择运动分类"
                    value={practiceConfig.category}
                    onChange={(value) => setPracticeConfig(prev => ({ 
                      ...prev, 
                      category: value, 
                      knowledgePoint: '' // 重置知识点选择
                    }))}
                  >
                    {getAllSports().map((category: string) => (
                      <Option key={category} value={category}>{category}</Option>
                    ))}
                  </Select>
                </Col>
                
                {practiceConfig.category && (
                  <Col span={8}>
                    <div style={{ marginBottom: '12px' }}>
                      <Text strong style={{ fontSize: '16px' }}>选择知识点</Text>
                      <Text type="secondary" style={{ fontSize: '14px', marginLeft: '8px' }}>(可选)</Text>
                    </div>
                    <Select
                      size="large"
                      style={{ width: '100%' }}
                      placeholder="选择具体知识点"
                      value={practiceConfig.knowledgePoint}
                      onChange={(value) => setPracticeConfig(prev => ({ ...prev, knowledgePoint: value }))}
                      allowClear
                    >
                      {getKnowledgePoints(practiceConfig.category).map((point: string) => (
                        <Option key={point} value={point}>{point}</Option>
                      ))}
                    </Select>
                  </Col>
                )}
              </>
            )}

            {practiceMode === 'difficulty' && (
              <Col span={8}>
                <div style={{ marginBottom: '12px' }}>
                  <Text strong style={{ fontSize: '16px' }}>选择难度</Text>
                </div>
                <Select
                  size="large"
                  style={{ width: '100%' }}
                  placeholder="请选择难度等级"
                  value={practiceConfig.difficulty}
                  onChange={(value) => setPracticeConfig(prev => ({ ...prev, difficulty: value }))}
                >
                  {difficultyOptions.map(diff => (
                    <Option key={diff.value} value={diff.value}>
                      <Tag color={diff.color}>{diff.label}</Tag>
                    </Option>
                  ))}
                </Select>
              </Col>
            )}

            <Col span={8}>
              <div style={{ marginBottom: '12px' }}>
                <Text strong style={{ fontSize: '16px' }}>题目数量</Text>
              </div>
              <Select
                size="large"
                style={{ width: '100%' }}
                value={practiceConfig.questionCount}
                onChange={(value) => setPracticeConfig(prev => ({ ...prev, questionCount: value }))}
              >
                <Option value={5}>5题 - 快速练习</Option>
                <Option value={10}>10题 - 标准练习</Option>
                <Option value={20}>20题 - 强化练习</Option>
                <Option value={30}>30题 - 深度练习</Option>
                <Option value={50}>50题 - 挑战练习</Option>
              </Select>
            </Col>
          </Row>
        </Card>
      </div>

      {/* 现代化开始按钮 */}
      <div style={{ textAlign: 'center' }}>
        <Button 
          type="primary" 
          size="large" 
          className="modern-button primary"
          icon={<PlayCircleOutlined />}
          loading={loading}
          onClick={startPractice}
          style={{
            height: '60px',
            fontSize: '18px',
            padding: '0 48px',
            borderRadius: '30px',
            boxShadow: `0 8px 24px ${primaryColor}40`,
            border: 'none',
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`
          }}
        >
          开始练习之旅
        </Button>
      </div>
    </div>
  );

  // 渲染答题界面
  const renderPractice = () => {
    if (!session) return null;

    const currentQuestion = session.questions[session.currentIndex];
    const progress = ((session.currentIndex + 1) / session.questions.length) * 100;

    return (
      <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
        {/* 进度条 */}
        <Card style={{ marginBottom: '16px' }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Text strong>
                第 {session.currentIndex + 1} 题 / 共 {session.questions.length} 题
              </Text>
            </Col>
            <Col>
              <Text type="secondary">
                <ClockCircleOutlined style={{ marginRight: '4px' }} />
                已用时间: {Math.floor((new Date().getTime() - session.startTime.getTime()) / 60000)}分钟
              </Text>
            </Col>
          </Row>
          <Progress 
            percent={progress} 
            strokeColor="#1890ff"
            style={{ marginTop: '8px' }}
          />
        </Card>

        {/* 题目内容 */}
        <Card>
          <div style={{ marginBottom: '16px' }}>
            <Row justify="space-between" align="middle">
              <Col>
                <Space>
                  <Tag color="blue">
                    {currentQuestion.type === 'single_choice' ? '单选题' :
                     currentQuestion.type === 'multiple_choice' ? '多选题' :
                     currentQuestion.type === 'true_false' ? '判断题' :
                     currentQuestion.type === 'fill_blank' ? '填空题' : '案例分析'}
                  </Tag>
                  <Tag color="cyan">
                    {typeof currentQuestion.category === 'string' 
                      ? currentQuestion.category 
                      : `${(currentQuestion.category as any)?.sport || ''} - ${(currentQuestion.category as any)?.knowledgeType || ''}`}
                  </Tag>
                  <Tag color={
                    currentQuestion.difficulty === 'easy' ? 'green' :
                    currentQuestion.difficulty === 'medium' ? 'orange' : 'red'
                  }>
                    {currentQuestion.difficulty === 'easy' ? '简单' :
                     currentQuestion.difficulty === 'medium' ? '中等' : '困难'}
                  </Tag>
                </Space>
              </Col>
            </Row>
          </div>

          <Title level={4} style={{ marginBottom: '16px' }}>
            {currentQuestion.title}
          </Title>

          <Paragraph style={{ fontSize: '16px', lineHeight: '1.6', marginBottom: '24px' }}>
            {currentQuestion.content}
          </Paragraph>

          {/* 多媒体内容展示 */}
          {currentQuestion.media && (
            <div style={{ marginBottom: '24px', textAlign: 'center' }}>
              {currentQuestion.media.type === 'image' && (
                <div>
                  <img 
                    src={currentQuestion.media.url} 
                    alt={currentQuestion.media.description || '题目图片'}
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '400px',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                  {currentQuestion.media.description && (
                    <Text type="secondary" style={{ display: 'block', marginTop: '8px' }}>
                      {currentQuestion.media.description}
                    </Text>
                  )}
                </div>
              )}
              
              {currentQuestion.media.type === 'video' && (
                <div>
                  <video 
                    src={currentQuestion.media.url}
                    controls
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '400px',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                  {currentQuestion.media.description && (
                    <Text type="secondary" style={{ display: 'block', marginTop: '8px' }}>
                      {currentQuestion.media.description}
                    </Text>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 答题区域 */}
          <div style={{ marginBottom: '32px' }}>
            {currentQuestion.type === 'single_choice' && currentQuestion.options && (
              <Group 
                value={currentAnswer} 
                onChange={(e) => setCurrentAnswer(e.target.value)}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {currentQuestion.options.map((option, index) => (
                    <Radio key={index} value={option} style={{ fontSize: '16px', padding: '8px 0' }}>
                      <Text>{String.fromCharCode(65 + index)}. {option}</Text>
                    </Radio>
                  ))}
                </Space>
              </Group>
            )}

            {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
              <Checkbox.Group 
                value={currentAnswer || []} 
                onChange={setCurrentAnswer}
                style={{ width: '100%' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {currentQuestion.options.map((option, index) => (
                    <Checkbox key={index} value={option} style={{ fontSize: '16px', padding: '8px 0' }}>
                      <Text>{String.fromCharCode(65 + index)}. {option}</Text>
                    </Checkbox>
                  ))}
                </Space>
              </Checkbox.Group>
            )}

            {currentQuestion.type === 'true_false' && (
              <Group 
                value={currentAnswer} 
                onChange={(e) => setCurrentAnswer(e.target.value)}
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
              </Group>
            )}

            {currentQuestion.type === 'fill_blank' && (
              <div>
                <Text strong style={{ marginBottom: '12px', display: 'block' }}>请填写答案：</Text>
                <input
                  type="text"
                  value={currentAnswer || ''}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="请输入答案"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '16px',
                    border: `2px solid ${isDark ? '#404040' : '#d9d9d9'}`,
                    borderRadius: '8px',
                    background: isDark ? '#1a1a1a' : '#ffffff',
                    color: isDark ? '#ffffff' : '#000000',
                    outline: 'none',
                    transition: 'border-color 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = primaryColor;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = isDark ? '#404040' : '#d9d9d9';
                  }}
                />
              </div>
            )}

            {currentQuestion.type === 'case_analysis' && (
              <div>
                <Text strong style={{ marginBottom: '12px', display: 'block' }}>案例分析（请详细分析）：</Text>
                <textarea
                  value={currentAnswer || ''}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="请结合案例内容进行详细分析..."
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    fontSize: '16px',
                    border: `2px solid ${isDark ? '#404040' : '#d9d9d9'}`,
                    borderRadius: '8px',
                    background: isDark ? '#1a1a1a' : '#ffffff',
                    color: isDark ? '#ffffff' : '#000000',
                    outline: 'none',
                    resize: 'vertical',
                    transition: 'border-color 0.3s ease',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = primaryColor;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = isDark ? '#404040' : '#d9d9d9';
                  }}
                />
              </div>
            )}
          </div>

          {/* 相关学习资源推荐 */}
          <div style={{ 
            marginBottom: '24px',
            padding: '16px',
            background: `linear-gradient(135deg, ${primaryColor}08 0%, ${primaryColor}04 100%)`,
            borderRadius: '12px',
            border: `1px solid ${primaryColor}20`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
              <BookOutlined style={{ 
                fontSize: '16px', 
                color: primaryColor, 
                marginRight: '8px' 
              }} />
              <Text strong style={{ color: primaryColor }}>
                相关学习资源
              </Text>
            </div>
            <Row gutter={12}>
              <Col span={8}>
                <div 
                  style={{
                    position: 'relative',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'transform 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  onClick={() => {
                    message.success('正在加载相关视频...');
                  }}
                >
                  <img
                    src={createDefaultResourceImage('视频1', primaryColor)}
                    alt="相关视频"
                    style={{ width: '100%', height: '68px', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(0, 0, 0, 0.6)',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <PlayCircleOutlined style={{ fontSize: '12px', color: '#ffffff' }} />
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    background: 'rgba(0, 0, 0, 0.8)',
                    color: '#ffffff',
                    padding: '1px 4px',
                    borderRadius: '2px',
                    fontSize: '10px'
                  }}>
                    3:24
                  </div>
                </div>
                <Text style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  {typeof currentQuestion.category === 'string' 
                    ? currentQuestion.category 
                    : (currentQuestion.category as any)?.sport || '体育'
                  }基础动作
                </Text>
              </Col>
              <Col span={8}>
                <div 
                  style={{
                    position: 'relative',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'transform 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  onClick={() => {
                    message.success('正在加载相关视频...');
                  }}
                >
                  <img
                    src={createDefaultResourceImage('视频2', '#52c41a')}
                    alt="相关视频"
                    style={{ width: '100%', height: '68px', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(0, 0, 0, 0.6)',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <PlayCircleOutlined style={{ fontSize: '12px', color: '#ffffff' }} />
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    background: 'rgba(0, 0, 0, 0.8)',
                    color: '#ffffff',
                    padding: '1px 4px',
                    borderRadius: '2px',
                    fontSize: '10px'
                  }}>
                    5:12
                  </div>
                </div>
                <Text style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  技巧解析
                </Text>
              </Col>
              <Col span={8}>
                <div 
                  style={{
                    position: 'relative',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'transform 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  onClick={() => {
                    message.success('正在加载相关视频...');
                  }}
                >
                  <img
                    src={createDefaultResourceImage('视频3', '#faad14')}
                    alt="相关视频"
                    style={{ width: '100%', height: '68px', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(0, 0, 0, 0.6)',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <PlayCircleOutlined style={{ fontSize: '12px', color: '#ffffff' }} />
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    background: 'rgba(0, 0, 0, 0.8)',
                    color: '#ffffff',
                    padding: '1px 4px',
                    borderRadius: '2px',
                    fontSize: '10px'
                  }}>
                    2:48
                  </div>
                </div>
                <Text style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                  常见错误
                </Text>
              </Col>
            </Row>
            <div style={{ textAlign: 'center', marginTop: '8px' }}>
              <Button 
                type="link" 
                size="small" 
                icon={<EyeOutlined />}
                onClick={() => {
                  navigate('/learning-resources');
                }}
                style={{ color: primaryColor }}
              >
                查看更多学习资源
              </Button>
            </div>
          </div>

          {/* 操作按钮 */}
          <Row justify="space-between">
            <Col>
              <Button 
                disabled={session.currentIndex === 0}
                onClick={prevQuestion}
              >
                上一题
              </Button>
            </Col>
            <Col>
              <Space>
                <Button onClick={() => {
                  confirm({
                    title: '确认退出练习吗？',
                    content: '退出后当前进度将丢失',
                    onOk: restart
                  });
                }}>
                  退出练习
                </Button>
                <Button 
                  type="primary" 
                  onClick={submitAnswer}
                  disabled={currentAnswer === null || currentAnswer === undefined}
                >
                  {session.currentIndex === session.questions.length - 1 ? '完成练习' : '下一题'}
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
      </div>
    );
  };

  // 渲染练习结果
  const renderResult = () => {
    if (!practiceResult) return null;

    const { totalQuestions, correctCount, accuracy, totalTime, results } = practiceResult;
    const passed = accuracy >= 60;

    return (
      <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
        <Card>
          <Result
            icon={passed ? <TrophyOutlined style={{ color: '#52c41a' }} /> : <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
            title={passed ? '练习完成！' : '继续努力！'}
            subTitle={passed ? '恭喜您通过了本次练习' : '还需要继续加油哦'}
          />

          {/* 统计信息 */}
          <Row gutter={16} style={{ marginBottom: '24px', textAlign: 'center' }}>
            <Col span={6}>
              <Statistic title="题目总数" value={totalQuestions} />
            </Col>
            <Col span={6}>
              <Statistic title="答对题数" value={correctCount} valueStyle={{ color: '#52c41a' }} />
            </Col>
            <Col span={6}>
              <Statistic 
                title="正确率" 
                value={accuracy} 
                precision={1} 
                suffix="%" 
                valueStyle={{ color: passed ? '#52c41a' : '#ff4d4f' }}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="总用时" 
                value={Math.floor(totalTime / 60)} 
                suffix="分钟"
              />
            </Col>
          </Row>

          <Divider>详细结果</Divider>

          {/* 题目列表 */}
          <List
            dataSource={results}
            renderItem={(item: any, index: number) => (
              <List.Item>
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      style={{ 
                        backgroundColor: item.isCorrect ? '#52c41a' : '#ff4d4f',
                        color: 'white'
                      }}
                    >
                      {index + 1}
                    </Avatar>
                  }
                  title={
                    <Space>
                      <Text>{item.question.title}</Text>
                      {item.isCorrect ? 
                        <CheckCircleOutlined style={{ color: '#52c41a' }} /> : 
                        <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                      }
                    </Space>
                  }
                  description={
                    <div>
                      <Text type="secondary">您的答案: </Text>
                      <Text style={{ color: item.isCorrect ? '#52c41a' : '#ff4d4f' }}>
                        {Array.isArray(item.userAnswer) ? item.userAnswer.join(', ') : item.userAnswer}
                      </Text>
                      {!item.isCorrect && (
                        <>
                          <br />
                          <Text type="secondary">正确答案: </Text>
                          <Text style={{ color: '#52c41a' }}>
                            {Array.isArray(item.question.correctAnswer) ? 
                              item.question.correctAnswer.join(', ') : 
                              item.question.correctAnswer}
                          </Text>
                        </>
                      )}
                      <br />
                      <Text type="secondary">用时: {item.timeSpent}秒</Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Space size="large">
              <Button size="large" onClick={restart}>
                重新练习
              </Button>
              <Button type="primary" size="large" onClick={() => window.location.href = '/dashboard'}>
                返回首页
              </Button>
            </Space>
          </div>
        </Card>
      </div>
    );
  };

  // 主渲染
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (isConfiguring) {
    return renderConfiguration();
  }

  if (isPracticing) {
    return renderPractice();
  }

  if (isCompleted) {
    return renderResult();
  }

  return null;
};

export default Practice; 