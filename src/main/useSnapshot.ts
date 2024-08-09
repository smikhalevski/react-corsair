import React from 'react';

export function useSnapshot<T>(subscribe: (listener: () => void) => () => void, getSnapshot: () => T): T {
  if (typeof React.useSyncExternalStore === 'function') {
    return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  }

  const [value, setValue] = React.useState(getSnapshot);

  React.useEffect(() => {
    setValue(getSnapshot());

    return subscribe(() => {
      setValue(getSnapshot());
    });
  }, [subscribe]);

  return value;
}
