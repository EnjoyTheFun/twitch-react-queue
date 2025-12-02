import { ActionIcon, PolymorphicComponentProps, useMantineColorScheme } from '@mantine/core';
import { PropsWithChildren } from 'react';
import { IconSun, IconMoonStars } from '@tabler/icons-react';

const LightModeIcon = IconSun;
const DarkModeIcon = IconMoonStars;

const ColorSchemeSwitch = ({
  component = ActionIcon,
  children,
  ...props
}: PropsWithChildren<PolymorphicComponentProps<any>>) => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  const isDark = colorScheme === 'dark';
  const ModeIcon = isDark ? LightModeIcon : DarkModeIcon;
  const ariaLabel = `Switch to ${isDark ? 'light' : 'dark'} mode`;

  const handleToggle = () => {
    toggleColorScheme();
  };

  const Component = component;

  return (
    <Component
      {...props}
      onClick={handleToggle}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      {children ?? <ModeIcon />}
    </Component>
  );
};

ColorSchemeSwitch.displayName = 'ColorSchemeSwitch';

export default ColorSchemeSwitch;
