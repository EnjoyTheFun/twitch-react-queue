export interface OEmbedBaseResponse {
  type: string;
  version: string;
  title?: string;
  author_name?: string;
  author_url?: string;
  provider_name?: string;
  provider_url?: string;
  cache_age?: number;
  thumbnail_url?: string;
  thumbnail_width?: number;
  thumbnail_height?: number;
}

export interface OEmbedVideoResponse extends OEmbedBaseResponse {
  type: 'video';
  html: string;
  width: number;
  height: number;
}

export interface OEmbedPhotoResponse extends OEmbedBaseResponse {
  type: 'photo';
  url: string;
  width: number;
  height: number;
}

export interface OEmbedRichResponse extends OEmbedBaseResponse {
  type: 'rich';
  html: string;
  width: number;
  height: number;
}

export interface OEmbedLinkResponse extends OEmbedBaseResponse {
  type: 'link';
}

export type OEmbedResponse =
  | OEmbedVideoResponse
  | OEmbedPhotoResponse
  | OEmbedRichResponse
  | OEmbedLinkResponse;

export const isVideoResponse = (response: OEmbedResponse): response is OEmbedVideoResponse => {
  return response.type === 'video';
};

export const isPhotoResponse = (response: OEmbedResponse): response is OEmbedPhotoResponse => {
  return response.type === 'photo';
};

export const isRichResponse = (response: OEmbedResponse): response is OEmbedRichResponse => {
  return response.type === 'rich';
};

export const isLinkResponse = (response: OEmbedResponse): response is OEmbedLinkResponse => {
  return response.type === 'link';
};

export const validateOEmbedResponse = (data: any): data is OEmbedResponse => {
  if (!data || typeof data !== 'object') return false;
  if (!data.type || !data.version) return false;

  const validTypes = ['video', 'photo', 'rich', 'link'];
  if (!validTypes.includes(data.type)) return false;

  if (data.type === 'video' || data.type === 'rich') {
    return typeof data.html === 'string' &&
           typeof data.width === 'number' &&
           typeof data.height === 'number';
  }

  if (data.type === 'photo') {
    return typeof data.url === 'string' &&
           typeof data.width === 'number' &&
           typeof data.height === 'number';
  }

  return true;
};

export const createSafeOEmbedResponse = (
  type: 'video' | 'photo' | 'rich' | 'link',
  overrides: Partial<OEmbedResponse> = {}
): OEmbedResponse => {
  const base: OEmbedBaseResponse = {
    type,
    version: '1.0',
    ...overrides,
  };

  switch (type) {
    case 'video':
    case 'rich':
      return {
        ...base,
        type,
        html: '',
        width: 640,
        height: 360,
        ...overrides,
      } as OEmbedVideoResponse | OEmbedRichResponse;

    case 'photo':
      return {
        ...base,
        type,
        url: '',
        width: 640,
        height: 360,
        ...overrides,
      } as OEmbedPhotoResponse;

    default:
      return {
        ...base,
        type: 'link',
        ...overrides,
      } as OEmbedLinkResponse;
  }
};
