import axios from 'axios';
import { StreamableVideoData, StreamableClipInfo } from '../models/streamable';

const getClip = async (id: string): Promise<StreamableClipInfo | undefined> => {
  try {
    const { data } = await axios.get(`https://api.streamable.com/videos/${id}`) as { data: StreamableVideoData };

    if (!data || data.status !== 2) {
      return undefined;
    }

    const mp4File = data.files?.mp4 || data.files?.['mp4-mobile'];
    if (!mp4File || mp4File.status !== 2) {
      return undefined;
    }

    return {
      id,
      title: data.title || `Streamable ${id}`,
      author: 'Streamable',
      thumbnailUrl: data.thumbnail_url,
      videoUrl: mp4File.url,
      duration: mp4File.duration,
      width: mp4File.width,
      height: mp4File.height,
    };
  } catch (error) {
    return undefined;
  }
};

const streamableApi = {
  getClip,
};

export default streamableApi;
