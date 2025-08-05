import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

// Import reducers
import authReducer from './slices/authSlice';
import questionReducer from './slices/questionSlice';
import examReducer from './slices/examSlice';
import uiReducer from './slices/uiSlice';

// 持久化配置
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'ui'], // 只持久化auth和ui状态
};

// 合并reducers
const rootReducer = combineReducers({
  auth: authReducer,
  question: questionReducer,
  exam: examReducer,
  ui: uiReducer,
});

// 持久化reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// 配置store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 