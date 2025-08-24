import streamableApi from '../../../../common/apis/streamableApi';
import type { Clip } from '../../clipQueueSlice';
import type { ClipProvider } from '../providers';

class StreamableProvider implements ClipProvider {
  name = 'streamable';

  getIdFromUrl(url: string): string | undefined {
    return streamableApi.extractIdFromUrl(url) ?? undefined;
  }

  async getClipById(id: string): Promise<Clip | undefined> {
    const clipInfo = await streamableApi.getClip(id);

    return {
      id,
      title: clipInfo?.title ?? id,
      author: clipInfo?.author_name ?? 'Streamable',
      thumbnailUrl: clipInfo?.thumbnail_url,
      submitters: [],
      Platform: 'Streamable',
    };
  }

  getUrl(id: string): string | undefined {
    return `https://streamable.com/${id}`;
  }

  getEmbedUrl(id: string): string | undefined {
    return `https://streamable.com/o/${id}`;
  }

  async getAutoplayUrl(id: string): Promise<string | undefined> {
    return this.getUrl(id);
  }
}

const streamableProvider = new StreamableProvider();

export default streamableProvider;
