import { Router } from './Router';
import { useRouterProvider } from './RouterProvider';

/**
 * Returns the router that handles navigation.
 */
export function useRouter(): Router {
  return useRouterProvider().router;
}
