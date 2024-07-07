import React, { HTMLAttributes, ReactElement, useEffect } from 'react';
import { useNavigation } from './hooks';
import { Route } from './Route';
import { Dict, NavigateToRouteOptions } from './types';

export interface LinkProps<T extends Route>
  extends Omit<HTMLAttributes<HTMLAnchorElement>, 'href'>,
    NavigateToRouteOptions {
  to: T;
  params: T['_params'];

  /**
   * When to prefetch a route and its data.
   *
   * <dl>
   *   <dt>"rendered"</dt>
   *   <dd>Prefetch when the link is rendered.</dd>
   *   <dt>"off"</dt>
   *   <dd>Prefetch is disabled.</dd>
   * </dl>
   *
   * @default "off"
   */
  prefetch?: 'rendered' | 'off';
}

export interface NoParamsLinkProps extends Omit<LinkProps<Route<any, void>>, 'params'> {
  params?: undefined;
}

export function Link<T extends Route>(props: NoParamsLinkProps | LinkProps<T>): ReactElement {
  const { to, params, prefetch } = props;

  const aProps: Dict = { ...props };
  delete aProps.to;
  delete aProps.params;
  delete aProps.prefetch;

  const navigation = useNavigation();

  useEffect(() => {
    if (prefetch === 'rendered') {
      navigation.prefetch(to, params);
    }
  }, []);

  return (
    <a
      {...aProps}
      href=""
      onClick={event => {
        event.preventDefault();
        navigation.navigate(to, params);
      }}
    />
  );
}
