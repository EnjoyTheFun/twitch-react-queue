import { useEffect, useCallback } from 'react';
import { useAppSelector } from './hooks';
import { selectIsOpen } from '../features/clips/clipQueueSlice';
import { useLocation } from 'react-router-dom';

const APP_BASE_TITLE = 'React Queue';

export default function AppTitle() {
  const isOpen = useAppSelector(selectIsOpen);
  const location = useLocation();

  const updateTitle = useCallback((isQueueOpen: boolean, pathname: string) => {
    if (typeof document === 'undefined') return;

    const onQueue = pathname === '/queue';
    const prefix = onQueue ? (isQueueOpen ? '[OPEN] ' : '[CLOSED] ') : '';

    document.title = `${prefix}${APP_BASE_TITLE}`;
  }, []);

  useEffect(() => {
    updateTitle(isOpen, location?.pathname || '');
  }, [isOpen, location?.pathname, updateTitle]);

  return null;
}
