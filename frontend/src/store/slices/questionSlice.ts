import { createSlice } from '@reduxjs/toolkit';
import { QuestionState } from '../../types';

const initialState: QuestionState = {
  questions: [],
  currentQuestion: null,
  loading: false,
  error: null,
  pagination: {
    current: 1,
    total: 0,
    pageSize: 20,
    totalCount: 0
  },
  filters: {}
};

const questionSlice = createSlice({
  name: 'question',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  }
});

export const { clearError } = questionSlice.actions;
export default questionSlice.reducer; 