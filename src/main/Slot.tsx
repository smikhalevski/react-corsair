import React, { Component, createElement, memo, ReactNode, Suspense } from 'react';
import { RouteState } from './RouteState';
import { SlotController } from './SlotController';

export const SlotControllerContext = React.createContext<SlotController | undefined>(undefined);

SlotControllerContext.displayName = 'SlotControllerContext';

export const RouteStateContext = React.createContext<RouteState | undefined>(undefined);

RouteStateContext.displayName = 'RouteStateContext';

interface SlotProps {
  controller: SlotController;
}

interface SlotState {
  /**
   * An error captured by an error boundary.
   */
  error: unknown;
  hasError: boolean;
}

export class InternalSlot extends Component<SlotProps, SlotState> {
  static displayName = 'Slot';

  routeState = new RouteState(this);

  declare _unsubscribe?: () => void;

  constructor(props: SlotProps) {
    super(props);

    this.state = { error: undefined, hasError: false };

    this.forceUpdate = this.forceUpdate.bind(this);
  }

  static getDerivedStateFromError(error: unknown): Partial<SlotState> | null {
    return { error, hasError: true };
  }

  static getDerivedStateFromProps(nextProps: Readonly<SlotProps>, prevState: SlotState): Partial<SlotState> | null {
    if (prevState.hasError) {
      // Move an error to a controller
      nextProps.controller.appearsAs.setRenderError(prevState.error);

      return { error: undefined, hasError: false };
    }
    return null;
  }

  componentDidMount() {
    this._unsubscribe = this.props.controller.subscribe?.(this.forceUpdate);
  }

  componentDidUpdate(prevProps: Readonly<SlotProps>, prevState: Readonly<SlotState>, snapshot?: any) {
    if (this.props.controller !== prevProps.controller) {
      this._unsubscribe?.();
      this._unsubscribe = this.props.controller.subscribe?.(this.forceUpdate);
    }
  }

  componentWillUnmount() {
    this._unsubscribe?.();
  }

  render(): ReactNode {
    return (
      <RouteStateContext.Provider value={this.routeState}>
        <Suspense
          fallback={
            <SlotRenderer
              isSuspendable={false}
              controller={this.props.controller.appearsAs}
            />
          }
        >
          <SlotRenderer
            isSuspendable={true}
            controller={this.props.controller.appearsAs}
          />
        </Suspense>
      </RouteStateContext.Provider>
    );
  }
}

export const Slot = memo(InternalSlot, (prevProps, nextProps) => prevProps.controller === nextProps.controller);

interface SlotRendererProps {
  isSuspendable: boolean;
  controller: SlotController;
}

function SlotRenderer({ isSuspendable, controller }: SlotRendererProps): ReactNode {
  const component = isSuspendable ? controller.component : controller.loadingComponent;

  if (isSuspendable && controller.promise !== undefined) {
    throw controller.promise;
  }
  if (component === undefined) {
    return null;
  }

  let payloadStr;

  return (
    <SlotControllerContext.Provider value={controller.childController}>
      {isSuspendable && (payloadStr = controller.getPayloadStr()) !== undefined && (
        <script
          nonce={controller.nonce}
          dangerouslySetInnerHTML={{
            __html:
              'window.__REACT_CORSAIR_SSR_STATE__&&' +
              `window.__REACT_CORSAIR_SSR_STATE__.set(${controller.index},${JSON.stringify(payloadStr)});` +
              'var e=document.currentScript;e&&e.parentNode.removeChild(e);',
          }}
        />
      )}
      {createElement(component)}
    </SlotControllerContext.Provider>
  );
}

SlotRenderer.displayName = 'SlotRenderer';
