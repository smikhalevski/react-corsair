import { RefObject, useEffect, useRef } from 'react';
import { To } from './types.js';
import { useRouter } from './useRouter.js';
import { isEqualLocation } from './utils.js';

/**
 * A callback that triggers a location prefetch.
 *
 * @param prefetch A callback that start prefetch.
 * @returns An optional callback that destroys prefetch trigger.
 * @group Prefetching
 */
export type PrefetchTrigger = (prefetch: () => void) => (() => void) | void;

/**
 * Prefetches components and data of routes matched by a location after a component has mounted.
 *
 * @example
 * const productRoute = createRoute('/product/:sku');
 *
 * usePrefetch(productRoute.getLocation({ sku: 37 }));
 *
 * @param to A location or a route to prefetch.
 * @param prefetchTrigger A callback that triggers a location prefetch.
 * @see {@link Prefetch}
 * @group Prefetching
 */
export function usePrefetch(to: To, prefetchTrigger?: PrefetchTrigger): void {
  const toRef = useRef<To>(undefined);
  const router = useRouter();

  if (!isEqualLocation(toRef.current, to)) {
    toRef.current = to;
  }

  useEffect(() => {
    if (prefetchTrigger === undefined) {
      router.prefetch(to);
      return;
    }

    const destroyTrigger = prefetchTrigger(() => {
      router.prefetch(to);
      destroyTrigger?.();
    });

    return destroyTrigger;
  }, [router, toRef.current, prefetchTrigger]);
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

  /**
   * A callback that triggers a location prefetch.
   */
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

/**
 * Creates a trigger that start prefetching when an element is hovered.
 *
 * @param ref A ref to an element that must be hovered.
 * @group Prefetching
 */
export function createHoveredPrefetchTrigger(ref: RefObject<Element | null>): PrefetchTrigger {
  return prefetch => {
    const hoverListener: EventListener = event => {
      if (ref.current?.contains(event.target as Node)) {
        prefetch();
      }
    };

    document.addEventListener('mouseenter', hoverListener, { capture: true });

    return () => document.removeEventListener('mouseenter', hoverListener, { capture: true });
  };
}

const prefetchElements = new WeakMap<Element, () => void>();

let prefetchObserver: IntersectionObserver;

/**
 * Creates a trigger that start prefetching when an element is at least 50% visible on the screen.
 *
 * @param ref A ref to an element that must be visible.
 * @group Prefetching
 */
export function createVisiblePrefetchTrigger(ref: RefObject<Element | null>): PrefetchTrigger {
  return prefetch => {
    const element = ref.current;

    if (element === null || element === undefined) {
      return;
    }

    if (prefetchObserver === undefined) {
      prefetchObserver = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            prefetchElements.get(entry.target)!();
          }
        }
      });
    }

    prefetchElements.set(element, prefetch);
    prefetchObserver.observe(element);

    return () => {
      prefetchElements.delete(element);
      prefetchObserver.unobserve(element);
    };
  };
}
