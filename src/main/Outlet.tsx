import React, {
  Component,
  ComponentType,
  createContext,
  memo,
  ReactNode,
  Suspense,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import { createErrorState, RoutePresenter } from './RoutePresenter';
import { Router } from './Router';
import { redirect } from './redirect';
import { notFound } from './notFound';
import { Fallbacks } from './types';
import { RoutePresenterProvider } from './useRoutePresenter';
import { useRerender } from './useRerender';

const OutletContentContext = createContext<RoutePresenter | Router | null>(null);

OutletContentContext.displayName = 'OutletContentContext';

export const OutletContentProvider = OutletContentContext.Provider;

/**
 * Renders a presenter {@link RouterProvider provided by an enclosing router}.
 *
 * @group Components
 */
const OutletMemo = memo(Outlet, (_prevProps, _nextProps) => true);

export { OutletMemo as Outlet };

function Outlet(_props: {}): ReactNode {
  const content = useContext(OutletContentContext);
  const rerender = useRerender();

  useEffect(() => {
    if (content instanceof RoutePresenter) {
      return content.router.subscribe(rerender);
    }
  }, [content]);

  if (content instanceof RoutePresenter) {
    return <OutletErrorBoundary presenter={content} />;
  }

  if (content === null || content.notFoundComponent === undefined) {
    return null;
  }

  return (
    <RoutePresenterProvider value={null}>
      <OutletContentProvider value={null}>
        <OutletRendererMemo component={content.notFoundComponent} />
      </OutletContentProvider>
    </RoutePresenterProvider>
  );
}

Outlet.displayName = 'Outlet';

interface OutletErrorBoundaryProps {
  presenter: RoutePresenter;
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

    nextProps.presenter.setState(createErrorState(prevState.error));

    return { hasError: false, error: null };
  }

  render(): ReactNode {
    const { presenter } = this.props;

    return (
      <Suspense
        fallback={
          presenter.fallbackPresenter !== null ? (
            <OutletErrorBoundary presenter={presenter.fallbackPresenter} />
          ) : (
            <OutletContent
              presenter={presenter}
              canSuspend={false}
            />
          )
        }
      >
        <OutletContent
          presenter={presenter}
          canSuspend={true}
        />
      </Suspense>
    );
  }
}

interface OutletContentProps {
  presenter: RoutePresenter;
  canSuspend: boolean;
}

/**
 * Renders route presenter according to its status.
 */
function OutletContent(props: OutletContentProps): ReactNode {
  const { presenter, canSuspend } = props;
  const { route } = presenter;
  const { status } = presenter.state;

  const fallbacks: Fallbacks = presenter.parentPresenter === null ? presenter.router : route;

  let component;
  let childPresenter = null;

  switch (status) {
    case 'ok':
      component = route.component;
      childPresenter = presenter.childPresenter;

      if (component === undefined) {
        throw new Error("Route component wasn't loaded");
      }
      break;

    case 'error':
      component = route.errorComponent || fallbacks.errorComponent;

      if (component === undefined) {
        throw presenter.state.error;
      }
      break;

    case 'not_found':
      component = route.notFoundComponent || fallbacks.notFoundComponent || notFound();
      break;

    case 'redirect':
      component = route.loadingComponent || fallbacks.loadingComponent || redirect(presenter.state.to);
      break;

    case 'loading':
      component = route.loadingComponent || fallbacks.loadingComponent;

      if (component === undefined || canSuspend) {
        throw presenter.pendingPromise || new Error('Loading route presenter has no pending promise');
      }
      break;

    default:
      throw new Error('Unexpected route presenter status: ' + status);
  }

  return (
    <RoutePresenterProvider value={presenter}>
      <OutletContentProvider value={childPresenter}>
        <OutletRendererMemo component={component} />
      </OutletContentProvider>
    </RoutePresenterProvider>
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
