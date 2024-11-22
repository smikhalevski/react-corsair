import React, { forwardRef, HTMLAttributes, MouseEventHandler } from 'react';
import { To } from '../__types';
import { Prefetch } from '../__usePrefetch';
import { toLocation } from '../__utils';
import { useHistory } from './useHistory';

/**
 * Props of the {@link Link} component.
 *
 * @group Components
 */
export interface LinkProps extends Omit<HTMLAttributes<HTMLAnchorElement>, 'href'> {
  /**
   * A location or route to navigate to when link is clicked.
   */
  to: To;

  /**
   * If `true` then link prefetches a route {@link to location} and its data.
   *
   * @default false
   */
  prefetch?: boolean;

  /**
   * If `true` then link replaces the current history entry, otherwise link pushes an entry.
   *
   * @default false
   */
  replace?: boolean;
}

/**
 * Renders an `a` tag that triggers an enclosing history navigation when clicked. Prefetches routes that match
 * the provided location when mounted.
 *
 * @group Components
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
  const { to, prefetch, replace, onClick, children, ...anchorProps } = props;

  const history = useHistory();

  const handleClick: MouseEventHandler<HTMLAnchorElement> = event => {
    if (typeof onClick === 'function') {
      onClick(event);
    }

    if (
      event.isDefaultPrevented() ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.metaKey ||
      event.buttons !== 1 ||
      event.button !== 0
    ) {
      return;
    }

    event.preventDefault();

    if (replace) {
      history.replace(to);
    } else {
      history.push(to);
    }
  };

  return (
    <a
      {...anchorProps}
      ref={ref}
      href={history.toAbsoluteURL(toLocation(to))}
      onClick={handleClick}
    >
      {prefetch && <Prefetch to={to} />}
      {children}
    </a>
  );
});

/**
 * @internal
 */
Link.displayName = 'Link';
