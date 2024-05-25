import { ComponentType, createContext, useContext } from 'react';
import { Router } from './Router';

const RouterContext = createContext<Router<ComponentType> | null>(null);

export const RouterProvider = RouterContext.Provider;

export function useRouter(): Router<ComponentType> {
  const router = useContext(RouterContext);

  if (router === null) {
    throw new Error('Expected a router to be provided');
  }
  return router;
}
