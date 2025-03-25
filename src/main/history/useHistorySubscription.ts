import { useSyncExternalStore } from 'react';
import { History } from './types';

/**
 * Subscribes component to updates of a history adapter and triggers re-render when history location is changed.
 *
 * @param history The history to subscribe to.
 * @group Hooks
 */
export function useHistorySubscription(history: History): History {
  const getLocation = () => history.location;

  useSyncExternalStore(history.subscribe, getLocation, getLocation);

  return history;
}
