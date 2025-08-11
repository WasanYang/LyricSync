import { configureStore } from '@reduxjs/toolkit';
import { setlistApi } from './setlistApi';

export const store = configureStore({
  reducer: {
    [setlistApi.reducerPath]: setlistApi.reducer,
    // ...reducers อื่นๆ
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(setlistApi.middleware),
});
