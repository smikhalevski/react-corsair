import React, { Component, createContext, createElement, ReactElement, useContext } from 'react';
import { createErrorPayload } from './__loadRoute';
import { NotFoundError } from './__notFound';
import { Redirect } from './__redirect';
import { isPromiseLike } from './__utils';
import { OutletModel } from './OutletModel';

export const OutletModelContext = createContext<OutletModel | null>(null);

export function Outlet(): ReactElement {
  const model = useContext(OutletModelContext);

  if (model === null) {
    throw new Error('Outlet model not found');
  }

  return <InternalOutlet model={model} />;
}

interface InternalOutletProps {
  model: OutletModel;
}

interface InternalOutletState {
  error: unknown;
  hasError: boolean;
}

class InternalOutlet extends Component<InternalOutletProps, InternalOutletState> {
  static getDerivedStateFromError(error: unknown): InternalOutletState {
    return { error, hasError: true };
  }

  static getDerivedStateFromProps(
    nextProps: InternalOutletProps,
    prevState: InternalOutletState
  ): InternalOutletState | null {
    if (prevState.hasError) {
      nextProps.model.renderedModel.setPayload(createErrorPayload(prevState.error));

      return { error: undefined, hasError: false };
    }
    return null;
  }

  render(): ReactElement | null {
    const renderedModel = this.props.model.renderedModel;
    const { routeMatch, router } = renderedModel;
    const payload = renderedModel.getPayload();

    if (isPromiseLike(payload)) {
      throw payload;
    }

    if (payload.status === 'ok') {
      if (routeMatch !== null && routeMatch.route.component !== undefined) {
        return createElement(routeMatch.route.component);
      }
      return null;
    }

    if (payload.status === 'not_found') {
      if (routeMatch === null) {
        if (renderedModel.parentModel === null && router.notFoundComponent !== undefined) {
          return createElement(router.notFoundComponent);
        }
        throw new NotFoundError();
      }
      if (routeMatch.route.notFoundComponent !== undefined) {
        return createElement(routeMatch.route.notFoundComponent);
      }
      throw new NotFoundError();
    }

    if (payload.status === 'error') {
      if (routeMatch === null) {
        if (renderedModel.parentModel === null && router.errorComponent !== undefined) {
          return createElement(router.errorComponent);
        }
        throw payload.error;
      }
      if (routeMatch.route.errorComponent !== undefined) {
        return createElement(routeMatch.route.errorComponent);
      }
      throw payload.error;
    }

    if (payload.status === 'redirect') {
      if (routeMatch === null) {
        if (renderedModel.parentModel === null && router.loadingComponent !== undefined) {
          return createElement(router.loadingComponent);
        }
        return null;
      }
      if (routeMatch.route.loadingComponent !== undefined) {
        return createElement(routeMatch.route.loadingComponent);
      }
      throw new Redirect(payload.to);
    }

    return null;
  }
}
