import { Component, ErrorInfo, ReactNode } from 'react';

/**
 * Props of the {@link ErrorBoundary} component.
 */
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;

  /**
   * Called when an error was caught during rendering.
   */
  onError?(error: unknown, errorBoundary: ErrorBoundary): void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: unknown;
}

const initialState: ErrorBoundaryState = { hasError: false, error: undefined };

/**
 * Renders a fallback is an error is thrown during rendering.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  static displayName = 'ErrorBoundary';

  state = initialState;

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo): void {
    this.props.onError?.(error, this);
  }

  /**
   * Reverts the error boundary to its initial state.
   */
  reset(): void {
    this.setState(initialState);
  }

  render(): ReactNode {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
