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
  blockedChannels: string[];
  blurredProviders: string[];
  showTopSubmitters?: boolean;
  subOnlyMode?: boolean;
  skipThreshold?: number;
  clipMemoryRetentionDays?: number | null;
  reorderOnDuplicate?: boolean;
  autoplayDelay?: number;
  playerPercentDefault?: number;
}

const initialState: SettingsState = {
  colorScheme: null,
  commandPrefix: '!q',
  volume: 1,
  blacklist: [],
  blockedChannels: [],
  blurredProviders: [],
  showTopSubmitters: false,
  subOnlyMode: false,
  skipThreshold: 20,
  clipMemoryRetentionDays: null,
  reorderOnDuplicate: true,
  autoplayDelay: 5,
  playerPercentDefault: 79,
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
        state.blacklist = payload.blacklist.map((s) => s.trim().toLowerCase()).filter(Boolean);
      }
      if (payload.blockedChannels) {
        state.blockedChannels = payload.blockedChannels.map((s: string) => s.trim().toLowerCase()).filter(Boolean);
      }
      if (payload.blurredProviders) {
        state.blurredProviders = payload.blurredProviders;
      }
      if (payload.showTopSubmitters !== undefined) {
        state.showTopSubmitters = payload.showTopSubmitters;
      }
      if (payload.subOnlyMode !== undefined) {
        state.subOnlyMode = payload.subOnlyMode;
      }
      if (payload.skipThreshold !== undefined) {
        state.skipThreshold = payload.skipThreshold;
      }
      if (payload.clipMemoryRetentionDays !== undefined) {
        state.clipMemoryRetentionDays = payload.clipMemoryRetentionDays;
      }
      if (payload.reorderOnDuplicate !== undefined) {
        state.reorderOnDuplicate = payload.reorderOnDuplicate;
      }
      if (payload.autoplayDelay !== undefined) {
        state.autoplayDelay = Math.max(0, Math.min(5, payload.autoplayDelay));
      }
      if (payload.playerPercentDefault !== undefined) {
        state.playerPercentDefault = Math.max(30, Math.min(85, payload.playerPercentDefault));
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
    addBlacklist: (state, { payload }: PayloadAction<string>) => {
      const name = payload.trim().toLowerCase();
      if (name && !state.blacklist.includes(name)) state.blacklist.push(name);
    },
    removeBlacklist: (state, { payload }: PayloadAction<string>) => {
      const name = payload.trim().toLowerCase();
      state.blacklist = state.blacklist.filter((c) => c !== name);
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
export const selectBlockedChannels = (state: RootState) => state.settings.blockedChannels || [];
export const selectBlurredProviders = (state: RootState) => state.settings.blurredProviders || [];

export const selectColorScheme = createSelector(
  [selectSettings, (_, defaultColorScheme: ColorScheme) => defaultColorScheme],
  (state, defaultColorScheme) => state.colorScheme ?? defaultColorScheme
);

export const selectShowTopSubmitters = (state: RootState) => state.settings.showTopSubmitters !== false;
export const selectSubOnlyMode = (state: RootState) => state.settings.subOnlyMode === true;
export const selectSkipThreshold = (state: RootState) => state.settings.skipThreshold ?? 20;
export const selectClipMemoryRetentionDays = (state: RootState) => state.settings.clipMemoryRetentionDays ?? null;

export const selectReorderOnDuplicate = (state: RootState) => state.settings.reorderOnDuplicate !== false;
export const selectAutoplayDelay = (state: RootState) => state.settings.autoplayDelay ?? 5;
export const selectPlayerPercentDefault = (state: RootState) => state.settings.playerPercentDefault ?? 79;

export const { colorSchemeToggled, channelChanged, settingsChanged, toggleShowTopSubmitters, setShowTopSubmitters, addBlacklist, removeBlacklist, setVolume } = settingsSlice.actions;

const settingsReducer = persistReducer(
  {
    key: 'settings',
    version: 1,
    storage: storage('twitch-react-queue'),
  },
  settingsSlice.reducer
);

export default settingsReducer;
