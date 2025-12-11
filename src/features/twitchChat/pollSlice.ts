import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../app/store';

type Vote = 'yea' | 'nay';

interface PollState {
  active: boolean;
  yea: number;
  nay: number;
  voters: Record<string, Vote>;
}

const initialState: PollState = {
  active: false,
  yea: 0,
  nay: 0,
  voters: {},
};

const pollSlice = createSlice({
  name: 'poll',
  initialState,
  reducers: {
    pollToggled(state) {
      state.active = !state.active;
      if (state.active) {
        state.yea = 0;
        state.nay = 0;
        state.voters = {};
      }
    },
    pollVoteRecorded(state, action: PayloadAction<{ username: string; vote: Vote }>) {
      if (!state.active) return;
      const { username, vote } = action.payload;
      const lower = username.toLowerCase();
      const previous = state.voters[lower];

      // currently allows changing your vote. Might change that in the future
      if (previous === vote) return;
      if (previous === 'yea') state.yea -= 1;
      if (previous === 'nay') state.nay -= 1;
      if (vote === 'yea') state.yea += 1;
      if (vote === 'nay') state.nay += 1;

      state.voters[lower] = vote;
    },
    pollReset(state) {
      state.active = false;
      state.yea = 0;
      state.nay = 0;
      state.voters = {};
    },
  },
});

export const { pollToggled, pollVoteRecorded, pollReset } = pollSlice.actions;

export const selectPollActive = (state: RootState) => state.poll.active;
export const selectPollCounts = (state: RootState) => ({ yea: state.poll.yea, nay: state.poll.nay });

export default pollSlice.reducer;
