import { Group, Text } from '@mantine/core';
import { BrandTwitch } from 'tabler-icons-react';
import BrandButton from './BrandButton';

function MyCredits() {
  return (
    <Text color="dimmed" size="xs" weight={400}>
      <Group spacing={1}>
        <div>by</div>
        <BrandButton href="https://www.twitch.tv/SirMuffin9" icon={<BrandTwitch size={16} />}>
          SirMuffin9
        </BrandButton>
        <div>&</div>
        <BrandButton href="https://www.twitch.tv/EnjoyTheFun" icon={<BrandTwitch size={16} />}>
          <span style={{ color: '#89f5a0' }}>EnjoyTheFun</span>
        </BrandButton>
      </Group>
    </Text>
  );
}

export default MyCredits;
