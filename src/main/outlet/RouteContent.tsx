import { getErrorComponent, getLoadingComponent, getNotFoundComponent, RouteController } from '../RouteController.js';
import React, { ReactNode } from 'react';
import { RouteProvider } from '../useRoute.js';
import { createMemoElement } from './utils.js';
import { OutletProvider } from './Outlet.js';

export interface RouteContentProps {
  controller: RouteController;
}

/**
 * Renders a route component in accordance with the controller status.
 *
 * @internal
 */
export function RouteContent(props: RouteContentProps): ReactNode {
  const { controller } = props;
  const { route } = controller;
  const state = controller['_state'];
  const error = controller['_error'];

  let component;
  let childController = null;

  switch (state.status) {
    case 'ready':
      component = route.component;
      childController = controller.childController;

      if (component === undefined) {
        throw new Error('Route is ready but has no component to render');
      }
      break;

    case 'error':
      component = getErrorComponent(controller);

      if (component === undefined) {
        // Propagate to the parent route
        throw error;
      }
      break;

    case 'not_found':
      component = getNotFoundComponent(controller);

      if (component === undefined) {
        // Propagate to the parent route
        throw error;
      }
      break;

    case 'redirect':
      component = getLoadingComponent(controller);

      if (component === undefined) {
        // Propagate to the parent route
        throw error;
      }
      break;

    case 'loading':
      throw controller.promise || new Error('Cannot suspend route controller');

    default:
      throw new Error('Route controller has unexpected status: ' + controller.status);
  }

  return (
    <RouteProvider value={controller}>
      <OutletProvider value={childController}>{createMemoElement(component)}</OutletProvider>
    </RouteProvider>
  );
}

RouteContent.displayName = 'RouteContent';
