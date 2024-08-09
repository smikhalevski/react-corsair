<p align="center">
  <a href="#readme"><picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/logo-dark.png" />
    <source media="(prefers-color-scheme: light)" srcset="./assets/logo-light.png" />
    <img alt="React Corsair" src="./assets/logo-light.png" width="700" />
  </picture></a>
</p>

```sh
npm install --save-prod react-corsair
```

&ensp; 🔥 [**Live example**](https://codesandbox.io/p/sandbox/react-corsair-example-mzjzcm)

- [Overview](#overview)
- [Router and routes](#router-and-routes)
- [Conditional routing](#conditional-routing)
- [Nested routes](#nested-routes)
- [Pathname templates](#pathname-templates)
- [Route params](#route-params)
- [Route locations](#route-locations)
- [Navigation](#navigation)
- [Code splitting](#code-splitting)
- [Error boundaries](#error-boundaries)
- [Triggering not found](#triggering-not-found)
- [History integration](#history-integration)
- [Data loading](#data-loading)
- [Prefetching](#prefetching)

# Overview

URLs don't matter since they are almost never part of the application domain logic. React Corsair is a router that
abstracts URLs away from your application.
Use [`Route`](https://smikhalevski.github.io/react-corsair/functions/createRoute.html) objects instead of URLs
to match locations, validate params, navigate between pages, prefetch data, infer types, etc.

React Corsair can be used in any environment and doesn't require any browser-specific API to be available. Browser
history integration is optional.

To showcase how the router works in the browser environment, lets start by creating a page component:

```ts
function UserPage() {
  return 'Hello';
}
```

Then create a [`Route`](https://smikhalevski.github.io/react-corsair/functions/createRoute.html) that maps a URL
pathname to a page component:

```ts
import { createRoute } from 'react-corsair';

const userRoute = createRoute('/user', UserPage);
```

Render the [`<Router>`](https://smikhalevski.github.io/react-corsair/classes/Router.html) component to set up a router:

```tsx
import { useState } from 'react';
import { Router, createBrowserHistory, useHistorySubscription } from 'react-corsair';

const history = createBrowserHistory();

function App() {
  useHistorySubscription(history);

  return (
    <Router
      location={history.location}
      routes={[userRoute]}
      onPush={history.push}
      onBack={history.back}
    />
  );
}
```

Inside route components use the [`<Link>`](https://smikhalevski.github.io/react-corsair/functions/Link.html) component
for navigation:

```tsx
import { Link } from 'react-corsair';

function TeamPage() {
  return (
    <Link to={userRoute}>
      {'Go to user'}
    </Link>
  );
}
```

Or use the [`useNavigation`](https://smikhalevski.github.io/react-corsair/functions/useNavigation.html) hook to trigger
navigation imperatively:

```tsx
import { useNavigation } from 'react-corsair';

function TeamPage() {
  const navigation = useNavigation();

  return (
    <button onClick={() => navigation.push(userRoute)}>
      {'Go to user'}
    </button>
  );
}
```

# Router and routes

To create a route that maps a pathname to a component use the
[`createRoute`](https://smikhalevski.github.io/react-corsair/functions/createRoute.html) function:

```ts
const userRoute = createRoute('/user', UserPage);
```

You can provide [options](https://smikhalevski.github.io/react-corsair/interfaces/RouteOptions.html) to `createRoute`:

```ts
const userRoute = createRoute({
  pathname: '/user',
  component: UserPage
});
```

[`<Router>`](https://smikhalevski.github.io/react-corsair/classes/Router.html) component is the heart of React Corsair.
It takes a pathname from the provided
[`location`](https://smikhalevski.github.io/react-corsair/interfaces/RouterProps.html#location) and matches it against
the given set of [`routes`](https://smikhalevski.github.io/react-corsair/interfaces/RouterProps.html#routes) in
the same order they were listed. Then router renders a component from a route which pathname matched the
`location.pathname` in full.

```tsx
import { Router } from 'react-corsair';

function App() {
  return (
    <Router
      location={{ pathname: '/user' }}
      routes={[userRoute]}
    />
  );
}
```

Where does a location come from? From a component state, from a React context,
from the [browser history](#history-integration), from anywhere really:

```tsx
function App() {
  const [location, setLocation] = useState({ pathname: '/user' });

  return (
    <Router
      location={location}
      routes={[userRoute]}
      onPush={setLocation}
      onReplace={setLocation}
    />
  );
}
```

## Outlets

`Router` uses [`<Outlet>`](https://smikhalevski.github.io/react-corsair/classes/Outlet.html) to render routes.
If you don't provide any children to the `Router` then it renders an `Outlet` by default. You can provide custom
children to `Router`, for example, to wrap route components in an additional markup:

```tsx
import { Router, Outlet } from 'react-corsair';

const userRoute = createRoute('/user', UserPage);

function UserPage() {
  return 'Hello';
}

function App() {
  return (
    <Router
      location={{ pathname: '/user' }}
      routes={[userRoute]}
    >
      <main>
        {/* 🟡 Outlet renders the matched route */}
        <Outlet/>
      </main>
    </Router>
  );
}
```

The rendered output would be:

```html

<main>Hello</main>
```

## Not found

If there's no route that matched the provided location, then
a [`notFoundComponent`](https://smikhalevski.github.io/react-corsair/interfaces/RouterProps.html#notFoundComponent) is
rendered:

```tsx
function NotFound() {
  return 'Not found';
}

function App() {
  return (
    <Router
      location={{ pathname: '/ooops' }}
      routes={[userRoute]}
      notFoundComponent={NotFound}
    />
  )
}
```

By default, `notFoundComponent` is `undefined`, so nothing is rendered if no route matched.

# Conditional routing

You can compose the [`routes`](https://smikhalevski.github.io/react-corsair/interfaces/RouterProps.html#routes) array
on-the-fly to change what routes a user can reach depending on external factors.

Consider an app with two rotes `"/posts"` and `"/settings"`. `"/posts"` should be available to all users,
while `"/settings"` should be available only to logged-in users. If user isn't logged and navigates to `"/settings"`,
then a [`notFoundComponent`](#not-found) must be rendered.

```tsx
const postsRoute = createRoute('/posts', PostsPage);

const settingsRoute = createRoute('/settings', SettingsPage);

function App() {
  const [location] = useState({ pathname: '/settings' });

  const routes = [postsRoute];

  // 🟡 Add a route on-the-fly
  if (isLoggedIn) {
    routes.push(settingsRoute);
  }

  return (
    <Router
      location={location}
      routes={routes}
    />
  );
}
```

Be sure that `App` is re-rendered every time `isLoggedIn` is changed, so `<Router>` would catch up the latest set of
routes.

# Nested routes

`<Router>` uses an [outlet](#outlets) to render a matched route. Route components can render outlets as well:

```tsx
import { Outlet } from 'react-corsair';

function SettingsPage() {
  return <Outlet/>;
}
```

Now we can leverage that nested outlet and create a nested route:

```ts
const settingsRoute = createRoute('/settings', SettingsPage);

const billingRoute = createRoute(settingsRoute, '/billing', BillingPage);
```

`BillingPage` would be rendered in an `Outlet` inside `SettingsPage`. 

Provide `billingRoute` to the `<Router>`:

```tsx
function App() {
  return (
    <Router
      loaction={{ pathname: '/settings/billing' }}
      routes={[billingRoute]}
    />
  );
}
```

While `SettingsPage` can render any markup around an `<Outlet>` to decorate the page, in the current example there's
no additional markup. If you omit the component when creating a route, a route would render an `<Outlet>` by default:

```diff
- const settingsRoute = createRoute('/settings', SettingsPage);
+ const settingsRoute = createRoute('/settings');
```

## Rendering nested routes

Since `settingsRoute` wasn't provided to the `<Router>`, it will never be matched. So if user navigates
to `"/settings"`,
a [`notFoundComponent`](https://smikhalevski.github.io/react-corsair/interfaces/RouterProps.html#notFoundComponent)
is rendered.

There are several approaches on how to avoid [Not Found](#not-found) in such case:

1. Add an index route to [`routes`](https://smikhalevski.github.io/react-corsair/interfaces/RouterProps.html#routes).

```tsx
const settingsIndexRoute = createRoute(settingsRoute, '/', BillingPage);

function App() {
  return (
    <Router
      loaction={{ pathname: '/settings' }}
      routes={[
        settingsIndexRoute,
        billingRoute
      ]}
    />
  );
}
```

2. Make an [optional segment](#pathname-templates) in one of existing routes:

```diff
- const billingRoute = createRoute(settingsRoute, '/billing', BillingPage);
+ const billingRoute = createRoute(settingsRoute, '/billing?', BillingPage);
```

With this setup, user can navigate to `"/settings"` and `"/settings/billing"` and would see the same content on
different URLs which usually isn't a great idea.

3. Render a redirect:

```ts
import { redirect } from 'react-corsair';

const settingsRoute = createRoute('/settings', () => redirect(billingRoute));
```

Here, `settingsRoute` renders a redirect to `billingRoute` every time it is matched by the `<Router>`.

# Pathname templates

A pathname provided for a route is parsed as a pattern. Pathname patterns may contain named params and other metadata.
Pathname patterns are compiled into
a [`PathnameTemplate`](https://smikhalevski.github.io/react-corsair/classes/PathnameTemplate.html) when route is
created. A template allows to both match a pathname, and build a pathname using a provided set of params.

After a route is created, you can access a pathname pattern like this:

```ts
const adminRoute = createRoute('/admin');

adminRoute.pathnameTemplate.pattern;
// ⮕ '/admin'
```

By default, a pathname pattern is case-insensitive. So the route in example above would match both `"/admin"` and
`"/ADMIN"`.

If you need a case-sensitive pattern, provide
[`isCaseSensitive`](https://smikhalevski.github.io/react-corsair/interfaces/RouteOptions.html#isCaseSensitive) route
option:

```ts
createRoute({
  pathname: '/admin',
  isCaseSensitive: true
});
```

Pathname patterns can include params that conform `:[A-Za-z$_][A-Za-z0-9$_]+`:

```ts
const userRoute = createRoute('/user/:userId');
```

You can retrieve param names at runtime:

```ts
userRoute.pathnameTemplate.paramNames;
// ⮕ Set { 'userId' }
```

Params match a whole segment and cannot be partial.

```ts
createRoute('/teams--:teamId');
// ❌ SyntaxError

createRoute('/teams/:teamId');
// ✅ Success
```

By default, a param matches a non-empty pathname segment. To make a param optional (so it can match an absent
segment) follow it by a `?` flag.

```ts
createRoute('/user/:userId?');
```

This route matches both `"/user"` and `"/user/37"`.

Static pathname segments can be optional as well:

```ts
createRoute('/project/task?/:taskId');
```

By default, a param matches a single pathname segment. Follow a param with a `*` flag to make it match multiple
segments.

```ts
createRoute('/:slug*');
```

This route matches both `"/watch"` and `"/watch/a/movie"`.

To make param both wildcard and optional, combine `*` and `?` flags:

```ts
createRoute('/:slug*?');
```

To use `:` as a character in a pathname pattern, replace it with
an [encoded](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent)
representation `%3A`:

```ts
createRoute('/foo%3Abar');
```

# Route params

You can access matched [pathname params](#pathname-templates) and search params in route components:

```ts
import { createRoute, useRouteParams } from 'react-corsair';

interface TeamParams {
  teamId: string;
  sortBy: 'username' | 'createdAt';
}

const teamRoute = createRoute<UserParams>('/teams/:teamId', TeamPage);

function TeamPage() {
  const params = useRouteParams(teamRoute);

  // 🟡 The params type was inferred from the teamRoute.
  return `Team ${params.teamId} is sorted by ${params.sortBy}.`;
}
```

Here we created the `teamRoute` route that has a `teamId` pathname param and a required `sortBy` search param. We added
an explicit type to `createRoute` to enhance type inference during development. While this provides great DX, there's
no guarantee that params would match the required schema at runtime. For example, user may provide an arbitrary string
as `sortBy` search param value, or even omit this param.

A route can parse and validate params at runtime with
a [`paramsAdapter`](https://smikhalevski.github.io/react-corsair/interfaces/RouteOptions.html#paramsAdapter):

```ts
const teamRoute = createRoute({
  pathname: '/team/:teamId',

  paramsAdapter: params => {
    // Parse or validate params here 
    return {
      teamId: params.teamId,
      sortBy: params.sortBy === 'username' || params.sortBy === 'createdAt' ? params.sortBy : 'username'
    };
  }
});
```

Now `sortBy` is guaranteed to be eiter `"username"` or `"createdAt"` inside your route components.

To enhance validation even further, you can use a validation library like
[Doubter](https://github.com/smikhalevski/doubter?tab=readme-ov-file) or
[Zod](https://github.com/colinhacks/zod?tab=readme-ov-file):

```ts
import * as d from 'doubter';

const teamRoute = createRoute({
  pathname: '/team/:teamId',

  paramsAdapter: d.object({
    teamId: d.string(),
    sortBy: d.enum(['username', 'createdAt']).catch('username')
  })
});
```

# Route locations

Every route has a [pathname template](#pathname-templates) that can be used to create a route location.

```ts
const adminRoute = createRoute('/admin');

adminRoute.getLocation();
// ⮕ { pathname: '/admin', searchParams: {}, hash: '' }
```

If route is parameterized, then params must be provided to
the [`getLocation`](https://smikhalevski.github.io/react-corsair/classes/Route.html#getLocation) method:

```ts
const userRoute = createRoute('/user/:userId');

userRoute.getLocation({ userId: 37 });
// ⮕ { pathname: '/user/37', searchParams: {}, hash: '' }

userRoute.getLocation();
// ❌ Error: Param must be a string: userId 
```

By default, route treats all params that aren't used by pathname template as search params:

```ts
const teamRoute = createRoute('/team/:teamId');

teamRoute.getLocation({
  teamId: 42,
  sortBy: 'username'
});
// ⮕ { pathname: '/team/42', searchParams: { sortBy: 'username' }, hash: '' }
```

Let's add some types, to constrain route param type inference and enhance DX:

```ts
interface UserParams {
  userId: string;
}

const userRoute = createRoute<UserParams>('/user/:userId');

userRoute.getLocation({});
// ❌ TS2345: Argument of type {} is not assignable to parameter of type { userId: string; }
```

TypeScript raises an error if `userRoute` receives insufficient number of params.

> [!TIP]\
> It is recommended to use
> [`paramsAdapter`](https://smikhalevski.github.io/react-corsair/interfaces/RouteOptions.html#paramsAdapter)
> to constrain route params at runtime. Read more about param adapters in the [Route params](#route-params) section.

# Navigation

`<Router>` does route matching only if
a [`location`](https://smikhalevski.github.io/react-corsair/interfaces/RouterProps.html#location) or
[`routes`](https://smikhalevski.github.io/react-corsair/interfaces/RouterProps.html#routes) have changed.

Provide [`onPush`](https://smikhalevski.github.io/react-corsair/interfaces/RouterProps.html#onPush),
[`onReplace`](https://smikhalevski.github.io/react-corsair/interfaces/RouterProps.html#onReplace), and
[`onBack`](https://smikhalevski.github.io/react-corsair/interfaces/RouterProps.html#onBack) callbacks to `<Router>`
to be notified when a location change is requested.

To request a navigation from route components use
the [`useNavigation`](https://smikhalevski.github.io/react-corsair/functions/useNavigation.html) hook:

```tsx
import { useNavigation } from 'react-corsair';

function TeamPage() {
  const navigation = useNavigation();

  return (
    <button onClick={() => navigation.push(userRoute)}>
      {'Go to user'}
    </button>
  );
}
```

Here, [`navigation.push`](https://smikhalevski.github.io/react-corsair/interfaces/Navigation.html#push) triggers
[`onPush`](https://smikhalevski.github.io/react-corsair/interfaces/RouterProps.html#onPush) with
the location of `userRoute`.

If user `userRoute` has [params](#route-params), then provide an explicit [route location](#route-locations):

```ts
navigation.push(userRoute.getLocation({ userId: 42 }));
```

# Code splitting

To enable code splitting in your app, use
the [`lazyComponent`](https://smikhalevski.github.io/react-corsair/interfaces/RouteOptions.html#lazyComponent) option,
instead of the [`component`](https://smikhalevski.github.io/react-corsair/interfaces/RouteOptions.html#component):

```ts
const userRoute = createRoute({
  pathname: '/user',
  lazyComponent: () => import('./UserPage')
});
```

When `userRoute` is matched by router, a chunk that contains `UserPage` is loaded and rendered. The loaded component is
cached, so next time the `userRoute` is matched, `UserPage` would be rendered instantly.

By default, while a lazy component is being loaded, `<Router>` would still render the previously matched route.

But what is rendered if the first ever route matched by the `<Router>` has a lazy component and there's no content yet
on the screen? By default, in this case nothing is rendered until a lazy component is loaded. This is no a good UX,
so you may want to provide
a [`loadingComponent`](https://smikhalevski.github.io/react-corsair/interfaces/RouteOptions.html#loadingComponent)
option to your route:

```ts
function LoadingIndicator() {
  return 'Loading';
}

const userRoute = createRoute({
  pathname: '/user',
  lazyComponent: () => import('./UserPage'),
  loadingComponent: LoadingIndicator
});
```

Now, `loadingComponent` would be rendered by the `<Router>` if there's nothing rendered yet.

Each route may have a custom loading component: here you can render a page skeleton or a spinner.

Router would still render the previously matched route when a new route is being loaded, even if a new route has
a `loadingComponent`. You can change this by adding
a [`loadingAppearance`](https://smikhalevski.github.io/react-corsair/interfaces/RouteOptions.html#loadingAppearance)
option:

```ts
const userRoute = createRoute({
  pathname: '/user',
  lazyComponent: () => import('./UserPage'),
  loadingComponent: LoadingIndicator,
  loadingAppearance: 'loading'
});
```

This tells `<Router>` to always render `userRoute.loadingComponent` when `userRoute` is matched and lazy component isn't
loaded yet. `loadingAppearance` can be set to:

<dl>
<dt>"loading"</dt>
<dd>

A `loadingComponent` is always rendered if a route is matched and a component or a data loader are being loaded.

</dd>
<dt>"auto"</dt>
<dd>

If another route is currently rendered then it would be preserved until a component and data loader of a newly
matched route are being loaded. Otherwise, a `loadingComponent` is rendered. This is the default value.

</dd>
</dl>

If an error is thrown during `lazyComponent` loading, an [error boundary](#error-boundaries) is rendered and `Router`
would retry loading the component again later.

# Error boundaries

Each route is rendered in its own
[error boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary). When an
error occurs during route component rendering,
an [`errorComponent`](https://smikhalevski.github.io/react-corsair/interfaces/RouteOptions.html#errorComponent) is
rendered as a fallback:

```ts
function UserPage() {
  throw new Error('Ooops!');
}

function ErrorFallback() {
  return 'Error occurred';
}

const userRoute = createRoute({
  pathname: '/user',
  component: UserPage,
  errorComponent: ErrorFallback
});
```

You can access the error that triggered the error boundary within an error component:

```ts
import { userRouteState } from 'react-corsair';

function ErrorFallback() {
  const { error } = userRouteState(userRoute);

  return 'Error occurred: ' + error;
}
```

# Triggering not found

During route component rendering, you may detect that there's not enough data to render a route. Call
the [`notFound`](https://smikhalevski.github.io/react-corsair/functions/notFound.html) function in such case:

```ts
import { notFound, useRouteParams } from 'react-corsair';

function UserPage() {
  const params = useRouteParams(userRoute);

  const user = useUser(params.userId);

  if (!user) {
    notFound();
  }

  return 'Hello, ' + user.firstName;
}
```

`notFound` throws a [`NotFoundError`](https://smikhalevski.github.io/react-corsair/classes/NotFoundError.html) that
triggers an [error boundary](#error-boundaries) and causes `Router` to render
a [`notFoundComponent`](https://smikhalevski.github.io/react-corsair/interfaces/RouteOptions.html#notFoundComponent)
as a fallback:

```ts
function UserNotFound() {
  return 'User not found';
}

const userRoute = createRoute({
  pathname: '/user/:userId',
  component: UserPage,
  notFoundComponent: UserNotFound
});
```

# History integration

React Corsair provides history integration:

```tsx
import { Router, createBrowserHistory, useHistorySubscription } from 'react-corsair';
import { userRoute } from './routes';

const history = createBrowserHistory();

function App() {
  useHistorySubscription(history);

  return (
    <Router
      location={history.location}
      routes={[userRoute]}
      onPush={history.push}
      onBack={history.back}
    />
  );
}
```

There are three types of history adapters that you can leverage:

- [`createBrowserHistory`](https://smikhalevski.github.io/react-corsair/functions/createBrowserHistory.html)
- [`createHashHistory`](https://smikhalevski.github.io/react-corsair/functions/createHashHistory.html)
- [`createMemoryHistory`](https://smikhalevski.github.io/react-corsair/functions/createMemoryHistory.html)

Inside route components use the [`<Link>`](https://smikhalevski.github.io/react-corsair/functions/Link.html) component
for navigation:

```tsx
import { Link } from 'react-corsair';

function TeamPage() {
  return (
    <Link to={userRoute}>
      {'Go to user'}
    </Link>
  );
}
```

If a route that link should navigate to is parameterized, provide a [route location](#route-locations):

```tsx
<Link to={userRoute.getLocation({ userId: 42 })}>
  {'Go to user'}
</Link>
```

Links can automatically [prefetch](#prefetching) a route component and [related data](#data-loading):

```tsx
<Link
  to={userRoute}
  prefetch={true}
>
  {'Go to user'}
</Link>
```

# Data loading

Routes may require some data to render. While you can load that data from inside a route component, this may lead to
a [waterfall](https://blog.sentry.io/fetch-waterfall-in-react/). React Corsair provides an easy way to load your data
along with the route:

```ts
const userRoute = createRoute({
  pathname: '/users/:userId',
  lazyComponent: () => import('./UserPage'),

  loader: async params => {
    const res = await fetch('/api/users/' + params.userId);
    return res.json();
  }
});
```

[`loader`](https://smikhalevski.github.io/react-corsair/interfaces/RouteOptions.html#loader) is called every time the
`<Router>` matches the route. Router waits for both component and data to be loaded and then renders the component.

You can access the loaded data in your route component using
the [useRouteData](https://smikhalevski.github.io/react-corsair/functions/useRouteData.html) hook:

```ts
function UserPage() {
  const userData = useRouteData(userRoute);

  // Render the data here
}
```

Your data loader can access a context of the `<Router>`:

```tsx
interface MyRouterContext {
  apiBase: string;
}

const userRoute = createRoute({
  pathname: '/users/:userId',
  lazyComponent: () => import('./UserPage'),

  loader: async (params, context: MyRouterContext) => {
    const res = await fetch(context.apiBase + '/users/' + params.userId);
    return res.json();
  }
});

function App() {
  return (
    <Router
      location={{ pathname: '/user/42' }}
      routes={[userRoute]}
      context={{
        // 🟡 Context type is inferred from the userRoute
        apiBase: 'https://superpuper.com'
      }}
    />
  )
}
```

# Prefetching

Sometimes you know ahead of time that user would visit a particular route, and you may want to prefetch the component
and [related data](#data-loading) so the navigation is instant.

To do this, you can eiter call [`prefetch`](https://smikhalevski.github.io/react-corsair/classes/Route.html#prefetch)
method on a route itself:

```ts
userRoute.prefetch({ userId: 42 });
```

Or user [`Navigation`](https://smikhalevski.github.io/react-corsair/interfaces/Navigation.html) to prefetch a location:

```ts
const navigation = useNavigation();

navigation.prefetch(userRoute.getLocation({ userId: 42 }));
```

`Navigation` would prefetch routes only if they were provided to `<Router>`. 

<hr/>

<p align="center">:octocat: :heart:</p>
