import twitchApi from '../../../../common/apis/twitchApi';
import type { Clip } from '../../clipQueueSlice';
import type { ClipProvider } from '../providers';

class TwitchClipProvider implements ClipProvider {
  name = 'twitch-clip';
  getIdFromUrl(url: string): string | undefined {
    let uri: URL;
    try {
      uri = new URL(url);
    } catch {
      return undefined;
    }

    if (uri.hostname === 'clips.twitch.tv') {
      return this.extractIdFromPathname(uri.pathname);
    }

    if (uri.hostname.endsWith('twitch.tv')) {
      if (uri.pathname.includes('/clip/')) {
        return this.extractIdFromPathname(uri.pathname);
      }
    }

    return undefined;
  }

  async getClipById(id: string): Promise<Clip | undefined> {
    if (!id) {
      return undefined;
    }

    const clipInfo = await twitchApi.getClip(id);

    if (!clipInfo) {
      return undefined;
    }

    let gameName: string | undefined;
    try {
      if (clipInfo.game_id) {
        const game = await twitchApi.getGame(clipInfo.game_id);
        gameName = game?.name;
      }
    } catch { }

    return {
      id,
      author: clipInfo.broadcaster_name,
      title: clipInfo.title,
      submitters: [],
      thumbnailUrl: clipInfo.thumbnail_url?.replace('%{width}x%{height}', '480x272'),
      createdAt: clipInfo.created_at,
      duration: clipInfo.duration,
      views: clipInfo.view_count,
      Platform: 'Twitch',
      category: gameName,
      url: this.getUrl(id),
    };
  }

  getUrl(id: string): string | undefined {
    return `https://clips.twitch.tv/${id}`;
  }

  getEmbedUrl(id: string): string | undefined {
    return `https://clips.twitch.tv/embed?clip=${id}&parent=${window.location.hostname}&autoplay=true`;
  }

  async getAutoplayUrl(id: string): Promise<string | undefined> {
    return await twitchApi.getDirectUrl(id);
  }

  private extractIdFromPathname(pathname: string): string | undefined {
    const idStart = pathname.lastIndexOf('/');
    const id = pathname.slice(idStart).split('?')[0].slice(1);

    return id;
  }
}

const twitchClipProvider = new TwitchClipProvider();
export default twitchClipProvider;
