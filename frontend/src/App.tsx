import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';

// 导入页面组件
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import QuestionBank from './pages/QuestionBank';
import Practice from './pages/Practice';
import Exam from './pages/Exam';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import ClassManagement from './pages/ClassManagement';
import StudentProgress from './pages/StudentProgress';
import MyProgress from './pages/MyProgress';
import Favorites from './pages/Favorites';
import Community from './pages/Community';
import LearningResources from './pages/LearningResources';
import KnowledgeBase from './pages/KnowledgeBase';
import Achievements from './pages/Achievements';
import PermissionManagement from './pages/PermissionManagement';
import InstitutionManagement from './pages/InstitutionManagement';
import OperationLogs from './pages/OperationLogs';
import FeedbackManagement from './pages/FeedbackManagement';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';
import { useTheme } from './hooks/useTheme';
import StudentKnowledgeBase from './pages/StudentKnowledgeBase';
import TeacherExamPublish from './pages/TeacherExamPublish';
import ExamMonitor from './pages/ExamMonitor';

// 导入样式
import './App.css';
import './styles/modern-theme.css';

// 现代化主题配置
const getThemeConfig = (isDark: boolean, primaryColor: string) => ({
  algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
  token: {
    colorPrimary: primaryColor,
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',
    borderRadius: 12,
    borderRadiusLG: 16,
    borderRadiusSM: 8,
    fontFamily: '"Inter", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
    fontSize: 14,
    colorBgContainer: isDark ? '#1f1f1f' : '#ffffff',
    colorBgElevated: isDark ? '#262626' : '#ffffff',
    colorBgLayout: isDark ? '#141414' : '#f0f2f5',
    colorTextBase: isDark ? '#ffffff' : '#000000',
    colorBorder: isDark ? '#424242' : '#d9d9d9',
    boxShadow: isDark ? 
      '0 6px 16px 0 rgba(0, 0, 0, 0.12), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)' :
      '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
    boxShadowSecondary: isDark ?
      '0 2px 8px rgba(0, 0, 0, 0.15)' :
      '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  components: {
    Card: {
      boxShadowTertiary: isDark ?
        '0 2px 12px rgba(0, 0, 0, 0.2)' :
        '0 2px 12px rgba(0, 0, 0, 0.08)',
      headerBg: isDark ? '#262626' : '#fafafa',
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: isDark ? 'rgba(102, 126, 234, 0.15)' : 'rgba(102, 126, 234, 0.08)',
      itemHoverBg: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
      itemActiveBg: isDark ? 'rgba(102, 126, 234, 0.2)' : 'rgba(102, 126, 234, 0.12)',
    },
    Button: {
      borderRadius: 8,
      primaryShadow: `0 2px 8px rgba(102, 126, 234, 0.3)`,
    },
    Layout: {
      headerBg: isDark ? '#1f1f1f' : '#ffffff',
      siderBg: isDark ? '#1f1f1f' : '#ffffff',
      bodyBg: isDark ? '#141414' : '#f0f2f5',
    }
  }
});

// 主题包装组件
const ThemedApp: React.FC = () => {
  const { theme: currentTheme, primaryColor } = useTheme();
  const isDark = currentTheme === 'dark';
  
  return (
    <AntApp>
      <Router>
        <div className={`App ${isDark ? 'dark-theme' : 'light-theme'}`}>
          <Routes>
            {/* 公开路由 */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* 受保护的路由 */}
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="question-bank" element={<QuestionBank />} />
              <Route path="practice" element={<Practice />} />
              <Route path="exam" element={<Exam />} />
                                                      <Route path="learning-resources" element={<LearningResources />} />
                    <Route path="knowledge-base" element={<KnowledgeBase />} />
                <Route path="profile" element={<Profile />} />
              
              {/* 学生专用路由 */}
              <Route path="student-knowledge-base" element={<StudentKnowledgeBase />} />
              <Route path="my-progress" element={<MyProgress />} />
              <Route path="favorites" element={<Favorites />} />
              <Route path="achievements" element={<Achievements />} />
              <Route path="community" element={<Community />} />
              
              {/* 教师专用路由 */}
              <Route path="class-management" element={<ClassManagement />} />
              <Route path="student-progress" element={<StudentProgress />} />
              <Route path="teacher-exam-publish" element={<TeacherExamPublish />} />
              <Route path="exam-monitor" element={<ExamMonitor />} />
              <Route path="teaching-resources" element={<div>教学资源页面开发中...</div>} />
              
              {/* 管理员路由 */}
              <Route 
                path="admin/*" 
                element={
                  <ProtectedRoute roles={['admin', 'super_admin', 'content_manager']}>
                    <AdminPanel />
                  </ProtectedRoute>
                } 
              />
              
              {/* 权限管理路由 - 仅超级管理员 */}
              <Route 
                path="permission-management" 
                element={
                  <ProtectedRoute roles={['super_admin']}>
                    <PermissionManagement />
                  </ProtectedRoute>
                } 
              />
              
              {/* 机构管理路由 - 机构管理员和超级管理员 */}
              <Route 
                path="institution-management" 
                element={
                  <ProtectedRoute roles={['institution_admin', 'super_admin']}>
                    <InstitutionManagement />
                  </ProtectedRoute>
                } 
              />
              
              {/* 操作日志路由 - 管理员和超级管理员 */}
              <Route 
                path="operation-logs" 
                element={
                  <ProtectedRoute roles={['admin', 'super_admin', 'institution_admin']}>
                    <OperationLogs />
                  </ProtectedRoute>
                } 
              />
              
              {/* 反馈管理路由 - 内容管理员、管理员和超级管理员 */}
              <Route 
                path="feedback-management" 
                element={
                  <ProtectedRoute roles={['content_manager', 'admin', 'super_admin', 'institution_admin']}>
                    <FeedbackManagement />
                  </ProtectedRoute>
                } 
              />
            </Route>
            
            {/* 404页面 */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AntApp>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingSpinner />} persistor={persistor}>
        <ConfigProvider
          locale={zhCN}
          theme={getThemeConfig(false, '#667eea')}
        >
          <ThemedApp />
        </ConfigProvider>
      </PersistGate>
    </Provider>
  );
};

export default App; 