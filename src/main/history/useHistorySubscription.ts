import { useSyncExternalStore } from 'react';
import { History } from './types';

/**
 * Subscribes component to updates of a history adapter and triggers re-render when history location is changed.
 *
 * @param history The history to subscribe to.
 */
export function useHistorySubscription(history: History): void {
  const getLocation = () => history.location;

  useSyncExternalStore(history.subscribe, getLocation, getLocation);
}
