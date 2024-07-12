import React, {
  Component,
  ComponentType,
  createContext,
  createElement,
  memo,
  ReactElement,
  ReactNode,
  Suspense,
} from 'react';
import { NotFoundError } from './notFound';
import { Route } from './Route';
import { RouterProps } from './Router';
import { LoadingAppearance } from './types';
import { isPromiseLike } from './utils';

/**
 * A content rendered in an {@link Outlet}.
 */
export interface OutletContent {
  /**
   * A content of an {@link Outlet} that is rendered by a {@link component}.
   */
  child: OutletContent | null;

  /**
   * A component to render.
   */
  component: ComponentType | undefined;
  loadingComponent: ComponentType | undefined;
  errorComponent: ComponentType | undefined;
  notFoundComponent: ComponentType | undefined;
  loadingAppearance: LoadingAppearance | undefined;
  route: Route | null;
  params: unknown;
  data: unknown;

  /**
   * Triggered before an {@link Outlet} renders a {@link component}. Throw a promise or a loading error here to trigger
   * a suspense boundary.
   */
  suspend?(): void;

  /**
   * Abort the content loading to prevent UI from changing.
   */
  abort?(): void;
}

export class NotFoundOutletContent implements OutletContent {
  child: OutletContent | null = null;

  component;
  loadingComponent;
  errorComponent;
  notFoundComponent;
  loadingAppearance: LoadingAppearance | undefined;
  route: Route | null = null;
  params: unknown;
  data: unknown;

  constructor(props: RouterProps<any>) {
    this.loadingComponent = props.loadingComponent;
    this.errorComponent = props.errorComponent;
    this.component = this.notFoundComponent = props.notFoundComponent;
  }
}

export class RouteOutletContent implements OutletContent {
  component;
  loadingComponent;
  errorComponent;
  notFoundComponent;
  loadingAppearance;
  data;

  protected _promise;
  protected _hasError;
  protected _error;

  constructor(
    public child: OutletContent | null,
    public route: Route,
    public params: unknown,
    context: unknown
  ) {
    this.component = undefined;
    this.loadingComponent = route.loadingComponent;
    this.errorComponent = route.errorComponent;
    this.notFoundComponent = route.notFoundComponent;
    this.loadingAppearance = route.loadingAppearance;

    this.data = this._promise = this._error = undefined;
    this._hasError = false;

    let content;

    try {
      content = route.loader(params, context);
    } catch (error) {
      this._hasError = true;
      this._error = error;
      return;
    }

    if (isPromiseLike(content)) {
      const promise = content.then(
        content => {
          if (this._promise === promise) {
            this._promise = undefined;
            this.component = content.component;
            this.data = content.data;
          }
        },
        error => {
          if (this._promise === promise) {
            this._promise = undefined;
            this._hasError = true;
            this._error = error;
          }
        }
      );

      this._promise = promise;
    } else {
      this.component = content.component;
      this.data = content.data;
    }
  }

  suspend(): void {
    if (this._promise !== undefined) {
      throw this._promise;
    }
    if (this._hasError) {
      throw this._error;
    }
  }

  abort(): void {
    this._promise = undefined;
  }
}

/**
 * The content of the current outlet. Used by hooks.
 */
export const OutletContentContext = createContext<OutletContent | null>(null);

OutletContentContext.displayName = 'OutletContentContext';

/**
 * The content of the child outlet. Used by outlets.
 */
export const ChildOutletContentContext = createContext<OutletContent | null>(null);

ChildOutletContentContext.displayName = 'ChildOutletContentContext';

/**
 * Props of an {@link Outlet}.
 */
export interface OutletProps {
  /**
   * A fallback that is rendered if there's no content to render in an {@link Outlet}.
   */
  children?: ReactNode;

  /**
   * @internal
   */
  ref?: never;
}

interface OutletState {
  hasError: boolean;
  error: unknown;
}

/**
 * Renders a content of a route provided by a {@link Router}.
 */
export class Outlet extends Component<OutletProps, OutletState> {
  /**
   * @internal
   */
  static displayName = 'Outlet';

  /**
   * @internal
   */
  static contextType = ChildOutletContentContext;

  /**
   * @internal
   */
  declare context: OutletContent | null;

  /**
   * A content that is currently rendered on the screen.
   *
   * @internal
   */
  _renderedContent;

  /**
   * A content that an outlet must render.
   *
   * @internal
   */
  _content;

  /**
   * `true` if an error must be rendered.
   *
   * @internal
   */
  _hasError = false;

  /**
   * @internal
   */
  constructor(props: OutletProps) {
    super(props);

    this.state = { hasError: false, error: undefined };

    this._renderedContent = this._content = this.context;
  }

  /**
   * @internal
   */
  static getDerivedStateFromError(error: unknown): Partial<OutletState> | null {
    return { hasError: true, error };
  }

  /**
   * @internal
   */
  componentDidUpdate(_prevProps: Readonly<OutletProps>, _prevState: Readonly<OutletState>, _snapshot?: any): void {
    if (this._hasError || !this.state.hasError) {
      return;
    }
    this.setState({ hasError: false, error: undefined });
  }

  /**
   * @internal
   */
  render(): ReactElement {
    this._hasError = this.state.hasError;

    if (this._content !== this.context) {
      // A new content was provided
      this._content = this.context;

      // Prevent a rendered content from being updated
      this._renderedContent?.abort?.();

      if (this._content === null || this._content.loadingAppearance === 'loading') {
        // Use new content to render a loading component
        this._renderedContent = this._content;
        this._hasError = false;
      }
    }

    return (
      <Suspense
        fallback={
          <OutletSuspense
            outlet={this}
            isSuspendable={false}
          />
        }
      >
        <OutletSuspense
          outlet={this}
          isSuspendable={true}
        />
      </Suspense>
    );
  }
}

interface OutletSuspenseProps {
  outlet: Outlet;
  isSuspendable: boolean;
}

function OutletSuspense({ outlet, isSuspendable }: OutletSuspenseProps): ReactNode {
  let content = outlet._renderedContent;

  if (content === null) {
    return outlet.props.children;
  }

  if (isSuspendable) {
    content = outlet._content!;

    content.suspend?.();

    if (outlet._renderedContent !== content) {
      outlet._renderedContent = content;

      // Reset the error status after a content was loaded
      outlet._hasError = false;
    }
  }

  if (outlet._hasError) {
    return renderContent(
      content,
      null,
      outlet.state.error instanceof NotFoundError ? content.notFoundComponent : content.errorComponent
    );
  }

  if (content.component === undefined) {
    // Component is being loaded
    return renderContent(content, null, content.loadingComponent);
  }

  return renderContent(content, content.child, content.component);
}

OutletSuspense.displayName = 'OutletSuspense';

function renderContent(
  content: OutletContent | null,
  childContent: OutletContent | null,
  component: ComponentType | undefined
): ReactElement | null {
  return component === undefined ? null : (
    <OutletContentContext.Provider value={content}>
      <ChildOutletContentContext.Provider value={childContent}>
        <Memo component={component} />
      </ChildOutletContentContext.Provider>
    </OutletContentContext.Provider>
  );
}

const Memo = memo<{ component: ComponentType }>(
  props => createElement(props.component),
  (prevProps, nextProps) => prevProps.component === nextProps.component
);

Memo.displayName = 'Memo';
