import { IconBrandTwitch, IconBrandKick, IconBrandYoutube, IconBrandInstagram, IconBrandTiktok, IconBrandX, IconBrandReddit } from '@tabler/icons-react';
import type { PlatformType } from '../utils';

interface BrandPlatformsProps {
  platform: PlatformType;
  size?: number;
}

const iconComponents = {
  Twitch: IconBrandTwitch,
  Kick: IconBrandKick,
  YouTube: IconBrandYoutube,
  TikTok: IconBrandTiktok,
  Instagram: IconBrandInstagram,
  Twitter: IconBrandX,
  Reddit: IconBrandReddit,
  Streamable: null,
} as const;

const Platform = ({ platform, size = 15 }: BrandPlatformsProps) => {
  const IconComponent = platform ? iconComponents[platform] : null;
  return IconComponent ? <IconComponent size={size} /> : null;
};

Platform.displayName = 'Platform';

export default Platform;
