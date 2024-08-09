import React, { Component, createElement, ReactNode, Suspense } from 'react';
import { SlotController } from './SlotController';

export const SlotControllerContext = React.createContext<SlotController | undefined>(undefined);

SlotControllerContext.displayName = 'SlotControllerContext';

export const ChildSlotControllerContext = React.createContext<SlotController | undefined>(undefined);

ChildSlotControllerContext.displayName = 'ChildSlotControllerContext';

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

export class Slot extends Component<SlotProps, SlotState> {
  static displayName = 'Slot';

  private _unsubscribe?: () => void;

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
      // Propagate an error to a controller
      nextProps.controller.renderedController.setRenderingError(prevState.error);

      return { error: undefined, hasError: false };
    }
    return null;
  }

  componentDidMount() {
    this._unsubscribe = this.props.controller.subscribe?.(this.forceUpdate);
  }

  shouldComponentUpdate(nextProps: Readonly<SlotProps>, _nextState: Readonly<SlotState>, _nextContext: any): boolean {
    return this.props.controller === nextProps.controller;
  }

  componentDidUpdate(prevProps: Readonly<SlotProps>, _prevState: Readonly<SlotState>, _snapshot?: any) {
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
      <Suspense
        fallback={
          <SlotRenderer
            isSuspendable={false}
            controller={this.props.controller.renderedController}
          />
        }
      >
        <SlotRenderer
          isSuspendable={true}
          controller={this.props.controller.renderedController}
        />
      </Suspense>
    );
  }
}

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

  let stateStr;

  return (
    <SlotControllerContext.Provider value={controller}>
      <ChildSlotControllerContext.Provider value={controller.childController}>
        {isSuspendable && (stateStr = controller.getStateStr()) !== undefined && (
          <script
            nonce={controller.nonce}
            dangerouslySetInnerHTML={{
              __html:
                'window.__REACT_CORSAIR_SSR_STATE__&&' +
                `window.__REACT_CORSAIR_SSR_STATE__.set(${controller.index},${JSON.stringify(stateStr)});` +
                'var e=document.currentScript;e&&e.parentNode.removeChild(e);',
            }}
          />
        )}
        {createElement(component)}
      </ChildSlotControllerContext.Provider>
    </SlotControllerContext.Provider>
  );
}

SlotRenderer.displayName = 'SlotRenderer';
