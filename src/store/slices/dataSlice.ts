import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NewsItem } from '@/types';

interface DataState {
  newsItems: NewsItem[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  categories: string[];
}

const initialState: DataState = {
  newsItems: [],
  totalCount: 0,
  loading: false,
  error: null,
  categories: [],
};

export const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    setNewsItems: (state, action: PayloadAction<{ items: NewsItem[], totalCount: number }>) => {
      state.newsItems = action.payload.items;
      state.totalCount = action.payload.totalCount;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setCategories: (state, action: PayloadAction<string[]>) => {
      state.categories = action.payload;
    },
  },
});

export const { setNewsItems, setLoading, setError, setCategories } = dataSlice.actions;

export default dataSlice.reducer;