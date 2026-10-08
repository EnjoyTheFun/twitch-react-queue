import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';

export type ChatConnectionStatus = 'connected' | 'disconnected' | 'connecting';

const chatConnectionSlice = createSlice({
  name: 'chatConnection',
  initialState: 'disconnected' as ChatConnectionStatus,
  reducers: {
    chatConnectionStatusChanged: (_state, action: PayloadAction<ChatConnectionStatus>) => action.payload,
  },
});

export const { chatConnectionStatusChanged } = chatConnectionSlice.actions;
export const selectChatConnectionStatus = (state: RootState) => state.chatConnection;

export default chatConnectionSlice.reducer;
