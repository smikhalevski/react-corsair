import React, { forwardRef, HTMLAttributes, MouseEventHandler, Ref, useEffect, useMemo, useRef, useState } from 'react';
import { To } from '../types.js';
import { toLocation } from '../utils.js';
import { useHistory } from './useHistory.js';
import { Prefetch } from '../usePrefetch.js';

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
  prefetch?: 'render' | 'hover' | 'visible' | 'off';

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
  const { to, prefetch, isReplace, onClick, onMouseEnter, children, ...anchorProps } = props;

  const [isPrefetched, setPrefetched] = useState(prefetch === 'render');

  const history = useHistory();
  const internalRef = useRef<HTMLAnchorElement>(null);

  const ref = useMemo<Ref<HTMLAnchorElement>>(() => {
    if (prefetch !== 'visible') {
      return externalRef;
    }

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
  }, [prefetch, externalRef]);

  useEffect(() => {
    if (internalRef.current !== null) {
      return observePrefetch(internalRef.current, setPrefetched);
    }
  }, [prefetch]);

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

  const handleMouseEnter: MouseEventHandler<HTMLAnchorElement> = event => {
    if (typeof onMouseEnter === 'function') {
      onMouseEnter(event);
    }

    if (event.isDefaultPrevented()) {
      return;
    }

    if (prefetch === 'hover') {
      setPrefetched(true);
    }
  };

  return (
    <a
      {...anchorProps}
      ref={ref}
      href={typeof to === 'string' ? to : history.toURL(toLocation(to))}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
    >
      {isPrefetched && <Prefetch to={typeof to === 'string' ? history.parseURL(to) : to} />}
      {children}
    </a>
  );
});

/**
 * @internal
 */
Link.displayName = 'Link';

let elements = new WeakMap<Element, (isPrefetched: boolean) => void>();
let observer: IntersectionObserver;

function observePrefetch(element: HTMLAnchorElement, setPrefetched: (isPrefetched: boolean) => void): () => void {
  if (observer === undefined) {
    const observerCallback: IntersectionObserverCallback = entries => {
      for (let i = 0; i < entries.length; ++i) {
        const element = entries[i].target;
        const setPrefetched = elements.get(element);

        if (setPrefetched === undefined || !entries[i].isIntersecting) {
          continue;
        }

        elements.delete(element);
        setPrefetched(true);
      }
    };

    observer = new IntersectionObserver(observerCallback, { threshold: 0 });
  }

  elements.set(element, setPrefetched);
  observer.observe(element);

  return () => {
    elements.delete(element);
    observer.unobserve(element);
  };
}
