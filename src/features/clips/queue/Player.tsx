import { Stack, Loader } from '@mantine/core';
import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import type { Clip } from '../clipQueueSlice';
import {
  autoplayTimeoutHandleChanged,
  currentClipWatched,
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
import StreamablePlayer from './players/StreamablePlayer';
import { useRef } from 'react';
import { preloadImage, preloadVideo, preloadHlsManifest, preloadGenericHead, PreloadHandle } from './preloadMedia';

interface PlayerProps {
  className?: string;
}

const getPlayerComponent = (
  currentClip: Clip | undefined,
  videoSrc: string | undefined,
  autoplayEnabled: boolean,
  nextClipId: string | undefined,
  autoplayTimeoutHandle: number | undefined,
  dispatch: ReturnType<typeof useAppDispatch>
) => {
  if (!currentClip) return null;

  const { Platform, id, title } = currentClip;
  if (!id) return null;
  const embedUrl = videoSrc || clipProvider.getEmbedUrl(id) || "";

  const handleEnded = autoplayEnabled && nextClipId
    ? () => {
      if (!autoplayTimeoutHandle) {
        dispatch(autoplayTimeoutHandleChanged({ set: true }));
      }
    }
    : undefined;


  switch (Platform) {
    case 'YouTube':
    case 'Twitch': return autoplayEnabled ? (
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
      />)
    case 'Streamable':
      return autoplayEnabled ? (
        <StreamablePlayer
          key={`${id}-${autoplayEnabled}`}
          src={embedUrl}
          title={title || 'Streamable Video'}
          autoplayEnabled={autoplayEnabled && !!nextClipId}
          onEnded={handleEnded}
        />
      ) : (<iframe
        key={`${id}-${autoplayEnabled}`}
        src={clipProvider.getEmbedUrl(id) + "?autoplay=1&loop=0" || embedUrl + "?autoplay=1&loop=0"}
        title={title}
        style={{ height: '100%', width: '100%' }}
        frameBorder="0"
        allow="autoplay"
        allowFullScreen
      />);
    case 'Kick':
      return <VideoPlayer key={`${currentClip.id}-${videoSrc}-${autoplayEnabled}`} src={embedUrl} onEnded={handleEnded} />;
    case 'Reddit':
      const isRedditImage = videoSrc && (
        /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(videoSrc) ||
        videoSrc.includes('preview.redd.it') ||
        videoSrc.includes('i.redd.it')
      );

      if (isRedditImage) {
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
      return <VideoPlayer key={`${currentClip.id}-${videoSrc}-${autoplayEnabled}`} src={videoSrc} onEnded={handleEnded} />;
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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showLoader, setShowLoader] = useState<boolean>(false);
  const skipVoteCount = useAppSelector(selectSkipVoteCount);
  const loaderTimerRef = useRef<number | null>(null);


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

    if (autoplayEnabled && nextClipId && currentClip.id?.startsWith('twitch-vod:')) {
      // skip autoplay for twitch VODs
      dispatch(currentClipWatched());
      return;
    }

    setVideoSrc(undefined);
    setIsLoading(true);
    setShowLoader(false);
    if (loaderTimerRef.current) {
      clearTimeout(loaderTimerRef.current as any);
      loaderTimerRef.current = null;
    }
    let Flag = true;

    // Show the spinner only if loading lasts longer than 1s
    loaderTimerRef.current = window.setTimeout(() => {
      if (Flag) setShowLoader(true);
      loaderTimerRef.current = null;
    }, 1000);

    const fetchVideoUrl = async () => {
      try {
        const url = await clipProvider.getAutoplayUrl(currentClip.id);
        if (Flag) {
          setVideoSrc(url);
          setError(null);
          setIsLoading(false);
          if (loaderTimerRef.current) {
            clearTimeout(loaderTimerRef.current as any);
            loaderTimerRef.current = null;
          }
          setShowLoader(false);
        }
      } catch (err) {
        if (Flag) {
          setError('Failed to load video');
          setVideoSrc(undefined);
          setIsLoading(false);
          if (loaderTimerRef.current) {
            clearTimeout(loaderTimerRef.current as any);
            loaderTimerRef.current = null;
          }
          setShowLoader(false);
        }
      }
    };

    fetchVideoUrl();

    return () => {
      Flag = false;
      if (loaderTimerRef.current) {
        clearTimeout(loaderTimerRef.current as any);
        loaderTimerRef.current = null;
      }
      setShowLoader(false);
    };
  }, [currentClip, autoplayEnabled, dispatch]);

  const preloadRef = useRef<PreloadHandle | null>(null);
  const preloadAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    preloadRef.current?.cleanup();
    preloadRef.current = null;
    try {
      preloadAbortRef.current?.abort();
    } catch { }
    preloadAbortRef.current = null;

    if (!currentClip || !nextClipId) return;

    if (!autoplayEnabled) return;

    const nav = (navigator as any);
    if (nav?.connection?.saveData) return;
    const effectiveType = nav?.connection?.effectiveType;
    if (effectiveType && /2g/.test(effectiveType)) return;

    const controller = new AbortController();
    preloadAbortRef.current = controller;

    (async () => {
      try {
        const url = await clipProvider.getAutoplayUrl(nextClipId);
        if (!url) return;

        let handle: PreloadHandle | null = null;
        if (/\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(url) || url.includes('preview.redd.it') || url.includes('i.redd.it') || url.includes('i.imgur.com')) {
          handle = preloadImage(url);
        } else if (/\.mp4(\?|$)/i.test(url)) {
          handle = preloadVideo(url);
        } else if (/\.m3u8(\?|$)/i.test(url)) {
          handle = await preloadHlsManifest(url, controller.signal);
        } else {
          handle = await preloadGenericHead(url, controller.signal);
        }

        preloadRef.current = handle;
      } catch (err) { }
    })();

    return () => {
      preloadRef.current?.cleanup();
      preloadRef.current = null;
      try { preloadAbortRef.current?.abort(); } catch { }
      preloadAbortRef.current = null;
    };
  }, [currentClip?.id, nextClipId, autoplayEnabled]);

  const player = getPlayerComponent(currentClip, videoSrc, autoplayEnabled, nextClipId, autoplayTimeoutHandle, dispatch);

  return (
    <Stack
      align="center"
      sx={{ background: 'black', width: '100%', aspectRatio: '16 / 9', position: 'relative', flex: '0 0 auto' }}
      className={className}
    >
      {error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : isLoading && showLoader ? (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}>
          <Loader size="xl" color="white" />
        </div>
      ) : videoSrc || !autoplayEnabled ? (
        player
      ) : (
        <div></div>
      )}
      {skipVoteCount > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 3,
            background: 'rgba(0, 0, 0, 0.6)',
            color: 'white',
            padding: '6px 10px',
            borderRadius: '0 0 12px 12px',
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
