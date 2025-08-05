import React from 'react';
import { Spin } from 'antd';

interface LoadingSpinnerProps {
  size?: 'small' | 'default' | 'large';
  tip?: string;
  spinning?: boolean;
  children?: React.ReactNode;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'default',
  tip = '加载中...',
  spinning = true,
  children
}) => {
  if (children) {
    return (
      <Spin size={size} tip={tip} spinning={spinning}>
        {children}
      </Spin>
    );
  }

  return (
    <div className="loading-spinner">
      <Spin size={size} tip={tip} />
    </div>
  );
};

export default LoadingSpinner; 