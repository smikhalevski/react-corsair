import { createContext, useContext } from 'react';
import { Navigation } from './Navigation';

export const NavigationContext = createContext<Navigation | null>(null);

NavigationContext.displayName = 'NavigationContext';

/**
 * Returns the navigation that controls the enclosing router.
 */
export function useNavigation(): Navigation {
  const navigation = useContext(NavigationContext);

  if (navigation === null) {
    throw new Error('Forbidden outside of a Router');
  }
  return navigation;
}
