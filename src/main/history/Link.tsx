import React, { forwardRef, HTMLAttributes, MouseEventHandler, useContext, useEffect } from 'react';
import { useRouter } from '../RouterProvider';
import { To } from '../types';
import { toLocation } from '../utils';
import { HistoryContext } from './useHistory';

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
 * Renders an `a` tag that triggers an enclosing router navigation when clicked.
 *
 * If there's no enclosing {@link HistoryProvider} the {@link Link} component renders `#`
 * as an {@link !HTMLAnchorElement.href a.href}.
 *
 * @group Components
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
  const { to, prefetch, replace, onClick, ...anchorProps } = props;

  const router = useRouter();
  const history = useContext(HistoryContext);

  useEffect(() => {
    if (prefetch) {
      router.prefetch(to);
    }
  }, []);

  const handleClick: MouseEventHandler<HTMLAnchorElement> = event => {
    if (typeof onClick === 'function') {
      onClick(event);
    }

    if (
      history === null ||
      event.isDefaultPrevented() ||
      event.getModifierState('Alt') ||
      event.getModifierState('Control') ||
      event.getModifierState('Shift') ||
      event.getModifierState('Meta')
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
      href={history === null ? '#' : history.toAbsoluteURL(toLocation(to))}
      onClick={handleClick}
    />
  );
});

/**
 * @internal
 */
Link.displayName = 'Link';
