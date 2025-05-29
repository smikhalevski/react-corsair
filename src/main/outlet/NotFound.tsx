import React, { ReactNode, Suspense } from 'react';
import { ErrorBoundary } from '../ErrorBoundary.js';
import { Router } from '../Router.js';

import { createMemoElement } from './utils.js';
import { useRouter } from '../useRouter.js';

/**
 * Renders the {@link Router.notFoundComponent}. Only appears in the topmost {@link Outlet} if there's no matched route.
 *
 * @internal
 */
export function NotFound(): ReactNode {
  const router = useRouter();

  if (router.notFoundComponent === undefined) {
    return null;
  }

  let children = createMemoElement(router.notFoundComponent);

  if (router.loadingComponent !== undefined) {
    children = <Suspense fallback={createMemoElement(router.loadingComponent)}>{children}</Suspense>;
  }

  if (router.errorComponent !== undefined) {
    children = <ErrorBoundary fallback={createMemoElement(router.errorComponent)}>{children}</ErrorBoundary>;
  }

  return children;
}

NotFound.displayName = 'NotFound';
