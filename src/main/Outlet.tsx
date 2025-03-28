import React, {
  Component,
  ComponentType,
  createContext,
  FunctionComponent,
  memo,
  ReactNode,
  Suspense,
  useContext,
} from 'react';
import { createErrorState, RoutePresenter } from './RoutePresenter';
import { Router } from './__Router';
import { redirect } from './__redirect';
import { notFound } from './__notFound';
import { die } from './__utils';

const RoutePresenterContext = createContext<RoutePresenter | null>(null);

RoutePresenterContext.displayName = 'RoutePresenterContext';

export const RoutePresenterProvider = RoutePresenterContext.Provider;

const OutletContentContext = createContext<RoutePresenter | Router | null>(null);

OutletContentContext.displayName = 'OutletContentContext';

export const OutletContentProvider = OutletContentContext.Provider;

/**
 * Renders a presenter {@link RouterProvider provided by an enclosing router}.
 *
 * @group Components
 */
export const Outlet: FunctionComponent = memo(() => {
  const content = useContext(OutletContentContext);

  if (content instanceof RoutePresenter) {
    return <OutletErrorBoundary presenter={content} />;
  }

  if (content === null || content.notFoundComponent === undefined) {
    return null;
  }

  return (
    <RoutePresenterProvider value={null}>
      <OutletContentProvider value={null}>
        <OutletRenderBoundary component={content.notFoundComponent} />
      </OutletContentProvider>
    </RoutePresenterProvider>
  );
});

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

    const state = createErrorState(prevState.error);
    const prevStatus = nextProps.presenter.state.status;
    const nextStatus = state.status;

    if (nextStatus === prevStatus) {
      console.log('PROPAGATE ' + nextProps.presenter.route.pathnameTemplate.pattern);
      // Propagate error to the parent presenter
      throw prevState.error;
    }

    nextProps.presenter.setState(state);

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
  const { status } = presenter.state;

  if (status === 'ok') {
    return (
      <RoutePresenterProvider value={presenter}>
        <OutletContentProvider value={presenter.childPresenter}>
          <OutletRenderBoundary
            component={presenter.route.component || die(new Error("Route component wasn't loaded"))}
          />
        </OutletContentProvider>
      </RoutePresenterProvider>
    );
  }

  if (status === 'error' || status === 'not_found' || status === 'redirect') {
    let component;

    switch (status) {
      case 'error':
        component = presenter.errorComponent || die(presenter.state.error);
        break;

      case 'not_found':
        component = presenter.notFoundComponent || notFound();
        break;

      case 'redirect':
        component = presenter.loadingComponent || redirect(presenter.state.to);
        break;
    }

    return (
      <RoutePresenterProvider value={presenter}>
        <OutletContentProvider value={null}>
          <OutletRenderBoundary component={component} />
        </OutletContentProvider>
      </RoutePresenterProvider>
    );
  }

  if (status !== 'loading') {
    throw new Error('Unexpected route presenter status: ' + status);
  }

  if (presenter.loadingComponent === undefined || canSuspend) {
    throw presenter.pendingPromise || new Error('Loading route presenter must have a pending promise');
  }

  return (
    <RoutePresenterProvider value={presenter}>
      <OutletContentProvider value={null}>
        <OutletRenderBoundary component={presenter.loadingComponent} />
      </OutletContentProvider>
    </RoutePresenterProvider>
  );
}

OutletContent.displayName = 'OutletContent';

interface OutletRenderBoundaryProps {
  component: ComponentType;
}

/**
 * Renders a component and prevents its re-rendering.
 */
const OutletRenderBoundary = memo<OutletRenderBoundaryProps>(
  props => <props.component />,
  (prevProps, nextProps) => prevProps.component === nextProps.component
);

OutletRenderBoundary.displayName = 'OutletRenderBoundary';
