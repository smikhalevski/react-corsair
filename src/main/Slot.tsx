import React, { Component, createElement, ReactNode, Suspense } from 'react';
import { SlotController } from './SlotController';
import { useInternalRouter } from './useInternalRouter';
import { SlotControllerContext } from './useSlotController';

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

  /**
   * `true` if an error boundary was triggered.
   */
  hasError: boolean;
}

export class Slot extends Component<SlotProps, SlotState> {
  static displayName = 'Slot';

  private declare _unsubscribe: () => void;

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
      nextProps.controller.renderedController.onCatch(prevState.error);

      return { error: undefined, hasError: false };
    }
    return null;
  }

  componentDidMount() {
    this._unsubscribe = this.props.controller.subscribe(this.forceUpdate);
  }

  shouldComponentUpdate(nextProps: Readonly<SlotProps>, _nextState: Readonly<SlotState>, _nextContext: any): boolean {
    return this.props.controller !== nextProps.controller;
  }

  componentDidUpdate(prevProps: Readonly<SlotProps>, _prevState: Readonly<SlotState>, _snapshot?: any) {
    if (this.props.controller !== prevProps.controller) {
      this._unsubscribe();
      this._unsubscribe = this.props.controller.subscribe(this.forceUpdate);
    }
  }

  componentWillUnmount() {
    this._unsubscribe();
  }

  render(): ReactNode {
    return (
      <Suspense
        fallback={
          <InternalSlot
            isSuspendable={false}
            controller={this.props.controller.renderedController}
          />
        }
      >
        <InternalSlot
          isSuspendable={true}
          controller={this.props.controller.renderedController}
        />
      </Suspense>
    );
  }
}

interface InternalSlotProps {
  isSuspendable: boolean;
  controller: SlotController;
}

function InternalSlot(props: InternalSlotProps): ReactNode {
  const { isSuspendable, controller } = props;
  const { isServer } = useInternalRouter().state;
  const component = isSuspendable ? (controller.onSuspend(), controller.component) : controller.fallbackComponent;

  if (component === undefined) {
    return null;
  }

  return (
    <SlotControllerContext.Provider value={controller}>
      <ChildSlotControllerContext.Provider value={controller.childController}>
        {isServer && isSuspendable && controller.renderHydrationScript()}
        {createElement(component)}
      </ChildSlotControllerContext.Provider>
    </SlotControllerContext.Provider>
  );
}

InternalSlot.displayName = 'InternalSlot';
