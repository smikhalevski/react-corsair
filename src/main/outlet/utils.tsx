import React, { ComponentType, memo, ReactElement } from 'react';

const elementCache = new WeakMap<ComponentType, ReactElement>();

/**
 * Returns an element that renders a memoized component.
 */
export function createMemoElement(component: ComponentType): ReactElement {
  let element = elementCache.get(component);

  if (element === undefined) {
    const Component = memo(component, returnTrue);
    element = <Component />;
    elementCache.set(component, element);
  }

  return element;
}

export function returnTrue(): boolean {
  return true;
}
