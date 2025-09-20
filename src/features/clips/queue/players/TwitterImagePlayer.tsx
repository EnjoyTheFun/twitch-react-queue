import { useEffect } from 'react';
import { useAppDispatch } from '../../../../app/hooks';
import { autoplayTimeoutHandleChanged } from '../../clipQueueSlice';

function TwitterImagePlayer({ src, title, autoplayEnabled, dispatch }: {
  src: string;
  title?: string;
  autoplayEnabled: boolean;
  dispatch: ReturnType<typeof useAppDispatch>;
}) {
  useEffect(() => {
    if (autoplayEnabled) {
      const timeout = setTimeout(() => {
        dispatch(autoplayTimeoutHandleChanged({ set: true }));
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [autoplayEnabled, dispatch]);

  return (
    // iframes render images with their original size on Chromium browsers - fix by using img
    <img
      src={src}
      alt={title}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        display: 'block',
        background: 'black',
      }}
    />)
}

export default TwitterImagePlayer;
