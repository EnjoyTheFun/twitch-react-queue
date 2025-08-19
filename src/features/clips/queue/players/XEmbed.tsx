import { useEffect } from 'react';
import { XEmbed } from 'react-social-media-embed';
import { useAppDispatch } from '../../../../app/hooks';
import {
  autoplayTimeoutHandleChanged,
} from '../../clipQueueSlice';

export default function XEmbedWithTimeout({
  url,
  autoplayEnabled,
  dispatch,
  timeout = 5000,
  ...props
}: {
  url: string;
  autoplayEnabled: boolean;
  dispatch: ReturnType<typeof useAppDispatch>;
  timeout?: number;
  [key: string]: any;
}) {
  useEffect(() => {
    if (autoplayEnabled) {
      const timer = setTimeout(() => {
        dispatch(autoplayTimeoutHandleChanged({ set: true }));
      }, timeout);
      return () => clearTimeout(timer);
    }
  }, [autoplayEnabled, dispatch, timeout]);

  return <XEmbed url={url} {...props} />;
}
