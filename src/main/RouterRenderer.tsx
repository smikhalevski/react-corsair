import { type ComponentType, createElement, type ReactElement, type ReactNode, useEffect, useReducer } from 'react';
import { Router } from './Router';
import { RouterProvider } from './useRouter';

export interface RouterRendererProps {
  router: Router<ComponentType>;
  fallback?: { notFound?: ReactNode; pending?: ReactNode };
}

export function RouterRenderer(props: RouterRendererProps): ReactElement {
  const { router, fallback } = props;
  const [, rerender] = useReducer(reduceCount, 0);

  useEffect(() => router.subscribe(rerender), []);

  return (
    <RouterProvider value={router}>
      {router.isPending
        ? fallback?.pending
        : router.result === undefined
          ? fallback?.notFound
          : createElement(router.result)}
    </RouterProvider>
  );
}

function reduceCount(count: number): number {
  return count + 1;
}
