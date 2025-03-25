import { Component, ReactNode } from 'react';
import { createErrorState } from './loadRoute';
import { RouteState } from './types';
import { RouteManager } from './RouteManager';

export interface OutletErrorBoundaryProps {
  manager: RouteManager;
  children: ReactNode;
}

interface OutletErrorBoundaryState {
  routeState: RouteState | null;
}

export class OutletErrorBoundary extends Component<OutletErrorBoundaryProps, OutletErrorBoundaryState> {
  static displayName = 'OutletErrorBoundary';

  state = { routeState: null };

  static getDerivedStateFromError(error: unknown): Partial<OutletErrorBoundaryState> | null {
    return { routeState: createErrorState(error) };
  }

  static getDerivedStateFromProps(
    nextProps: Readonly<OutletErrorBoundaryProps>,
    prevState: OutletErrorBoundaryState
  ): Partial<OutletErrorBoundaryState> | null {
    if (prevState.routeState === null) {
      return null;
    }

    nextProps.manager.setState(prevState.routeState);

    return { routeState: null };
  }

  render(): ReactNode {
    return this.props.children;
  }
}
