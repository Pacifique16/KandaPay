import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Transaction {
  id: string;
  type: string;
  amount?: string;
  phone?: string;
  operator: string;
  response: string;
  timestamp: number;
  success: boolean;
}

interface TransactionState {
  history: Transaction[];
  loading: boolean;
}

const initialState: TransactionState = { history: [], loading: false };

const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.history.unshift(action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { addTransaction, setLoading } = transactionSlice.actions;
export default transactionSlice.reducer;
