import { configureStore } from '@reduxjs/toolkit';
import { setlistApi } from './setlistApi';
import { songApi } from './songApi';

export const store = configureStore({
  reducer: {
    [setlistApi.reducerPath]: setlistApi.reducer,
    [songApi.reducerPath]: songApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(setlistApi.middleware, songApi.middleware),
});
