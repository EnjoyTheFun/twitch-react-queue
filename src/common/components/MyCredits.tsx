import { Group, Text } from '@mantine/core';
import { IconBrandGithub, IconBrandTwitch } from '@tabler/icons-react';
import BrandButton from './BrandButton';

const githubIcon = <IconBrandGithub size={16} />;
const twitchIcon = <IconBrandTwitch size={16} />;

const MyCredits = ({ persist = true }: { persist?: boolean }) => {
  const className = `app-credits${persist ? '' : ' navbar'}`;

  return (
    <Text size="xs" weight={500} className={className} sx={{ color: 'var(--mantine-color-dimmed)' }}>
      <Group spacing={0} sx={{ flexWrap: 'nowrap', minWidth: 0 }}>
        <span>by</span>
        <BrandButton href="https://twitch.tv/EnjoyTheFun" icon={twitchIcon} />
        <span aria-hidden="true" className="app-credits-separator">/</span>
        <BrandButton href="https://github.com/EnjoyTheFun" icon={githubIcon}>
          EnjoyTheFun
        </BrandButton>
      </Group>
    </Text>
  );
};

MyCredits.displayName = 'MyCredits';

export default MyCredits;
