import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type TapGoCard = {
  id: string;
  name: string;
  cardNumber: string;
  balance: number;
};

const initialState: TapGoCard[] = [
  { id: '1', name: 'Pacifique', cardNumber: 'C24D77B1', balance: 4851 },
  { id: '2', name: 'Teta', cardNumber: '621613B1', balance: 1200 },
];

const tapGoSlice = createSlice({
  name: 'tapGo',
  initialState,
  reducers: {
    addCard(state, action: PayloadAction<TapGoCard>) {
      state.push(action.payload);
    },
    updateBalance(state, action: PayloadAction<{ cardNumber: string; amount: number }>) {
      const card = state.find((c) => c.cardNumber === action.payload.cardNumber);
      if (card) card.balance += action.payload.amount;
    },
    editCard(state, action: PayloadAction<{ id: string; name: string }>) {
      const card = state.find((c) => c.id === action.payload.id);
      if (card) card.name = action.payload.name;
    },
    deleteCard(state, action: PayloadAction<string>) {
      return state.filter((c) => c.id !== action.payload);
    },
  },
});

export const { addCard, updateBalance, editCard, deleteCard } = tapGoSlice.actions;
export default tapGoSlice.reducer;
