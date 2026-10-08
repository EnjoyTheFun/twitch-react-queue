export type PreloadHandle = { cleanup: () => void };

export function preloadImage(url: string): PreloadHandle {
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
  return {
    cleanup: () => {
      try {
        img.src = '';
      } catch { /* ignore */ }
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
      } catch { /* ignore */ }
      try {
        video.removeAttribute('src');
      } catch { /* ignore */ }
      try {
        video.load();
      } catch { /* ignore */ }
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
      } catch { /* ignore */ }
      if (aborted) return;
    },
  };
}

export async function preloadGenericHead(url: string, signal?: AbortSignal): Promise<PreloadHandle> {
  const controller = new AbortController();
  const mergedSignal = signal ?? controller.signal;

  try {
    await fetch(url, { method: 'HEAD', mode: 'cors', signal: mergedSignal, cache: 'force-cache' });
  } catch { /* ignore */ }

  return {
    cleanup: () => {
      try {
        controller.abort();
      } catch { /* ignore */ }
    },
  };
}
