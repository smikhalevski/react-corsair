import isDeepEqual from 'fast-deep-equal';
import { useEffect, useRef } from 'react';
import { To } from './__types';
import { useRouter } from './__useRouter';

/**
 * Prefetches components and data of routes matched by a location after a component has mounted.
 *
 * @param to A location or a route to prefetch.
 * @see {@link Prefetch}
 * @group Hooks
 * @example
 * const userRoute = createRoute('/userRoute/:userId');
 *
 * usePrefetch(userRoute.getLocation({ userId: 37 }));
 */
export function usePrefetch(to: To): void {
  const toRef = useRef<To>();
  const router = useRouter();

  useEffect(() => {
    if (isDeepEqual(toRef.current, to)) {
      return;
    }
    toRef.current = to;
    router.prefetch(to);
  }, [router, to]);
}

/**
 * Props of the {@link Prefetch} component.
 *
 * @group Components
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
 * @group Components
 */
export function Prefetch(props: PrefetchProps): null {
  usePrefetch(props.to);
  return null;
}
