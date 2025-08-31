import { Group, Text, Box } from '@mantine/core';
import { IconBrandGithub, IconExternalLink } from '@tabler/icons-react';
import BrandButton from './BrandButton';

const githubIcon = <IconBrandGithub size={16} />;
const externalIcon = <IconExternalLink size={16} />;

const MyCredits = () => {
  return (
    <Text color="dimmed" size="xs" weight={400} className="app-credits">
      <Group spacing={1} sx={{ flexWrap: 'nowrap', minWidth: 0 }}>
        <div>by</div>
        <BrandButton href="https://github.com/EnjoyTheFun" icon={githubIcon}>
          EnjoyTheFun
        </BrandButton>
        <Box className="credits-extended" sx={{ whiteSpace: 'nowrap' }}>
          • based on
        </Box>
        <Box className="credits-extended">
          <BrandButton href="https://jakemiki.me/twitch-clip-queue/" icon={externalIcon}>
            Clip Queue
          </BrandButton>
        </Box>
      </Group>
    </Text>
  );
};

MyCredits.displayName = 'MyCredits';

export default MyCredits;
