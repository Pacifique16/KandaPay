import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SimCard } from '../../modules/ussd/UssdBridge';
import { Operator } from '../../constants/ussdCodes';

interface SimState {
  cards: SimCard[];
  selectedSlot: number;
  detectedOperator: Operator;
}

const initialState: SimState = {
  cards: [],
  selectedSlot: 0,
  detectedOperator: 'UNKNOWN',
};

const simSlice = createSlice({
  name: 'sim',
  initialState,
  reducers: {
    setSimCards: (state, action: PayloadAction<SimCard[]>) => { state.cards = action.payload; },
    setSelectedSlot: (state, action: PayloadAction<number>) => { state.selectedSlot = action.payload; },
    setDetectedOperator: (state, action: PayloadAction<Operator>) => { state.detectedOperator = action.payload; },
  },
});

export const { setSimCards, setSelectedSlot, setDetectedOperator } = simSlice.actions;
export default simSlice.reducer;
