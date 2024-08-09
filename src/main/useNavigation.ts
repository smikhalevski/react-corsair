import { useContext } from 'react';
import { Navigation } from './createNavigation';
import { RouterContext } from './Router';

/**
 * Returns the navigation that controls the enclosing router.
 */
export function useNavigation(): Navigation {
  const router = useContext(RouterContext);

  if (router === null) {
    throw new Error('Cannot be used outside of a Router');
  }
  return router.navigation;
}
