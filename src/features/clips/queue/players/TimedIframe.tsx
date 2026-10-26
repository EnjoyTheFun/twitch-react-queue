import { useEffect } from 'react';
import { useAppDispatch } from '../../../../app/hooks';
import { autoplayTimeoutHandleChanged } from '../../clipQueueSlice';

export default function TimedIframe({
  src,
  title,
  autoplayEnabled,
  dispatch,
  timeout = 5000,
}: {
  src: string;
  title?: string;
  autoplayEnabled: boolean;
  dispatch: ReturnType<typeof useAppDispatch>;
  timeout?: number;
}) {
  useEffect(() => {
    if (!autoplayEnabled) return;
    const timer = setTimeout(() => {
      dispatch(autoplayTimeoutHandleChanged({ set: true }));
    }, timeout);
    return () => clearTimeout(timer);
  }, [autoplayEnabled, dispatch, timeout]);

  return (
    <iframe
      src={src}
      title={title}
      style={{ height: '100%', width: '100%' }}
      frameBorder="0"
      allow="autoplay"
      allowFullScreen
    />
  );
}
