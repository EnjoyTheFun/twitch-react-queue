import { createSlice, createSelector, PayloadAction } from '@reduxjs/toolkit';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist-indexeddb-storage';
import type { RootState } from '../../app/store';
import { authenticateWithToken } from '../auth/authSlice';
import { legacyDataMigrated } from '../migration/legacyMigration';
import { AllSettings, ColorScheme, ObservedChannelPointsRedemption } from './models';

interface SettingsState {
  colorScheme: ColorScheme | null;
  channel?: string;
  commandPrefix: string;
  volume: number;
  blockedSubmitters: string[];
  blockedCreators: string[];
  favoriteSubmitters: string[];
  blurredProviders: string[];
  allowRedditNsfw: boolean;
  showTopSubmitters?: boolean;
  subOnlyMode?: boolean;
  channelPointsLinksOnly?: boolean;
  showSubmitterNotes?: boolean;
  allowStandardMessageUrls?: boolean;
  allowChannelPointsRedemptionUrls?: boolean;
  allowPowerUpRedemptionUrls?: boolean;
  channelPointsRewardId?: string;
  listenForChannelPointsRewardIds?: boolean;
  powerUpRedemptionTypeId?: string;
  powerUpRedemptionsEnabled?: boolean;
  highlightRedemptionId?: string;
  skipThreshold?: number;
  clipMemoryRetentionDays?: number | null;
  reorderOnDuplicate?: boolean;
  autoplayDelay?: number;
  playerPercentDefault?: number;
  showPlayerProgressBar?: boolean;
  voteYeaKeyword?: string;
  voteNayKeyword?: string;
  observedChannelPointsRedemptions: ObservedChannelPointsRedemption[];
}

