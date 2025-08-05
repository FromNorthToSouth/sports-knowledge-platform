import { createSlice } from '@reduxjs/toolkit';
import { ExamState } from '../../types';

const initialState: ExamState = {
  currentExam: null,
  exams: [],
  loading: false,
  error: null
};

const examSlice = createSlice({
  name: 'exam',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    }
  }
});

export const { clearError } = examSlice.actions;
export default examSlice.reducer; 