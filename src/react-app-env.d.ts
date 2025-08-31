/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TWITCH_CLIENT_ID: string;
  readonly VITE_TWITCH_REDIRECT_URI: string;
  readonly VITE_BASEPATH: string;
  readonly VITE_LOG_LEVEL: string;
  readonly VITE_UMAMI_WEBSITE_ID: string;
  readonly VITE_UMAMI_SRC: string;
  readonly VITE_DC_LINKS_API_URL: string;
  readonly VITE_IMPORT_WHITELIST: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'redux-persist-indexeddb-storage' {
  import { WebStorage } from 'redux-persist/es/types';

  const createStorage: (dbName: string) => WebStorage;
  export default createStorage;
}
