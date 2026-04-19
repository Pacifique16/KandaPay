import { configureStore } from '@reduxjs/toolkit';
import simReducer from './slices/simSlice';
import transactionReducer from './slices/transactionSlice';

export const store = configureStore({
  reducer: {
    sim: simReducer,
    transactions: transactionReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
