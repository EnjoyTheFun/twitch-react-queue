import { IconBrandTwitch, IconBrandKick, IconBrandYoutube, IconBrandInstagram, IconBrandTiktok, IconBrandX } from '@tabler/icons-react';
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
  SOOP: null,
  Streamable: null,
} as const;

const Platform = ({ platform, size = 15 }: BrandPlatformsProps) => {
  if (!platform || !iconComponents[platform]) {
    return null;
  }

  const IconComponent = iconComponents[platform];

  if (!IconComponent) return null;

  return <IconComponent size={size} />;
};

Platform.displayName = 'Platform';

export default Platform;
