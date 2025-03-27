import React, {
  ComponentType,
  createContext,
  FunctionComponent,
  memo,
  ReactElement,
  Suspense,
  useContext,
} from 'react';
import { RoutePresenter } from './RoutePresenter';
import { OutletErrorBoundary } from './__OutletErrorBoundary';
import { Router } from './__Router';
import { notFound } from './__notFound';

const PresenterContext = createContext<RoutePresenter | null>(null);

PresenterContext.displayName = 'PresenterContext';

export const PresenterProvider = PresenterContext.Provider;

const OutletContext = createContext<RoutePresenter | Router | null>(null);

OutletContext.displayName = 'OutletContext';

export const OutletProvider = OutletContext.Provider;

/**
 * Renders presenter {@link RouterProvider provided by an enclosing router}.
 *
 * @group Components
 */
export const Outlet: FunctionComponent = memo(
  () => {
    const presenter = useContext(OutletContext);

    if (presenter === null) {
      // Nothing to render
      return null;
    }

    if (presenter instanceof Router) {
      // No route was matched
      const component = presenter.notFoundComponent;

      if (component === undefined) {
        return null;
      }

      return (
        <PresenterProvider value={null}>
          <OutletProvider value={null}>
            <RenderBoundary component={component} />
          </OutletProvider>
        </PresenterProvider>
      );
    }

    const { status } = presenter.state;

    if (status === 'error' || status === 'not_found' || status === 'redirect') {
      return (
        <RouteContent
          presenter={presenter}
          canSuspend={false}
        />
      );
    }

    return (
      <Suspense
        fallback={
          <RouteContent
            presenter={presenter.fallbackPresenter || presenter}
            canSuspend={false}
          />
        }
      >
        <RouteContent
          presenter={presenter}
          canSuspend={true}
        />
      </Suspense>
    );
  },
  (_prevProps, _nextProps) => true
);

Outlet.displayName = 'Outlet';

interface RouteContentProps {
  presenter: RoutePresenter;
  canSuspend: boolean;
}

function RouteContent(props: RouteContentProps): ReactElement | null {
  const { presenter, canSuspend } = props;
  const { route } = presenter;

  const fallbacks = presenter.parentPresenter === null ? presenter.router : route;

  let component;

  switch (presenter.state.status) {
    case 'ok':
      component = route.component;

      if (component === undefined) {
        return null;
      }

      return (
        <PresenterProvider value={presenter}>
          <OutletProvider value={presenter.childPresenter}>
            <OutletErrorBoundary presenter={presenter}>
              <RenderBoundary component={component} />
            </OutletErrorBoundary>
          </OutletProvider>
        </PresenterProvider>
      );

    case 'error':
      component = route.errorComponent || fallbacks.errorComponent;

      if (component === undefined) {
        throw presenter.state.error;
      }
      break;

    case 'loading':
      if (canSuspend) {
        throw presenter.pendingPromise;
      }

      component = route.loadingComponent || fallbacks.loadingComponent;

      if (component === undefined) {
        throw presenter.pendingPromise;
      }
      break;

    case 'not_found':
      component = route.notFoundComponent || fallbacks.notFoundComponent;

      if (component === undefined) {
        notFound();
      }
      break;

    case 'redirect':
      component = route.loadingComponent || fallbacks.loadingComponent;
      break;
  }

  if (component === undefined) {
    return null;
  }

  return (
    <PresenterProvider value={presenter}>
      <OutletProvider value={null}>
        <RenderBoundary component={component} />
      </OutletProvider>
    </PresenterProvider>
  );
}

RouteContent.displayName = 'RouteContent';

const RenderBoundary = memo<{ component: ComponentType }>(
  props => <props.component />,
  (prevProps, nextProps) => prevProps.component === nextProps.component
);

RenderBoundary.displayName = 'RenderBoundary';
