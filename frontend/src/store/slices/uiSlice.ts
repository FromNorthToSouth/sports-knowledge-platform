import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UIState } from '../../types';

const initialState: UIState = {
  sidebarCollapsed: false,
  theme: 'light',
  language: 'zh',
  primaryColor: '#667eea',
  animationsEnabled: true,
  compactMode: false
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    setLanguage: (state, action: PayloadAction<'zh' | 'en'>) => {
      state.language = action.payload;
    },
    setPrimaryColor: (state, action: PayloadAction<string>) => {
      state.primaryColor = action.payload;
    },
    setAnimationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.animationsEnabled = action.payload;
    },
    setCompactMode: (state, action: PayloadAction<boolean>) => {
      state.compactMode = action.payload;
    }
  }
});

export const { 
  toggleSidebar, 
  setSidebarCollapsed, 
  setTheme,
  toggleTheme,
  setLanguage,
  setPrimaryColor,
  setAnimationsEnabled,
  setCompactMode
} = uiSlice.actions;

export default uiSlice.reducer; 