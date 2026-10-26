import { lazy, Suspense } from 'react';
import { Loader } from '@mantine/core';

const VideoPlayer = lazy(() => import('./VideoPlayer'));

interface StreamablePlayerProps {
  src: string;
  title: string;
  autoplayEnabled: boolean;
  onEnded?: () => void;
}

function StreamablePlayer({ src, autoplayEnabled, onEnded }: StreamablePlayerProps) {
  return (
    <Suspense fallback={
      <div className="player-loading-indicator">
        <Loader size={48} variant="oval" color="indigo" />
      </div>
    }>
      <VideoPlayer
        src={src}
        onEnded={autoplayEnabled ? onEnded : undefined}
      />
    </Suspense>
  );
}

export default StreamablePlayer;
