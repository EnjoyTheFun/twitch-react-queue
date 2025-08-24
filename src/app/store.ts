import { configureStore, combineReducers, MiddlewareAPI } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import createAnalyticsMiddleware from '../features/analytics/analyticsMiddleware';
import authReducer from '../features/auth/authSlice';
import createClipQueueMiddleware from '../features/clips/clipQueueMiddleware';
import clipQueueReducer from '../features/clips/clipQueueSlice';
import { tryMigrateLegacyData } from '../features/migration/legacyMigration';
import settingsReducer from '../features/settings/settingsSlice';
import createTwitchChatMiddleware from '../features/twitchChat/twitchChatMiddleware';
import chatUsersReducer from '../features/twitchChat/chatUsersSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  settings: settingsReducer,
  chatUsers: chatUsersReducer,
  clipQueue: clipQueueReducer,
});

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'settings', 'clipQueue'],
  blacklist: ['chatUsers'], // Don't persist chat users
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat([
      createTwitchChatMiddleware(),
      createClipQueueMiddleware(),
      createAnalyticsMiddleware(),
    ]),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store, undefined, () => {
  tryMigrateLegacyData(store.dispatch);
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
export type AppThunkConfig = { dispatch: AppDispatch; state: RootState };
export type AppMiddlewareAPI = MiddlewareAPI<AppDispatch, RootState>;
