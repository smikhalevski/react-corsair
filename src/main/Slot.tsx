import React, { Component, ComponentType, createElement, ReactNode, Suspense } from 'react';

/**
 * The content rendered in a {@link Slot}.
 */
export interface SlotContent {
  /**
   * A component that is rendered in a {@link Slot}.
   */
  component: ComponentType | undefined;

  /**
   * A payload that is marshalled to a client during SSR.
   */
  payload: unknown;

  /**
   * A {@link !Promise} thrown in a {@link !Suspense} body if defined.
   */
  promise: Promise<void> | undefined;

  /**
   * Associates an error with the content in this slot.
   *
   * @param error An error to associate.
   */
  setError(error: unknown): void;
}

export interface SlotProps {
  content: SlotContent;
}

interface SlotState {
  hasError: boolean;
  error: unknown;
}

export class Slot extends Component<SlotProps, SlotState> {
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
      nextProps.content.setError(prevState.error);

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
          />
        }
      >
        <SlotRenderer
          isSuspendable={true}
          content={props.content}
        />
      </Suspense>
    );
  }
}

interface SlotRendererProps {
  isSuspendable: boolean;
  content: SlotContent;
}

function SlotRenderer({ isSuspendable, content }: SlotRendererProps): ReactNode {
  if (isSuspendable && content.promise !== undefined) {
    throw content.promise;
  }
  if (content.component === undefined) {
    return null;
  }
  return (
    <>
      {createElement(content.component)}
      {content.payload !== undefined && (
        <script dangerouslySetInnerHTML={{ __html: 'var e=document.currentScript;e&&e.parentNode.removeChild(e)' }} />
      )}
    </>
  );
}
