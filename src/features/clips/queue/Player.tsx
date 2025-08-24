import { Stack } from '@mantine/core';
import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import type { Clip } from '../clipQueueSlice';
import {
  autoplayTimeoutHandleChanged,
  selectAutoplayEnabled,
  selectAutoplayTimeoutHandle,
  selectCurrentClip,
  selectNextId,
  selectSkipVoteCount,
  clearSkipVotes,
} from '../clipQueueSlice';
import clipProvider from '../providers/providers';
import AutoplayOverlay from './AutoplayOverlay';
import VideoPlayer from './players/VideoPlayer';
import TikTokPlayer from './players/TikTokPlayer';
import TwitterImagePlayer from './players/TwitterImagePlayer';
import InstagramEmbedWithTimeout from './players/InstagramEmbed';
import XEmbedWithTimeout from './players/XEmbed';

interface PlayerProps {
  className?: string;
}

const getPlayerComponent = (
  currentClip: Clip | undefined,
  videoSrc: string | undefined,
  autoplayEnabled: boolean,
  nextClipId: string | undefined,
  dispatch: ReturnType<typeof useAppDispatch>
) => {
  if (!currentClip) return null;

  const { Platform, id, title, url } = currentClip;
  if (!id) return null;
  const embedUrl = videoSrc || clipProvider.getEmbedUrl(id) || "";

  const handleEnded = autoplayEnabled && nextClipId
    ? () => dispatch(autoplayTimeoutHandleChanged({ set: true }))
    : undefined;


  switch (Platform) {
    case 'YouTube':
    case 'Twitch':
    case 'SOOP':
    case 'Streamable':
      return autoplayEnabled ? (
        <VideoPlayer
          key={`${id}-${videoSrc}-${autoplayEnabled}`}
          src={videoSrc}
          onEnded={handleEnded}
        />
      ) : (
        <iframe
          key={`${id}-${autoplayEnabled}`}
          src={clipProvider.getEmbedUrl(id) || embedUrl}
          title={title}
          style={{ height: '100%', width: '100%' }}
          frameBorder="0"
          allow="autoplay"
          allowFullScreen
        />);
    case 'Kick':
      return <VideoPlayer key={`${currentClip.id}-${videoSrc}-${autoplayEnabled}`} src={url} onEnded={handleEnded} />;
    case 'Instagram':
      return (
        <InstagramEmbedWithTimeout
          key={id}
          url={embedUrl}
          autoplayEnabled={autoplayEnabled && !!nextClipId}
          dispatch={dispatch}
          height="100%"
          captioned
        />
      );
    case 'TikTok':
      return (
        <TikTokPlayer
          key={`${id}-${videoSrc}-${autoplayEnabled}`}
          src={videoSrc ? videoSrc + '?autoplay=1&rel=0' : clipProvider.getEmbedUrl(id) + '?autoplay=1&rel=0'}
          title={title}
          autoplayEnabled={autoplayEnabled && !!nextClipId}
        />
      );
    case 'Twitter':
      if (videoSrc?.endsWith('.jpg') || videoSrc?.endsWith('.png')) {
        return (
          <TwitterImagePlayer
            key={`${id}-${videoSrc}-${autoplayEnabled}`}
            src={videoSrc}
            title={title}
            autoplayEnabled={autoplayEnabled && !!nextClipId}
            dispatch={dispatch}
          />
        );
      }
      if (videoSrc?.endsWith('.mp4')) {
        return (
          <VideoPlayer
            key={`${id}-${videoSrc}-${autoplayEnabled}`}
            src={videoSrc}
            onEnded={handleEnded}
          />
        );
      }
      // Not sure if raw tweets with no media should be displayed. Temp solution:
      return <XEmbedWithTimeout key={`${id}-${videoSrc}-${autoplayEnabled}`} url={embedUrl} style={{
        maxWidth: '100%', maxHeight: '100%', width: 500, height: '100%'
      }} autoplayEnabled={autoplayEnabled && !!nextClipId} dispatch={dispatch} />;
    default:
      return (
        <iframe
          key={`${id}-${autoplayEnabled}`}
          src={embedUrl}
          title={title}
          style={{ height: '100%', width: '100%' }}
          frameBorder="0"
          allow="autoplay"
          allowFullScreen
        />
      );
  }
};

function Player({ className }: PlayerProps) {
  const dispatch = useAppDispatch();
  const currentClip = useAppSelector(selectCurrentClip);
  const nextClipId = useAppSelector(selectNextId);
  const autoplayEnabled = useAppSelector(selectAutoplayEnabled);
  const autoplayTimeoutHandle = useAppSelector(selectAutoplayTimeoutHandle);
  const [videoSrc, setVideoSrc] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const skipVoteCount = useAppSelector(selectSkipVoteCount);

  const handleCancel = useCallback(() => {
    dispatch(autoplayTimeoutHandleChanged({ set: false }));
    dispatch(clearSkipVotes());
  }, [dispatch]);

  useEffect(() => {
    if (!currentClip) {
      setVideoSrc(undefined);
      setError(null);
      setIsLoading(false);
      return;
    }

    setVideoSrc(undefined);
    setError(null);
    setIsLoading(true);
    let Flag = true;

    const fetchVideoUrl = async () => {
      try {
        const url = await clipProvider.getAutoplayUrl(currentClip.id);
        if (Flag) {
          setVideoSrc(url);
          setError(null);
          setIsLoading(false);
        }
      } catch (err) {
        if (Flag) {
          console.error('Failed to fetch video URL for clip:', currentClip.id, err);
          setError('Failed to load video');
          setVideoSrc(undefined);
          setIsLoading(false);
        }
      }
    };

    fetchVideoUrl();

    return () => {
      Flag = false;
    };
  }, [currentClip]);

  const player = getPlayerComponent(currentClip, videoSrc, autoplayEnabled, nextClipId, dispatch);

  return (
    <Stack
      align="center"
      sx={{ background: 'black', width: '100%', aspectRatio: '16 / 9', position: 'relative', flex: '0 0 auto' }}
      className={className}
    >
      {error ? (
        <div style={{ color: 'white', background: 'rgba(255,0,0,0.7)', padding: '8px 12px', borderRadius: 4, margin: 16 }}>
          {error}
        </div>
      ) : isLoading ? (
        <div style={{ color: 'white', padding: 16 }}>Loading...</div>
      ) : videoSrc || !autoplayEnabled ? (
        player
      ) : (
        <div style={{ color: 'white', padding: 16 }}>Preparing video...</div>
      )}
      {skipVoteCount > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 3,
            background: 'rgba(0,0,0,0.6)',
            color: 'white',
            padding: '6px 10px',
            borderTopLeftRadius: 0,
            borderTopRightRadius: 0,
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
            fontWeight: 600,
            fontSize: 12,
          }}
          aria-live="polite"
        >
          Skip votes: {skipVoteCount}
        </div>
      )}
      <AutoplayOverlay
        visible={!!autoplayTimeoutHandle}
        onCancel={handleCancel}
      />
    </Stack>
  );
}

export default Player;
