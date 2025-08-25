import VideoPlayer from './VideoPlayer';

interface StreamablePlayerProps {
  src: string;
  title: string;
  autoplayEnabled: boolean;
  onEnded?: () => void;
}

function StreamablePlayer({ src, autoplayEnabled, onEnded }: StreamablePlayerProps) {
  return (
    <VideoPlayer
      src={src}
      onEnded={autoplayEnabled ? onEnded : undefined}
    />
  );
}

export default StreamablePlayer;
