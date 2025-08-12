import React, { useEffect, useRef } from 'react';
import {
  autoplayTimeoutHandleChanged,
} from '../clipQueueSlice';
import { useAppDispatch } from '../../../app/hooks';

interface TikTokPlayerProps {
  src: string;
  title?: string;
  autoplayEnabled?: boolean;
}

const TikTokPlayer: React.FC<TikTokPlayerProps> = ({
  src,
  title = 'TikTok Video',
  autoplayEnabled = false
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin !== 'https://www.tiktok.com' ||
        !event.data ||
        typeof event.data !== 'object'
      ) return;

      // eslint-disable-next-line no-useless-computed-key
      const { type, value, ['x-tiktok-player']: isTikTokPlayer } = event.data;

      if (!isTikTokPlayer) return;

      if (type === 'onStateChange') {
        if (value === 0 && autoplayEnabled) {
          dispatch(autoplayTimeoutHandleChanged({ set: true }));
        }
        // Video started playing — unmute it
        iframeRef.current?.contentWindow?.postMessage({ type: "unMute", "x-tiktok-player": true }, '*');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [dispatch, autoplayEnabled]);

  return (
    <iframe
      ref={iframeRef}
      src={src}
      title={title}
      style={{ height: '100%', width: '100%' }}
      frameBorder="0"
      allow="autoplay; fullscreen"
      allowFullScreen
    />
  );
};

export default TikTokPlayer;
