import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Select, DatePicker, Input, Tag, Typography, 
  Space, Avatar, Tooltip, Badge, Modal, Descriptions, Alert
} from 'antd';
import {
  AuditOutlined, SearchOutlined, FilterOutlined, EyeOutlined,
  UserOutlined, CheckCircleOutlined, CloseCircleOutlined,
  FileTextOutlined, EditOutlined, DeleteOutlined, PlusOutlined
} from '@ant-design/icons';
import { useTheme } from '../hooks/useTheme';
import '../styles/modern-theme.css';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Search } = Input;

interface OperationLog {
  id: string;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
  action: string;
  module: string;
  target: {
    type: string;
    id: string;
    name?: string;
  };
  details: any;
  ip: string;
  userAgent: string;
  result: 'success' | 'failed';
  errorMessage?: string;
  createdAt: string;
}

const OperationLogs: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<OperationLog | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    action: '',
    module: '',
    result: '',
    user: '',
    dateRange: null as any
  });

  const { isDark, primaryColor } = useTheme();

  // 模拟操作日志数据
  const mockLogs: OperationLog[] = [
    {
      id: '1',
      user: {
        id: '1',
        username: '张管理员',
        email: 'zhang.admin@school.com',
        role: 'super_admin'
      },
      action: 'create',
      module: 'user_management',
      target: {
        type: 'user',
        id: '123',
        name: '李小明'
      },
      details: {
        username: '李小明',
        email: 'li.xiaoming@school.com',
        role: 'student',
        grade: '三年级'
      },
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      result: 'success',
      createdAt: '2024-01-20T10:30:15Z'
    },
    {
      id: '2',
      user: {
        id: '2',
        username: '王老师',
        email: 'wang.teacher@school.com',
        role: 'institution_admin'
      },
      action: 'update',
      module: 'question_management',
      target: {
        type: 'question',
        id: '456',
        name: '足球基础知识题'
      },
      details: {
        title: '足球基础知识题',
        difficulty: 'easy',
        category: '足球',
        changes: ['title', 'difficulty']
      },
      ip: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      result: 'success',
      createdAt: '2024-01-20T09:45:22Z'
    },
    {
      id: '3',
      user: {
        id: '3',
        username: '李审核员',
        email: 'li.reviewer@school.com',
        role: 'content_manager'
      },
      action: 'review',
      module: 'question_management',
      target: {
        type: 'question',
        id: '789',
        name: '篮球投篮技巧'
      },
      details: {
        reviewResult: 'approved',
        comment: '题目内容准确，可以发布'
      },
      ip: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      result: 'success',
      createdAt: '2024-01-20T08:20:10Z'
    },
    {
      id: '4',
      user: {
        id: '1',
        username: '张管理员',
        email: 'zhang.admin@school.com',
        role: 'super_admin'
      },
      action: 'delete',
      module: 'user_management',
      target: {
        type: 'user',
        id: '999',
        name: '测试用户'
      },
      details: {
        reason: '测试账号清理',
        confirmationCode: 'DELETE_USER_999'
      },
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      result: 'success',
      createdAt: '2024-01-19T16:30:45Z'
    },
    {
      id: '5',
      user: {
        id: '4',
        username: '赵老师',
        email: 'zhao.teacher@school.com',
        role: 'teacher'
      },
      action: 'login',
      module: 'authentication',
      target: {
        type: 'system',
        id: 'login'
      },
      details: {
        loginMethod: 'password',
        device: 'Windows PC'
      },
      ip: '192.168.1.103',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      result: 'failed',
      errorMessage: '密码错误，连续失败3次',
      createdAt: '2024-01-19T15:20:33Z'
    },
    {
      id: '6',
      user: {
        id: '2',
        username: '王老师',
        email: 'wang.teacher@school.com',
        role: 'institution_admin'
      },
      action: 'export',
      module: 'data_analysis',
      target: {
        type: 'report',
        id: 'student_progress_202401',
        name: '2024年1月学生进度报告'
      },
      details: {
        reportType: 'student_progress',
        dateRange: '2024-01-01 to 2024-01-31',
        format: 'xlsx',
        recordCount: 156
      },
      ip: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      result: 'success',
      createdAt: '2024-01-19T14:15:20Z'
    }
  ];

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    setTimeout(() => {
      setLogs(mockLogs);
      setLoading(false);
    }, 800);
  };

  // 获取操作类型显示名称
  const getActionName = (action: string) => {
    const actionMap: { [key: string]: string } = {
      'create': '创建',
      'update': '更新',
      'delete': '删除',
      'review': '审核',
      'login': '登录',
      'logout': '登出',
      'export': '导出',
      'import': '导入',
      'assign': '分配',
      'revoke': '撤销'
    };
    return actionMap[action] || action;
  };

  // 获取模块显示名称
  const getModuleName = (module: string) => {
    const moduleMap: { [key: string]: string } = {
      'user_management': '用户管理',
      'question_management': '题目管理',
      'data_analysis': '数据分析',
      'system_management': '系统管理',
      'authentication': '身份认证'
    };
    return moduleMap[module] || module;
  };

  // 获取操作结果颜色
  const getResultColor = (result: string) => {
    return result === 'success' ? '#52c41a' : '#ff4d4f';
  };

  // 获取操作结果图标
  const getResultIcon = (result: string) => {
    return result === 'success' ? <CheckCircleOutlined /> : <CloseCircleOutlined />;
  };

  // 格式化IP地址
  const formatIP = (ip: string) => {
    return ip.replace(/(\d+\.\d+\.\d+\.)(\d+)/, '$1***');
  };

  // 表格列定义
  const columns = [
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => (
        <div>
          <Text style={{ fontSize: '13px' }}>
            {new Date(date).toLocaleDateString()}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {new Date(date).toLocaleTimeString()}
          </Text>
        </div>
      ),
      sorter: (a: OperationLog, b: OperationLog) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: 'descend' as const
    },
    {
      title: '操作用户',
      key: 'user',
      width: 180,
      render: (record: OperationLog) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            size={32}
            icon={<UserOutlined />}
            style={{
              marginRight: '8px',
              background: record.user.role === 'super_admin' ? '#ff4d4f' :
                         record.user.role === 'institution_admin' ? '#faad14' :
                         record.user.role === 'content_manager' ? '#1890ff' : '#52c41a'
            }}
          />
          <div>
            <Text strong style={{ fontSize: '13px' }}>{record.user.username}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {record.user.role === 'super_admin' ? '超级管理员' :
               record.user.role === 'institution_admin' ? '机构管理员' :
               record.user.role === 'content_manager' ? '内容管理员' : '教师'}
            </Text>
          </div>
        </div>
      )
    },
    {
      title: '操作',
      key: 'operation',
      width: 120,
      render: (record: OperationLog) => (
        <div>
          <Tag color="blue" style={{ marginBottom: '4px', fontSize: '11px' }}>
            {getActionName(record.action)}
          </Tag>
          <br />
          <Tag color="cyan" style={{ fontSize: '10px' }}>
            {getModuleName(record.module)}
          </Tag>
        </div>
      )
    },
    {
      title: '目标对象',
      key: 'target',
      width: 200,
      render: (record: OperationLog) => (
        <div>
          <Text strong style={{ fontSize: '13px' }}>
            {record.target.name || `${record.target.type}_${record.target.id}`}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            类型: {record.target.type} | ID: {record.target.id}
          </Text>
        </div>
      )
    },
    {
      title: '来源',
      key: 'source',
      width: 130,
      render: (record: OperationLog) => (
        <div>
          <Text style={{ fontSize: '12px' }}>
            IP: {formatIP(record.ip)}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.userAgent.includes('Windows') ? 'Windows' :
             record.userAgent.includes('Mac') ? 'macOS' : 'Other'}
          </Text>
        </div>
      )
    },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      width: 80,
      render: (result: string, record: OperationLog) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            color: getResultColor(result),
            fontSize: '16px',
            marginBottom: '2px'
          }}>
            {getResultIcon(result)}
          </div>
          <Text 
            style={{ 
              fontSize: '11px',
              color: getResultColor(result),
              fontWeight: 'bold'
            }}
          >
            {result === 'success' ? '成功' : '失败'}
          </Text>
          {record.errorMessage && (
            <Tooltip title={record.errorMessage}>
              <div style={{ fontSize: '10px', color: '#ff4d4f', marginTop: '2px' }}>
                查看错误
              </div>
            </Tooltip>
          )}
        </div>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (record: OperationLog) => (
        <Tooltip title="查看详情">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedLog(record);
              setDetailModalVisible(true);
            }}
            style={{ color: primaryColor }}
          />
        </Tooltip>
      ),
    },
  ];

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
                <AuditOutlined style={{ fontSize: '20px', color: primaryColor }} />
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
                  操作日志
                </Title>
                <Text type="secondary" style={{ fontSize: '16px', marginLeft: '2px' }}>
                  系统操作记录和安全审计
                </Text>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 筛选区域 */}
      <div className="modern-card animate-slideUp" style={{
        animationDelay: '0.1s',
        background: isDark ? '#1a1a1a' : '#ffffff',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '24px',
        border: `1px solid ${isDark ? '#404040' : '#e2e8f0'}`
      }}>
        <Space wrap size="middle">
          <div>
            <Text strong style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>
              操作类型
            </Text>
            <Select
              placeholder="全部操作"
              style={{ width: 120 }}
              value={filters.action}
              onChange={(value) => setFilters({ ...filters, action: value })}
              allowClear
            >
              <Select.Option value="create">创建</Select.Option>
              <Select.Option value="update">更新</Select.Option>
              <Select.Option value="delete">删除</Select.Option>
              <Select.Option value="review">审核</Select.Option>
              <Select.Option value="login">登录</Select.Option>
              <Select.Option value="export">导出</Select.Option>
            </Select>
          </div>
          
          <div>
            <Text strong style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>
              功能模块
            </Text>
            <Select
              placeholder="全部模块"
              style={{ width: 140 }}
              value={filters.module}
              onChange={(value) => setFilters({ ...filters, module: value })}
              allowClear
            >
              <Select.Option value="user_management">用户管理</Select.Option>
              <Select.Option value="question_management">题目管理</Select.Option>
              <Select.Option value="data_analysis">数据分析</Select.Option>
              <Select.Option value="system_management">系统管理</Select.Option>
              <Select.Option value="authentication">身份认证</Select.Option>
            </Select>
          </div>

          <div>
            <Text strong style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>
              操作结果
            </Text>
            <Select
              placeholder="全部结果"
              style={{ width: 100 }}
              value={filters.result}
              onChange={(value) => setFilters({ ...filters, result: value })}
              allowClear
            >
              <Select.Option value="success">成功</Select.Option>
              <Select.Option value="failed">失败</Select.Option>
            </Select>
          </div>

          <div>
            <Text strong style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>
              时间范围
            </Text>
            <RangePicker
              style={{ width: 220 }}
              value={filters.dateRange}
              onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
            />
          </div>

          <div>
            <Text strong style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>
              用户搜索
            </Text>
            <Search
              placeholder="搜索用户"
              style={{ width: 160 }}
              value={filters.user}
              onChange={(e) => setFilters({ ...filters, user: e.target.value })}
              allowClear
            />
          </div>

          <div style={{ alignSelf: 'flex-end' }}>
            <Button 
              type="primary" 
              icon={<SearchOutlined />}
              onClick={loadLogs}
            >
              搜索
            </Button>
          </div>
        </Space>
      </div>

      {/* 统计信息 */}
      <div className="animate-slideUp" style={{ animationDelay: '0.2s', marginBottom: '24px' }}>
        <Alert
          message={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                共找到 <Text strong style={{ color: primaryColor }}>{logs.length}</Text> 条操作记录
              </span>
              <Space>
                <Badge status="success" text={`成功: ${logs.filter(l => l.result === 'success').length}`} />
                <Badge status="error" text={`失败: ${logs.filter(l => l.result === 'failed').length}`} />
              </Space>
            </div>
          }
          type="info"
          showIcon
        />
      </div>

      {/* 主要内容区域 */}
      <div className="modern-card animate-slideUp" style={{
        animationDelay: '0.3s',
        background: isDark ? '#1a1a1a' : '#ffffff',
        borderRadius: '16px',
        padding: '24px',
        border: `1px solid ${isDark ? '#404040' : '#e2e8f0'}`
      }}>
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          size="middle"
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
          scroll={{ x: 1000 }}
        />
      </div>

      {/* 详情模态框 */}
      <Modal
        title="操作详情"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedLog(null);
        }}
        footer={null}
        width={700}
      >
        {selectedLog && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="操作时间">
                {new Date(selectedLog.createdAt).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="操作用户">
                <Space>
                  <Avatar size={24} icon={<UserOutlined />} />
                  {selectedLog.user.username} ({selectedLog.user.email})
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="操作类型">
                <Tag color="blue">{getActionName(selectedLog.action)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="功能模块">
                <Tag color="cyan">{getModuleName(selectedLog.module)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="目标对象">
                {selectedLog.target.name || `${selectedLog.target.type}_${selectedLog.target.id}`}
              </Descriptions.Item>
              <Descriptions.Item label="操作结果">
                <Badge 
                  status={selectedLog.result === 'success' ? 'success' : 'error'}
                  text={selectedLog.result === 'success' ? '成功' : '失败'}
                />
              </Descriptions.Item>
              <Descriptions.Item label="IP地址">
                {selectedLog.ip}
              </Descriptions.Item>
              <Descriptions.Item label="用户代理">
                <Tooltip title={selectedLog.userAgent}>
                  <Text ellipsis style={{ maxWidth: '200px' }}>
                    {selectedLog.userAgent}
                  </Text>
                </Tooltip>
              </Descriptions.Item>
            </Descriptions>

            {selectedLog.errorMessage && (
              <Alert
                message="错误信息"
                description={selectedLog.errorMessage}
                type="error"
                showIcon
                style={{ marginTop: '16px' }}
              />
            )}

            <Card title="详细信息" size="small" style={{ marginTop: '16px' }}>
              <pre style={{ 
                background: isDark ? '#262626' : '#f5f5f5',
                padding: '12px',
                borderRadius: '6px',
                fontSize: '12px',
                maxHeight: '300px',
                overflow: 'auto'
              }}>
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OperationLogs; 