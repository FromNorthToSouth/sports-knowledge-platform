import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, message, Tabs, Space, Row, Col } from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  SafetyOutlined,
  CrownOutlined,
  TeamOutlined,
  BookOutlined,
  RocketOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginUser, logout } from '../store/slices/authSlice';
import { LoginForm, RootState } from '../types';
import { useTheme } from '../hooks/useTheme';

const { Title, Text, Link } = Typography;
const { TabPane } = Tabs;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [loginType, setLoginType] = useState('student');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, error } = useSelector((state: RootState) => state.auth);
  const { isDark, primaryColor } = useTheme();
  
  // 如果已经登录，直接跳转到仪表盘
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onFinish = async (values: LoginForm) => {
    setLoading(true);
    try {
      // 使用 unwrap() 方法来处理 rejected 的 thunk
      const result = await dispatch(loginUser(values) as any).unwrap();
      
      // 验证用户角色和选择的登录类型是否匹配
      const userRole = result.user?.role;
      
      if (loginType === 'student' && userRole !== 'student') {
        message.error('当前账号不是学生账号，请选择正确的登录类型');
        dispatch(logout()); // 登出用户
        return;
      }
      
      if (loginType === 'teacher' && !['teacher', 'institution_admin'].includes(userRole)) {
        message.error('当前账号不是教师账号，请选择正确的登录类型');
        dispatch(logout()); // 登出用户
        return;
      }
      
      if (loginType === 'admin' && !['admin', 'super_admin'].includes(userRole)) {
        message.error('当前账号不是管理员账号，请选择正确的登录类型');
        dispatch(logout()); // 登出用户
        return;
      }
      
      message.success('登录成功');
      // 登录成功后，isAuthenticated 会更新，useEffect 会处理跳转
    } catch (error: any) {
      console.error('Login error:', error);
      message.error(error || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };
  
  // 动态角色配置 - 使用useMemo确保正确更新
  const roleConfig = React.useMemo(() => ({
    student: {
      icon: <BookOutlined />,
      title: '学生登录',
      subtitle: '开启智能学习之旅',
      color: primaryColor,
      gradient: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`
    },
    teacher: {
      icon: <TeamOutlined />,
      title: '教师登录',
      subtitle: '智慧教学管理平台',
      color: '#52c41a',
      gradient: 'linear-gradient(135deg, #52c41a 0%, #52c41add 100%)'
    },
    admin: {
      icon: <CrownOutlined />,
      title: '管理员登录',
      subtitle: '系统管理控制中心',
      color: '#722ed1',
      gradient: 'linear-gradient(135deg, #722ed1 0%, #722ed1dd 100%)'
    }
  }), [primaryColor]);

  const currentRole = React.useMemo(() => 
    roleConfig[loginType as keyof typeof roleConfig], 
    [roleConfig, loginType]
  );

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
        right: '-20%',
        width: '800px',
        height: '800px',
        background: currentRole.gradient,
        borderRadius: '50%',
        opacity: 0.1,
        filter: 'blur(100px)'
      }} />
      
      <div style={{
        position: 'absolute',
        bottom: '-30%',
        left: '-10%',
        width: '600px',
        height: '600px',
        background: `radial-gradient(circle, ${currentRole.color}20 0%, transparent 70%)`,
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
          <div key={loginType} className="animate-fadeIn" style={{ textAlign: 'center', zIndex: 1 }}>
            <div style={{
              width: '120px',
              height: '120px',
              background: currentRole.gradient,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px',
              color: 'white',
              margin: '0 auto 32px',
              boxShadow: `0 20px 40px ${currentRole.color}40`,
              animation: 'bounce 2s infinite',
              transition: 'all 0.3s ease'
            }}>
              {currentRole.icon}
            </div>
            
            <Title level={1} className="gradient-text" style={{ 
              fontSize: '3rem', 
              marginBottom: '16px',
              background: currentRole.gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              transition: 'all 0.3s ease'
            }}>
              智能体育题库
            </Title>
            
            <Title level={2} style={{ 
              color: isDark ? '#ffffff' : '#1a202c',
              marginBottom: '24px',
              fontWeight: 'normal'
            }}>
              智能化题库平台
            </Title>
            
            <Text style={{ 
              fontSize: '18px',
              color: isDark ? '#a1a1aa' : '#4a5568',
              lineHeight: '1.8'
            }}>
              集成AI技术的个性化学习系统<br/>
              为中小学生提供智能化体育知识学习体验
            </Text>

            {/* 特性展示 */}
            <div style={{ marginTop: '48px' }}>
              <Space direction="vertical" size="large">
                {loginType === 'admin' ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <CrownOutlined style={{ 
                        fontSize: '24px', 
                        color: currentRole.color,
                        padding: '12px',
                        background: `${currentRole.color}20`,
                        borderRadius: '50%'
                      }} />
                      <Text style={{ fontSize: '16px' }}>系统权限管理，用户角色分配</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <SafetyOutlined style={{ 
                        fontSize: '24px', 
                        color: currentRole.color,
                        padding: '12px',
                        background: `${currentRole.color}20`,
                        borderRadius: '50%'
                      }} />
                      <Text style={{ fontSize: '16px' }}>数据统计分析，运营监控</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <ThunderboltOutlined style={{ 
                        fontSize: '24px', 
                        color: currentRole.color,
                        padding: '12px',
                        background: `${currentRole.color}20`,
                        borderRadius: '50%'
                      }} />
                      <Text style={{ fontSize: '16px' }}>题库内容审核，质量管控</Text>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <RocketOutlined style={{ 
                        fontSize: '24px', 
                        color: currentRole.color,
                        padding: '12px',
                        background: `${currentRole.color}20`,
                        borderRadius: '50%'
                      }} />
                      <Text style={{ fontSize: '16px' }}>AI智能出题，个性化推荐</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <ThunderboltOutlined style={{ 
                        fontSize: '24px', 
                        color: currentRole.color,
                        padding: '12px',
                        background: `${currentRole.color}20`,
                        borderRadius: '50%'
                      }} />
                      <Text style={{ fontSize: '16px' }}>多维度能力分析，精准提升</Text>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <SafetyOutlined style={{ 
                        fontSize: '24px', 
                        color: currentRole.color,
                        padding: '12px',
                        background: `${currentRole.color}20`,
                        borderRadius: '50%'
                      }} />
                      <Text style={{ fontSize: '16px' }}>互动社区，共同进步</Text>
                    </div>
                  </>
                )}
              </Space>
            </div>
          </div>
        </Col>

        {/* 右侧登录表单区域 */}
        <Col xs={24} lg={12} style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px'
        }}>
          <div className="glass-panel animate-slideUp" style={{
            width: '100%',
            maxWidth: '440px',
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
            {/* 登录标题 */}
            <div key={loginType} style={{ textAlign: 'center', marginBottom: '40px' }}>
              <div style={{
                fontSize: '32px',
                color: currentRole.color,
                marginBottom: '16px',
                transition: 'all 0.3s ease'
              }}>
                {currentRole.icon}
              </div>
              <Title level={2} style={{ 
                marginBottom: '8px',
                background: currentRole.gradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                transition: 'all 0.3s ease'
              }}>
                {currentRole.title}
              </Title>
              <Text style={{ 
                fontSize: '16px',
                color: isDark ? '#a1a1aa' : '#4a5568',
                transition: 'all 0.3s ease'
              }}>
                {currentRole.subtitle}
              </Text>
            </div>

            {/* 现代化标签切换 */}
            <div style={{ marginBottom: '32px' }}>
              <Tabs 
                activeKey={loginType} 
                onChange={setLoginType} 
                centered
                size="large"
              >
                <TabPane 
                  tab={
                    <Space>
                      <BookOutlined />
                      学生登录
                    </Space>
                  } 
                  key="student" 
                />
                <TabPane 
                  tab={
                    <Space>
                      <TeamOutlined />
                      教师登录
                    </Space>
                  } 
                  key="teacher" 
                />
                <TabPane 
                  tab={
                    <Space>
                      <CrownOutlined />
                      管理员
                    </Space>
                  } 
                  key="admin" 
                />
              </Tabs>
            </div>

            {/* 现代化表单 */}
            <Form
              name="login"
              onFinish={onFinish}
              layout="vertical"
              requiredMark={false}
              size="large"
              initialValues={{
                role: loginType, // 确保提交时带有角色信息
              }}
            >


              <Form.Item
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
                style={{ marginBottom: '24px' }}
              >
                <Input 
                  className="modern-input"
                  prefix={<UserOutlined style={{ color: currentRole.color, transition: 'all 0.3s ease' }} />} 
                  placeholder={
                    loginType === 'student' ? '👤 学号 / 用户名' : 
                    loginType === 'teacher' ? '👨‍🏫 工号 / 用户名' :
                    '👑 管理员账号'
                  }
                  style={{
                    borderRadius: '12px',
                    border: `2px solid ${isDark ? '#404040' : '#e2e8f0'}`,
                    background: isDark ? '#1a1a1a' : '#ffffff',
                    fontSize: '16px',
                    padding: '12px 16px',
                    transition: 'all 0.3s ease'
                  }}
                />
              </Form.Item>

              <Form.Item
                name="password"
                rules={[{ required: true, message: '请输入密码' }]}
                style={{ marginBottom: '24px' }}
              >
                <Input.Password 
                  className="modern-input"
                  prefix={<LockOutlined style={{ color: currentRole.color, transition: 'all 0.3s ease' }} />} 
                  placeholder="🔒 登录密码" 
                  style={{
                    borderRadius: '12px',
                    border: `2px solid ${isDark ? '#404040' : '#e2e8f0'}`,
                    background: isDark ? '#1a1a1a' : '#ffffff',
                    fontSize: '16px',
                    padding: '12px 16px',
                    transition: 'all 0.3s ease'
                  }}
                />
              </Form.Item>
              
              <Form.Item name="role" hidden>
                <Input />
              </Form.Item>

              <Form.Item style={{ marginBottom: '24px' }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading} 
                  className="modern-button primary"
                  style={{
                    width: '100%',
                    height: '56px',
                    borderRadius: '16px',
                    fontSize: '18px',
                    fontWeight: '600',
                    border: 'none',
                    background: currentRole.gradient,
                    boxShadow: `0 8px 24px ${currentRole.color}40`,
                    transition: 'all 0.3s ease'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {currentRole.icon}
                    {loginType === 'student' ? '学生登录' : 
                     loginType === 'teacher' ? '教师登录' : 
                     '管理员登录'}
                  </span>
                </Button>
              </Form.Item>
              
              {/* 底部链接 */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginTop: '32px',
                paddingTop: '24px',
                borderTop: `1px solid ${isDark ? '#404040' : '#e2e8f0'}`
              }}>
                <Link 
                  href="/register"
                  style={{ 
                    color: currentRole.color,
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  📝 没有账号？立即注册
                </Link>
                <Link 
                  href="/forgot-password"
                  style={{ 
                    color: isDark ? '#a1a1aa' : '#4a5568',
                    textDecoration: 'none',
                    fontSize: '14px'
                  }}
                >
                  🔑 忘记密码？
                </Link>
              </div>
              
              {/* 管理员账户提示 */}
              {loginType === 'admin' && (
                <div style={{ 
                  marginTop: '20px',
                  padding: '16px',
                  background: isDark ? 'rgba(114, 46, 209, 0.1)' : 'rgba(114, 46, 209, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(114, 46, 209, 0.2)'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <Text style={{ 
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#722ed1'
                    }}>
                      <CrownOutlined /> 管理员登录
                    </Text>
                    <br />
                    <Text style={{ 
                      fontSize: '13px',
                      color: isDark ? '#a1a1aa' : '#6b7280',
                      marginTop: '8px',
                      display: 'block'
                    }}>
                      请使用管理员账户登录系统
                    </Text>
                  </div>
                </div>
              )}
            </Form>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Login; 