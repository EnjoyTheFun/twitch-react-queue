import { useState } from 'react';
import { ActionIcon } from '@mantine/core';

type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
  size?: any;
  color?: string;
  variant?: any;
  className?: string;
  style?: React.CSSProperties;
  clearWhenIdle?: boolean;
};

export default function CircularButton({ children, onClick, title, size = 'lg', color, variant = 'filled', className, style, clearWhenIdle = false }: Props) {
  const [hover, setHover] = useState(false);
  const onMouseEnter = () => setHover(true);
  const onMouseLeave = () => setHover(false);

  const baseStyle: React.CSSProperties = {
    borderRadius: '50%',
    transition: 'opacity 160ms, transform 120ms',
    opacity: hover ? 1 : 0.25,
    transform: hover ? 'scale(1.02)' : 'none',
    pointerEvents: 'auto',
    ...style,
  };

  if (clearWhenIdle && !hover) {
    Object.assign(baseStyle, {
      backgroundColor: 'transparent',
      boxShadow: 'none',
      border: 'none',
    });
  }

  return (
    <ActionIcon
      size={size}
      variant={variant}
      color={color as any}
      title={title}
      onClick={onClick}
      style={baseStyle}
      className={className}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </ActionIcon>
  );
}
