import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ProfileState {
  name: string;
  phone: string;
}

const initialState: ProfileState = {
  name: '',
  phone: '',
};

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<{ name: string; phone: string }>) => {
      state.name = action.payload.name;
      state.phone = action.payload.phone;
    },
  },
});

export const { setProfile } = profileSlice.actions;
export default profileSlice.reducer;
