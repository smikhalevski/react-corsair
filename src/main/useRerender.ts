import { useReducer } from 'react';

export function useRerender(): () => void {
  return useReducer(reduceCount, 0)[1];
}

function reduceCount(count: number): number {
  return count + 1;
}
