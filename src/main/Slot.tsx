import React, { Component, ComponentType, createContext, createElement, ReactNode, Suspense } from 'react';
import { Route } from './Route';

export interface SlotContentComponents {
  /**
   * A component that is rendered when a route is being loaded.
   */
  loadingComponent?: ComponentType;

  /**
   * A component that is rendered when an error was thrown during rendering.
   */
  errorComponent?: ComponentType;

  /**
   * A component that is rendered if {@link notFound} was called during rendering.
   */
  notFoundComponent?: ComponentType;
}

/**
 * The content rendered in a {@link Slot}.
 */
export interface SlotContent extends SlotContentComponents {
  /**
   * A promise thrown in a Suspense body.
   */
  promise?: Promise<void>;

  /**
   * A content for a child {@link Slot}.
   */
  childContent?: SlotContent;

  /**
   * A component that is currently rendered in a {@link Slot}.
   */
  renderedComponent: ComponentType | undefined;

  /**
   * A route represented by this {@link SlotContent}.
   */
  route?: Route;

  /**
   * Params extracted during route matching.
   */
  params?: unknown;

  /**
   * A data loaded for the {@link route}.
   */
  data?: unknown;

  /**
   * An error that is occurred during data loading or content rendering.
   */
  error?: unknown;

  /**
   * Associates an error with this content.
   *
   * @param error An error to associate.
   */
  setError?(error: unknown): void;

  /**
   * Abort any action taken by this content, and freezes its state so UI don't change if this content is used for
   * rendering.
   */
  freeze?(): void;
}

export const SlotContentContext = createContext<SlotContent | undefined>(undefined);

export const ChildSlotContentContext = createContext<SlotContent | undefined>(undefined);

export interface SlotProps {
  content: SlotContent | undefined;
  children?: ReactNode;
}

interface SlotState {
  hasError: boolean;
  error: unknown;
}

export class Slot extends Component<SlotProps, SlotState> {
  static getDerivedStateFromError(error: unknown): Partial<SlotState> | null {
    return { hasError: true, error };
  }

  static getDerivedStateFromProps(nextProps: Readonly<SlotProps>, prevState: SlotState): Partial<SlotState> | null {
    if (prevState.hasError) {
      // Move error to the content
      nextProps.content?.setError?.(prevState.error);

      return { hasError: false, error: undefined };
    }
    return null;
  }

  render(): ReactNode {
    const { props } = this;

    return (
      <Suspense
        fallback={
          <SlotRenderer
            isSuspendable={false}
            content={props.content}
            children={props.children}
          />
        }
      >
        <SlotRenderer
          isSuspendable={true}
          content={props.content}
          children={props.children}
        />
      </Suspense>
    );
  }
}

interface SlotRendererProps {
  isSuspendable: boolean;
  content: SlotContent | undefined;
  children: ReactNode;
}

function SlotRenderer({ isSuspendable, content, children }: SlotRendererProps): ReactNode {
  if (content === undefined) {
    return children;
  }
  if (isSuspendable && content.promise !== undefined) {
    throw content.promise;
  }
  if (content.renderedComponent === undefined) {
    return null;
  }
  return (
    <SlotContentContext.Provider value={content}>
      <ChildSlotContentContext.Provider value={content.childContent}>
        {createElement(content.renderedComponent)}
      </ChildSlotContentContext.Provider>
    </SlotContentContext.Provider>
  );
}
