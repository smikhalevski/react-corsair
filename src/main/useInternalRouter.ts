import { createContext, useContext } from 'react';
import { InternalRouter } from './InternalRouter';

export const InternalRouterContext = createContext<InternalRouter | null>(null);

InternalRouterContext.displayName = 'InternalRouterContext';

/**
 * Provides an enclosing {@link InternalRouter} instance.
 */
export function useInternalRouter(): InternalRouter {
  const router = useContext(InternalRouterContext);

  if (router === null) {
    throw new Error('Cannot be used outside of a Router');
  }
  return router;
}
