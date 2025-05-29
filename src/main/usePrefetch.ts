import { useEffect, useRef } from 'react';
import { To } from './types.js';
import { useRouter } from './useRouter.js';
import { isEqualLocation } from './utils.js';

/**
 * Prefetches components and data of routes matched by a location after a component has mounted.
 *
 * @example
 * const productRoute = createRoute('/product/:sku');
 *
 * usePrefetch(productRoute.getLocation({ sku: 37 }));
 *
 * @param to A location or a route to prefetch.
 * @see {@link Prefetch}
 * @group Prefetching
 */
export function usePrefetch(to: To): void {
  const toRef = useRef<To>();
  const router = useRouter();

  useEffect(() => {
    if (isEqualLocation(toRef.current, to)) {
      return;
    }
    toRef.current = to;
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
}

/**
 * Prefetches components and data of routes matched by a location after a component has mounted.
 *
 * @see {@link usePrefetch}
 * @group Prefetching
 */
export function Prefetch(props: PrefetchProps): null {
  usePrefetch(props.to);

  return null;
}
