import { useEffect, useRef } from 'react';
import { useAppSelector } from './hooks';
import { selectIsOpen } from '../features/clips/clipQueueSlice';
import { useLocation } from 'react-router-dom';

export default function useQueueStatusTitle() {
  const isOpen = useAppSelector(selectIsOpen);
  const location = useLocation();
  const baseTitleRef = useRef<string>(typeof document !== 'undefined' ? document.title || 'Twitch Clip Queue' : 'Twitch Clip Queue');

  useEffect(() => {
    if (typeof document !== 'undefined') {
      baseTitleRef.current = (document.title || baseTitleRef.current).replace(/^\[(OPEN|CLOSED)\]\s*/i, '');
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const onQueue = location?.pathname === '/queue';
    const prefix = onQueue ? (isOpen ? '[OPEN] ' : '[CLOSED] ') : '';

    document.title = `${prefix}${baseTitleRef.current}`;
  }, [isOpen, location?.pathname]);
}
