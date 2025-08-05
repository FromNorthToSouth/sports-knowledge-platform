import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Select, message, Spin, Row, Col, Space } from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  LockOutlined, 
  BankOutlined,
  TeamOutlined,
  BookOutlined,
  SafetyOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  StarOutlined
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../store/slices/authSlice';
import { RegisterForm, RootState } from '../types';
import api from '../services/api';
import { useTheme } from '../hooks/useTheme';

const { Title, Text, Link } = Typography;
const { Option } = Select;

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [institutions, setInstitutions] = useState<{ _id: string, name: string }[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { isDark, primaryColor } = useTheme();

  // 获取学校列表
  const fetchInstitutions = async (search?: string) => {
    setSearchLoading(true);
    try {
      // 使用专门的注册API端点
      const response = await api.get('/institutions/for-registration', {
        params: { 
          keyword: search
        }
      });
      
      console.log('获取学校列表API响应:', response.data);
      
      if (response.data.success && response.data.data) {
        const institutionsData = response.data.data;
        
        if (Array.isArray(institutionsData)) {
          setInstitutions(institutionsData);
          console.log('✅ 成功加载学校列表:', institutionsData.length, '个学校');
          
          // 显示学校名称以便调试
          if (institutionsData.length > 0) {
            console.log('学校列表:', institutionsData.map(inst => inst.name).join(', '));
          }
        } else {
          console.warn('❌ 学校数据不是数组格式:', institutionsData);
          setInstitutions([]);
          message.warning('学校数据格式异常');
        }
      } else {
        console.warn('❌ API响应格式异常:', response.data);
        setInstitutions([]);
        message.warning('无法获取学校数据');
      }
    } catch (error: any) {
      console.error('❌ 获取学校列表失败:', error);
      
      if (error.response) {
        console.error('响应状态:', error.response.status);
        console.error('响应数据:', error.response.data);
        
        if (error.response.status === 404) {
          message.error('学校数据接口未找到，请检查后端服务');
        } else if (error.response.status === 500) {
          message.error('服务器内部错误，请联系管理员');
        } else {
          message.error(`获取学校列表失败 (${error.response.status})`);
        }
      } else if (error.request) {
        console.error('无响应:', error.request);
        message.error('无法连接到服务器，请检查网络连接');
      } else {
        console.error('请求配置错误:', error.message);
        message.error(`请求失败: ${error.message}`);
      }
      
      setInstitutions([]);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutions(); // 初始加载一次
  }, []);
  
  // 如果已经登录，直接跳转到仪表盘
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onFinish = async (values: RegisterForm) => {
    setLoading(true);
    try {
      const result = await dispatch(registerUser(values) as any).unwrap();
      message.success('注册成功');
      // 注册成功后，isAuthenticated 会更新，useEffect 会处理跳转
    } catch (error: any) {
      console.error('Register error:', error);
      message.error(error || '注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`login-container ${isDark ? 'dark-theme' : 'light-theme'}`} style={{
      display: 'flex',
      minHeight: '100vh',
      background: isDark 
        ? 'linear-gradient(135deg, #141414 0%, #1f1f1f 50%, #262626 100%)'
        : `linear-gradient(135deg, ${primaryColor}05 0%, ${primaryColor}10 50%, ${primaryColor}15 100%)`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 背景装饰 */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-20%',
        width: '800px',
        height: '800px',
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
        borderRadius: '50%',
        opacity: 0.1,
        filter: 'blur(100px)'
      }} />
      
      <div style={{
        position: 'absolute',
        bottom: '-30%',
        right: '-10%',
        width: '600px',
        height: '600px',
        background: `radial-gradient(circle, ${primaryColor}20 0%, transparent 70%)`,
        borderRadius: '50%'
      }} />

      <Row style={{ width: '100%', margin: 0 }}>
        {/* 左侧品牌区域 */}
        <Col xs={0} lg={12} style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '80px 60px',
          position: 'relative'
        }}>
          <div className="animate-fadeIn" style={{ textAlign: 'center', zIndex: 1 }}>
            <div style={{
              width: '120px',
              height: '120px',
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              color: 'white',
              margin: '0 auto 32px',
              boxShadow: `0 20px 40px ${primaryColor}40`,
              animation: 'bounce 2s infinite'
            }}>
              <TeamOutlined />
            </div>
            
            <Title level={1} className="gradient-text" style={{ 
              fontSize: '3rem', 
              marginBottom: '16px',
              background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              加入我们
            </Title>
            
            <Title level={2} style={{ 
              color: isDark ? '#ffffff' : '#1a202c',
              marginBottom: '24px',
              fontWeight: 'normal'
            }}>
              开启智能学习之旅
            </Title>
            
            <Text style={{ 
              fontSize: '18px',
              color: isDark ? '#a1a1aa' : '#4a5568',
              lineHeight: '1.8'
            }}>
                             注册智能体育题库平台<br/>
               与千万学子一起探索体育知识的奥秘
            </Text>

            {/* 特性展示 */}
            <div style={{ marginTop: '48px' }}>
              <Space direction="vertical" size="large">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <RocketOutlined style={{ 
                    fontSize: '24px', 
                    color: primaryColor,
                    padding: '12px',
                    background: `${primaryColor}20`,
                    borderRadius: '50%'
                  }} />
                  <Text style={{ fontSize: '16px' }}>个性化学习路径，精准提升</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <ThunderboltOutlined style={{ 
                    fontSize: '24px', 
                    color: primaryColor,
                    padding: '12px',
                    background: `${primaryColor}20`,
                    borderRadius: '50%'
                  }} />
                  <Text style={{ fontSize: '16px' }}>AI智能题目推荐系统</Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <StarOutlined style={{ 
                    fontSize: '24px', 
                    color: primaryColor,
                    padding: '12px',
                    background: `${primaryColor}20`,
                    borderRadius: '50%'
                  }} />
                  <Text style={{ fontSize: '16px' }}>专业教师在线答疑指导</Text>
                </div>
              </Space>
            </div>
          </div>
        </Col>

        {/* 右侧注册表单区域 */}
        <Col xs={24} lg={12} style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px'
        }}>
          <div className="glass-panel animate-slideUp" style={{
            width: '100%',
            maxWidth: '500px',
            padding: '48px',
            background: isDark 
              ? 'rgba(26, 26, 26, 0.8)' 
              : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)'}`,
            boxShadow: isDark
              ? '0 32px 64px rgba(0, 0, 0, 0.5)'
              : '0 32px 64px rgba(0, 0, 0, 0.1)'
          }}>
            {/* 注册标题 */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{
                fontSize: '32px',
                color: primaryColor,
                marginBottom: '16px'
              }}>
                <TeamOutlined />
              </div>
              <Title level={2} style={{ 
                marginBottom: '8px',
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                立即注册
              </Title>
              <Text style={{ 
                fontSize: '16px',
                color: isDark ? '#a1a1aa' : '#4a5568'
              }}>
                填写信息，开启学习之旅
              </Text>
            </div>
        
        <Form
          name="register"
          onFinish={onFinish}
          layout="vertical"
          requiredMark={false}
          size="large"
        >
          <Form.Item
            name="institution"
            label="学校"
            rules={[{ required: true, message: '请选择您的学校' }]}
          >
            <Select
              showSearch
              placeholder={institutions.length > 0 ? "请搜索并选择您的学校" : "正在加载学校列表..."}
              onSearch={(value) => {
                console.log('搜索学校:', value);
                fetchInstitutions(value);
              }}
              loading={searchLoading}
              filterOption={false}
              suffixIcon={<BankOutlined />}
              optionLabelProp="label"
              notFoundContent={searchLoading ? "搜索中..." : institutions.length === 0 ? "暂无学校数据，请联系管理员" : "未找到相关学校"}
              dropdownRender={(menu) => (
                <div>
                  {menu}
                  {institutions.length === 0 && !searchLoading && (
                    <div style={{ padding: '8px', textAlign: 'center', color: '#999' }}>
                      <div>如果找不到您的学校，请联系管理员添加</div>
                      <div style={{ fontSize: '12px', marginTop: '4px' }}>
                        或者尝试搜索关键词如"大学"、"中学"、"小学"
                      </div>
                    </div>
                  )}
                </div>
              )}
            >
              {institutions.map(inst => (
                <Option 
                  key={inst._id} 
                  value={inst._id} 
                  label={inst.name}
                  title={inst.name}
                >
                  <div>
                    <div style={{ fontWeight: 500 }}>{inst.name}</div>
                    {(inst as any).description && (
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                        {(inst as any).description}
                      </div>
                    )}
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 4, message: '用户名至少4位' }
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="请输入邮箱" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="手机号"
            rules={[{ pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="请输入手机号（选填）" />
          </Form.Item>

          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择您的角色' }]}
          >
            <Select placeholder="请选择您的角色">
              <Option value="student">学生</Option>
              <Option value="teacher">教师</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6位' }
            ]}
            hasFeedback
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
          </Form.Item>

          <Form.Item
            name="confirm"
            label="确认密码"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: '请确认您的密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请再次输入密码" />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              style={{ width: '100%' }}
            >
              注册
            </Button>
          </Form.Item>
          
          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              已有账号？ 
              <Link href="/login">直接登录</Link>
            </Text>
          </div>
        </Form>
        </div>
        </Col>
      </Row>
    </div>
  );
};

export default Register; 