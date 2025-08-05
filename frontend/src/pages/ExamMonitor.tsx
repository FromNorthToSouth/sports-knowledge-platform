import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Button, Space, Typography, Row, Col, Statistic, 
  Progress, Modal, List, Avatar, Badge, Tabs, Alert, Select, DatePicker,
  Input, Tooltip, message, Spin, Empty, Divider
} from 'antd';
import {
  EyeOutlined, SendOutlined, ReloadOutlined, DownloadOutlined,
  ClockCircleOutlined, UserOutlined, CheckCircleOutlined, ExclamationCircleOutlined,
  FireOutlined, TrophyOutlined, MessageOutlined, FileTextOutlined,
  BarChartOutlined, TeamOutlined, NotificationOutlined, SearchOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useTheme } from '../hooks/useTheme';
import { examAPI } from '../services/examAPI';
import { classAPI } from '../services/classAPI';
import moment from 'moment';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface ExamMonitorData {
  id: string;
  title: string;
  status: 'active' | 'pending' | 'completed' | 'cancelled';
  startTime: string;
  endTime: string;
  totalParticipants: number;
  completedCount: number;
  passedCount: number;
  averageScore: number;
  participants: Array<{
    id: string;
    username: string;
    className: string;
    grade: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
    score?: number;
    completedAt?: string;
    timeSpent?: number;
  }>;
  targetAudience: {
    type: 'class' | 'grade' | 'specific' | 'all';
    classIds?: string[];
    gradeIds?: string[];
    studentIds?: string[];
  };
}

