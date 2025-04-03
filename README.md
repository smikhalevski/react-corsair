<p align="center">
  <a href="#readme"><picture>
    <source media="(prefers-color-scheme: dark)" srcset="./assets/logo-dark.png" />
    <source media="(prefers-color-scheme: light)" srcset="./assets/logo-light.png" />
    <img alt="React Corsair" src="./assets/logo-light.png" width="450" />
  </picture></a>
</p>

```sh
npm install --save-prod react-corsair
```

&ensp; 🔥 [**Live example**](https://codesandbox.io/p/sandbox/react-corsair-example-mzjzcm)

- [Overview](#overview)
- [Routing](#routing)
- [Parameterized routes](#parameterized-routes)
- [Pathname templates](#pathname-templates)
- [Outlets](#outlets)
- [Nested routes](#nested-routes)
- [Code splitting](#code-splitting)
- [Data loading](#data-loading)
- [Error boundaries](#error-boundaries)
- [Not found](#not-found)
- [Redirects](#redirects)
- [Prefetching](#prefetching)
- [History integration](#history-integration)

# Overview

URLs don't matter because they are almost never part of the application domain logic. React Corsair is a router that
abstracts URLs away from your application domain.

Use [`Route`](https://smikhalevski.github.io/react-corsair/functions/react_corsair.createRoute.html) objects instead of
URLs to match locations, validate params, navigate between pages, prefetch data, infer types, etc.

React Corsair can be used in any environment and doesn't require any browser-specific API to be available. Browser
history integration is optional but available out-of-the-box if you need it.

To showcase how the router works, lets start by creating a page component:

```ts
function HelloPage() {
  return 'Hello';
}
```

Then create a [`Route`](https://smikhalevski.github.io/react-corsair/functions/react_corsair.createRoute.html) that maps
a URL pathname to a page component:

```ts
import { createRoute } from 'react-corsair';

const helloRoute = createRoute('/hello', HelloPage);
```

Now we need a [`Router`](https://smikhalevski.github.io/react-corsair/classes/react_corsair.Router.html) that would
handle the navigation:

```ts
import { Router } from 'react-corsair';

const router = new Router({
  routes: [helloRoute],
  context: undefined,
});
```

To let router know what route we want to render we should navigate it to it:

```ts
router.navigate(helloRoute);
```

Now everything is ready to be rendered:

```tsx
import { RouterProvider } from 'react-corsair';

function MyApp() {
  return <RouterProvider router={router}/>;
}
```

And that's how you start routing! Read further to know how to navigate from you components, integrate history,
prefetch, enable SSR and more.

# Routing

Routes are navigation entry points. Most routes associate a pathname segment with a rendered component:

```ts
import { createRoute } from 'react-corsair';

function HelloPage() {
  return 'Hello';
}

const helloRoute = createRoute('/hello', HelloPage);
```

Routes are location providers:

```ts
helloRoute.getLocation();
// ⮕ { pathname: '/hello', searchParams: {}, hash: '', state: undefined }
```

Routes are matched during router navigation:

```ts
import { Router } from 'react-corsair';

const router = new Router({
  routes: [helloRoute],
  context: undefined,
});

router.navigate(helloRoute);
```

While router reads a location from a route, but you can use a location directly to navigate a router:

```ts
router.navigate({ pathname: '/hello' });
```

To trigger navigation from inside a component, use the
[`useRouter`](https://smikhalevski.github.io/react-corsair/functions/react_corsair.useRouter.html) hook:

```tsx
function AnotherPage() {
  const router = useRouter();
  
  const handleClick = () => {
    router.navigate(helloRoute);
  };
  
  return <button onClick={handleClick}>{'Go to hello'}</button>;
}
```

# Parameterized routes

Routes can be parameterized with pathname and search params. Let's create a route that has a pathname param:

```ts
const productRoute = createRoute<{ sku: number }>('/products/:sku', ProductPage);
```

Router cannot create a location for a parameterized route by itself, because it doesn't know the required param values.
So here's where
[`getLocation`](https://smikhalevski.github.io/react-corsair/classes/react_corsair.Route.html#getLocation)
comes handy:

```ts
const productLocation = productRoute.getLocation({ sku: 42 });
// ⮕ { pathname: '/products/42', searchParams: {}, hash: '', state: undefined }

router.navigate(productLocation);
```

Read more about pathname params syntax in [Pathname templates](#pathname-templates) section.

By default, params that aren't a part of pathname become search params:

```diff
- const productRoute = createRoute<{ sku: number }>('/products/:sku', ProductPage);
+ const productRoute = createRoute<{ sku: number }>('/products', ProductPage);
```

`sku` is now a search param:

```ts
productRoute.getLocation({ sku: 42 });
// ⮕ { pathname: '/products', searchParams: { sku: 42 }, hash: '', state: undefined }
```

You can have both pathname and search params on the same route:

```ts
interface ProductParams {
  sku: number;
  color: 'red' | 'green';
}

const productRoute = createRoute<ProductParams>('/products/:sku', ProductPage);

productRoute.getLocation({ sku: 42, color: 'red' });
// ⮕ { pathname: '/products/42', searchParams: { color: 'red' }, hash: '', state: undefined }
```

To access params from a component use the
[`useRoute`](https://smikhalevski.github.io/react-corsair/functions/react_corsair.useRoute.html) hook:

```tsx
function ProductPage() {
  const { params } = useRoute(productRoute);
  // ⮕ { sku: 42, color: 'red' }
}
```

Provide params adapter to parse route params:

```ts
const userRoute = createRoute({
  pathname: '/users/:userId',

  paramsAdapter: params => {
    return { userId: params.userId };
  }
});
```

Note that we didn't specify parameter types explicitly this time: TypeScript can infer them from the
[`paramsAdapter`](https://smikhalevski.github.io/react-corsair/interfaces/react_corsair.RouteOptions.html#paramsAdapter).

Route params can be validated at runtime with any validation library:

```ts
import * as d from 'doubter';

const productRoute = createRoute({
  pathname: '/products/:sku',

  paramsAdapter: d.object({
    sku: d.number().int().nonNegative().coerce(),
    color: d.enum(['red', 'green']).optional()
  })
});

productRoute.getLocation({ sku: 42 });
```

> [!TIP]\
> Read more about [Doubter](https://github.com/smikhalevski/doubter#readme), the runtime validation and transformation
> library. 

# Pathname templates

A pathname provided for a route is parsed as a pattern. Pathname patterns may contain named params and other metadata.
Pathname patterns are compiled into
a [`PathnameTemplate`](https://smikhalevski.github.io/react-corsair/classes/react_corsair.PathnameTemplate.html) when
route is created. A template allows to both match a pathname, and build a pathname using a provided set of params.

After a route is created, you can access a pathname pattern like this:

```ts
const productsRoute = createRoute('/products');

productsRoute.pathnameTemplate.pattern;
// ⮕ '/products'
```

By default, a pathname pattern is case-insensitive. So the route in example above would match both `"/products"` and
`"/PRODUCTS"`.

If you need a case-sensitive pattern, provide
[`isCaseSensitive`](https://smikhalevski.github.io/react-corsair/interfaces/react_corsair.RouteOptions.html#isCaseSensitive)
route option:

```ts
createRoute({
  pathname: '/products',
  isCaseSensitive: true
});
```

Pathname patterns can include params that conform `:[A-Za-z$_][A-Za-z0-9$_]+`:

```ts
const userRoute = createRoute('/users/:userId');
```

You can retrieve param names at runtime:

```ts
userRoute.pathnameTemplate.paramNames;
// ⮕ Set { 'userId' }
```

Params match a whole segment and cannot be partial.

```ts
createRoute('/users__:userId');
// ❌ SyntaxError

createRoute('/users/:userId');
// ✅ Success
```

By default, a param matches a non-empty pathname segment. To make a param optional (so it can match an absent
segment) follow it by a `?` flag.

```ts
createRoute('/product/:sku?');
```

This route matches both `"/product"` and `"/product/37"`.

Static pathname segments can be optional as well:

```ts
createRoute('/project/task?/:taskId');
```

This route matches both `"/product/task/37"` and `"/product/37"`.

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

# Outlets

Route components are rendered inside
an [`Outlet`](https://smikhalevski.github.io/react-corsair/functions/react_corsair.Outlet.html). If you don't render
an `Outlet` explicitly then
[`RouteProvider`](https://smikhalevski.github.io/react-corsair/functions/react_corsair.RouterProvider.html) would
implicitly do it for you:

```tsx
import { Router, RouterProvider } from 'react-crsair';

function HelloPage() {
  return 'Hello';
}

const helloRoute = createRoute('/hello', HelloPage);

const router = new Router({
  routes: [helloRoute],
  context: undefined
});

router.navigate(helloRoute);

function App() {
  return <RouterProvider router={router}/>;
}
```

You can provide children to `RouterProvider`:

```tsx
function App() {
  return (
    <RouterProvider router={router}>
      <main>
        <Outlet/>
      </main>
    </RouterProvider>
  );
}
```

The rendered output would be:

```html
<main>Hello</main>
```

# Nested routes

Routes can be nested:

```ts
const parentRoute = createRoute('/parent', ParentPage);

const childRoute = createRoute(parentRoute, '/child', ChildPage);

childRoute.getLocation();
// ⮕ { pathname: '/parent/child', searchParams: {}, hash: '', state: undefined }
```

Routes are [rendered inside outlets](#outlets), so `ParentPage` should
render an [`Outlet`](https://smikhalevski.github.io/react-corsair/functions/react_corsair.Outlet.html) to give place for
a `ChildPage`:

```tsx
function ParentPage() {
  return (
    <section>
      <Outlet/>
    </section>
  );
}

function ChildPage() {
  return <em>{'Hello'}</em>;
}
```

To allow router navigation to `childRoute` it should be listed among routes:

```ts
const router = new Router({
  routes: [childRoute],
  context: undefined
});

router.navigate(childRoute);
```

The rendered output would be:

```html
<section><em>Hello</em></section>
```

If you create a route without specifying a component, it would render an `Outlet` by default:

```diff
- const parentRoute = createRoute('/parent', ParentPage);
+ const parentRoute = createRoute('/parent');
```

Now the rendering output would be:

```html
<em>Hello</em>
```

# Code splitting

To enable code splitting in your app, use the
[`lazyComponent`](https://smikhalevski.github.io/react-corsair/interfaces/react_corsair.RouteOptions.html#lazyComponent)
option, instead of the
[`component`](https://smikhalevski.github.io/react-corsair/interfaces/react_corsair.RouteOptions.html#component):

```ts
const userRoute = createRoute({
  pathname: '/user',
  lazyComponent: () => import('./UserPage')
});
```

When router is navigated to the `userRoute`, a chunk that contains `UserPage` is loaded and rendered. The loaded
component is cached, so next time the `userRoute` is matched, `UserPage` would be rendered instantly.

By default, while a lazy component is being loaded, router would still render the previously matched route.

But what is rendered if the first ever route matched by the router has a lazy component and there's no content yet
on the screen? By default, an promise would be thrown so you can wrap
[`RouteProvider`](https://smikhalevski.github.io/react-corsair/functions/react_corsair.RouterProvider.html) in a custom
`Suspense` boundary.

You may want to provide a
[`loadingComponent`](https://smikhalevski.github.io/react-corsair/interfaces/react_corsair.RouteOptions.html#loadingComponent)
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

Now, `loadingComponent` would be rendered if there's nothing rendered yet.

Each route may have a custom loading component: here you can render a page skeleton or a spinner.

Router would still render the previously matched route when a new route is being loaded, even if a new route has
a `loadingComponent`. You can change this by adding a
[`loadingAppearance`](https://smikhalevski.github.io/react-corsair/interfaces/react_corsair.RouteOptions.html#loadingAppearance)
option:

```ts
const userRoute = createRoute({
  pathname: '/user',
  lazyComponent: () => import('./UserPage'),
  loadingComponent: LoadingIndicator,
  loadingAppearance: 'loading'
});
```

This tells router to always render `userRoute.loadingComponent` when `userRoute` is matched and lazy component isn't
loaded yet. `loadingAppearance` can be set to:

<dl>
<dt>"loading"</dt>
<dd>

Always render `loadingComponent` if a route requires loading.

</dd>
<dt>"route_loading"</dt>
<dd>

Render `loadingComponent` only if a route is changed during navigation.

</dd>
<dt>"avoid"</dt>
<dd>

If there's a route that is already rendered then keep it on the screen until the new route is loaded.

</dd>
</dl>

If an error is thrown during `lazyComponent` loading, an [error boundary](#error-boundaries) is rendered and router
would retry loading the component again later.

# Data loading

Routes may require some data to render. While you can load that data from inside a route component, this may lead to
a [waterfall](https://blog.sentry.io/fetch-waterfall-in-react/). React Corsair provides an easy way to load your data
ahead of rendering:

```ts
function LoadingIndicator() {
  return 'Loading';
}

const userRoute = createRoute<{ userId: string }, User>({
  pathname: '/users/:userId',
  component: UserPage,
  loadingComponent: LoadingIndicator,

  dataLoader: async options => {
    const response = await fetch('/api/users/' + options.params.userId);
    
    return response.json();
    // ⮕ Promise<User>
  }
});
```

[`dataLoader`](https://smikhalevski.github.io/react-corsair/classes/react_corsair.Route.html#dataLoader) is called every
time router is navigated to `userRoute`. While data is being loaded
[`loadingComponent`](https://smikhalevski.github.io/react-corsair/classes/react_corsair.Route.html#loadingComponent) is
rendered instead of the `UserPage`.

You can access the loaded data in your route component using
the [`useRoute`](https://smikhalevski.github.io/react-corsair/functions/react_corsair.useRoute.html) hook:

```ts
function UserPage() {
  const user = useRoute(userRoute).getData();
  // ⮕ User
}
```

Data loader may require additional context:

```ts
const userRoute = createRoute<{ userId: string }, User, { apiBase: string }>({
  pathname: '/users/:userId',
  component: UserPage,
  loadingComponent: LoadingIndicator,

  dataLoader: async options => {
    const response = await fetch(options.context.apiBase + '/users/' + options.params.userId);

    return response.json();
  }
});
```

A context value should be provided through a router:

```ts
const router = new Router({
  routes: [userRoute],
  context: {
    apiBase: 'https://superpuper.com'
  }
});
```

# Error boundaries

Each route is rendered in its own
[error boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary). If an
error occurs during route component rendering or [data loading](#data-loading),
then an [`errorComponent`](https://smikhalevski.github.io/react-corsair/interfaces/react_corsair.RouteOptions.html#errorComponent)
is rendered as a fallback:

```ts
function UserPage() {
  throw new Error('Ooops!');
}

function ErrorDetails() {
  return 'An error occurred';
}

const userRoute = createRoute({
  pathname: '/user',
  component: UserPage,
  errorComponent: ErrorDetails
});
```

You can access the error that triggered the error boundary within an error component:

```ts
import { useRoute } from 'react-corsair';

function ErrorDetails() {
  const error = useRoute(userRoute).getError();
  
  return 'An error occurred: ' + error.message;
}
```

# Not found

During route component rendering, you may detect that there's not enough data to render a route. Call
the [`notFound`](https://smikhalevski.github.io/react-corsair/functions/react_corsair.notFound.html) in such case:

```ts
import { notFound, useRoute } from 'react-corsair';

function ProductPage() {
  const { params } = useRoute(userRoute);

  const user = getProductById(params.sku);
  // ⮕ User | null
  
  if (user === null) {
    // 🟡 Aborts further rendering
    notFound();
  }

  return 'Hello, ' + user.firstName;
}
```

`notFound` throws aborts further rendering and causes router to render
a [`notFoundComponent`](https://smikhalevski.github.io/react-corsair/interfaces/react_corsair.RouteOptions.html#notFoundComponent)
as a fallback:

```ts
function ProductNotFound() {
  return 'Product not found';
}

const productRoute = createRoute<{ sku: string }>({
  pathname: '/products/:sku',
  component: ProductPage,
  notFoundComponent: ProductNotFound
});
```

You can call `notFound` from a [data loader](#data-loading) as well:

```ts
const productRoute = createRoute<{ sku: string }>({
  pathname: '/products/:sku',
  component: ProductPage,
  notFoundComponent: ProductNotFound,
  
  dataLoader: async () => {
    // Try to load product here or call notFound
    notFound();
  }
});
```

Force router to render `notFoundComponent` from an event handler:

```tsx
function ProductPage() {
  const routeController = useRoute(productRoute);

  const handleClick = () => {
    routeController.notFound();
  };
  
  return <button onClick={handleClick}>{'Render not found'}</button> 
}
```

# Redirects

During route component rendering, you can trigger a redirect by calling
[`redirect`](https://smikhalevski.github.io/react-corsair/functions/react_corsair.redirect.html):

```ts
import { createRoute, redirect } from 'react-corsair';

function AdminPage() {
  redirect(loginRoute);
}

const adminRoute = createRoute('/admin', AdminPage);
```

When `redirect` is called during rendering, router would render a
[`loadingComponent`](https://smikhalevski.github.io/react-corsair/interfaces/react_corsair.RouteOptions.html#loadingComponent).

`redirect` accepts routes, [locations](https://smikhalevski.github.io/react-corsair/interfaces/react_corsair.Location.html),
and URL strings as an argument. Rect Corsair doesn't have a default behaviour for redirects. Use a router event listener
to handle redirects:

```ts
const router = new Router({
  routes: [adminRoute],
  context: undefined
});

router.subscribe(event => {
  if (event.type !== 'redirect') {
    return;
  }

  if (typeof event.to === 'string') {
    window.location.href = event.to;
    return;
  }

  router.navigate(event.to);
});
```

# Prefetching

Sometimes you know ahead of time that user would visit a particular route, and you may want to prefetch the component
and [related data](#data-loading) so the navigation is instant.

To do this, call
the [`Router.prefetch`](https://smikhalevski.github.io/react-corsair/classes/react_corsair.Router.html#prefetch)
method and provide a route or a location to prefetch. Router would load required [components](#code-splitting)
and trigger [data loaders](#data-loading):

```ts
router.prefetch(productRoute);
```

If a route requires params, use
[`getLocation`](https://smikhalevski.github.io/react-corsair/classes/react_corsair.Route.html#getLocation) to create
a prefetched location:

```ts
router.prefetch(user.getLocation({ userId: 42 }));
```

Use [`Prefetch`](https://smikhalevski.github.io/react-corsair/functions/react_corsair.Prefetch.html) component for a
more declarative route prefetching:

```tsx
<Prefetch to={productRoute}/>
```

# History integration

React Corsair provides a seamless history integration:

```tsx
import { Router, RouterProvider, userRoute } from 'react-corsair';
import { createBrowserHistory, HistoryProvider } from 'react-corsair/history';

const usersRoute = createRoute<{ userId: string }>('/users/:userId', UserPage);

const productRoute = createRoute<{ sku: string }>('/products/:sku', ProductPage);

// 1️⃣ Create a history adapter
const history = createBrowserHistory();

// 2️⃣ Create a router
const router = new Router({
  routes: [usersRoute, productRoute],
  context: undefined,
});

// 3️⃣ Trigger router navigation if history location changes
history.subscribe(() => {
  router.navigate(history.location);
});

// 4️⃣ Trigger history location change on router redirect
router.subscribe(event => {
  if (event.type === 'redirect') {
    history.replace(event.to);
  }
});

function App() {
  return (
    <HistoryProvider history={history}>
      <RouterProvider router={router}/>
    </HistoryProvider>
  );
}
```

To trigger navigation, push or replace the history location:

```tsx
import { useHistory } from 'react-corsair/history';

function UserPage() {
  const history = useHistory();

  const handleGoToProduct = () => {
    history.push(productRoute.getLocation({ sku: 42 }));
  };

  return <button onClick={handleGoToProduct}>{'Go to product'}</button>
}
```

There are three types of history adapters that you can leverage:

- [`createBrowserHistory`](https://smikhalevski.github.io/react-corsair/functions/history.createBrowserHistory.html)
- [`createHashHistory`](https://smikhalevski.github.io/react-corsair/functions/history.createHashHistory.html)
- [`createMemoryHistory`](https://smikhalevski.github.io/react-corsair/functions/history.createMemoryHistory.html)

Inside route components use the [`<Link>`](https://smikhalevski.github.io/react-corsair/functions/history.Link.html)
for navigation:

```tsx
import { Link } from 'react-corsair/history';

function UserPage() {
  return (
    <Link to={productRoute.getLocation({ sku: 42 })}>
      {'Go to product'}
    </Link>
  );
}
```

Links can automatically [prefetch](#prefetching) a route component and [related data](#data-loading):

```tsx
<Link
  to={productRoute.getLocation({ sku: 42 })}
  prefetch={true}
>
  {'Go to product'}
</Link>
```


<hr/>

<p align="center">:octocat: :heart:</p>
