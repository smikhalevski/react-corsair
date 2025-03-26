import { To } from './types';
import { usePrefetch } from './usePrefetch';

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
