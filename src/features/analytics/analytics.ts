import { createLogger } from '../../common/logging';

const logger = createLogger('Umami Event');

export function trace(value: string, type = 'custom') {
  const umami = (window as Window & {
    umami?: {
      trackView?: (path: string) => void;
      trackEvent?: (event: string, eventType: string) => void;
    };
  }).umami;
  logger.debug(`${type}: ${value}`);

  try {
    if (!umami) return;

    if (type === 'view') {
      if (typeof umami.trackView !== 'function') {
        // logger.warn('Umami view tracking is unavailable.');
        return;
      }
      umami.trackView(`${import.meta.env.VITE_BASEPATH}${value}`);
    } else {
      if (typeof umami.trackEvent !== 'function') {
        // logger.warn('Umami event tracking is unavailable.');
        return;
      }
      umami.trackEvent(value, type);
    }
  } catch {
    // logger.warn('Failed to send analytics event.', error);
  }
}
