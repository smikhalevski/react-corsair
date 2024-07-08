import React, { HTMLAttributes, MouseEvent, ReactElement, useEffect } from 'react';
import { useNavigation } from './hooks';
import { LocationOptions, To } from './types';

/**
 * Props of the {@link Link} component.
 */
export interface LinkProps extends Omit<HTMLAttributes<HTMLAnchorElement>, 'href'>, LocationOptions {
  /**
   * A location or route to navigate to when link is clicked.
   */
  to: To;

  /**
   * When to prefetch a route and its data.
   *
   * <dl>
   *   <dt>"rendered"</dt>
   *   <dd>Prefetch when the link is rendered.</dd>
   *   <dt>"off"</dt>
   *   <dd>Prefetch is disabled.</dd>
   * </dl>
   *
   * @default "off"
   */
  prefetch?: 'rendered' | 'off';

  /**
   * Navigation action triggered by a link.
   */
  action?: 'push' | 'replace';
}

/**
 * Renders an `a` tag that trigger an enclosing router navigation when clicked.
 */
export function Link(props: LinkProps): ReactElement {
  const { to, prefetch, action } = props;

  const navigation = useNavigation();

  useEffect(() => {
    if (prefetch === 'rendered') {
      navigation.prefetch(to);
    }
  }, []);

  const handleClick = (event: MouseEvent) => {
    event.preventDefault();

    if (action === 'replace') {
      navigation.replace(to);
    } else {
      navigation.push(to);
    }
  };

  return (
    <a
      href="#"
      onClick={handleClick}
    />
  );
}