const ExamMonitor: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [examData, setExamData] = useState<ExamMonitorData[]>([]);
  const [selectedExam, setSelectedExam] = useState<ExamMonitorData | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [notifyModalVisible, setNotifyModalVisible] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');

  const { user } = useSelector((state: RootState) => state.auth);
  const { isDark, primaryColor } = useTheme();

  // 加载发布的考试数据
  const loadExamData = async () => {
    try {
      setLoading(true);
      const response = await examAPI.getPublishedExams({
        teacherId: user?.id,
        includeStats: true
      });
      
      if (response.data.success) {
        // 后端返回的数据结构是 {examPublications: [...], pagination: {...}}
        const examPublications = response.data.data.examPublications || [];
        const exams = examPublications.map((exam: any) => ({
          id: exam._id,
          title: exam.title,
          status: exam.status,
          startTime: exam.schedule.startTime,
          endTime: exam.schedule.endTime,
          totalParticipants: exam.statistics?.totalParticipants || 0,
          completedCount: exam.statistics?.completedCount || 0,
          passedCount: exam.statistics?.passedCount || 0,
          averageScore: exam.statistics?.averageScore || 0,
          participants: exam.participants || [],
          targetAudience: exam.targetAudience
        }));
        setExamData(exams);
      }
    } catch (error: any) {
      console.error('获取考试数据失败:', error);
      message.error('获取考试数据失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 获取考试详细统计
  const loadExamDetail = async (examId: string) => {
    try {
      const response = await examAPI.getExamParticipationStats(examId);
      if (response.data.success) {
        const stats = response.data.data;
        setSelectedExam(prev => prev ? {
          ...prev,
          participants: stats.participants || []
        } : null);
      }
    } catch (error: any) {
      console.error('获取考试详情失败:', error);
      message.error('获取考试详情失败');
    }
  };

  // 发送通知
  const sendNotification = async () => {
    if (!selectedExam || selectedStudents.length === 0 || !notificationMessage.trim()) {
      message.error('请选择学生并输入通知内容');
      return;
    }

    try {
      // 这里应该调用发送通知的API
      message.success(`已向 ${selectedStudents.length} 名学生发送通知`);
      setNotifyModalVisible(false);
      setSelectedStudents([]);
      setNotificationMessage('');
    } catch (error: any) {
      console.error('发送通知失败:', error);
      message.error('发送通知失败');
    }
  };

  useEffect(() => {
    loadExamData();
  }, []);

  // 状态标签渲染
  const renderStatusTag = (status: string) => {
    const statusMap: any = {
      active: { color: 'processing', text: '进行中' },
      pending: { color: 'default', text: '未开始' },
      completed: { color: 'success', text: '已结束' },
      cancelled: { color: 'error', text: '已取消' }
    };
    return <Tag color={statusMap[status]?.color}>{statusMap[status]?.text || status}</Tag>;
  };

  // 参与者状态标签
  const renderParticipantStatus = (status: string) => {
    const statusMap: any = {
      not_started: { color: 'default', text: '未开始', icon: <ExclamationCircleOutlined /> },
      in_progress: { color: 'processing', text: '进行中', icon: <ClockCircleOutlined /> },
      completed: { color: 'success', text: '已完成', icon: <CheckCircleOutlined /> },
      overdue: { color: 'error', text: '超时', icon: <ExclamationCircleOutlined /> }
    };
    const statusInfo = statusMap[status] || statusMap.not_started;
    return (
      <Tag color={statusInfo.color} icon={statusInfo.icon}>
        {statusInfo.text}
      </Tag>
    );
  };

  // 考试列表列定义
  const examColumns = [
    {
      title: '考试名称',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: ExamMonitorData) => (
        <Space direction="vertical" size={0}>
          <Text strong>{title}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            ID: {record.id.slice(-8)}
          </Text>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: renderStatusTag,
      filters: [
        { text: '进行中', value: 'active' },
        { text: '未开始', value: 'pending' },
        { text: '已结束', value: 'completed' },
        { text: '已取消', value: 'cancelled' }
      ],
      onFilter: (value: any, record: ExamMonitorData) => record.status === value
    },
    {
      title: '时间安排',
      key: 'schedule',
      width: 200,
      render: (_: any, record: ExamMonitorData) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: '12px' }}>
            <ClockCircleOutlined /> {moment(record.startTime).format('MM-DD HH:mm')}
          </Text>
          <Text style={{ fontSize: '12px' }} type="secondary">
            至 {moment(record.endTime).format('MM-DD HH:mm')}
          </Text>
        </Space>
      )
    },
    {
      title: '参与情况',
      key: 'participation',
      width: 150,
      render: (_: any, record: ExamMonitorData) => {
        const completionRate = record.totalParticipants > 0 
          ? (record.completedCount / record.totalParticipants * 100).toFixed(1)
          : '0';
        return (
          <Space direction="vertical" size={0}>
            <Text style={{ fontSize: '12px' }}>
              完成: {record.completedCount}/{record.totalParticipants}
            </Text>
            <Progress 
              percent={parseFloat(completionRate)} 
              size="small" 
              strokeColor={primaryColor}
              showInfo={false}
            />
            <Text style={{ fontSize: '11px' }} type="secondary">
              {completionRate}%
            </Text>
          </Space>
        );
      }
    },
    {
      title: '合格情况',
      key: 'pass',
      width: 120,
      render: (_: any, record: ExamMonitorData) => {
        const passRate = record.completedCount > 0 
          ? (record.passedCount / record.completedCount * 100).toFixed(1)
          : '0';
        return (
          <Space direction="vertical" size={0}>
            <Text style={{ fontSize: '12px' }}>
              合格: {record.passedCount}/{record.completedCount}
            </Text>
            <Text style={{ fontSize: '11px', color: passRate === '100.0' ? '#52c41a' : '#faad14' }}>
              通过率: {passRate}%
            </Text>
          </Space>
        );
      }
    },
    {
      title: '平均分',
      dataIndex: 'averageScore',
      key: 'averageScore',
      width: 100,
      render: (score: number) => (
        <Text style={{ 
          fontWeight: 'bold',
          color: score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f'
        }}>
          {score.toFixed(1)}
        </Text>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: any, record: ExamMonitorData) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedExam(record);
              loadExamDetail(record.id);
              setDetailModalVisible(true);
            }}
          >
            详情
          </Button>
          <Button
            size="small"
            icon={<MessageOutlined />}
            onClick={() => {
              setSelectedExam(record);
              setNotifyModalVisible(true);
            }}
          >
            通知
          </Button>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => {
              // 导出功能
              message.info('导出功能开发中...');
            }}
          >
            导出
          </Button>
        </Space>
      )
    }
  ];

  // 参与者列表列定义
  const participantColumns = [
    {
      title: '学生信息',
      key: 'student',
      render: (_: any, record: any) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <Space direction="vertical" size={0}>
            <Text>{record.username}</Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.className} · {record.grade}
            </Text>
          </Space>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: renderParticipantStatus
    },
    {
      title: '分数',
      dataIndex: 'score',
      key: 'score',
      render: (score: number | undefined) => (
        score !== undefined ? (
          <Text style={{ 
            fontWeight: 'bold',
            color: score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#ff4d4f'
          }}>
            {score}
          </Text>
        ) : <Text type="secondary">-</Text>
      )
    },
    {
      title: '用时',
      dataIndex: 'timeSpent',
      key: 'timeSpent',
      render: (timeSpent: number | undefined) => (
        timeSpent ? (
          <Text>{Math.floor(timeSpent / 60)}分{timeSpent % 60}秒</Text>
        ) : <Text type="secondary">-</Text>
      )
    },
    {
      title: '完成时间',
      dataIndex: 'completedAt',
      key: 'completedAt',
      render: (completedAt: string | undefined) => (
        completedAt ? (
          <Text style={{ fontSize: '12px' }}>
            {moment(completedAt).format('MM-DD HH:mm')}
          </Text>
        ) : <Text type="secondary">-</Text>
      )
    }
  ];

  const filteredExamData = examData.filter(exam => {
    if (statusFilter !== 'all' && exam.status !== statusFilter) return false;
    if (searchKeyword && !exam.title.toLowerCase().includes(searchKeyword.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面头部 */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>
          <FileTextOutlined style={{ marginRight: '12px', color: primaryColor }} />
          考试监控
        </Title>
        <Text type="secondary">
          实时监控考试进行状态，管理学生参与情况，发送通知提醒
        </Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={24} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="进行中考试"
              value={examData.filter(e => e.status === 'active').length}
              prefix={<FireOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="总参与人次"
              value={examData.reduce((sum, e) => sum + e.totalParticipants, 0)}
              prefix={<TeamOutlined style={{ color: primaryColor }} />}
              valueStyle={{ color: primaryColor }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="完成率"
              value={
                examData.reduce((sum, e) => sum + e.totalParticipants, 0) > 0
                  ? ((examData.reduce((sum, e) => sum + e.completedCount, 0) / examData.reduce((sum, e) => sum + e.totalParticipants, 0)) * 100).toFixed(1)
                  : 0
              }
              suffix="%"
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均分"
              value={
                examData.length > 0
                  ? (examData.reduce((sum, e) => sum + e.averageScore, 0) / examData.length).toFixed(1)
                  : 0
              }
              prefix={<TrophyOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 筛选和搜索 */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col>
            <Text strong>筛选条件：</Text>
          </Col>
          <Col>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 120 }}
            >
              <Option value="all">全部状态</Option>
              <Option value="active">进行中</Option>
              <Option value="pending">未开始</Option>
              <Option value="completed">已结束</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Col>
          <Col>
            <Input
              placeholder="搜索考试名称"
              prefix={<SearchOutlined />}
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
          </Col>
          <Col>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadExamData}
            >
              刷新
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 考试列表 */}
      <Card>
        <Table
          dataSource={filteredExamData}
          columns={examColumns}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 场考试`
          }}
          locale={{
            emptyText: <Empty description="暂无考试数据" />
          }}
        />
      </Card>

      {/* 考试详情模态框 */}
      <Modal
        title={
          <Space>
            <EyeOutlined />
            <span>考试详情 - {selectedExam?.title}</span>
          </Space>
        }
        visible={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={1000}
        footer={null}
      >
        {selectedExam && (
          <Tabs defaultActiveKey="overview">
            <TabPane tab="概览统计" key="overview">
              <Row gutter={24}>
                <Col span={8}>
                  <Statistic
                    title="总参与人数"
                    value={selectedExam.totalParticipants}
                    prefix={<UserOutlined />}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="已完成人数"
                    value={selectedExam.completedCount}
                    prefix={<CheckCircleOutlined />}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="合格人数"
                    value={selectedExam.passedCount}
                    prefix={<TrophyOutlined />}
                  />
                </Col>
              </Row>
              
              <Divider />
              
              <Row gutter={24}>
                <Col span={12}>
                  <Card title="完成进度" size="small">
                    <Progress
                      type="circle"
                      percent={
                        selectedExam.totalParticipants > 0
                          ? (selectedExam.completedCount / selectedExam.totalParticipants * 100)
                          : 0
                      }
                      format={(percent) => `${selectedExam.completedCount}/${selectedExam.totalParticipants}`}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card title="合格率" size="small">
                    <Progress
                      type="circle"
                      percent={
                        selectedExam.completedCount > 0
                          ? (selectedExam.passedCount / selectedExam.completedCount * 100)
                          : 0
                      }
                      strokeColor="#52c41a"
                      format={(percent) => `${percent?.toFixed(1)}%`}
                    />
                  </Card>
                </Col>
              </Row>
            </TabPane>
            
            <TabPane tab="参与详情" key="participants">
              <Alert
                message="参与学生详情"
                description={`共 ${selectedExam.participants?.length || 0} 名学生参与此次考试`}
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />
              
              <Table
                dataSource={selectedExam.participants || []}
                columns={participantColumns}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `共 ${total} 名学生`
                }}
                size="small"
              />
            </TabPane>
          </Tabs>
        )}
      </Modal>

      {/* 发送通知模态框 */}
      <Modal
        title={
          <Space>
            <NotificationOutlined />
            <span>发送通知 - {selectedExam?.title}</span>
          </Space>
        }
        visible={notifyModalVisible}
        onCancel={() => {
          setNotifyModalVisible(false);
          setSelectedStudents([]);
          setNotificationMessage('');
        }}
        onOk={sendNotification}
        okText="发送通知"
        cancelText="取消"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>选择通知对象：</Text>
            <Table
              dataSource={selectedExam?.participants?.filter(p => 
                p.status === 'not_started' || p.status === 'overdue'
              ) || []}
              columns={[
                {
                  title: '学生姓名',
                  dataIndex: 'username',
                  render: (name, record) => (
                    <Space>
                      <Avatar size="small" icon={<UserOutlined />} />
                      <span>{name}</span>
                    </Space>
                  )
                },
                {
                  title: '状态',
                  dataIndex: 'status',
                  render: renderParticipantStatus
                }
              ]}
              rowKey="id"
              rowSelection={{
                selectedRowKeys: selectedStudents,
                onChange: (selectedRowKeys: React.Key[]) => {
                  setSelectedStudents(selectedRowKeys.map(key => String(key)));
                },
                getCheckboxProps: (record: any) => ({
                  disabled: record.status === 'completed'
                })
              }}
              pagination={false}
              size="small"
              style={{ maxHeight: '300px', overflow: 'auto' }}
            />
          </div>
          
          <div>
            <Text strong>通知内容：</Text>
            <Input.TextArea
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
              placeholder="请输入要发送的通知内容..."
              rows={4}
              maxLength={500}
              showCount
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
};

export default ExamMonitor; 