import React, { forwardRef, HTMLAttributes, useContext, useEffect } from 'react';
import { LocationOptions, To } from '../types';
import { useNavigation } from '../useNavigation';
import { toLocation } from '../utils';
import { HistoryContext } from './useHistory';

/**
 * Props of the {@link Link} component.
 */
export interface LinkProps extends Omit<HTMLAttributes<HTMLAnchorElement>, 'href'>, LocationOptions {
  /**
   * A location or route to navigate to when link is clicked.
   */
  to: To;

  /**
   * If `true` then link prefetches a route {@link to location} and its data.
   *
   * @default false
   */
  prefetch?: boolean;

  /**
   * If `true` then link replaces the current history entry, otherwise link pushes an entry.
   *
   * @default false
   */
  replace?: boolean;
}

/**
 * Renders an `a` tag that trigger an enclosing router navigation when clicked.
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
  const { to, prefetch, replace, onClick, ...anchorProps } = props;

  const navigation = useNavigation();
  const history = useContext(HistoryContext);

  useEffect(() => {
    if (prefetch) {
      navigation.prefetch(to);
    }
  }, []);

  return (
    <a
      {...anchorProps}
      ref={ref}
      href={history?.toURL(toLocation(to))}
      onClick={event => {
        if (typeof onClick === 'function') {
          onClick(event);
        }

        if (event.isDefaultPrevented()) {
          return;
        }

        event.preventDefault();

        if (replace) {
          navigation.replace(to);
        } else {
          navigation.push(to);
        }
      }}
    />
  );
});

Link.displayName = 'Link';
