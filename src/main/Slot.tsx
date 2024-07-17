import React, { Component, createElement, memo, ReactNode, Suspense } from 'react';
import { RouteContent, SlotValue } from './SlotValue';

export const SlotValueContext = React.createContext<SlotValue | undefined>(undefined);

SlotValueContext.displayName = 'SlotValueContext';

export const RouteContentContext = React.createContext<RouteContent | undefined>(undefined);

RouteContentContext.displayName = 'RouteContentContext';

interface SlotProps {
  value: SlotValue;
}

interface SlotState {
  hasError: boolean;
  error: unknown;
}

/**
 * Renders a volatile value that reflects a route content.
 */
export const Slot = memo(
  class extends Component<SlotProps, SlotState> {
    static displayName = 'Slot';

    constructor(props: SlotProps) {
      super(props);

      this.state = { hasError: false, error: undefined };
    }

    static getDerivedStateFromError(error: unknown): Partial<SlotState> | null {
      return { hasError: true, error };
    }

    static getDerivedStateFromProps(nextProps: Readonly<SlotProps>, prevState: SlotState): Partial<SlotState> | null {
      if (prevState.hasError) {
        // Move error to the content
        nextProps.value.setError(prevState.error);

        return { hasError: false, error: undefined };
      }
      return null;
    }

    componentWillUnmount(): void {
      this.props.value.freeze();
    }

    render(): ReactNode {
      const { props } = this;

      return (
        <Suspense
          fallback={
            <SlotRenderer
              isSuspended={true}
              value={props.value}
            />
          }
        >
          <SlotRenderer
            isSuspended={false}
            value={props.value}
          />
        </Suspense>
      );
    }
  },
  (prevProps, nextProps) => prevProps.value === nextProps.value
);

interface SlotRendererProps {
  isSuspended: boolean;
  value: SlotValue;
}

function SlotRenderer({ isSuspended, value }: SlotRendererProps): ReactNode {
  const component = isSuspended ? value.fallbackComponent : value.component;

  if (!isSuspended && value.promise !== undefined) {
    throw value.promise;
  }
  if (component === undefined) {
    return null;
  }
  return (
    <RouteContentContext.Provider value={value.routeContent}>
      <SlotValueContext.Provider value={value.childValue}>{createElement(component)}</SlotValueContext.Provider>
    </RouteContentContext.Provider>
  );
}

SlotRenderer.displayName = 'SlotRenderer';
