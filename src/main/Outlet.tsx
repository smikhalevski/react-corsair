import React, { Component, createContext, ReactNode, Suspense } from 'react';
import { Presenter } from './Presenter';

export const PresenterContext = createContext<Presenter | null>(null);

export const ChildPresenterContext = createContext<Presenter | null>(null);

interface OutletState {
  /**
   * An error captured by an error boundary.
   */
  error: unknown;

  /**
   * `true` if an error boundary was triggered.
   */
  hasError: boolean;
}

export class Outlet extends Component<{}, OutletState> {
  static contextType = ChildPresenterContext;

  declare context: Presenter | null;

  // static getDerivedStateFromError(error: unknown): Partial<SlotState> | null {
  //   return { error, hasError: true };
  // }

  // static getDerivedStateFromProps(nextProps: Readonly<SlotProps>, prevState: SlotState): Partial<SlotState> | null {
  //   if (prevState.hasError) {
  //     nextProps.controller.renderedController.onCatch(prevState.error);
  //
  //     return { error: undefined, hasError: false };
  //   }
  //   return null;
  // }

  render(): ReactNode {
    if (this.context === null) {
      return null;
    }

    const { renderedPresenter } = this.context;

    const children = (
      <InternalOutlet
        canSuspend={true}
        presenter={renderedPresenter}
      />
    );

    if (renderedPresenter.loadingComponent === undefined) {
      return children;
    }

    return (
      <Suspense
        fallback={
          <InternalOutlet
            canSuspend={false}
            presenter={renderedPresenter}
          />
        }
      >
        {children}
      </Suspense>
    );
  }
}

interface InternalOutletProps {
  canSuspend: boolean;
  presenter: Presenter;
}

function InternalOutlet(props: InternalOutletProps): ReactNode {
  const { canSuspend, presenter } = props;

  const Component = canSuspend ? presenter.getComponentOrSuspend() : presenter.loadingComponent;

  if (Component === undefined) {
    return null;
  }

  return (
    <PresenterContext.Provider value={presenter}>
      <ChildPresenterContext.Provider value={presenter.childPresenter}>
        <Component />
      </ChildPresenterContext.Provider>
    </PresenterContext.Provider>
  );
}

InternalOutlet.displayName = 'InternalOutlet';
