export interface TikTokOEmbedResponse {
  author_name?: string;
  author_url?: string;
  html?: string;
  title?: string;
  thumbnail_url?: string;
  provider_name?: string;
  provider_url?: string;
  version?: string;
  embed_product_id?: string;
  author_url_name?: string;
}

export interface TikwmResponse {
  code: number;
  msg?: string;
  data?: {
    id?: string;
    title?: string;
    cover?: string;
    origin_cover?: string;
    author?: {
      unique_id?: string;
      nickname?: string;
    };
  };
}

export default TikTokOEmbedResponse;
