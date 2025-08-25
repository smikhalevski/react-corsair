import React, { forwardRef, HTMLAttributes, MouseEventHandler, Ref, useMemo, useRef } from 'react';
import { To } from '../types.js';
import { noop, toLocation } from '../utils.js';
import { useHistory } from './useHistory.js';
import { createHoverTrigger, createIntersectionTrigger, PrefetchTrigger, usePrefetch } from '../usePrefetch.js';

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
   * If `true` then link prefetches a route {@link to location} and its data.
   *
   * @default "off"
   */
  prefetch?: 'instant' | 'hover' | 'visible' | 'off';

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
  const { to, prefetch = 'off', isReplace, onClick, children, ...anchorProps } = props;

  const history = useHistory();
  const internalRef = useRef<HTMLAnchorElement>(null);

  const prefetchTrigger = (useRef<PrefetchTrigger | undefined>(undefined).current ||=
    prefetch === 'instant'
      ? undefined
      : prefetch === 'hover'
        ? createHoverTrigger(internalRef)
        : prefetch === 'visible'
          ? createIntersectionTrigger(internalRef)
          : noop);

  usePrefetch(typeof to === 'string' ? history.parseURL(to) : to, prefetchTrigger);

  const ref = useMemo<Ref<HTMLAnchorElement>>(() => {
    if (externalRef === null) {
      return internalRef;
    }

    if (typeof externalRef === 'function') {
      return element => {
        internalRef.current = element;
        externalRef(element);
      };
    }

    return element => {
      internalRef.current = externalRef.current = element;
    };
  }, [externalRef]);

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
      {...anchorProps}
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
