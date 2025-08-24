import { useEffect, useRef, useCallback } from 'react';
import { useAppSelector } from './hooks';
import { selectIsOpen } from '../features/clips/clipQueueSlice';
import { useLocation } from 'react-router-dom';

const DEFAULT_TITLE = 'React Queue';

const useQueueStatusTitle = () => {
  const isOpen = useAppSelector(selectIsOpen);
  const location = useLocation();
  const baseTitleRef = useRef<string>(
    typeof document !== 'undefined' ? document.title || DEFAULT_TITLE : DEFAULT_TITLE
  );

  useEffect(() => {
    if (typeof document !== 'undefined' && document.title) {
      baseTitleRef.current = document.title.replace(/^\[(OPEN|CLOSED)\]\s*/i, '');
    }
  }, []);

  const updateTitle = useCallback((isQueueOpen: boolean, pathname: string) => {
    if (typeof document === 'undefined') return;

    const onQueue = pathname === '/queue';
    const prefix = onQueue ? (isQueueOpen ? '[OPEN] ' : '[CLOSED] ') : '';

    document.title = `${prefix}${baseTitleRef.current}`;
  }, []);

  useEffect(() => {
    updateTitle(isOpen, location?.pathname || '');
  }, [isOpen, location?.pathname, updateTitle]);
};

export default useQueueStatusTitle;
