import { RefObject, useEffect, useRef } from 'react';
import { To } from './types.js';
import { useRouter } from './useRouter.js';
import { isEqualLocation, noop } from './utils.js';

export type PrefetchTrigger = (callback: () => void) => (() => void) | void;

/**
 * Prefetches components and data of routes matched by a location after a component has mounted.
 *
 * @example
 * const productRoute = createRoute('/product/:sku');
 *
 * usePrefetch(productRoute.getLocation({ sku: 37 }));
 *
 * @param to A location or a route to prefetch.
 * @param prefetchTrigger
 * @see {@link Prefetch}
 * @group Prefetching
 */
export function usePrefetch(to: To, prefetchTrigger?: PrefetchTrigger): void {
  const toRef = useRef<To>(undefined);
  const router = useRouter();

  useEffect(() => {
    if (isEqualLocation(toRef.current, to)) {
      return;
    }
    toRef.current = to;

    if (prefetchTrigger !== undefined) {
      return prefetchTrigger(() => router.prefetch(to));
    }

    router.prefetch(to);
  }, [router, to]);
}

/**
 * Props of the {@link Prefetch} component.
 *
 * @group Prefetching
 */
export interface PrefetchProps {
  /**
   * A location or a route to prefetch.
   */
  to: To;

  prefetchTrigger?: PrefetchTrigger;
}

/**
 * Prefetches components and data of routes matched by a location after a component has mounted.
 *
 * @see {@link usePrefetch}
 * @group Prefetching
 */
export function Prefetch(props: PrefetchProps): null {
  usePrefetch(props.to, props.prefetchTrigger);

  return null;
}

export function createHoverTrigger(ref: RefObject<Element | null>): PrefetchTrigger {
  return callback => {
    const hoverListener = (event: MouseEvent) => {
      if (ref.current?.contains(event.target as Node)) {
        unsubscribe();
        callback();
      }
    };

    const unsubscribe = () => window.removeEventListener('mouseenter', hoverListener);

    window.addEventListener('mouseenter', hoverListener);

    return unsubscribe;
  };
}

let callbacks = new WeakMap<Element, () => void>();
let observer: IntersectionObserver;

export function createIntersectionTrigger(ref: RefObject<Element | null>): PrefetchTrigger {
  return callback => {
    const element = ref.current;

    if (element === null) {
      return noop;
    }

    if (observer === undefined) {
      const observerCallback: IntersectionObserverCallback = entries => {
        for (let i = 0; i < entries.length; ++i) {
          const element = entries[i].target;
          const callback = callbacks.get(element);

          if (callback === undefined || !entries[i].isIntersecting) {
            continue;
          }

          unsubscribe();
          callback();
        }
      };

      observer = new IntersectionObserver(observerCallback, { threshold: 0 });
    }

    const unsubscribe = () => {
      callbacks.delete(element);
      observer.unobserve(element);
    };

    callbacks.set(element, callback);
    observer.observe(element);

    return unsubscribe;
  };
}
