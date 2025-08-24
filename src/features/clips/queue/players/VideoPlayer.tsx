import React, { useEffect, useRef, useCallback } from 'react';
import { setVolume } from '../../../settings/settingsSlice';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../../app/store';
import videojs from 'video.js';
import VideoJSPlayer from 'video.js/dist/types/player';
import 'video.js/dist/video-js.css';
import '@videojs/http-streaming';
import 'videojs-youtube';

interface VideoPlayerProps {
  src: string | undefined;
  onEnded?: () => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, onEnded }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<VideoJSPlayer | null>(null);
  const dispatch = useDispatch();
  const volume = useSelector((state: RootState) => state.settings.volume);

  const handleVolumeChange = useCallback(() => {
    if (playerRef.current && !playerRef.current.isDisposed()) {
      const currentVolume = playerRef.current.volume();
      dispatch(setVolume(currentVolume));
    }
  }, [dispatch]);

  const handleError = useCallback((e: any) => {
    console.error('Video player error:', e);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (playerRef.current && !playerRef.current.isDisposed()) {
      const player = playerRef.current;
      if (!player.paused()) return;
      player.play()?.catch((err) => {
        console.warn('Play failed:', err);
      });
    }
  }, []);

  useEffect(() => {
    if (!videoRef.current || !src) return;

    const isYouTube = src.includes('youtube.com') || src.includes('youtu.be');

    if (playerRef.current && !playerRef.current.isDisposed()) {
      try {
        playerRef.current.dispose();
      } catch (e) {
        console.warn('Error during Video.js dispose:', e);
      }
      playerRef.current = null;
    }

    playerRef.current = videojs(videoRef.current, {
      controls: true,
      autoplay: true,
      fluid: true,
      responsive: true,
      aspectRatio: '16:9',
      bigPlayButton: false,
      preload: 'auto',
      sources: isYouTube
        ? [{ src, type: 'video/youtube' }]
        : [{ src, type: src.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4' }],
      techOrder: isYouTube ? ['youtube', 'html5'] : ['html5'],
    });

    const player = playerRef.current;
    if (player) {
      player.fill(true);
      player.volume(volume);

      player.on('volumechange', handleVolumeChange);
      player.on('error', handleError);
      player.on('loadedmetadata', handleLoadedMetadata);

      if (onEnded) {
        player.on('ended', onEnded);
      }
    }

    return () => {
      if (playerRef.current && !playerRef.current.isDisposed()) {
        try {
          const player = playerRef.current;
          player.off('volumechange', handleVolumeChange);
          player.off('error', handleError);
          player.off('loadedmetadata', handleLoadedMetadata);
          if (onEnded) {
            player.off('ended', onEnded);
          }
          player.dispose();
        } catch (e) {
          console.warn('Error during Video.js dispose:', e);
        }
        playerRef.current = null;
      }
    };
  }, [src, volume, onEnded, handleVolumeChange, handleError, handleLoadedMetadata]);

  if (!src) return null;

  return (
    <div data-vjs-player>
      <video ref={videoRef} className="video-js vjs-default-skin" />
    </div>
  );
};

export default VideoPlayer;
