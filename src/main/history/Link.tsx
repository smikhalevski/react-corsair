import React, { forwardRef, HTMLAttributes, MouseEventHandler } from 'react';
import { To } from '../types';
import { toLocation } from '../utils';
import { Prefetch } from '../Prefetch';
import { useHistory } from './useHistory';

/**
 * Props of the {@link Link} component.
 *
 * @group History
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
  isPrefetched?: boolean;

  /**
   * If `true` then link replaces the current history entry, otherwise link pushes an entry.
   *
   * @default false
   */
  isReplace?: boolean;
}

/**
 * Renders an `a` tag that triggers an enclosing history navigation when clicked. Prefetches routes that match
 * the provided location when mounted.
 *
 * @group History
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
  const { to, isPrefetched, isReplace, onClick, children, ...anchorProps } = props;

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
      event.button !== 0
    ) {
      return;
    }

    event.preventDefault();

    if (isReplace) {
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
      {isPrefetched && <Prefetch to={to} />}
      {children}
    </a>
  );
});

/**
 * @internal
 */
Link.displayName = 'Link';