const initialState: SettingsState = {
  colorScheme: null,
  commandPrefix: '!q',
  volume: 1,
  blockedSubmitters: [],
  blockedCreators: [],
  favoriteSubmitters: [],
  blurredProviders: [],
  allowRedditNsfw: false,
  showTopSubmitters: false,
  subOnlyMode: false,
  channelPointsLinksOnly: false,
  showSubmitterNotes: true,
  allowStandardMessageUrls: true,
  allowChannelPointsRedemptionUrls: false,
  allowPowerUpRedemptionUrls: true,
  channelPointsRewardId: '',
  listenForChannelPointsRewardIds: false,
  powerUpRedemptionTypeId: '',
  highlightRedemptionId: '',
  powerUpRedemptionsEnabled: true,
  skipThreshold: 20,
  clipMemoryRetentionDays: null,
  reorderOnDuplicate: true,
  autoplayDelay: 5,
  playerPercentDefault: 79,
  showPlayerProgressBar: true,
  voteYeaKeyword: 'VoteYea',
  voteNayKeyword: 'VoteNay',
  observedChannelPointsRedemptions: [],
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
      if (payload.blockedSubmitters) {
        state.blockedSubmitters = payload.blockedSubmitters.map((s) => s.trim().toLowerCase()).filter(Boolean);
      }
      if (payload.blockedCreators) {
        state.blockedCreators = payload.blockedCreators.map((s: string) => s.trim().toLowerCase()).filter(Boolean);
      }
      if (payload.favoriteSubmitters) {
        state.favoriteSubmitters = payload.favoriteSubmitters.map((s: string) => s.trim().toLowerCase()).filter(Boolean);
      }
      if (payload.blurredProviders) {
        state.blurredProviders = payload.blurredProviders;
      }
      if (payload.allowRedditNsfw !== undefined) {
        state.allowRedditNsfw = payload.allowRedditNsfw;
      }
      if (payload.showTopSubmitters !== undefined) {
        state.showTopSubmitters = payload.showTopSubmitters;
      }
      if (payload.subOnlyMode !== undefined) {
        state.subOnlyMode = payload.subOnlyMode;
      }
      if (payload.showSubmitterNotes !== undefined) {
        state.showSubmitterNotes = payload.showSubmitterNotes;
      }
      if (payload.channelPointsLinksOnly !== undefined) {
        state.channelPointsLinksOnly = payload.channelPointsLinksOnly;
        if (payload.channelPointsLinksOnly) {
          state.allowStandardMessageUrls = false;
          state.allowChannelPointsRedemptionUrls = true;
        } else {
          state.allowStandardMessageUrls = true;
        }
      }
      if (payload.allowStandardMessageUrls !== undefined) {
        state.allowStandardMessageUrls = payload.allowStandardMessageUrls;
      }
      if (payload.allowChannelPointsRedemptionUrls !== undefined) {
        state.allowChannelPointsRedemptionUrls = payload.allowChannelPointsRedemptionUrls;
      }
      if (payload.allowPowerUpRedemptionUrls !== undefined) {
        state.allowPowerUpRedemptionUrls = payload.allowPowerUpRedemptionUrls;
      }
      if (payload.channelPointsRewardId !== undefined) {
        state.channelPointsRewardId = payload.channelPointsRewardId.trim().toLowerCase();
      }
      if (payload.listenForChannelPointsRewardIds !== undefined) {
        state.listenForChannelPointsRewardIds = payload.listenForChannelPointsRewardIds;
      }
      if (payload.powerUpRedemptionTypeId !== undefined) {
        state.powerUpRedemptionTypeId = payload.powerUpRedemptionTypeId.trim().toLowerCase();
      }
      if (payload.highlightRedemptionId !== undefined) {
        state.highlightRedemptionId = payload.highlightRedemptionId.trim().toLowerCase();
      }
      if (payload.powerUpRedemptionsEnabled !== undefined) {
        state.powerUpRedemptionsEnabled = payload.powerUpRedemptionsEnabled;
        state.allowPowerUpRedemptionUrls = payload.powerUpRedemptionsEnabled;
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
      if (payload.showPlayerProgressBar !== undefined) {
        state.showPlayerProgressBar = payload.showPlayerProgressBar;
      }
      if (payload.voteYeaKeyword !== undefined) {
        state.voteYeaKeyword = payload.voteYeaKeyword.trim() || 'VoteYea';
      }
      if (payload.voteNayKeyword !== undefined) {
        state.voteNayKeyword = payload.voteNayKeyword.trim() || 'VoteNay';
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
    addBlockedSubmitter: (state, { payload }: PayloadAction<string>) => {
      const name = payload.trim().toLowerCase();
      if (name && !state.blockedSubmitters.includes(name)) state.blockedSubmitters.push(name);
    },
    removeBlockedSubmitter: (state, { payload }: PayloadAction<string>) => {
      const name = payload.trim().toLowerCase();
      state.blockedSubmitters = state.blockedSubmitters.filter((c) => c !== name);
    },
    addBlockedCreator: (state, { payload }: PayloadAction<string>) => {
      const name = payload.trim().toLowerCase();
      if (name && !state.blockedCreators.includes(name)) state.blockedCreators.push(name);
    },
    removeBlockedCreator: (state, { payload }: PayloadAction<string>) => {
      const name = payload.trim().toLowerCase();
      state.blockedCreators = state.blockedCreators.filter((c) => c !== name);
    },
    addFavoriteSubmitter: (state, { payload }: PayloadAction<string>) => {
      const name = payload.trim().toLowerCase();
      if (!state.favoriteSubmitters) state.favoriteSubmitters = [];
      if (name && !state.favoriteSubmitters.includes(name)) state.favoriteSubmitters.push(name);
    },
    removeFavoriteSubmitter: (state, { payload }: PayloadAction<string>) => {
      const name = payload.trim().toLowerCase();
      if (!state.favoriteSubmitters) state.favoriteSubmitters = [];
      state.favoriteSubmitters = state.favoriteSubmitters.filter((c) => c !== name);
    },
    channelPointsRedemptionObserved: (state, { payload }: PayloadAction<{ id?: string; title?: string; source: 'redeem' | 'message' }>) => {
      if (!state.observedChannelPointsRedemptions) {
        state.observedChannelPointsRedemptions = [];
      }

      const normalizedId = (payload.id || '').trim().toLowerCase();
      const normalizedTitle = payload.title?.trim();
      if (!normalizedId && !normalizedTitle) {
        return;
      }

      const matchIndex = state.observedChannelPointsRedemptions.findIndex((item) => {
        if (normalizedId && item.id === normalizedId) {
          return true;
        }

        if (!normalizedId && normalizedTitle && item.title?.toLowerCase() === normalizedTitle.toLowerCase()) {
          return true;
        }

        return false;
      });

      const observed: ObservedChannelPointsRedemption = {
        id: normalizedId,
        title: normalizedTitle,
        source: payload.source,
        lastSeenAt: Date.now(),
      };

      if (matchIndex >= 0) {
        const existing = state.observedChannelPointsRedemptions[matchIndex];
        state.observedChannelPointsRedemptions[matchIndex] = {
          ...existing,
          ...observed,
          title: observed.title || existing.title,
        };
      } else {
        state.observedChannelPointsRedemptions.unshift(observed);
      }

      state.observedChannelPointsRedemptions.sort((a, b) => b.lastSeenAt - a.lastSeenAt);
      state.observedChannelPointsRedemptions = state.observedChannelPointsRedemptions.slice(0, 20);
    },
    clearObservedChannelPointsRedemptions: (state) => {
      state.observedChannelPointsRedemptions = [];
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
export const selectBlockedSubmitters = (state: RootState) => state.settings.blockedSubmitters || [];
export const selectBlockedCreators = (state: RootState) => state.settings.blockedCreators || [];
export const selectFavoriteSubmitters = (state: RootState) => state.settings.favoriteSubmitters || [];
export const selectBlurredProviders = (state: RootState) => state.settings.blurredProviders || [];
export const selectAllowRedditNsfw = (state: RootState) => state.settings.allowRedditNsfw === true;

export const selectColorScheme = createSelector(
  [selectSettings, (_, defaultColorScheme: ColorScheme) => defaultColorScheme],
  (state, defaultColorScheme) => state.colorScheme ?? defaultColorScheme
);

export const selectShowTopSubmitters = (state: RootState) => state.settings.showTopSubmitters !== false;
export const selectSubOnlyMode = (state: RootState) => state.settings.subOnlyMode === true;
export const selectShowSubmitterNotes = (state: RootState) => state.settings.showSubmitterNotes !== false;
export const selectChannelPointsLinksOnly = (state: RootState) => state.settings.channelPointsLinksOnly === true;
export const selectAllowStandardMessageUrls = (state: RootState) => {
  if (state.settings.allowStandardMessageUrls !== undefined) {
    return state.settings.allowStandardMessageUrls === true;
  }

  return state.settings.channelPointsLinksOnly !== true;
};
export const selectAllowChannelPointsRedemptionUrls = (state: RootState) => {
  if (state.settings.allowChannelPointsRedemptionUrls !== undefined) {
    return state.settings.allowChannelPointsRedemptionUrls === true;
  }

  return !!(state.settings.channelPointsRewardId || '').trim();
};
export const selectAllowPowerUpRedemptionUrls = (state: RootState) => {
  if (state.settings.allowPowerUpRedemptionUrls !== undefined) {
    return state.settings.allowPowerUpRedemptionUrls === true;
  }

  return state.settings.powerUpRedemptionsEnabled === true;
};
export const selectChannelPointsRewardId = (state: RootState) => (state.settings.channelPointsRewardId || '').trim().toLowerCase();
export const selectHighlightRedemptionId = (state: RootState) => (state.settings.highlightRedemptionId || '').trim().toLowerCase();
export const selectListenForChannelPointsRewardIds = (state: RootState) => state.settings.listenForChannelPointsRewardIds === true;
export const selectPowerUpRedemptionTypeId = (state: RootState) => (state.settings.powerUpRedemptionTypeId || '').trim().toLowerCase();
export const selectPowerUpRedemptionsEnabled = (state: RootState) => selectAllowPowerUpRedemptionUrls(state);
export const selectSkipThreshold = (state: RootState) => state.settings.skipThreshold ?? 20;
export const selectClipMemoryRetentionDays = (state: RootState) => state.settings.clipMemoryRetentionDays ?? null;

export const selectReorderOnDuplicate = (state: RootState) => state.settings.reorderOnDuplicate !== false;
export const selectAutoplayDelay = (state: RootState) => state.settings.autoplayDelay ?? 5;
export const selectPlayerPercentDefault = (state: RootState) => state.settings.playerPercentDefault ?? 79;
export const selectShowPlayerProgressBar = (state: RootState) => state.settings.showPlayerProgressBar !== false;
export const selectVoteYeaKeyword = (state: RootState) => state.settings.voteYeaKeyword || 'VoteYea';
export const selectVoteNayKeyword = (state: RootState) => state.settings.voteNayKeyword || 'VoteNay';
export const selectObservedChannelPointsRedemptions = (state: RootState) => state.settings.observedChannelPointsRedemptions || [];

export const {
  colorSchemeToggled,
  channelChanged,
  settingsChanged,
  toggleShowTopSubmitters,
  setShowTopSubmitters,
  addBlockedSubmitter,
  removeBlockedSubmitter,
  addBlockedCreator,
  removeBlockedCreator,
  addFavoriteSubmitter,
  removeFavoriteSubmitter,
  setVolume,
  channelPointsRedemptionObserved,
  clearObservedChannelPointsRedemptions,
} = settingsSlice.actions;

const settingsReducer = persistReducer(
  {
    key: 'settings',
    version: 1,
    storage: storage('twitch-react-queue'),
  },
  settingsSlice.reducer
);

export default settingsReducer;
