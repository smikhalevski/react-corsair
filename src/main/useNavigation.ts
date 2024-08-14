import { Navigation } from './createNavigation';
import { useInternalRouter } from './useInternalRouter';

/**
 * Returns a {@link Navigation} that controls an enclosing router.
 */
export function useNavigation(): Navigation {
  return useInternalRouter().navigation;
}
