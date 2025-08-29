import React, { forwardRef, HTMLAttributes, MouseEventHandler, Ref, useMemo, useRef } from 'react';
import { To } from '../types.js';
import { noop, toLocation } from '../utils.js';
import { useHistory } from './useHistory.js';
import { createHoveredPrefetchTrigger, createVisiblePrefetchTrigger, usePrefetch } from '../usePrefetch.js';

/**
 * Props of the {@link Link} component.
 *
 * @group History
 */
export interface LinkProps extends Omit<HTMLAttributes<HTMLAnchorElement>, 'href'> {
  /**
   * A location or route to navigate to when link is clicked.
   */
  to: To | string;

  /**
   * Defines when the link prefetches a route that corresponds to a {@link to location}.
   *
   * <dl>
   * <dt>"never"</dt>
   * <dd>The route isn't prefetched.</dd>
   * <dt>"always"</dt>
   * <dd>The route is prefetched after the link is rendered.</dd>
   * <dt>"hovered"</dt>
   * <dd>The route is prefetched when a user hovers a pointer over a DOM element.</dd>
   * <dt>"visible"</dt>
   * <dd>The route is prefetched when a DOM element enters the viewport.</dd>
   * </dl>
   *
   * @default "never"
   */
  prefetch?: 'never' | 'always' | 'hovered' | 'visible';

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
export const Link = forwardRef<HTMLAnchorElement, LinkProps>((props, externalRef) => {
  const { to, prefetch = 'never', isReplace, onClick, children, ...otherProps } = props;

  const history = useHistory();
  const internalRef = useRef<HTMLAnchorElement>(null);

  const ref = useMemo<Ref<HTMLAnchorElement>>(() => {
    if (externalRef === null) {
      return internalRef;
    }

    return element => {
      internalRef.current = element;

      if (typeof externalRef === 'function') {
        externalRef(element);
      } else {
        externalRef.current = element;
      }
    };
  }, [externalRef]);

  const prefetchTrigger = useMemo(() => {
    if (prefetch === 'hovered') {
      return createHoveredPrefetchTrigger(internalRef);
    }
    if (prefetch === 'visible') {
      return createVisiblePrefetchTrigger(internalRef);
    }
    if (prefetch === 'never') {
      return noop;
    }
  }, [prefetch]);

  usePrefetch(typeof to === 'string' ? history.parseURL(to) : to, prefetchTrigger);

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

    if (isReplace) {
      history.replace(to);
    } else {
      history.push(to);
    }

    event.preventDefault();
  };

  return (
    <a
      {...otherProps}
      ref={ref}
      href={typeof to === 'string' ? to : history.toURL(toLocation(to))}
      onClick={handleClick}
    >
      {children}
    </a>
  );
});

/**
 * @internal
 */
Link.displayName = 'Link';
