import React, {
  Component,
  ComponentType,
  createContext,
  memo,
  ReactNode,
  Suspense,
  useContext,
  useEffect,
} from 'react';
import { RouteController } from './RouteController';
import { Router } from './Router';
import { redirect } from './redirect';
import { notFound } from './notFound';
import { Fallbacks } from './types';
import { RouteControllerProvider } from './useRoute';
import { useRerender } from './useRerender';

const OutletContext = createContext<RouteController | Router | null>(null);

OutletContext.displayName = 'OutletContext';

export const OutletProvider = OutletContext.Provider;

/**
 * Renders a controller {@link RouterProvider provided by an enclosing router}.
 *
 * @group Components
 */
const OutletMemo = memo(Outlet, (_prevProps, _nextProps) => true);

export { OutletMemo as Outlet };

function Outlet(_props: {}): ReactNode {
  const content = useContext(OutletContext);
  const rerender = useRerender();

  useEffect(() => {
    if (content instanceof RouteController) {
      return content.router.subscribe(rerender);
    }
  }, [content]);

  if (content instanceof RouteController) {
    return <OutletErrorBoundary controller={content} />;
  }

  if (content === null || content.notFoundComponent === undefined) {
    return null;
  }

  return (
    <RouteControllerProvider value={null}>
      <OutletProvider value={null}>
        <OutletRendererMemo component={content.notFoundComponent} />
      </OutletProvider>
    </RouteControllerProvider>
  );
}

Outlet.displayName = 'Outlet';

interface OutletErrorBoundaryProps {
  controller: RouteController;
}

interface OutletErrorBoundaryState {
  hasError: boolean;
  error: unknown;
}

class OutletErrorBoundary extends Component<OutletErrorBoundaryProps, OutletErrorBoundaryState> {
  static displayName = 'OutletErrorBoundary';

  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: unknown): Partial<OutletErrorBoundaryState> | null {
    return { hasError: true, error };
  }

  static getDerivedStateFromProps(
    nextProps: Readonly<OutletErrorBoundaryProps>,
    prevState: OutletErrorBoundaryState
  ): Partial<OutletErrorBoundaryState> | null {
    if (!prevState.hasError) {
      return null;
    }

    nextProps.controller.setError(prevState.error);

    return { hasError: false, error: null };
  }

  render(): ReactNode {
    const { controller } = this.props;

    return (
      <Suspense
        fallback={
          controller.fallbackController !== null ? (
            <OutletErrorBoundary controller={controller.fallbackController} />
          ) : (
            <OutletContent
              controller={controller}
              canSuspend={false}
            />
          )
        }
      >
        <OutletContent
          controller={controller}
          canSuspend={true}
        />
      </Suspense>
    );
  }
}

interface OutletContentProps {
  controller: RouteController;
  canSuspend: boolean;
}

/**
 * Renders controller according to its status.
 */
function OutletContent(props: OutletContentProps): ReactNode {
  const { controller, canSuspend } = props;
  const { route } = controller;
  const { status } = controller.state;

  const fallbacks: Fallbacks = controller.parentController === null ? controller.router : route;

  let component;
  let childController = null;

  switch (status) {
    case 'ok':
      component = route.component;
      childController = controller.childController;

      if (component === undefined) {
        throw new Error("Route component wasn't loaded");
      }
      break;

    case 'error':
      component = route.errorComponent || fallbacks.errorComponent;

      if (component === undefined) {
        throw controller.state.error;
      }
      break;

    case 'not_found':
      component = route.notFoundComponent || fallbacks.notFoundComponent || notFound();
      break;

    case 'redirect':
      component = route.loadingComponent || fallbacks.loadingComponent || redirect(controller.state.to);
      break;

    case 'loading':
      component = route.loadingComponent || fallbacks.loadingComponent;

      if (component === undefined || canSuspend) {
        throw controller.promise || new Error('Loading controller has no promise');
      }
      break;

    default:
      throw new Error('Unexpected controller status: ' + status);
  }

  return (
    <RouteControllerProvider value={controller}>
      <OutletProvider value={childController}>
        <OutletRendererMemo component={component} />
      </OutletProvider>
    </RouteControllerProvider>
  );
}

OutletContent.displayName = 'OutletContent';

interface OutletRendererProps {
  component: ComponentType;
}

/**
 * Renders a component and prevents its re-rendering.
 */
const OutletRendererMemo = memo(OutletRenderer, (prevProps, nextProps) => prevProps.component === nextProps.component);

function OutletRenderer(props: OutletRendererProps): ReactNode {
  return <props.component />;
}

OutletRenderer.displayName = 'OutletRenderer';
