import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist-indexeddb-storage';
import type { RootState } from '../../app/store';
import { authenticateWithToken } from '../auth/authSlice';
import { legacyDataMigrated } from '../migration/legacyMigration';
import { AllSettings, ColorScheme } from './models';

interface SettingsState {
  colorScheme: ColorScheme | null;
  channel?: string;
  commandPrefix: string;
  volume: number;
  blacklist: string[];
  blurredProviders: string[];
  showTopSubmitters?: boolean;
}

const initialState: SettingsState = {
  colorScheme: null,
  commandPrefix: '!q',
  volume: 1,
  blacklist: [],
  blurredProviders: [],
  showTopSubmitters: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    colorSchemeToggled: (state, { payload }: PayloadAction<ColorScheme>) => {
      state.colorScheme = (state.colorScheme ?? payload) === 'dark' ? 'light' : 'dark';
    },
    channelChanged: (state, { payload }: PayloadAction<string>) => {
      state.channel = payload;
    },
    settingsChanged: (state, { payload }: PayloadAction<AllSettings>) => {
      if (payload.channel) {
        state.channel = payload.channel;
      }
      if (payload.colorScheme) {
        state.colorScheme = payload.colorScheme;
      }
      if (payload.commandPrefix) {
        state.commandPrefix = payload.commandPrefix;
      }
      if (payload.blacklist) {
        state.blacklist = payload.blacklist.map((s) => s.toLowerCase());
      }
      if (payload.blurredProviders) {
        state.blurredProviders = payload.blurredProviders;
      }
      if (payload.showTopSubmitters !== undefined) {
        state.showTopSubmitters = payload.showTopSubmitters;
      }
    },
    toggleShowTopSubmitters: (state) => {
      state.showTopSubmitters = !state.showTopSubmitters;
    },
    setShowTopSubmitters: (state, { payload }: PayloadAction<boolean>) => {
      state.showTopSubmitters = payload;
    },
    setVolume: (state, action) => {
      state.volume = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(authenticateWithToken.fulfilled, (state, { payload }) => {
      if (!state.channel) {
        state.channel = payload.username;
      }
    });
    builder.addCase(legacyDataMigrated, (state, { payload }) => {
      if (payload.channel) {
        state.channel = payload.channel;
      }
    });
  },
});

const selectSettings = (state: RootState): SettingsState => state.settings;
export const selectChannel = (state: RootState) => state.settings.channel;
export const selectCommandPrefix = (state: RootState) => state.settings.commandPrefix;
export const selectBlacklist = (state: RootState) => state.settings.blacklist || [];
export const selectBlurredProviders = (state: RootState) => state.settings.blurredProviders || [];

export const selectColorScheme = createSelector(
  [selectSettings, (_, defaultColorScheme: ColorScheme) => defaultColorScheme],
  (state, defaultColorScheme) => state.colorScheme ?? defaultColorScheme
);

export const selectShowTopSubmitters = (state: RootState) => state.settings.showTopSubmitters !== false;

export const { colorSchemeToggled, channelChanged, settingsChanged, toggleShowTopSubmitters, setShowTopSubmitters } = settingsSlice.actions;

const settingsReducer = persistReducer(
  {
    key: 'settings',
    version: 1,
    storage: storage('twitch-react-queue'),
  },
  settingsSlice.reducer
);

export const { setVolume } = settingsSlice.actions;
export default settingsReducer;
