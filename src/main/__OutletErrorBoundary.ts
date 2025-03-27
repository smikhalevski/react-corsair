import { Component, ReactNode } from 'react';
import { createErrorState, RoutePresenter } from './RoutePresenter';

export interface OutletErrorBoundaryProps {
  /**
   * A presenter rendered in an {@link Outlet}.
   */
  presenter: RoutePresenter;
  children: ReactNode;
}

interface OutletErrorBoundaryState {
  hasError: boolean;
  error: unknown;
}

/**
 * Catches errors thrown during rendering and updates presenter state.
 */
export class OutletErrorBoundary extends Component<OutletErrorBoundaryProps, OutletErrorBoundaryState> {
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
    return this.props.children;
  }
}
