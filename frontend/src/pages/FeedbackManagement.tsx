import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Modal, Form, Input, Select, Tag, Typography, 
  Space, Avatar, Badge, Popconfirm, message, Drawer, Timeline,
  Alert, Rate, Upload, Image, Tabs
} from 'antd';
import {
  MessageOutlined, EyeOutlined, EditOutlined, CheckCircleOutlined,
  CloseCircleOutlined, UserOutlined, FileTextOutlined, BugOutlined,
  BulbOutlined, ExclamationCircleOutlined, ClockCircleOutlined,
  PlusOutlined, InboxOutlined, StarOutlined
} from '@ant-design/icons';
import { useTheme } from '../hooks/useTheme';
import '../styles/modern-theme.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Dragger } = Upload;

interface Feedback {
  id: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
  type: 'question_error' | 'suggestion' | 'bug_report' | 'feature_request';
  title: string;
  content: string;
  relatedItem?: {
    type: string;
    id: string;
    name?: string;
  };
  status: 'pending' | 'processing' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: {
    id: string;
    username: string;
  };
  response?: string;
  attachments: string[];
  rating?: number; // 用户对处理结果的评分
  createdAt: string;
  updatedAt: string;
}

const FeedbackManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [responseModalVisible, setResponseModalVisible] = useState(false);
  const [assignModalVisible, setAssignModalVisible] = useState(false);

  const [responseForm] = Form.useForm();
  const [assignForm] = Form.useForm();

  const { isDark, primaryColor } = useTheme();

  // 模拟反馈数据
  const mockFeedbacks: Feedback[] = [
    {
      id: '1',
      user: {
        id: '1',
        username: '张小明',
        email: 'zhang.xiaoming@school.com',
        role: 'student'
      },
      type: 'question_error',
      title: '足球规则题目答案有误',
      content: '题目"足球比赛中，越位的判定标准是什么？"的标准答案似乎不正确。根据最新的FIFA规则，答案应该是...',
      relatedItem: {
        type: 'question',
        id: 'q123',
        name: '足球越位规则判定'
      },
      status: 'pending',
      priority: 'high',
      attachments: [],
      createdAt: '2024-01-20T14:30:00Z',
      updatedAt: '2024-01-20T14:30:00Z'
    },
    {
      id: '2',
      user: {
        id: '2',
        username: '李老师',
        email: 'li.teacher@school.com',
        role: 'teacher'
      },
      type: 'suggestion',
      title: '建议增加视频解析功能',
      content: '希望在题目答案解析中增加视频演示功能，特别是对于体育动作类题目，视频解析会更直观易懂。',
      status: 'processing',
      priority: 'medium',
      assignedTo: {
        id: '100',
        username: '产品经理'
      },
      response: '感谢您的建议！我们已经将此功能加入开发计划，预计下个版本会上线。',
      attachments: [],
      createdAt: '2024-01-19T10:15:00Z',
      updatedAt: '2024-01-20T09:20:00Z'
    },
    {
      id: '3',
      user: {
        id: '3',
        username: '王小红',
        email: 'wang.xiaohong@school.com',
        role: 'student'
      },
      type: 'bug_report',
      title: '练习页面加载异常',
      content: '在做篮球练习题时，页面经常卡住不动，需要刷新才能继续。使用的是Chrome浏览器，版本120.0.6099.109。',
      status: 'resolved',
      priority: 'high',
      assignedTo: {
        id: '101',
        username: '技术支持'
      },
      response: '问题已修复，是由于网络请求超时导致的。已优化网络请求逻辑，并增加了重试机制。',
      rating: 5,
      attachments: ['screenshot1.png', 'console_log.txt'],
      createdAt: '2024-01-18T16:45:00Z',
      updatedAt: '2024-01-19T11:30:00Z'
    },
    {
      id: '4',
      user: {
        id: '4',
        username: '陈管理员',
        email: 'chen.admin@school.com',
        role: 'admin'
      },
      type: 'feature_request',
      title: '批量导入题目功能',
      content: '希望能够支持Excel格式的批量题目导入功能，这样可以大大提高题目录入效率。需要支持题目分类、难度等字段的批量设置。',
      status: 'pending',
      priority: 'medium',
      attachments: ['sample_template.xlsx'],
      createdAt: '2024-01-17T13:20:00Z',
      updatedAt: '2024-01-17T13:20:00Z'
    },
    {
      id: '5',
      user: {
        id: '5',
        username: '刘小强',
        email: 'liu.xiaoqiang@school.com',
        role: 'student'
      },
      type: 'question_error',
      title: '游泳题目图片显示不全',
      content: '游泳姿势相关的题目中，配图显示不完整，影响理解题意。希望能够修复图片显示问题。',
      relatedItem: {
        type: 'question',
        id: 'q456',
        name: '自由泳标准姿势'
      },
      status: 'rejected',
      priority: 'low',
      assignedTo: {
        id: '102',
        username: '内容审核员'
      },
      response: '经核实，图片显示正常。可能是网络问题导致的加载不完整，建议检查网络连接后重试。',
      rating: 2,
      attachments: [],
      createdAt: '2024-01-16T09:10:00Z',
      updatedAt: '2024-01-18T14:50:00Z'
    }
  ];

  useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    setLoading(true);
    setTimeout(() => {
      setFeedbacks(mockFeedbacks);
      setLoading(false);
    }, 800);
  };

  // 获取反馈类型显示信息
  const getFeedbackTypeInfo = (type: string) => {
    const typeMap = {
      'question_error': { 
        icon: <ExclamationCircleOutlined />, 
        color: '#ff4d4f', 
        name: '题目纠错' 
      },
      'suggestion': { 
        icon: <BulbOutlined />, 
        color: '#faad14', 
        name: '建议反馈' 
      },
      'bug_report': { 
        icon: <BugOutlined />, 
        color: '#ff7a45', 
        name: '问题报告' 
      },
      'feature_request': { 
        icon: <PlusOutlined />, 
        color: '#1890ff', 
        name: '功能请求' 
      }
    };
    return typeMap[type as keyof typeof typeMap] || { 
      icon: <FileTextOutlined />, 
      color: '#8c8c8c', 
      name: '其他' 
    };
  };

  // 获取状态显示信息
  const getStatusInfo = (status: string) => {
    const statusMap = {
      'pending': { color: '#faad14', name: '待处理' },
      'processing': { color: '#1890ff', name: '处理中' },
      'resolved': { color: '#52c41a', name: '已解决' },
      'rejected': { color: '#8c8c8c', name: '已拒绝' }
    };
    return statusMap[status as keyof typeof statusMap] || { 
      color: '#8c8c8c', 
      name: '未知' 
    };
  };

  // 获取优先级显示信息
  const getPriorityInfo = (priority: string) => {
    const priorityMap = {
      'urgent': { color: '#ff4d4f', name: '紧急' },
      'high': { color: '#ff7a45', name: '高' },
      'medium': { color: '#faad14', name: '中' },
      'low': { color: '#52c41a', name: '低' }
    };
    return priorityMap[priority as keyof typeof priorityMap] || { 
      color: '#8c8c8c', 
      name: '未知' 
    };
  };

  // 处理反馈响应
  const handleResponse = async (values: any) => {
    try {
      message.success('响应提交成功');
      setResponseModalVisible(false);
      responseForm.resetFields();
      setSelectedFeedback(null);
      loadFeedbacks();
    } catch (error) {
      message.error('响应提交失败');
    }
  };

  // 分配反馈
  const handleAssign = async (values: any) => {
    try {
      message.success('分配成功');
      setAssignModalVisible(false);
      assignForm.resetFields();
      setSelectedFeedback(null);
      loadFeedbacks();
    } catch (error) {
      message.error('分配失败');
    }
  };

  // 更新状态
  const handleStatusChange = async (feedback: Feedback, status: string) => {
    try {
      message.success(`状态更新为${getStatusInfo(status).name}`);
      loadFeedbacks();
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  // 筛选反馈
  const getFilteredFeedbacks = () => {
    if (activeTab === 'all') return feedbacks;
    if (activeTab === 'pending') return feedbacks.filter(f => f.status === 'pending');
    if (activeTab === 'processing') return feedbacks.filter(f => f.status === 'processing');
    if (activeTab === 'resolved') return feedbacks.filter(f => f.status === 'resolved');
    return feedbacks.filter(f => f.type === activeTab);
  };

  // 表格列定义
  const columns = [
    {
      title: '反馈信息',
      key: 'feedback',
      width: 300,
      render: (record: Feedback) => {
        const typeInfo = getFeedbackTypeInfo(record.type);
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ color: typeInfo.color, marginRight: '8px', fontSize: '16px' }}>
                {typeInfo.icon}
              </span>
              <Text strong style={{ fontSize: '14px' }}>
                {record.title}
              </Text>
            </div>
            <Tag color={typeInfo.color} style={{ fontSize: '11px', padding: '2px 6px', height: 'auto', lineHeight: 1.2 }}>
              {typeInfo.name}
            </Tag>
            {record.relatedItem && (
              <Tag color="blue" style={{ marginLeft: '4px', fontSize: '11px', padding: '2px 6px', height: 'auto', lineHeight: 1.2 }}>
                关联: {record.relatedItem.type}
              </Tag>
            )}
            {record.attachments.length > 0 && (
              <Tag color="purple" style={{ marginLeft: '4px', fontSize: '11px', padding: '2px 6px', height: 'auto', lineHeight: 1.2 }}>
                附件: {record.attachments.length}
              </Tag>
            )}
          </div>
        );
      }
    },
    {
      title: '提交用户',
      key: 'user',
      width: 150,
      render: (record: Feedback) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            size={32}
            icon={<UserOutlined />}
            style={{
              marginRight: '8px',
              background: record.user.role === 'student' ? '#52c41a' : 
                         record.user.role === 'teacher' ? '#1890ff' : '#faad14'
            }}
          />
          <div>
            <Text strong style={{ fontSize: '13px' }}>{record.user.username}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {record.user.role === 'student' ? '学生' : 
               record.user.role === 'teacher' ? '教师' : '管理员'}
            </Text>
          </div>
        </div>
      )
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: (priority: string) => {
        const info = getPriorityInfo(priority);
        return (
          <Tag color={info.color} style={{ fontSize: '11px' }}>
            {info.name}
          </Tag>
        );
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const info = getStatusInfo(status);
        return (
          <Badge 
            color={info.color}
            text={info.name}
          />
        );
      }
    },
    {
      title: '处理人',
      key: 'assignedTo',
      width: 100,
      render: (record: Feedback) => (
        record.assignedTo ? (
          <Text style={{ fontSize: '12px' }}>{record.assignedTo.username}</Text>
        ) : (
          <Text type="secondary" style={{ fontSize: '12px' }}>未分配</Text>
        )
      )
    },
    {
      title: '评分',
      dataIndex: 'rating',
      key: 'rating',
      width: 100,
      render: (rating?: number) => (
        rating ? (
          <Rate disabled value={rating} style={{ fontSize: '12px' }} />
        ) : (
          <Text type="secondary" style={{ fontSize: '12px' }}>-</Text>
        )
      )
    },
    {
      title: '提交时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => (
        <div>
          <Text style={{ fontSize: '12px' }}>
            {new Date(date).toLocaleDateString()}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {new Date(date).toLocaleTimeString()}
          </Text>
        </div>
      ),
      sorter: (a: Feedback, b: Feedback) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: 'descend' as const
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (record: Feedback) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedFeedback(record);
              setDetailDrawerVisible(true);
            }}
          />
          {record.status === 'pending' && (
            <>
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  setSelectedFeedback(record);
                  setAssignModalVisible(true);
                }}
              />
              <Button
                type="text"
                size="small"
                icon={<MessageOutlined />}
                onClick={() => {
                  setSelectedFeedback(record);
                  setResponseModalVisible(true);
                }}
              />
            </>
          )}
          {record.status === 'processing' && (
            <Popconfirm
              title="确定标记为已解决吗？"
              onConfirm={() => handleStatusChange(record, 'resolved')}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="text"
                size="small"
                icon={<CheckCircleOutlined />}
                style={{ color: '#52c41a' }}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const filteredFeedbacks = getFilteredFeedbacks();

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
                <MessageOutlined style={{ fontSize: '20px', color: primaryColor }} />
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
                  反馈管理
                </Title>
                <Text type="secondary" style={{ fontSize: '16px', marginLeft: '2px' }}>
                  用户反馈处理和问题跟踪
                </Text>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="modern-card animate-slideUp" style={{
        animationDelay: '0.2s',
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
                <InboxOutlined style={{ marginRight: '8px' }} />
                全部反馈
                <Badge 
                  count={feedbacks.length} 
                  style={{ 
                    marginLeft: '8px',
                    background: primaryColor
                  }} 
                />
              </span>
            } 
            key="all"
          >
            <div style={{ padding: '24px' }}>
              <Table
                columns={columns}
                dataSource={filteredFeedbacks}
                rowKey="id"
                loading={loading}
                size="middle"
                pagination={{
                  pageSize: 15,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                }}
              />
            </div>
          </TabPane>
          
          <TabPane 
            tab={
              <span style={{ fontSize: '16px', fontWeight: '500' }}>
                <ClockCircleOutlined style={{ marginRight: '8px' }} />
                待处理
                <Badge 
                  count={feedbacks.filter(f => f.status === 'pending').length} 
                  style={{ 
                    marginLeft: '8px',
                    background: '#faad14'
                  }} 
                />
              </span>
            } 
            key="pending"
          >
            <div style={{ padding: '24px' }}>
              <Table
                columns={columns}
                dataSource={filteredFeedbacks}
                rowKey="id"
                loading={loading}
                size="middle"
                pagination={{
                  pageSize: 15,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                }}
              />
            </div>
          </TabPane>
          
          <TabPane 
            tab={
              <span style={{ fontSize: '16px', fontWeight: '500' }}>
                <EditOutlined style={{ marginRight: '8px' }} />
                处理中
                <Badge 
                  count={feedbacks.filter(f => f.status === 'processing').length} 
                  style={{ 
                    marginLeft: '8px',
                    background: '#1890ff'
                  }} 
                />
              </span>
            } 
            key="processing"
          >
            <div style={{ padding: '24px' }}>
              <Table
                columns={columns}
                dataSource={filteredFeedbacks}
                rowKey="id"
                loading={loading}
                size="middle"
                pagination={{
                  pageSize: 15,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                }}
              />
            </div>
          </TabPane>
          
          <TabPane 
            tab={
              <span style={{ fontSize: '16px', fontWeight: '500' }}>
                <CheckCircleOutlined style={{ marginRight: '8px' }} />
                已解决
                <Badge 
                  count={feedbacks.filter(f => f.status === 'resolved').length} 
                  style={{ 
                    marginLeft: '8px',
                    background: '#52c41a'
                  }} 
                />
              </span>
            } 
            key="resolved"
          >
            <div style={{ padding: '24px' }}>
              <Table
                columns={columns}
                dataSource={filteredFeedbacks}
                rowKey="id"
                loading={loading}
                size="middle"
                pagination={{
                  pageSize: 15,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                }}
              />
            </div>
          </TabPane>
        </Tabs>
      </div>

      {/* 详情抽屉 */}
      <Drawer
        title="反馈详情"
        placement="right"
        onClose={() => setDetailDrawerVisible(false)}
        open={detailDrawerVisible}
        width={600}
      >
        {selectedFeedback && (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <Avatar 
                  size={40}
                  icon={<UserOutlined />}
                  style={{ marginRight: '12px' }}
                />
                <div>
                  <Text strong>{selectedFeedback.user.username}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {selectedFeedback.user.email}
                  </Text>
                </div>
              </div>
              
              <Space wrap style={{ marginBottom: '12px' }}>
                <Tag color={getFeedbackTypeInfo(selectedFeedback.type).color}>
                  {getFeedbackTypeInfo(selectedFeedback.type).name}
                </Tag>
                <Tag color={getStatusInfo(selectedFeedback.status).color}>
                  {getStatusInfo(selectedFeedback.status).name}
                </Tag>
                <Tag color={getPriorityInfo(selectedFeedback.priority).color}>
                  {getPriorityInfo(selectedFeedback.priority).name}
                </Tag>
              </Space>
            </div>

            <Card title={selectedFeedback.title} size="small" style={{ marginBottom: '16px' }}>
              <Paragraph>{selectedFeedback.content}</Paragraph>
              
              {selectedFeedback.relatedItem && (
                <Alert
                  message="关联项目"
                  description={`${selectedFeedback.relatedItem.type}: ${selectedFeedback.relatedItem.name || selectedFeedback.relatedItem.id}`}
                  type="info"
                  showIcon
                  style={{ marginTop: '12px' }}
                />
              )}
            </Card>

            {selectedFeedback.attachments.length > 0 && (
              <Card title="附件" size="small" style={{ marginBottom: '16px' }}>
                <Space wrap>
                  {selectedFeedback.attachments.map((attachment, index) => (
                    <Tag key={index} color="blue">
                      {attachment}
                    </Tag>
                  ))}
                </Space>
              </Card>
            )}

            {selectedFeedback.response && (
              <Card title="处理回复" size="small" style={{ marginBottom: '16px' }}>
                <Paragraph>{selectedFeedback.response}</Paragraph>
                {selectedFeedback.assignedTo && (
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    回复人: {selectedFeedback.assignedTo.username}
                  </Text>
                )}
              </Card>
            )}

            {selectedFeedback.rating && (
              <Card title="用户评分" size="small" style={{ marginBottom: '16px' }}>
                <Rate disabled value={selectedFeedback.rating} />
                <Text style={{ marginLeft: '12px' }}>
                  {selectedFeedback.rating} 分
                </Text>
              </Card>
            )}

            <Card title="处理时间线" size="small">
              <Timeline>
                <Timeline.Item color="blue">
                  <Text>反馈提交</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {new Date(selectedFeedback.createdAt).toLocaleString()}
                  </Text>
                </Timeline.Item>
                
                {selectedFeedback.assignedTo && (
                  <Timeline.Item color="orange">
                    <Text>分配处理人: {selectedFeedback.assignedTo.username}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {new Date(selectedFeedback.updatedAt).toLocaleString()}
                    </Text>
                  </Timeline.Item>
                )}
                
                {selectedFeedback.response && (
                  <Timeline.Item color="green">
                    <Text>处理完成</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {new Date(selectedFeedback.updatedAt).toLocaleString()}
                    </Text>
                  </Timeline.Item>
                )}
              </Timeline>
            </Card>
          </div>
        )}
      </Drawer>

      {/* 回复模态框 */}
      <Modal
        title="处理反馈"
        open={responseModalVisible}
        onCancel={() => {
          setResponseModalVisible(false);
          responseForm.resetFields();
          setSelectedFeedback(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={responseForm}
          layout="vertical"
          onFinish={handleResponse}
        >
          <Form.Item
            label="处理状态"
            name="status"
            rules={[{ required: true, message: '请选择处理状态' }]}
          >
            <Select placeholder="请选择处理状态">
              <Select.Option value="processing">处理中</Select.Option>
              <Select.Option value="resolved">已解决</Select.Option>
              <Select.Option value="rejected">已拒绝</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="回复内容"
            name="response"
            rules={[{ required: true, message: '请输入回复内容' }]}
          >
            <TextArea 
              rows={6} 
              placeholder="请输入详细的处理回复..."
              maxLength={1000}
              showCount
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button 
                onClick={() => {
                  setResponseModalVisible(false);
                  responseForm.resetFields();
                  setSelectedFeedback(null);
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                提交回复
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 分配模态框 */}
      <Modal
        title="分配处理人"
        open={assignModalVisible}
        onCancel={() => {
          setAssignModalVisible(false);
          assignForm.resetFields();
          setSelectedFeedback(null);
        }}
        footer={null}
        width={400}
      >
        <Form
          form={assignForm}
          layout="vertical"
          onFinish={handleAssign}
        >
          <Form.Item
            label="处理人"
            name="assignedTo"
            rules={[{ required: true, message: '请选择处理人' }]}
          >
            <Select placeholder="请选择处理人">
              <Select.Option value="100">产品经理</Select.Option>
              <Select.Option value="101">技术支持</Select.Option>
              <Select.Option value="102">内容审核员</Select.Option>
              <Select.Option value="103">客服专员</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="优先级"
            name="priority"
          >
            <Select placeholder="调整优先级（可选）">
              <Select.Option value="urgent">紧急</Select.Option>
              <Select.Option value="high">高</Select.Option>
              <Select.Option value="medium">中</Select.Option>
              <Select.Option value="low">低</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button 
                onClick={() => {
                  setAssignModalVisible(false);
                  assignForm.resetFields();
                  setSelectedFeedback(null);
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                确认分配
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FeedbackManagement; 