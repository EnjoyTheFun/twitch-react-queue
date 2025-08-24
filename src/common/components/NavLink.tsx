import { forwardRef } from 'react';
import { NavLink as NavLinkBase, NavLinkProps } from 'react-router-dom';

interface CustomNavLinkProps extends Omit<NavLinkProps, 'className' | 'type' | 'style'> {
  activeStyle?: NavLinkProps['style'];
}

const NavLink = forwardRef<HTMLAnchorElement, CustomNavLinkProps>(({ activeStyle, ...props }, ref) => (
  <NavLinkBase ref={ref} {...props} style={activeStyle} />
));

NavLink.displayName = 'NavLink';

export default NavLink;
