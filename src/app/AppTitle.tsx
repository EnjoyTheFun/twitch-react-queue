import { useEffect } from 'react';
import { useAppSelector } from './hooks';
import { selectIsOpen } from '../features/clips/clipQueueSlice';
import { useLocation } from 'react-router-dom';

const APP_BASE_TITLE = 'React Queue';

const normalizePathname = (pathname: string) => pathname.replace(/\/+$/, '') || '/';

export default function AppTitle() {
  const isOpen = useAppSelector(selectIsOpen);
  const location = useLocation();

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const pathname = normalizePathname(location.pathname);
    const onQueue = pathname.endsWith('/queue');
    const prefix = onQueue ? (isOpen ? '[OPEN] ' : '[CLOSED] ') : '';

    document.title = `${prefix}${APP_BASE_TITLE}`;
  }, [isOpen, location.pathname]);

  return null;
}
