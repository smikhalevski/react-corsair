import React, { Component, createContext, FC, ReactNode, Suspense } from 'react';
import { OutletController } from './OutletController';

/**
 * The current outlet controller. Hooks use this context to access route matches.
 */
export const OutletControllerContext = createContext<OutletController | null>(null);

OutletControllerContext.displayName = 'OutletControllerContext';

export const NestedOutletControllerContext = createContext<OutletController | null>(null);

NestedOutletControllerContext.displayName = 'NestedOutletControllerContext';

export interface OutletProps {
  /**
   * Children that are rendered if an {@link Outlet} doesn't have any content to render.
   */
  children?: ReactNode;
}

interface OutletState {
  hasError: boolean;
  error: unknown;
}

/**
 * Renders a {@link Route} provided by an enclosing {@link Router}.
 */
export class Outlet extends Component<OutletProps, OutletState> {
  /**
   * @internal
   */
  static contextType = NestedOutletControllerContext;

  /**
   * @internal
   */
  static getDerivedStateFromError(error: unknown): Partial<OutletState> | null {
    return { hasError: true, error };
  }

  /**
   * @internal
   */
  declare context: OutletController | null;

  private _prevController;
  private _controller;

  /**
   * @internal
   */
  constructor(props: OutletProps, context: OutletController | null) {
    super(props);

    this.state = { hasError: false, error: undefined };

    this._prevController = this._controller = context;
    this._OutletContent.displayName = 'OutletContent';
  }

  /**
   * @internal
   */
  componentDidUpdate(_prevProps: Readonly<OutletProps>, _prevState: Readonly<OutletState>, _snapshot?: unknown): void {
    if (this.state.hasError) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  /**
   * @internal
   */
  render() {
    if (this.context !== this._controller) {
      this._controller?.abort();
      this._controller = this.context;
    }

    if (this._controller === null) {
      this._prevController = null;
      return this.props.children;
    }

    if (this.state.hasError) {
      this._controller.setError(this.state.error);
    }

    return (
      <Suspense fallback={<this._OutletContent isSuspendable={false} />}>
        <this._OutletContent isSuspendable={true} />
      </Suspense>
    );
  }

  private _OutletContent: FC<{ isSuspendable: boolean }> = ({ isSuspendable }) => {
    let controller = this._controller!;

    if (isSuspendable) {
      controller.suspend();
      this._prevController = controller;
    } else {
      const prevController = controller.route?.['_pendingBehavior'] === 'fallback' ? controller : this._prevController;

      if (prevController === null) {
        return this.props.children;
      }
      controller = prevController;
    }

    return (
      <OutletControllerContext.Provider value={controller}>
        <NestedOutletControllerContext.Provider value={controller.nestedController}>
          {controller.node}
        </NestedOutletControllerContext.Provider>
      </OutletControllerContext.Provider>
    );
  };
}
