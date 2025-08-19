import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';

interface ChatUserFlags {
  mod?: boolean;
  vip?: boolean;
  broadcaster?: boolean;
}

type ChatUsersState = Record<string, ChatUserFlags>;

const initialState: ChatUsersState = {};

const chatUsersSlice = createSlice({
  name: 'chatUsers',
  initialState,
  reducers: {
    chatUserUpdated: (state, action: PayloadAction<{ username: string; flags: ChatUserFlags }>) => {
      const key = action.payload.username.toLowerCase();
      state[key] = { ...(state[key] || {}), ...action.payload.flags };
    },
    chatUserRemoved: (state, action: PayloadAction<string>) => {
      const key = action.payload.toLowerCase();
      delete state[key];
    },
  },
});

export const { chatUserUpdated, chatUserRemoved } = chatUsersSlice.actions;
export const selectChatUser = (username?: string) => (state: RootState) =>
  username ? state.chatUsers[username.toLowerCase()] : undefined;

export default chatUsersSlice.reducer;
