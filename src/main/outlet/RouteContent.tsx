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

  let component;
  let childController = null;

  switch (controller.status) {
    case 'ready':
      component = route.component;
      childController = controller.childController;
      break;

    case 'error':
      component = getErrorComponent(controller);
      break;

    case 'not_found':
      component = getNotFoundComponent(controller);
      break;

    case 'redirect':
      component = getLoadingComponent(controller);
      break;

    case 'loading':
      // Ensure the controller was reloaded after instantiation
      throw controller.promise || new Error('Cannot suspend route controller');

    default:
      throw new Error('Route controller has unknown status: ' + controller.status);
  }

  if (component === undefined) {
    throw new Error('No component to render: ' + controller.status);
  }

  return (
    <RouteProvider value={controller}>
      <OutletProvider value={childController}>{createMemoElement(component)}</OutletProvider>
    </RouteProvider>
  );
}

RouteContent.displayName = 'RouteContent';
