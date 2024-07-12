import React from 'react';
import { History } from './types';

/**
 * Subscribes component to updates of a history adapter and triggers re-render when history location is changed.
 *
 * @param history The history to subscribe to.
 */
export function useHistorySubscription(history: History): void {
  if (typeof React.useSyncExternalStore === 'function') {
    React.useSyncExternalStore(history.subscribe, () => history.location);
    return;
  }

  const [, setLocation] = React.useState(history.location);

  React.useEffect(
    () =>
      history.subscribe(() => {
        setLocation(history.location);
      }),
    [history]
  );
}
