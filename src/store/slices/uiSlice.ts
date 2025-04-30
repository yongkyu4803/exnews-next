import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  currentPage: number;
  selectedCategory: string;
  pageSize: number;
}

const initialState: UiState = {
  currentPage: 1,
  selectedCategory: 'all',
  pageSize: 20,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    setSelectedCategory: (state, action: PayloadAction<string>) => {
      state.selectedCategory = action.payload;
      state.currentPage = 1; // 카테고리 변경 시 첫 페이지로 이동
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
    },
  },
});

export const { setCurrentPage, setSelectedCategory, setPageSize } = uiSlice.actions;

export default uiSlice.reducer;