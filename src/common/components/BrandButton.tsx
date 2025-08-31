import { useMantineColorScheme, Button } from '@mantine/core';
import { PropsWithChildren, ReactElement } from 'react';

interface BrandButtonProps {
  icon: ReactElement;
  href: string;
}

const BrandButton = ({ children, icon, href }: PropsWithChildren<BrandButtonProps>) => {
  const { colorScheme } = useMantineColorScheme();

  const buttonColor = colorScheme === 'dark' ? 'gray' : 'dark';

  return (
    <Button
      component="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      variant="subtle"
      color={buttonColor}
      compact
      size="xs"
      leftIcon={icon}
      styles={{
        root: {
          paddingLeft: 1,
          paddingRight: 1,
        },
        leftIcon: {
          marginRight: 2,
        },
      }}
    >
      {children}
    </Button>
  );
};

BrandButton.displayName = 'BrandButton';

export default BrandButton;
