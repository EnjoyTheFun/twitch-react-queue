import { createRoot } from 'react-dom/client';
import { PersistGate } from 'redux-persist/integration/react';
import { Provider } from 'react-redux';
import App from './app/App';
import AppSkeleton from './app/AppSkeleton';
import { persistor, store } from './app/store';
import { injectStore } from './common/apis/twitchApi';

import './index.scss';

injectStore(store);

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <Provider store={store}>
    <PersistGate loading={<AppSkeleton />} persistor={persistor}>
      <App />
    </PersistGate>
  </Provider>
);
