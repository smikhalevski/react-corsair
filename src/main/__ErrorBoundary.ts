import { Component, ReactNode } from 'react';
import { RoutePresenter } from './RoutePresenter';

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

    nextProps.presenter.revealError(prevState.error);

    return { hasError: false, error: null };
  }

  render(): ReactNode {
    return this.props.children;
  }
}
