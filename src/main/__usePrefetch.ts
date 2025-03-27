import isDeepEqual from 'fast-deep-equal';
import { useEffect, useRef } from 'react';
import { To } from './__types';
import { useRouter } from './__useRouter';
import { Route } from './__Route';

/**
 * Prefetches components and data of routes matched by a location after a component has mounted.
 *
 * @param to A location or a route to prefetch.
 * @see {@link Prefetch}
 * @group Hooks
 * @example
 * const productRoute = createRoute('/product/:sku');
 *
 * usePrefetch(productRoute.getLocation({ sku: 37 }));
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
