import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../types';
import { 
  setTheme, 
  toggleTheme, 
  setPrimaryColor, 
  setAnimationsEnabled, 
  setCompactMode 
} from '../store/slices/uiSlice';

export const useTheme = () => {
  const dispatch = useDispatch();
  const {
    theme,
    primaryColor,
    animationsEnabled,
    compactMode
  } = useSelector((state: RootState) => state.ui);

  const isDark = theme === 'dark';

  const setDarkMode = (dark: boolean) => {
    dispatch(setTheme(dark ? 'dark' : 'light'));
  };

  const toggleDarkMode = () => {
    dispatch(toggleTheme());
  };

  const changePrimaryColor = (color: string) => {
    dispatch(setPrimaryColor(color));
  };

  const toggleAnimations = () => {
    dispatch(setAnimationsEnabled(!animationsEnabled));
  };

  const toggleCompactMode = () => {
    dispatch(setCompactMode(!compactMode));
  };

  return {
    isDark,
    theme,
    primaryColor,
    animationsEnabled,
    compactMode,
    setDarkMode,
    toggleDarkMode,
    changePrimaryColor,
    toggleAnimations,
    toggleCompactMode
  };
};
