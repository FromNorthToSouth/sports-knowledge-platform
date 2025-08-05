import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User, LoginForm, RegisterForm } from '../../types';
import * as authAPI from '../../services/authAPI';

// 初始状态
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// 异步thunk actions
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginForm, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '登录失败');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterForm, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '注册失败');
    }
  }
);

export const getUserProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.getProfile();
      return response.data?.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取用户信息失败');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData: Partial<User>, { rejectWithValue }) => {
    try {
      const response = await authAPI.updateProfile(userData);
      return response.data?.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '更新用户信息失败');
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData: { currentPassword: string; newPassword: string }, { rejectWithValue }) => {
    try {
      await authAPI.changePassword(passwordData);
      return '密码修改成功';
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '修改密码失败');
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    },
    clearError: (state) => {
      state.error = null;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      localStorage.setItem('token', action.payload);
    },
    updateUserStats: (state, action: PayloadAction<Partial<User['learningStats']>>) => {
      if (state.user) {
        state.user.learningStats = { ...state.user.learningStats, ...action.payload };
      }
    },
    updateAbilityProfile: (state, action: PayloadAction<Partial<User['abilityProfile']>>) => {
      if (state.user) {
        state.user.abilityProfile = { ...state.user.abilityProfile, ...action.payload };
      }
    },
    addAchievement: (state, action: PayloadAction<string>) => {
      if (state.user && !state.user.achievements.includes(action.payload)) {
        state.user.achievements.push(action.payload);
      }
    },
    updatePoints: (state, action: PayloadAction<number>) => {
      if (state.user) {
        state.user.points += action.payload;
      }
    }
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.user) {
          state.user = action.payload.user;
        }
        if (action.payload?.token) {
          state.token = action.payload.token;
          localStorage.setItem('token', action.payload.token);
        }
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload?.user) {
          state.user = action.payload.user;
        }
        if (action.payload?.token) {
          state.token = action.payload.token;
          localStorage.setItem('token', action.payload.token);
        }
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Get Profile
    builder
      .addCase(getUserProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.user = action.payload;
        }
        state.isAuthenticated = true;
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.token = null;
        localStorage.removeItem('token');
      });

    // Update Profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.user = action.payload;
        }
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Change Password
    builder
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  logout,
  clearError,
  setToken,
  updateUserStats,
  updateAbilityProfile,
  addAchievement,
  updatePoints
} = authSlice.actions;

export default authSlice.reducer; 