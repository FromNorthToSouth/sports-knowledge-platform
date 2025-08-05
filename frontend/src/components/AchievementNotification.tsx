import React, { useState, useEffect } from 'react';
import { notification, Modal, Typography, Tag, Card, Space, Button } from 'antd';
import { TrophyOutlined, StarOutlined, FireOutlined, CrownOutlined } from '@ant-design/icons';
import { Achievement } from '../types';
import { useTheme } from '../hooks/useTheme';

const { Title, Text } = Typography;

interface AchievementNotificationProps {
  achievements: Achievement[];
  onClose: () => void;
  visible: boolean;
}

// 成就获得通知组件
export const AchievementNotification: React.FC<AchievementNotificationProps> = ({
  achievements,
  onClose,
  visible
}) => {
  const { isDark } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);

  // 获取稀有度颜色
  const getRarityColor = (rarity: string) => {
    const colors = {
      common: '#52c41a',
      rare: '#1890ff', 
      epic: '#722ed1',
      legendary: '#faad14'
    };
    return colors[rarity as keyof typeof colors] || '#52c41a';
  };

  // 获取稀有度标签
  const getRarityLabel = (rarity: string) => {
    const labels = {
      common: '普通',
      rare: '稀有',
      epic: '史诗',
      legendary: '传奇'
    };
    return labels[rarity as keyof typeof labels] || '普通';
  };

  // 下一个成就
  const nextAchievement = () => {
    if (currentIndex < achievements.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  // 跳过所有
  const skipAll = () => {
    onClose();
  };

  // 重置索引
  useEffect(() => {
    if (visible) {
      setCurrentIndex(0);
    }
  }, [visible]);

  if (!achievements.length || !visible) return null;

  const currentAchievement = achievements[currentIndex];

  return (
    <Modal
      title={
        <div style={{ textAlign: 'center' }}>
          <TrophyOutlined style={{ color: '#faad14', fontSize: '24px', marginRight: '8px' }} />
          <span style={{ fontSize: '20px', fontWeight: 'bold' }}>恭喜获得成就！</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={
        <div style={{ textAlign: 'center' }}>
          <Space>
            {achievements.length > 1 && (
              <Button onClick={skipAll}>
                跳过全部 ({achievements.length})
              </Button>
            )}
            <Button type="primary" onClick={nextAchievement}>
              {currentIndex < achievements.length - 1 ? '下一个' : '完成'}
            </Button>
          </Space>
        </div>
      }
      width={500}
      centered
      maskClosable={false}
      className="achievement-modal"
    >
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        {/* 成就图标和动画 */}
        <div 
          style={{
            fontSize: '80px',
            marginBottom: '20px',
            animation: 'achievementBounce 0.6s ease-out',
            filter: `drop-shadow(0 0 10px ${getRarityColor(currentAchievement.rarity)})`
          }}
        >
          {currentAchievement.icon}
        </div>

        {/* 成就信息 */}
        <Title level={2} style={{ marginBottom: '8px', color: getRarityColor(currentAchievement.rarity) }}>
          {currentAchievement.title}
        </Title>

        <Tag 
          color={getRarityColor(currentAchievement.rarity)}
          style={{ 
            marginBottom: '16px',
            fontSize: '14px',
            padding: '4px 12px',
            borderRadius: '16px'
          }}
        >
          {getRarityLabel(currentAchievement.rarity)}
        </Tag>

        <Text 
          style={{ 
            display: 'block', 
            fontSize: '16px', 
            marginBottom: '20px',
            color: isDark ? '#d9d9d9' : '#666'
          }}
        >
          {currentAchievement.description}
        </Text>

        {/* 积分奖励 */}
        <Card 
          size="small"
          style={{
            background: `linear-gradient(135deg, ${getRarityColor(currentAchievement.rarity)}20, ${getRarityColor(currentAchievement.rarity)}10)`,
            border: `1px solid ${getRarityColor(currentAchievement.rarity)}50`,
            borderRadius: '12px',
            marginBottom: '16px'
          }}
        >
          <Space>
            <StarOutlined style={{ color: getRarityColor(currentAchievement.rarity) }} />
            <Text strong>奖励积分: +{currentAchievement.points}</Text>
          </Space>
        </Card>

        {/* 进度指示器 */}
        {achievements.length > 1 && (
          <div style={{ marginTop: '16px' }}>
            <Text type="secondary">
              {currentIndex + 1} / {achievements.length}
            </Text>
            <div style={{ 
              width: '100%', 
              height: '4px', 
              backgroundColor: '#f0f0f0', 
              borderRadius: '2px',
              marginTop: '8px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${((currentIndex + 1) / achievements.length) * 100}%`,
                height: '100%',
                backgroundColor: getRarityColor(currentAchievement.rarity),
                borderRadius: '2px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes achievementBounce {
          0% {
            transform: scale(0.3) rotate(-10deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.1) rotate(5deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        .achievement-modal .ant-modal-content {
          border-radius: 16px;
          overflow: hidden;
        }

        .achievement-modal .ant-modal-header {
          background: linear-gradient(135deg, #faad14, #ff7875);
          border-bottom: none;
          padding: 16px 24px;
        }

        .achievement-modal .ant-modal-title {
          color: white !important;
        }

        .achievement-modal .ant-modal-close {
          color: white;
        }
      `}</style>
    </Modal>
  );
};

// 简单的toast通知
export const showAchievementToast = (achievement: Achievement) => {
  const getRarityColor = (rarity: string) => {
    const colors = {
      common: '#52c41a',
      rare: '#1890ff',
      epic: '#722ed1', 
      legendary: '#faad14'
    };
    return colors[rarity as keyof typeof colors] || '#52c41a';
  };

  notification.success({
    message: (
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <TrophyOutlined style={{ color: '#faad14', fontSize: '18px', marginRight: '8px' }} />
        <span>获得新成就！</span>
      </div>
    ),
    description: (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ fontSize: '20px', marginRight: '8px' }}>{achievement.icon}</span>
          <strong style={{ color: getRarityColor(achievement.rarity) }}>
            {achievement.title}
          </strong>
        </div>
        <div style={{ marginBottom: '4px' }}>{achievement.description}</div>
        <Tag color={getRarityColor(achievement.rarity)}>
          +{achievement.points} 积分
        </Tag>
      </div>
    ),
    duration: 4,
    placement: 'topRight',
    style: {
      border: `1px solid ${getRarityColor(achievement.rarity)}`,
      borderRadius: '8px'
    }
  });
};

export default AchievementNotification; 