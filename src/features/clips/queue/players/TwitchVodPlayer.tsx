import { useEffect, useRef } from 'react';

interface TwitchPlayerInstance {
  addEventListener: (event: string, listener: () => void) => void;
  removeEventListener: (event: string, listener: () => void) => void;
}

interface TwitchPlayerOptions {
  video: string;
  width: string;
  height: string;
  autoplay: boolean;
  parent: string[];
  time?: string;
}

interface TwitchPlayerConstructor {
  new (target: string, options: TwitchPlayerOptions): TwitchPlayerInstance;
}

interface TwitchPlayerApi {
  Player: TwitchPlayerConstructor;
}

declare global {
  interface Window {
    Twitch?: TwitchPlayerApi;
  }
}

let twitchApiPromise: Promise<TwitchPlayerApi> | undefined;

function loadTwitchPlayerApi(): Promise<TwitchPlayerApi> {
  if (window.Twitch?.Player) return Promise.resolve(window.Twitch);
  if (twitchApiPromise) return twitchApiPromise;

  const promise = new Promise<TwitchPlayerApi>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://player.twitch.tv/js/embed/v1.js';
    script.async = true;
    script.onload = () => {
      if (window.Twitch?.Player) {
        resolve(window.Twitch);
      } else {
        reject(new Error('Twitch Player API loaded without exposing Twitch.Player'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Twitch Player API'));
    document.head.appendChild(script);
  }).catch((error: unknown) => {
    twitchApiPromise = undefined;
    throw error;
  });
  twitchApiPromise = promise;
  return promise;
}

interface TwitchVodPlayerProps {
  src: string;
  onEnded?: () => void;
}

function TwitchVodPlayer({ src, onEnded }: TwitchVodPlayerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onEndedRef = useRef(onEnded);
  const playerIdRef = useRef(`twitch-vod-player-${Math.random().toString(36).slice(2)}`);

  onEndedRef.current = onEnded;

  useEffect(() => {
    let disposed = false;
    let player: TwitchPlayerInstance | undefined;
    const container = containerRef.current;
    const handleEnded = () => onEndedRef.current?.();
    const embedUrl = new URL(src);
    const video = embedUrl.searchParams.get('video');
    const parent = embedUrl.searchParams.get('parent');
    const time = embedUrl.searchParams.get('time') || undefined;

    if (!video || !parent || !container) {
      console.error('Invalid Twitch VOD embed URL', src);
      return;
    }

    loadTwitchPlayerApi()
      .then(({ Player }) => {
        if (disposed || !container) return;

        player = new Player(playerIdRef.current, {
          video,
          width: '100%',
          height: '100%',
          autoplay: true,
          parent: [parent],
          time,
        });
        if (onEndedRef.current) {
          player.addEventListener('ended', handleEnded);
        }
      })
      .catch((error: unknown) => {
        if (!disposed) console.error('Unable to initialize Twitch VOD player', error);
      });

    return () => {
      disposed = true;
      player?.removeEventListener('ended', handleEnded);
      container.replaceChildren();
    };
  }, [src]);

  return <div id={playerIdRef.current} ref={containerRef} style={{ height: '100%', width: '100%' }} />;
}

export default TwitchVodPlayer;
