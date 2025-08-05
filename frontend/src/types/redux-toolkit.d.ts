declare module '@reduxjs/toolkit' {
  export * from '@reduxjs/toolkit/dist/index';
}

declare module 'redux-persist' {
  export * from 'redux-persist/lib/index';
}

declare module 'redux-persist/lib/storage' {
  const storage: any;
  export default storage;
}

declare module 'classnames' {
  type ClassValue = string | number | ClassDictionary | ClassArray | undefined | null | boolean;
  
  interface ClassDictionary {
    [id: string]: any;
  }
  
  interface ClassArray extends Array<ClassValue> { }
  
  interface ClassNamesFn {
    (...classes: ClassValue[]): string;
  }
  
  const classNames: ClassNamesFn;
  export = classNames;
}

declare module 'echarts-for-react' {
  import { ECharts } from 'echarts';
  import { Component } from 'react';
  
  interface ReactEchartsProps {
    option: any;
    notMerge?: boolean;
    lazyUpdate?: boolean;
    style?: React.CSSProperties;
    className?: string;
    theme?: string;
    onChartReady?: (chartInstance: ECharts) => void;
    showLoading?: boolean;
    loadingOption?: any;
    onEvents?: any;
    opts?: any;
  }
  
  export default class ReactEcharts extends Component<ReactEchartsProps> {}
} 