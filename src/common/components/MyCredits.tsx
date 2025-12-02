import { Group, Text } from '@mantine/core';
import { IconBrandGithub, IconBrandTwitch } from '@tabler/icons-react';
import BrandButton from './BrandButton';

const githubIcon = <IconBrandGithub size={16} />;
const twitchIcon = <IconBrandTwitch size={16} />;

const MyCredits = ({ persist = true }: { persist?: boolean }) => {
  const className = `app-credits${persist ? '' : ' navbar'}`;

  return (
    <Text color="dimmed" size="xs" weight={400} className={className}>
      <Group spacing={1} sx={{ flexWrap: 'nowrap', minWidth: 0 }}>
        <div>by</div>
        <BrandButton href="https://twitch.tv/EnjoyTheFun" icon={twitchIcon}>
          /
        </BrandButton>
        <BrandButton href="https://github.com/EnjoyTheFun" icon={githubIcon}>
          EnjoyTheFun
        </BrandButton>
      </Group>
    </Text>
  );
};

MyCredits.displayName = 'MyCredits';

export default MyCredits;
