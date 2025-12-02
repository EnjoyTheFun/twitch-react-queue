export type PreloadHandle = { cleanup: () => void };

export function preloadImage(url: string): PreloadHandle {
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
  return {
    cleanup: () => {
      try {
        img.src = '';
      } catch { }
    },
  };
}

export function preloadVideo(url: string): PreloadHandle {
  const video = document.createElement('video');

  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  video.src = url;

  return {
    cleanup: () => {
      try {
        video.pause();
      } catch { }
      try {
        video.removeAttribute('src');
      } catch { }
      try {
        video.load();
      } catch { }
    },
  };
}

export async function preloadHlsManifest(url: string, signal?: AbortSignal): Promise<PreloadHandle> {
  const controller = new AbortController();
  const mergedSignal = signal ?? controller.signal;

  let aborted = false;

  try {
    await fetch(url, { method: 'GET', mode: 'cors', signal: mergedSignal, cache: 'force-cache' });
  } catch {
    aborted = true;
  }

  return {
    cleanup: () => {
      try {
        controller.abort();
      } catch { }
      if (aborted) return;
    },
  };
}

export async function preloadGenericHead(url: string, signal?: AbortSignal): Promise<PreloadHandle> {
  const controller = new AbortController();
  const mergedSignal = signal ?? controller.signal;

  try {
    await fetch(url, { method: 'HEAD', mode: 'cors', signal: mergedSignal, cache: 'force-cache' });
  } catch { }

  return {
    cleanup: () => {
      try {
        controller.abort();
      } catch { }
    },
  };
}
