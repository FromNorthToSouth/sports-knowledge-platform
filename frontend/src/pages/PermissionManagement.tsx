import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Table, Button, Modal, Form, Input, Select, Switch, 
  Tag, Typography, Space, Divider, Tree, Tabs, message, Popconfirm,
  Badge, Tooltip, Transfer, Timeline, Alert, Drawer
} from 'antd';
import {
  SettingOutlined, UserOutlined, TeamOutlined, KeyOutlined,
  EditOutlined, DeleteOutlined, PlusOutlined, EyeOutlined,
  SecurityScanOutlined, AuditOutlined, ClockCircleOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined, FilterOutlined
} from '@ant-design/icons';
import { useTheme } from '../hooks/useTheme';
import '../styles/modern-theme.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

interface Permission {
  id: string;
  name: string;
  code: string;
  module: string;
  description: string;
  isActive: boolean;
}

interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  institution?: string;
  restrictions: {
    maxUsers?: number;
    questionDifficultyLimit?: string[];
    moduleAccess?: string[];
  };
  userCount: number;
  createdBy: string;
  createdAt: string;
}

interface UserRole {
  id: string;
  userId: string;
  username: string;
  email: string;
  role: string;
  roleName: string;
  assignedBy: string;
  assignedAt: string;
  expiresAt?: string;
  isActive: boolean;
}

const PermissionManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('permissions');
  const [loading, setLoading] = useState(false);
  
  // 权限管理状态
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  
  // 角色管理状态
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [assignRoleModalVisible, setAssignRoleModalVisible] = useState(false);
  
  // 用户角色状态
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [userRoleDetailVisible, setUserRoleDetailVisible] = useState(false);
  const [selectedUserRole, setSelectedUserRole] = useState<UserRole | null>(null);

  const [permissionForm] = Form.useForm();
  const [roleForm] = Form.useForm();
  const [assignForm] = Form.useForm();

  const { isDark, primaryColor } = useTheme();

  // 模拟权限数据
  const mockPermissions: Permission[] = [
    { id: '1', name: '用户查看', code: 'user.view', module: 'user_management', description: '查看用户信息', isActive: true },
    { id: '2', name: '用户创建', code: 'user.create', module: 'user_management', description: '创建新用户', isActive: true },
    { id: '3', name: '用户编辑', code: 'user.edit', module: 'user_management', description: '编辑用户信息', isActive: true },
    { id: '4', name: '用户删除', code: 'user.delete', module: 'user_management', description: '删除用户账号', isActive: true },
    { id: '5', name: '题目查看', code: 'question.view', module: 'question_management', description: '查看题目内容', isActive: true },
    { id: '6', name: '题目创建', code: 'question.create', module: 'question_management', description: '创建新题目', isActive: true },
    { id: '7', name: '题目审核', code: 'question.review', module: 'question_management', description: '审核题目内容', isActive: true },
    { id: '8', name: '数据分析', code: 'data.analysis', module: 'data_analysis', description: '查看数据分析报告', isActive: true },
    { id: '9', name: '系统设置', code: 'system.config', module: 'system_management', description: '修改系统配置', isActive: true },
    { id: '10', name: '操作日志', code: 'log.view', module: 'system_management', description: '查看操作日志', isActive: true },
  ];

  // 模拟角色数据
  const mockRoles: Role[] = [
    {
      id: '1',
      name: '超级管理员',
      code: 'super_admin',
      description: '拥有系统所有权限',
      permissions: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
      isSystem: true,
      restrictions: {},
      userCount: 2,
      createdBy: '系统',
      createdAt: '2024-01-01'
    },
    {
      id: '2',
      name: '机构管理员',
      code: 'institution_admin',
      description: '管理本机构用户和数据',
      permissions: ['1', '2', '3', '5', '6', '8'],
      isSystem: true,
      restrictions: { moduleAccess: ['user_management', 'question_management', 'data_analysis'] },
      userCount: 8,
      createdBy: '系统',
      createdAt: '2024-01-01'
    },
    {
      id: '3',
      name: '内容管理员',
      code: 'content_manager',
      description: '管理题目内容和审核',
      permissions: ['5', '6', '7'],
      isSystem: true,
      restrictions: { moduleAccess: ['question_management'] },
      userCount: 15,
      createdBy: '系统',
      createdAt: '2024-01-01'
    },
    {
      id: '4',
      name: '初级审核员',
      code: 'junior_reviewer',
      description: '只能审核简单和中等难度题目',
      permissions: ['5', '7'],
      isSystem: false,
      restrictions: { 
        questionDifficultyLimit: ['easy', 'medium'],
        moduleAccess: ['question_management'],
        maxUsers: 10
      },
      userCount: 5,
      createdBy: '管理员',
      createdAt: '2024-01-15'
    }
  ];

  // 模拟用户角色数据
  const mockUserRoles: UserRole[] = [
    {
      id: '1',
      userId: '1',
      username: '张管理员',
      email: 'zhang.admin@school.com',
      role: '1',
      roleName: '超级管理员',
      assignedBy: '系统',
      assignedAt: '2024-01-01',
      isActive: true
    },
    {
      id: '2',
      userId: '2',
      username: '李机构长',
      email: 'li.institution@school.com',
      role: '2',
      roleName: '机构管理员',
      assignedBy: '张管理员',
      assignedAt: '2024-01-05',
      isActive: true
    },
    {
      id: '3',
      userId: '3',
      username: '王审核员',
      email: 'wang.reviewer@school.com',
      role: '3',
      roleName: '内容管理员',
      assignedBy: '李机构长',
      assignedAt: '2024-01-10',
      expiresAt: '2025-01-10',
      isActive: true
    }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setTimeout(() => {
      setPermissions(mockPermissions);
      setRoles(mockRoles);
      setUserRoles(mockUserRoles);
      setLoading(false);
    }, 800);
  };

  // 权限管理相关函数
  const handlePermissionSave = async (values: any) => {
    try {
      if (selectedPermission) {
        message.success('权限更新成功');
      } else {
        message.success('权限创建成功');
      }
      setPermissionModalVisible(false);
      permissionForm.resetFields();
      setSelectedPermission(null);
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handlePermissionDelete = async (permission: Permission) => {
    try {
      message.success('权限删除成功');
      loadData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 角色管理相关函数
  const handleRoleSave = async (values: any) => {
    try {
      if (selectedRole) {
        message.success('角色更新成功');
      } else {
        message.success('角色创建成功');
      }
      setRoleModalVisible(false);
      roleForm.resetFields();
      setSelectedRole(null);
      loadData();
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleRoleDelete = async (role: Role) => {
    try {
      message.success('角色删除成功');
      loadData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 用户角色分配
  const handleAssignRole = async (values: any) => {
    try {
      message.success('角色分配成功');
      setAssignRoleModalVisible(false);
      assignForm.resetFields();
      loadData();
    } catch (error) {
      message.error('分配失败');
    }
  };

  // 权限表格列
  const permissionColumns = [
    {
      title: '权限名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
    },
    {
      title: '权限代码',
      dataIndex: 'code',
      key: 'code',
      width: 180,
      render: (code: string) => (
        <Tag color="blue" style={{ fontFamily: 'monospace' }}>
          {code}
        </Tag>
      )
    },
    {
      title: '所属模块',
      dataIndex: 'module',
      key: 'module',
      width: 150,
      render: (module: string) => {
        const moduleColors: { [key: string]: string } = {
          'user_management': 'green',
          'question_management': 'orange',
          'data_analysis': 'purple',
          'system_management': 'red'
        };
        const moduleNames: { [key: string]: string } = {
          'user_management': '用户管理',
          'question_management': '题目管理',
          'data_analysis': '数据分析',
          'system_management': '系统管理'
        };
        return (
          <Tag color={moduleColors[module] || 'default'}>
            {moduleNames[module] || module}
          </Tag>
        );
      }
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean) => (
        <Badge 
          status={isActive ? 'success' : 'error'} 
          text={isActive ? '启用' : '禁用'} 
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (record: Permission) => (
        <Space size="small">
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedPermission(record);
                permissionForm.setFieldsValue(record);
                setPermissionModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定删除此权限吗？"
              onConfirm={() => handlePermissionDelete(record)}
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

  // 角色表格列
  const roleColumns = [
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (name: string, record: Role) => (
        <div>
          <Text strong>{name}</Text>
          {record.isSystem && (
            <Tag color="gold" style={{ marginLeft: 8, fontSize: '11px', padding: '2px 6px', height: 'auto', lineHeight: 1.2 }}>
              系统角色
            </Tag>
          )}
        </div>
      )
    },
    {
      title: '角色代码',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      render: (code: string) => (
        <Tag color="cyan" style={{ fontFamily: 'monospace' }}>
          {code}
        </Tag>
      )
    },
    {
      title: '权限数量',
      key: 'permissions',
      width: 100,
      render: (record: Role) => (
        <Badge count={record.permissions.length} style={{ backgroundColor: primaryColor }} />
      )
    },
    {
      title: '用户数量',
      dataIndex: 'userCount',
      key: 'userCount',
      width: 100,
      render: (count: number) => (
        <Text>{count} 人</Text>
      )
    },
    {
      title: '限制条件',
      key: 'restrictions',
      width: 200,
      render: (record: Role) => (
        <div>
          {record.restrictions.maxUsers && (
            <Tag color="orange" style={{ fontSize: '11px', padding: '2px 6px', height: 'auto', lineHeight: 1.2 }}>
              最多 {record.restrictions.maxUsers} 人
            </Tag>
          )}
          {record.restrictions.questionDifficultyLimit && (
            <Tag color="purple" style={{ fontSize: '11px', padding: '2px 6px', height: 'auto', lineHeight: 1.2 }}>
              限制题目难度
            </Tag>
          )}
          {record.restrictions.moduleAccess && (
            <Tag color="green" style={{ fontSize: '11px', padding: '2px 6px', height: 'auto', lineHeight: 1.2 }}>
              限制模块访问
            </Tag>
          )}
        </div>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (record: Role) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedRole(record);
                setUserRoleDetailVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => {
                setSelectedRole(record);
                roleForm.setFieldsValue({
                  ...record,
                  permissions: record.permissions
                });
                setRoleModalVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="分配给用户">
            <Button
              type="text"
              size="small"
              icon={<UserOutlined />}
              onClick={() => {
                setSelectedRole(record);
                setAssignRoleModalVisible(true);
              }}
            />
          </Tooltip>
          {!record.isSystem && (
            <Tooltip title="删除">
              <Popconfirm
                title="确定删除此角色吗？"
                onConfirm={() => handleRoleDelete(record)}
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
          )}
        </Space>
      ),
    },
  ];

  // 用户角色表格列
  const userRoleColumns = [
    {
      title: '用户信息',
      key: 'user',
      width: 200,
      render: (record: UserRole) => (
        <div>
          <Text strong>{record.username}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.email}
          </Text>
        </div>
      )
    },
    {
      title: '角色',
      dataIndex: 'roleName',
      key: 'roleName',
      width: 150,
      render: (roleName: string) => (
        <Tag color={primaryColor}>{roleName}</Tag>
      )
    },
    {
      title: '分配者',
      dataIndex: 'assignedBy',
      key: 'assignedBy',
      width: 120,
    },
    {
      title: '分配时间',
      dataIndex: 'assignedAt',
      key: 'assignedAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: '过期时间',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      width: 120,
      render: (date?: string) => date ? new Date(date).toLocaleDateString() : '永久'
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean) => (
        <Badge 
          status={isActive ? 'success' : 'error'} 
          text={isActive ? '有效' : '无效'} 
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (record: UserRole) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedUserRole(record);
                setUserRoleDetailVisible(true);
              }}
            />
          </Tooltip>
          <Tooltip title="撤销角色">
            <Popconfirm
              title="确定撤销此用户的角色吗？"
              onConfirm={() => {
                message.success('角色撤销成功');
                loadData();
              }}
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
                <SecurityScanOutlined style={{ fontSize: '20px', color: primaryColor }} />
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
                  权限管理
                </Title>
                <Text type="secondary" style={{ fontSize: '16px', marginLeft: '2px' }}>
                  系统权限、角色管理和用户授权
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
                <KeyOutlined style={{ marginRight: '8px' }} />
                权限管理
                <Badge 
                  count={permissions.length} 
                  style={{ 
                    marginLeft: '8px',
                    background: primaryColor
                  }} 
                />
              </span>
            } 
            key="permissions"
          >
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                <Space>
                  <Select
                    placeholder="筛选模块"
                    style={{ width: 150 }}
                    allowClear
                  >
                    <Option value="user_management">用户管理</Option>
                    <Option value="question_management">题目管理</Option>
                    <Option value="data_analysis">数据分析</Option>
                    <Option value="system_management">系统管理</Option>
                  </Select>
                </Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setSelectedPermission(null);
                    permissionForm.resetFields();
                    setPermissionModalVisible(true);
                  }}
                >
                  添加权限
                </Button>
              </div>
              <Table
                columns={permissionColumns}
                dataSource={permissions}
                rowKey="id"
                loading={loading}
                pagination={{
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
                <TeamOutlined style={{ marginRight: '8px' }} />
                角色管理
                <Badge 
                  count={roles.length} 
                  style={{ 
                    marginLeft: '8px',
                    background: '#52c41a'
                  }} 
                />
              </span>
            } 
            key="roles"
          >
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                <Space>
                  <Select
                    placeholder="筛选角色类型"
                    style={{ width: 150 }}
                    allowClear
                  >
                    <Option value="system">系统角色</Option>
                    <Option value="custom">自定义角色</Option>
                  </Select>
                </Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setSelectedRole(null);
                    roleForm.resetFields();
                    setRoleModalVisible(true);
                  }}
                >
                  创建角色
                </Button>
              </div>
              <Table
                columns={roleColumns}
                dataSource={roles}
                rowKey="id"
                loading={loading}
                pagination={{
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
                <UserOutlined style={{ marginRight: '8px' }} />
                用户角色
                <Badge 
                  count={userRoles.length} 
                  style={{ 
                    marginLeft: '8px',
                    background: '#faad14'
                  }} 
                />
              </span>
            } 
            key="user-roles"
          >
            <div style={{ padding: '24px' }}>
              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                <Space>
                  <Select
                    placeholder="筛选角色"
                    style={{ width: 150 }}
                    allowClear
                  >
                    {roles.map(role => (
                      <Option key={role.id} value={role.id}>
                        {role.name}
                      </Option>
                    ))}
                  </Select>
                </Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setAssignRoleModalVisible(true);
                  }}
                >
                  分配角色
                </Button>
              </div>
              <Table
                columns={userRoleColumns}
                dataSource={userRoles}
                rowKey="id"
                loading={loading}
                pagination={{
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`,
                }}
              />
            </div>
          </TabPane>
        </Tabs>
      </div>

      {/* 权限编辑模态框 */}
      <Modal
        title={selectedPermission ? '编辑权限' : '添加权限'}
        open={permissionModalVisible}
        onCancel={() => {
          setPermissionModalVisible(false);
          setSelectedPermission(null);
          permissionForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={permissionForm}
          layout="vertical"
          onFinish={handlePermissionSave}
        >
          <Form.Item
            label="权限名称"
            name="name"
            rules={[{ required: true, message: '请输入权限名称' }]}
          >
            <Input placeholder="请输入权限名称" />
          </Form.Item>
          <Form.Item
            label="权限代码"
            name="code"
            rules={[{ required: true, message: '请输入权限代码' }]}
          >
            <Input placeholder="如：user.create" />
          </Form.Item>
          <Form.Item
            label="所属模块"
            name="module"
            rules={[{ required: true, message: '请选择所属模块' }]}
          >
            <Select placeholder="请选择所属模块">
              <Option value="user_management">用户管理</Option>
              <Option value="question_management">题目管理</Option>
              <Option value="data_analysis">数据分析</Option>
              <Option value="system_management">系统管理</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="描述"
            name="description"
            rules={[{ required: true, message: '请输入权限描述' }]}
          >
            <TextArea rows={3} placeholder="请输入权限描述" />
          </Form.Item>
          <Form.Item
            label="状态"
            name="isActive"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button 
                onClick={() => {
                  setPermissionModalVisible(false);
                  setSelectedPermission(null);
                  permissionForm.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {selectedPermission ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 角色编辑模态框 */}
      <Modal
        title={selectedRole ? '编辑角色' : '创建角色'}
        open={roleModalVisible}
        onCancel={() => {
          setRoleModalVisible(false);
          setSelectedRole(null);
          roleForm.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={roleForm}
          layout="vertical"
          onFinish={handleRoleSave}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="角色名称"
                name="name"
                rules={[{ required: true, message: '请输入角色名称' }]}
              >
                <Input placeholder="请输入角色名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="角色代码"
                name="code"
                rules={[{ required: true, message: '请输入角色代码' }]}
              >
                <Input placeholder="如：content_manager" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="描述"
            name="description"
            rules={[{ required: true, message: '请输入角色描述' }]}
          >
            <TextArea rows={2} placeholder="请输入角色描述" />
          </Form.Item>
          <Form.Item
            label="权限配置"
            name="permissions"
            rules={[{ required: true, message: '请选择权限' }]}
          >
            <Transfer
              dataSource={permissions.map(p => ({
                key: p.id,
                title: p.name,
                description: p.description
              }))}
              targetKeys={roleForm.getFieldValue('permissions') || []}
              onChange={(targetKeys) => {
                roleForm.setFieldsValue({ permissions: targetKeys });
              }}
              render={item => item.title}
              listStyle={{ width: 300, height: 300 }}
              titles={['可用权限', '已选权限']}
              showSearch
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="最大用户数" name={['restrictions', 'maxUsers']}>
                <Input type="number" placeholder="不限制" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="题目难度限制" name={['restrictions', 'questionDifficultyLimit']}>
                <Select mode="multiple" placeholder="不限制">
                  <Option value="easy">简单</Option>
                  <Option value="medium">中等</Option>
                  <Option value="hard">困难</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="模块访问限制" name={['restrictions', 'moduleAccess']}>
                <Select mode="multiple" placeholder="不限制">
                  <Option value="user_management">用户管理</Option>
                  <Option value="question_management">题目管理</Option>
                  <Option value="data_analysis">数据分析</Option>
                  <Option value="system_management">系统管理</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button 
                onClick={() => {
                  setRoleModalVisible(false);
                  setSelectedRole(null);
                  roleForm.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {selectedRole ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 角色分配模态框 */}
      <Modal
        title="分配角色"
        open={assignRoleModalVisible}
        onCancel={() => {
          setAssignRoleModalVisible(false);
          assignForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={assignForm}
          layout="vertical"
          onFinish={handleAssignRole}
        >
          <Form.Item
            label="选择用户"
            name="userId"
            rules={[{ required: true, message: '请选择用户' }]}
          >
            <Select placeholder="请选择用户" showSearch>
              <Option value="1">张小明 (zhang@school.com)</Option>
              <Option value="2">李小红 (li@school.com)</Option>
              <Option value="3">王小强 (wang@school.com)</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="选择角色"
            name="roleId"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              {roles.map(role => (
                <Option key={role.id} value={role.id}>
                  {role.name} - {role.description}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="过期时间" name="expiresAt">
            <Input type="date" placeholder="留空表示永久有效" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setAssignRoleModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                分配
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 用户角色详情抽屉 */}
      <Drawer
        title="角色详情"
        placement="right"
        onClose={() => setUserRoleDetailVisible(false)}
        open={userRoleDetailVisible}
        width={600}
      >
        {selectedUserRole && (
          <div>
            <Card title="用户信息" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>用户名：</Text>
                  <Text>{selectedUserRole.username}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>邮箱：</Text>
                  <Text>{selectedUserRole.email}</Text>
                </Col>
              </Row>
            </Card>
            
            <Card title="角色信息" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>角色名称：</Text>
                  <Text>{selectedUserRole.roleName}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>分配者：</Text>
                  <Text>{selectedUserRole.assignedBy}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>分配时间：</Text>
                  <Text>{new Date(selectedUserRole.assignedAt).toLocaleString()}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>过期时间：</Text>
                  <Text>{selectedUserRole.expiresAt ? new Date(selectedUserRole.expiresAt).toLocaleString() : '永久'}</Text>
                </Col>
              </Row>
            </Card>

            <Card title="权限详情" size="small">
              <div>
                {selectedRole?.permissions.map(permId => {
                  const perm = permissions.find(p => p.id === permId);
                  return perm ? (
                    <Tag key={perm.id} color="blue" style={{ margin: '4px' }}>
                      {perm.name}
                    </Tag>
                  ) : null;
                })}
              </div>
            </Card>

            <Card title="操作历史" size="small" style={{ marginTop: 16 }}>
              <Timeline>
                <Timeline.Item color="green">
                  <Text>角色分配成功</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {new Date(selectedUserRole.assignedAt).toLocaleString()}
                  </Text>
                </Timeline.Item>
              </Timeline>
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default PermissionManagement; 