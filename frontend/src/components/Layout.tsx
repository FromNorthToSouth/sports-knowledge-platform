import React, { useState, useEffect } from 'react';
import { Layout as AntLayout, Menu, Dropdown, Badge, Avatar, Typography, Button, Switch, Space, Divider, Tooltip } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  DashboardOutlined,
  BookOutlined,
  EditOutlined,
  FileTextOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  StarOutlined,
  TrophyOutlined,
  TeamOutlined,
  LineChartOutlined,
  MessageOutlined,
  SunOutlined,
  MoonOutlined,
  ThunderboltOutlined,
  FireOutlined,
  CrownOutlined,
  VideoCameraOutlined,
  GiftOutlined,
  HomeOutlined,
  SecurityScanOutlined,
  BankOutlined,
  AuditOutlined,
  QuestionCircleOutlined,
  RocketOutlined
} from '@ant-design/icons';
import { logout } from '../store/slices/authSlice';
import { setSidebarCollapsed } from '../store/slices/uiSlice';
import { RootState } from '../types';
import { useTheme } from '../hooks/useTheme';
import '../styles/modern-theme.css';

const { Header, Sider, Content } = AntLayout;
const { Title, Text } = Typography;

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { sidebarCollapsed } = useSelector((state: RootState) => state.ui);
  const [collapsed, setCollapsed] = useState(sidebarCollapsed);
  const { isDark, toggleDarkMode, primaryColor } = useTheme();

  // 同步折叠状态
  useEffect(() => {
    setCollapsed(sidebarCollapsed);
  }, [sidebarCollapsed]);

  const handleToggleCollapse = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    dispatch(setSidebarCollapsed(newCollapsed));
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // 获取角色显示名称
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'student': return '学生';
      case 'teacher': return '教师';
      case 'admin': return '管理员';
      case 'super_admin': return '超级管理员';
      default: return '用户';
    }
  };

  // 用户菜单项
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => navigate('/profile')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '个人设置',
      onClick: () => navigate('/settings')
    },
    { type: 'divider' as const },
    {
      key: 'theme-toggle',
      icon: isDark ? <SunOutlined /> : <MoonOutlined />,
      label: isDark ? '切换到亮色主题' : '切换到暗色主题',
      onClick: toggleDarkMode
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout
    }
  ];

  // 生成菜单项
  const getMenuItems = () => {
    const baseItems = [
      {
        key: '/dashboard',
        icon: <HomeOutlined />,
        label: '首页',
        onClick: () => navigate('/dashboard'),
        'data-menu-id': 'home'
      }
    ];

    if (user?.role === 'student') {
      return [
        ...baseItems,
        {
          key: 'learning-group',
          type: 'group' as const,
          label: '学习中心',
          children: [
            {
              key: '/student-knowledge-base',
              icon: <BookOutlined />,
              label: '知识学习',
              onClick: () => navigate('/student-knowledge-base')
            },
            {
              key: '/practice',
              icon: <ThunderboltOutlined />,
              label: '智能练习',
              onClick: () => navigate('/practice')
            },
            {
              key: '/exam',
              icon: <FileTextOutlined />,
              label: '综合考试',
              onClick: () => navigate('/exam')
            }
          ]
        },
        {
          key: 'personal-group',
          type: 'group' as const,
          label: '个人中心',
          children: [
            {
              key: '/my-progress',
              icon: <LineChartOutlined />,
              label: '学习分析',
              onClick: () => navigate('/my-progress')
            },
            {
              key: '/favorites',
              icon: <StarOutlined />,
              label: '我的收藏',
              onClick: () => navigate('/favorites')
            },
            {
              key: '/achievements',
              icon: <TrophyOutlined />,
              label: '个人成就',
              onClick: () => navigate('/achievements')
            }
          ]
        },
        {
          key: 'community-group',
          type: 'group' as const,
          label: '互动社区',
          children: [
            {
              key: '/community',
              icon: <MessageOutlined />,
              label: '讨论社区',
              onClick: () => navigate('/community')
            }
          ]
        }
      ];
    }

    if (user?.role === 'teacher') {
      return [
        ...baseItems,
        {
          key: 'teaching-group',
          type: 'group' as const,
          label: '教学管理',
          children: [
            {
              key: '/knowledge-base',
              icon: <BookOutlined />,
              label: '知识库管理',
              onClick: () => navigate('/knowledge-base')
            },
            {
              key: '/question-bank',
              icon: <BankOutlined />,
              label: '题库管理',
              onClick: () => navigate('/question-bank')
            },
            {
              key: '/class-management',
              icon: <TeamOutlined />,
              label: '班级管理',
              onClick: () => navigate('/class-management')
            }
          ]
        },
        {
          key: 'exam-group',
          type: 'group' as const,
          label: '考试管理',
          children: [
            {
              key: '/teacher-exam-publish',
              icon: <RocketOutlined />,
              label: '考试组卷',
              onClick: () => navigate('/teacher-exam-publish')
            },
            {
              key: '/exam-monitor',
              icon: <FileTextOutlined />,
              label: '考试监控',
              onClick: () => navigate('/exam-monitor')
            }
          ]
        },
        {
          key: 'analytics-group',
          type: 'group' as const,
          label: '数据分析',
          children: [
            {
              key: '/student-progress',
              icon: <LineChartOutlined />,
              label: '学生分析',
              onClick: () => navigate('/student-progress')
            }
          ]
        }
      ];
    }

    // 机构管理员菜单
    if (user?.role === 'institution_admin') {
      return [
        ...baseItems,
        {
          key: '/question-bank',
          icon: <BookOutlined />,
          label: '题库管理',
          onClick: () => navigate('/question-bank')
        },
        {
          key: '/knowledge-base',
          icon: <BookOutlined />,
          label: '知识库管理',
          onClick: () => navigate('/knowledge-base')
        },
        {
          key: 'management-group',
          type: 'group' as const,
          label: '机构管理',
          children: [
            {
              key: '/institution-management',
              icon: <BankOutlined />,
              label: '机构管理',
              onClick: () => navigate('/institution-management')
            },
            {
              key: '/operation-logs',
              icon: <AuditOutlined />,
              label: '操作日志',
              onClick: () => navigate('/operation-logs')
            },
            {
              key: '/feedback-management',
              icon: <MessageOutlined />,
              label: '反馈管理',
              onClick: () => navigate('/feedback-management')
            }
          ]
        }
      ];
    }

    // 内容管理员菜单
    if (user?.role === 'content_manager') {
      return [
        ...baseItems,
        {
          key: '/question-bank',
          icon: <BookOutlined />,
          label: '题库管理',
          onClick: () => navigate('/question-bank')
        },
        {
          key: 'content-group',
          type: 'group' as const,
          label: '内容管理',
          children: [
            {
              key: '/feedback-management',
              icon: <MessageOutlined />,
              label: '反馈管理',
              onClick: () => navigate('/feedback-management')
            }
          ]
        }
      ];
    }

    // 超级管理员和普通管理员菜单
    if (user?.role === 'admin' || user?.role === 'super_admin') {
      const adminMenuItems = [
        ...baseItems,
        {
          key: '/question-bank',
          icon: <BookOutlined />,
          label: '题库管理',
          onClick: () => navigate('/question-bank')
        },
        {
          key: '/learning-resources',
          icon: <BookOutlined />,
          label: '资源管理',
          onClick: () => navigate('/learning-resources')
        },
        {
          key: 'admin-group',
          type: 'group' as const,
          label: '系统管理',
          children: [
            {
              key: '/admin',
              icon: <CrownOutlined />,
              label: '管理后台',
              onClick: () => navigate('/admin')
            },
            {
              key: '/operation-logs',
              icon: <AuditOutlined />,
              label: '操作日志',
              onClick: () => navigate('/operation-logs')
            },
            {
              key: '/feedback-management',
              icon: <MessageOutlined />,
              label: '反馈管理',
              onClick: () => navigate('/feedback-management')
            }
          ]
        }
      ];

      // 仅超级管理员可访问的功能
      if (user?.role === 'super_admin') {
        adminMenuItems.push({
          key: 'security-group',
          type: 'group' as const,
          label: '安全管理',
          children: [
            {
              key: '/permission-management',
              icon: <SecurityScanOutlined />,
              label: '权限管理',
              onClick: () => navigate('/permission-management')
            },
            {
              key: '/institution-management',
              icon: <BankOutlined />,
              label: '机构管理',
              onClick: () => navigate('/institution-management')
            }
          ]
        });
      }

      return adminMenuItems;
    }

    return baseItems;
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        theme="light"
        width={240}
        collapsedWidth={64}
        style={{
          overflow: 'hidden',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          background: isDark 
            ? 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)'
            : 'linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)',
          borderRight: isDark
            ? '1px solid rgba(255, 255, 255, 0.08)'
            : '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: isDark
            ? '4px 0 24px rgba(0, 0, 0, 0.4)'
            : '4px 0 24px rgba(0, 0, 0, 0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 1000
        }}
      >
        {/* Logo区域 */}
        <div style={{ 
          height: 80, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: isDark
            ? '1px solid rgba(255, 255, 255, 0.08)'
            : '1px solid rgba(0, 0, 0, 0.06)',
          flexDirection: 'column',
          padding: '16px',
          background: isDark
            ? 'rgba(255, 255, 255, 0.02)'
            : 'rgba(0, 0, 0, 0.01)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* 装饰性背景 */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}05 100%)`,
            opacity: collapsed ? 0 : 1,
            transition: 'opacity 0.3s ease'
          }} />
          
          {/* Logo图标 */}
          <div style={{
            width: collapsed ? 32 : 40,
            height: collapsed ? 32 : 40,
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}cc 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: collapsed ? '16px' : '20px',
            fontWeight: 'bold',
            marginBottom: collapsed ? 0 : '8px',
            boxShadow: `0 4px 12px ${primaryColor}40`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 1
          }}>
            🏆
          </div>
          
          {!collapsed && (
            <>
              <Title level={4} style={{ 
                margin: 0, 
                color: isDark ? '#ffffff' : '#1a202c',
                fontSize: '16px',
                fontWeight: '600',
                zIndex: 1,
                textAlign: 'center'
              }}>
                体育智能题库
              </Title>
              <span style={{ 
                fontSize: '11px', 
                color: isDark ? '#a1a1aa' : '#64748b',
                marginTop: '2px',
                fontWeight: '500',
                zIndex: 1,
                opacity: 0.8
              }}>
                {user?.role === 'teacher' ? '🎓 教师工作台' : 
                 user?.role === 'student' ? '📚 学生学习平台' : 
                 '⚙️ 管理系统'}
              </span>
            </>
          )}
        </div>
        
        {/* 菜单区域 */}
        <div style={{
          flex: 1,
          padding: '12px 8px',
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'thin'
        }}>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={getMenuItems()}
            style={{ 
              borderRight: 0,
              background: 'transparent',
              fontSize: '13px'
            }}
            className="modern-sidebar-menu"
          />
        </div>

        {/* 底部用户快捷操作 */}
        {!collapsed && (
          <div style={{
            padding: '16px',
            borderTop: isDark
              ? '1px solid rgba(255, 255, 255, 0.08)'
              : '1px solid rgba(0, 0, 0, 0.06)',
            background: isDark
              ? 'rgba(255, 255, 255, 0.02)'
              : 'rgba(0, 0, 0, 0.01)'
          }}>
            <div style={{
              padding: '8px 12px',
              borderRadius: '8px',
              background: isDark
                ? 'rgba(255, 255, 255, 0.04)'
                : 'rgba(0, 0, 0, 0.02)',
              border: isDark
                ? '1px solid rgba(255, 255, 255, 0.06)'
                : '1px solid rgba(0, 0, 0, 0.04)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '12px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = isDark
                ? 'rgba(255, 255, 255, 0.04)'
                : 'rgba(0, 0, 0, 0.02)';
            }}
            onClick={() => navigate('/profile')}
            >
              <Avatar 
                src={user?.avatar} 
                icon={<UserOutlined />} 
                size={24}
                style={{ 
                  background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  color: isDark ? '#ffffff' : '#1a202c',
                  fontWeight: '500',
                  fontSize: '12px',
                  lineHeight: 1,
                  marginBottom: '2px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {user?.username || '用户'}
                </div>
                <div style={{
                  color: isDark ? '#a1a1aa' : '#64748b',
                  fontSize: '10px',
                  lineHeight: 1
                }}>
                  {getRoleDisplayName(user?.role || '')}
                </div>
              </div>
              <SettingOutlined style={{
                color: isDark ? '#a1a1aa' : '#64748b',
                fontSize: '12px'
              }} />
            </div>
          </div>
        )}
      </Sider>

      <AntLayout style={{ marginLeft: collapsed ? 64 : 240, transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
        <Header style={{ 
          padding: '0 24px', 
          background: isDark ? '#1a1a1a' : '#ffffff', 
          boxShadow: isDark 
            ? '0 1px 4px rgba(0,0,0,.3)' 
            : '0 1px 4px rgba(0,21,41,.08)',
          borderBottom: `1px solid ${isDark ? '#404040' : '#e2e8f0'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              className: 'trigger header-trigger',
              onClick: () => setCollapsed(!collapsed),
              style: { 
                fontSize: '18px', 
                cursor: 'pointer',
                color: isDark ? '#ffffff' : '#1a202c',
                padding: '8px',
                borderRadius: '6px',
                transition: 'all 0.3s ease'
              }
            })}
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '20px',
            height: '100%'
          }}>
            <Badge count={0} showZero={false}>
              <BellOutlined 
                className="notification-bell"
                style={{ 
                  fontSize: '18px', 
                  cursor: 'pointer',
                  color: isDark ? '#a1a1aa' : '#64748b',
                  transition: 'all 0.3s ease'
                }} 
              />
            </Badge>
            
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div 
                className="user-info-card"
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                  transition: 'all 0.3s ease',
                  minWidth: '160px'
                }}>
                <Avatar 
                  src={user?.avatar} 
                  icon={<UserOutlined />} 
                  size={32}
                  style={{ 
                    marginRight: 12,
                    border: `2px solid ${primaryColor}`,
                    background: user?.avatar ? 'transparent' : `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`
                  }}
                />
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  width: '100%'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'flex-start',
                    lineHeight: 1.2
                  }}>
                    <span style={{ 
                      fontSize: '14px',
                      fontWeight: '500',
                      color: isDark ? '#ffffff' : '#1a202c',
                      marginBottom: '2px'
                    }}>
                      {user?.username || '未知用户'}
                    </span>
                    <span style={{ 
                      fontSize: '12px', 
                      color: primaryColor,
                      fontWeight: '600',
                      background: `${primaryColor}15`,
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      {getRoleDisplayName(user?.role || '')}
                    </span>
                  </div>
                  <UserOutlined style={{ 
                    fontSize: '12px', 
                    color: isDark ? '#a1a1aa' : '#64748b',
                    marginLeft: '8px'
                  }} />
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content style={{ 
          margin: '24px 16px', 
          padding: 24, 
          background: isDark ? '#0f0f0f' : '#f5f5f5',
          borderRadius: '12px',
          minHeight: 'calc(100vh - 112px)',
          transition: 'all 0.3s ease'
        }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default AppLayout; 