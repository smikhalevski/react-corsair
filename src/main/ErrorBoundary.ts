import { Component, ReactNode } from 'react';
import { RoutePresenter } from './RoutePresenter';
import { createErrorState } from './loadRoute';

export interface ErrorBoundaryProps {
  presenter: RoutePresenter;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: unknown;
}

/**
 * Catches errors thrown during rendering and updates presenter state.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static displayName = 'ErrorBoundary';

  state = { hasError: false, error: null };

  static getDerivedStateFromError(error: unknown): Partial<ErrorBoundaryState> | null {
    return { hasError: true, error };
  }

  static getDerivedStateFromProps(
    nextProps: Readonly<ErrorBoundaryProps>,
    prevState: ErrorBoundaryState
  ): Partial<ErrorBoundaryState> | null {
    if (!prevState.hasError) {
      return null;
    }

    const state = createErrorState(prevState.error);

    const prevStatus = nextProps.presenter.state.status;
    const nextStatus = state.status;

    if (
      prevStatus === 'ok' ||
      prevStatus === 'loading' ||
      (prevStatus === 'error' && nextStatus === 'redirect') ||
      (prevStatus === 'redirect' && nextStatus !== 'redirect') ||
      (prevStatus === 'not_found' && (nextStatus === 'redirect' || nextStatus === 'error'))
    ) {
      nextProps.presenter.setState(state);

      return { hasError: false, error: null };
    }

    // Propagate error to the parent presenter
    throw prevState.error;
  }

  render(): ReactNode {
    return this.props.children;
  }
}
