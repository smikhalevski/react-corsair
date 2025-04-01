import isDeepEqual from 'fast-deep-equal';
import { useEffect, useRef } from 'react';
import { To } from './types';
import { Route } from './Route';
import { useRouter } from './useRouter';

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
 * @group Hooks
 */
export function usePrefetch(to: To): void {
  const toRef = useRef<To>();
  const router = useRouter();

  useEffect(() => {
    if (toRef.current instanceof Route && to instanceof Route ? toRef.current === to : isDeepEqual(toRef.current, to)) {
      return;
    }
    toRef.current = to;
    router.prefetch(to);
  }, [router, to]);
}
