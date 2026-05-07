import { configureStore } from '@reduxjs/toolkit';
import simReducer from './slices/simSlice';
import transactionReducer from './slices/transactionSlice';
import recentsReducer from './slices/recentsSlice';

export const store = configureStore({
  reducer: {
    sim: simReducer,
    transactions: transactionReducer,
    recents: recentsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
