export interface StreamableVideoFile {
  status: number;
  url: string;
  framerate: number;
  duration: number;
  width: number;
  height: number;
  bitrate: number;
  size: number;
}

export interface StreamableVideoData {
  status: number;
  percent: number;
  url: string;
  embed_code: string;
  message?: string;
  title?: string;
  thumbnail_url?: string;
  source?: string | null;
  audio_channels?: number;
  files?: {
    mp4?: StreamableVideoFile;
    'mp4-mobile'?: StreamableVideoFile;
    original?: Partial<StreamableVideoFile>;
    [key: string]: any;
  };
}

export interface StreamableClipInfo {
  id: string;
  title: string;
  author: string;
  thumbnailUrl?: string;
  videoUrl: string;
  duration: number;
  width: number;
  height: number;
}
