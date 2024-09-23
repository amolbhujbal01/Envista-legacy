import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface AuthState {
  accessToken: string | null;
  idToken: string | null;
  refreshToken: string | null;
  email: string | null;
  uid: string | null;
}

const initialState: AuthState = {
  accessToken: null,
  idToken: null,
  refreshToken: null,
  email: null,
  uid: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthToken(
      state,
      action: PayloadAction<{
        accessToken: string;
        idToken: string;
        refreshToken: string;
        email: string;
        uid: string;
      }>
    ) {
      const { accessToken, idToken, refreshToken, email, uid } = action.payload;
      state.accessToken = accessToken;
      state.idToken = idToken;
      state.refreshToken = refreshToken;
      state.email = email;
      state.uid = uid;
    },
    clearAuthToken(state) {
      state.accessToken = null;
      state.idToken = null;
      state.refreshToken = null;
      state.email = null;
      state.uid = null;
    },
  },
});

export const { setAuthToken, clearAuthToken } = authSlice.actions;
export default authSlice.reducer;
