import { useEffect, useRef } from 'react';
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
  const disposeTimeoutRef = useRef<number | null>(null);
  const dispatch = useDispatch();
  const volume = useSelector((state: RootState) => state.settings.volume);

  useEffect(() => {
    if (!videoRef.current || !src) return;

    const YouTube = src.includes('youtube.com') || src.includes('youtu.be');

    playerRef.current = videojs(videoRef.current, {
      controls: true,
      autoplay: true,
      fluid: true,
      responsive: true,
      aspectRatio: '16:9',
      bigPlayButton: false,
      preload: 'auto',
      sources: YouTube
        ? [{ src, type: 'video/youtube' }]
        : [{ src, type: src.includes('.m3u8') ? 'application/x-mpegURL' : 'video/mp4' }],
      techOrder: YouTube ? ['youtube', 'html5'] : ['html5'],
    });

    const player = playerRef.current;
    if (player) {
      player.fill(true);
      player.volume(volume);

      player.on('volumechange', () => {
        const currentVolume = player.volume();
        dispatch(setVolume(currentVolume));
      });

      player.on('error', (e: any) => {
        console.error('Video player error:', e);
      });

      player.on('loadedmetadata', () => {
        if (!player.paused()) return;
        player.play()?.catch((err) => {
          console.warn('Play failed:', err);
        });
      });

      if (onEnded) {
        player.on('ended', onEnded);
      }
    }

    return () => {
      if (disposeTimeoutRef.current) {
        clearTimeout(disposeTimeoutRef.current);
        disposeTimeoutRef.current = null;
      }

      if (playerRef.current && !playerRef.current.isDisposed()) {
        try {
          try {
            playerRef.current.pause();
          } catch (err) {
            // ignore
          }

          disposeTimeoutRef.current = window.setTimeout(() => {
            try {
              playerRef.current && !playerRef.current.isDisposed() && playerRef.current.dispose();
            } catch (e) {
              console.warn('Error during Video.js dispose:', e);
            }
            playerRef.current = null;
            disposeTimeoutRef.current = null;
          }, 50) as unknown as number;
        } catch (e) {
          console.warn('Error during Video.js dispose scheduling:', e);
          try {
            playerRef.current.dispose();
          } catch (err) {
            // ignore
          }
          playerRef.current = null;
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  if (!src) return null;

  return (
    <div data-vjs-player>
      <video ref={videoRef} className="video-js vjs-default-skin" />
    </div>
  );
};

export default VideoPlayer;
