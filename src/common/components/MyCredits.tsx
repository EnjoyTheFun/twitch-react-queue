import { Group, Text } from '@mantine/core';
import { BrandGithub } from 'tabler-icons-react';
import BrandButton from './BrandButton';

const githubIcon = <BrandGithub size={16} />;

const MyCredits = () => {
  return (
    <Text color="dimmed" size="xs" weight={400}>
      <Group spacing={1} sx={{ flexWrap: 'nowrap', minWidth: 0 }}>
        <div>by</div>
        <BrandButton href="https://github.com/JakeMiki" icon={githubIcon}>
          JakeMiki
        </BrandButton>
        <div>&</div>
        <BrandButton href="https://github.com/EnjoyTheFun" icon={githubIcon}>
          EnjoyTheFun
        </BrandButton>
      </Group>
    </Text>
  );
};

MyCredits.displayName = 'MyCredits';

export default MyCredits;
