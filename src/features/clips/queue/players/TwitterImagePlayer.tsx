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
    // use max-width/max-height to constrain within parent's aspect ratio without breaking out
    <img
      src={src}
      alt={title}
      style={{
        maxWidth: '100%',
        maxHeight: '100%',
        width: 'auto',
        height: 'auto',
        objectFit: 'contain',
        display: 'block',
        background: 'black',
        margin: 'auto',
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    />)
}

export default TwitterImagePlayer;
