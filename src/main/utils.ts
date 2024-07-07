import { ComponentType, createElement, memo, ReactElement } from 'react';

const elementCache = new WeakMap<ComponentType, ReactElement>();

export function memoizeElement(component: ComponentType): ReactElement {
  let element = elementCache.get(component);

  if (element === undefined) {
    element = createElement(memo(component, propsAreEqual));
    elementCache.set(component, element);
  }

  return element;
}

function propsAreEqual(_prevProps: unknown, _nextProps: unknown): boolean {
  // Route components don't receive any props, so props are always equal
  return true;
}

export function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return value !== null && typeof value === 'object' && 'then' in value;
}

export function isArrayEqual(a: any[], b: any[]): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}
