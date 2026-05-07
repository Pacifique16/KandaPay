import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface RecentRecipient {
  id: string;
  name: string;
  phone: string;
  initials: string;
  color: string;
}

interface RecentsState {
  list: RecentRecipient[];
}

const initialState: RecentsState = { list: [] };

const recentsSlice = createSlice({
  name: 'recents',
  initialState,
  reducers: {
    addRecent: (state, action: PayloadAction<RecentRecipient>) => {
      // Remove duplicate if exists, then add to front, keep max 10
      state.list = [
        action.payload,
        ...state.list.filter((r) => r.phone !== action.payload.phone),
      ].slice(0, 5);
    },
  },
});

export const { addRecent } = recentsSlice.actions;
export default recentsSlice.reducer;
