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

🔥&ensp;[**Live example**](https://codesandbox.io/p/sandbox/react-corsair-example-mzjzcm)

🧭&ensp;[**Routing**](#routing)

- [Router and routes](#router-and-routes)
- [Route params](#route-params)
- [Pathname templates](#pathname-templates)
- [Outlets](#outlets)
- [Nested routes](#nested-routes)
- [Code splitting](#code-splitting)
- [Data loading](#data-loading)
- [Error boundaries](#error-boundaries)
- [Not found](#not-found)
- [Redirects](#redirects)
- [Prefetching](#prefetching)
- [Route interception](#route-interception)
- [Inline routes](#inline-routes)

🔗&ensp;[**History**](#history)

- [Local and absolute URLs](#local-and-absolute-URLs)
- [Search strings](#search-strings)
- [Links](#links)
- [Navigation blocking](#navigation-blocking)

🚀&ensp;[**Server-side rendering**](#server-side-rendering)

- [Rendering disposition](#rendering-disposition)
- [Render to string](#render-to-string)
- [Streaming SSR](#streaming-ssr)
- [State serialization](#state-serialization)
- [Content-Security-Policy support](#content-security-policy-support)

🍪&ensp;**Cookbook**

- [Route masking](#route-masking)

# Routing

URLs don't matter because they are almost never part of the application domain logic. React Corsair is a router that
abstracts URLs away from your application domain.

Use [`Route`](https://smikhalevski.github.io/react-corsair/functions/react_corsair.createRoute.html) objects instead of
URLs to match locations, validate params, navigate between pages, prefetch data, infer types, etc.

React Corsair can be used in any environment and doesn't require any browser-specific API to be available. While
history integration is optional, it is [available out-of-the-box](#history) if you need it.

To showcase how the router works, lets start by creating a page component:

```ts
function HelloPage() {
  return 'Hello';
}
```

[Create a route](https://smikhalevski.github.io/react-corsair/functions/react_corsair.createRoute.html) that maps
a URL pathname to a page component:

```ts
import { createRoute } from 'react-corsair';

const helloRoute = createRoute('/hello', HelloPage);
```

Now we need a [`Router`](https://smikhalevski.github.io/react-corsair/classes/react_corsair.Router.html) that would
handle the navigation:

```ts
import { Router } from 'react-corsair';

const router = new Router({ routes: [helloRoute] });
```

To let the router know what route to render, call
[`navigate`](https://smikhalevski.github.io/react-corsair/classes/react_corsair.Router.html#navigate):

```ts
router.navigate(helloRoute);
```

Use [`<RouterProvider>`](https://smikhalevski.github.io/react-corsair/functions/react_corsair.RouterProvider.html)
to render the router:

```tsx
import { RouterProvider } from 'react-corsair';

function MyApp() {
  return <RouterProvider value={router}/>;
}
```

And that's how you render your first route with React Corsair!

## Router and routes

Routes are navigation entry points. Most routes associate a pathname with a rendered component:

```ts
import { createRoute } from 'react-corsair';

function HelloPage() {
  return 'Hello';
}

const helloRoute = createRoute('/hello', HelloPage);
```

In this example we used a shorthand signature of
the [`createRoute`](https://smikhalevski.github.io/react-corsair/functions/react_corsair.createRoute.html) function.
You can also use
a [route options object](https://smikhalevski.github.io/react-corsair/interfaces/react_corsair.RouteOptions.html):

```ts
const helloRoute = createRoute({
  pathname: '/hello',
  component: HelloPage
});
```

Routes are location providers:

```ts
helloRoute.getLocation();
// ⮕ { pathname: '/hello', searchParams: {}, hash: '', state: undefined }
```

Routes are matched during router navigation:

```ts
import { Router } from 'react-corsair';

const router = new Router({ routes: [helloRoute] });

router.navigate(helloRoute);
```

Use a location to navigate a router:

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

## Route params

Routes can be parameterized with pathname params and search params. Let's create a route that has a pathname param:

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

Read more about pathname params syntax in the [Pathname templates](#pathname-templates) section.

By default, params that aren't a part of a pathname become search params:

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

Use your favourite validation library to parse and validate params:

```ts
import * as d from 'doubter';

const productRoute = createRoute({
  pathname: '/products/:sku',

  paramsAdapter: d.object({
    sku: d.number().int().nonNegative().coerce(),
    color: d.enum(['red', 'green']).optional()
  })
});

productRoute.getLocation({ sku: 42, color: 'red' });
```

> [!TIP]\
> Read more about [Doubter](https://github.com/smikhalevski/doubter#readme), the runtime validation and transformation
> library. 

## Pathname templates

A pathname provided for a route is parsed as a pattern. Pathname patterns may contain named params and matching flags.
Pathname patterns are compiled into
a [`PathnameTemplate`](https://smikhalevski.github.io/react-corsair/classes/react_corsair.PathnameTemplate.html) when
route is created. A template allows to both match a pathname, and build a pathname using a provided set of params.

After a route is created, you can access a pathname pattern like this:

```ts
const productsRoute = createRoute('/products');

productsRoute.pathnameTemplate.pattern;
// ⮕ '/products'
```

By default, a pathname pattern is case-insensitive. So the route in example above would match both `/products` and
`/PRODUCTS`.

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

This route matches both `/product` and `/product/37`.

Static pathname segments can be optional as well:

```ts
createRoute('/shop?/product/:sku');
```

This route matches both `/shop/product/37` and `/product/37`.

By default, a param matches a single pathname segment. Follow a param with a `*` flag to make it match multiple
segments.

```ts
createRoute('/:slug*');
```

This route matches both `/watch` and `/watch/a/movie`.

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

## Outlets

Route components are rendered inside
an [`<Outlet>`](https://smikhalevski.github.io/react-corsair/functions/react_corsair.Outlet.html). If you don't provide
children to
[`<RouterProvider>`](https://smikhalevski.github.io/react-corsair/functions/react_corsair.RouterProvider.html) then it
would implicitly render an `<Outlet>`:

```tsx
import { Router, RouterProvider } from 'react-corsair';

function HelloPage() {
  return 'Hello';
}

const helloRoute = createRoute('/hello', HelloPage);

const router = new Router({ routes: [helloRoute] });

router.navigate(helloRoute);

function App() {
  return <RouterProvider value={router}/>;
}
```

You can provide children to `<RouterProvider>`:

```tsx
function App() {
  return (
    <RouterProvider value={router}>
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

## Nested routes

Routes can be nested:

```ts
const parentRoute = createRoute('/parent', ParentPage);

const childRoute = createRoute(parentRoute, '/child', ChildPage);

childRoute.getLocation();
// ⮕ { pathname: '/parent/child', searchParams: {}, hash: '', state: undefined }
```

Routes are [rendered inside outlets](#outlets), so `ParentPage` should
render an [`<Outlet>`](https://smikhalevski.github.io/react-corsair/functions/react_corsair.Outlet.html) to give place for
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

To allow router navigation to `childRoute` it should be listed among
[`routes`](https://smikhalevski.github.io/react-corsair/interfaces/react_corsair.RouterOptions.html#routes):

```ts
const router = new Router({ routes: [childRoute] });

router.navigate(childRoute);
```

The rendered output would be:

```html
<section><em>Hello</em></section>
```

If you create a route without specifying a component, it would render an `<Outlet>` by default:

```diff
- const parentRoute = createRoute('/parent', ParentPage);
+ const parentRoute = createRoute('/parent');
```

Now the rendering output would be:

```html
<em>Hello</em>
```

## Code splitting

To enable code splitting in your app, use the
[`lazyComponent`](https://smikhalevski.github.io/react-corsair/interfaces/react_corsair.RouteOptions.html#lazyComponent)
option, instead of the
[`component`](https://smikhalevski.github.io/react-corsair/interfaces/react_corsair.RouteOptions.html#component):

```ts
const userRoute = createRoute({
  pathname: '/user',
  lazyComponent: () => import('./UserPage.js')
});
```

Default-export the component from the `./UserPage.js`:

```ts
export default function UserPage() {
  return 'Hello';
}
```

When router is navigated to the `userRoute`, a module that contains `<UserPage>` is loaded and rendered. The loaded
component is cached, so next time the `userRoute` is matched, `<UserPage>` would be rendered instantly.

A promise is thrown if the `lazyComponent` isn't loaded yet. You can wrap
[`<RouterProvider>`](https://smikhalevski.github.io/react-corsair/functions/react_corsair.RouterProvider.html) in
a custom `<Suspense>` boundary to catch it and render a fallback:

```tsx
function LoadingIndicator() {
  return 'Loading';
}

<Suspense fallback={<LoadingIndicator/>}>
  <RouterProvider value={router}/>
</Suspense>
```

Or you can to provide a
[`loadingComponent`](https://smikhalevski.github.io/react-corsair/interfaces/react_corsair.RouteOptions.html#loadingComponent)
option to your route, so an `<Outlet>` renders a `<Suspense>` for you, using `loadingComponent` as a fallback:

```ts
const userRoute = createRoute({
  pathname: '/user',
  lazyComponent: () => import('./UserPage.js'),
  loadingComponent: LoadingIndicator
});
```

Now, `loadingComponent` would be rendered if there's loading in progress.

Each route may have a custom loading component: here you can render a page skeleton or a spinner.

Router can render the previously matched route when a new route is being loaded, even if a new route has
a `loadingComponent`. Customize this behavior by adding a
[`loadingAppearance`](https://smikhalevski.github.io/react-corsair/interfaces/react_corsair.RouteOptions.html#loadingAppearance)
option:

```ts
const userRoute = createRoute({
  pathname: '/user',
  lazyComponent: () => import('./UserPage.js'),
  loadingComponent: LoadingIndicator,
  loadingAppearance: 'always'
});
```

This tells a router to always render `userRoute.loadingComponent` when `userRoute` is matched and lazy component isn't
loaded yet. `loadingAppearance` can be set to:

<dl>
<dt>"always"</dt>
<dd>

Always render `loadingComponent` if a route requires loading.

</dd>
<dt>"reroute"</dt>
<dd>

Render `loadingComponent` only if a route is changed during navigation. This is the default behavior.

</dd>
<dt>"avoid"</dt>
<dd>

If there's a route that is already rendered then keep it on the screen until the new route is loaded.

</dd>
</dl>

If an error is thrown during `lazyComponent` loading, an [error boundary](#error-boundaries) is rendered and router
would retry loading the component again later.

## Data loading

Routes may require some data to render. Triggering data loading during rendering may lead to
a [waterfall](https://blog.sentry.io/fetch-waterfall-in-react/). React Corsair provides an easy way to load route data
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
time router is navigated to `userRoute`. While data is being loaded, the `<LoadingIndicator>` is rendered instead of
the `<UserPage>`.

You can access the loaded data in your route component using
the [`useRoute`](https://smikhalevski.github.io/react-corsair/functions/react_corsair.useRoute.html) hook:

```ts
function UserPage() {
  const { data } = useRoute(userRoute);
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

## Error boundaries

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

```tsx
import { useRoute } from 'react-corsair';

function ErrorDetails() {
  const { error } = useRoute(userRoute);
  
  return 'An error occurred: ' + error.message;
}
```

Some errors are recoverable and only require a route data to be reloaded:

```tsx
function ErrorDetails() {
  const routeController = useRoute(userRoute);
  
  const handleClick = () => {
    routeController.load();
  };
  
  return <button onClick={handleClick}>{'Reload'}</button>;
}
```

Clicking on a "Reload" button would reload the route data and component (if needed).

You can trigger a route error from an event handler:

```tsx
function UserPage() {
  const routeController = useRoute(userRoute);
  
  const handleClick = () => {
    routeController.setError(new Error('Ooops!'));
  };
  
  return <button onClick={handleClick}>{'Show error'}</button>;
}
```

## Not found

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

## Redirects

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
and URL strings as an argument. Rect Corsair doesn't have a default behavior for redirects. Use a router event listener
to handle redirects:

```ts
const router = new Router({ routes: [adminRoute] });

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

## Prefetching

Sometimes you know ahead of time that a user would visit a particular route, and you may want to prefetch
the component and [related data](#data-loading) so the navigation is instant.

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

React Corsair triggers required [data loaders](#data-loading) on every navigation, so you may need to implement caching
for data loaders.

## Route interception

When a router is navigated to a new location, a target route can be intercepted and rendered in the layout of
the current route. This can be useful when you want to display the content of a route without the user switching to
a different context.

To showcase how to use route interception, let's start with creating create a shop feed from which products can be
opened in a separate page.

Here's the product route and its component:

```ts
import { createRoute, useRoute } from 'react-corsair';

const productRoute = createRoute<{ sku: number }>('/product/:sku', ProductPage);

function ProductPage() {
  const { params } = useRoute(productRoute);

  // Render a product here
}
```

Shop feed is a list of product links:

```tsx
import { createRoute } from 'react-corsair';
import { Link } from 'react-corsair/history';

const shopRoute = createRoute('/shop', ShopPage);

function ShopPage() {
  return <Link to={productRoute.getLocation(42)}>{'Go to product'}</Link>;
}
```

Setup the history and the router:

```ts
import { Router } from 'react-corsair';
import { createBrowserHistory } from 'react-corsair/history';

const history = createBrowserHistory();

const router = new Router({ routes: [shopRoute, productRoute] });

// 🟡 Trigger router navigation if history location changes
history.subscribe(() => {
  router.navigate(history.location);
});
```

Render the router:

```tsx
import { RouterProvider } from 'react-corsair';
import { HistoryProvider } from 'react-corsair/history';

<HistoryProvider value={history}>
  <RouterProvider value={router}/>
</HistoryProvider>
```

Now when user opens `/shop` and clicks on _Go to product_, the browser location changes to `/product/42` and
the `productRoute` is rendered.

With route interception we can render `productRoute` route inside the `<ShopPage>`, so the browser location would be
`/product/42` and the user would see the shop feed with a product inlay.

To achieve this, add
the [`useInterceptedRoute`](https://smikhalevski.github.io/react-corsair/functions/react_corsair.useInterceptedRoute.html)
hook to `<ShopPage>`:

```tsx
import { useInterceptedRoute } from 'react-corsair';

function ShopPage() {
  const productController = useInterceptedRoute(productRoute);
  // ⮕ RouteController | null
  
  return (
    <>
      <Link to={productRoute.getLocation(42)}>{'Go to product'}</Link>

      {productController !== null && <RouteOutlet controller={productController}/>}
    </>
  );
}
```

Now when user clicks on _Go to product_, the browser location changes to `/product/42` and `<ShopPage>` is re-rendered.
`productController` would contain
a [route controller](https://smikhalevski.github.io/react-corsair/classes/react_corsair.RouteController.html) for
`productRoute`. This controller can be then rendered using
the [`<RouteOutlet>`](https://smikhalevski.github.io/react-corsair/functions/react_corsair.RouteOutlet.html).

If a user clicks the _Reload_ button in the browser, a `<ProductPage>` would be rendered because it matches
`/product/42`.

You can render `<RouteOutlet>` in a popup to show the product preview, allowing user not to loose the context of
the shop feed.

Use
[`cancelInterception`](https://smikhalevski.github.io/react-corsair/classes/react_corsair.Router.html#cancelInterception)
method to render the intercepted route in a router `<Outlet>`:

```ts
router.cancelInterception();
```

## Inline routes

Inline routes allow rendering a route that matches a location inside a component:

```tsx
import { useInlineRoute, RouteOutlet } from 'react-corsair';

function Product() {
  const productController = useInlineRoute(productRoute.getLocation(42));
  
  return productController !== null && <RouteOutlet controller={productController}/>;
}
```

[`useInlineRoute`](https://smikhalevski.github.io/react-corsair/functions/react_corsair.useInlineRoute.html) matches the
provided location against routes of the current router and returns a corresponding route controller.

# History

React Corsair provides a seamless history integration:

```tsx
import { Router, RouterProvider, userRoute } from 'react-corsair';
import { createBrowserHistory, HistoryProvider } from 'react-corsair/history';

const history = createBrowserHistory();

const router = new Router({ routes: [helloRoute] });

// 1️⃣ Trigger router navigation if history location changes
history.subscribe(() => {
  router.navigate(history.location);
});

// 2️⃣ Trigger history location change if redirect is dispatched
router.subscribe(event => {
  if (event.type === 'redirect') {
    history.replace(event.to);
  }
});

function App() {
  return (
    // 5️⃣ Provide history to components
    <HistoryProvider value={history}>
      <RouterProvider value={router}/>
    </HistoryProvider>
  );
}
```

Inside components use [`useHistory`](https://smikhalevski.github.io/react-corsair/interfaces/history.useHistory.html)
hook to retrieve the provided [`History`](https://smikhalevski.github.io/react-corsair/interfaces/history.History.html):

```ts
const history = useHistory();
```

[Push](https://smikhalevski.github.io/react-corsair/interfaces/history.History.html#push) and
[replace](https://smikhalevski.github.io/react-corsair/interfaces/history.History.html#replace) routes using history:

```ts
history.push(helloRoute);

history.replace(productRoute.getLocation({ sku: 42 }));
```

There are three types of history adapters that you can leverage:

- [`createBrowserHistory`](https://smikhalevski.github.io/react-corsair/functions/history.createBrowserHistory.html)
is a DOM-specific history adapter, useful in web browsers that support the HTML5 history API.

- [`createHashHistory`](https://smikhalevski.github.io/react-corsair/functions/history.createHashHistory.html) is
a DOM-specific history adapter that stores location in
a [URL hash](https://developer.mozilla.org/en-US/docs/Web/API/URL/hash).

- [`createMemoryHistory`](https://smikhalevski.github.io/react-corsair/functions/history.createMemoryHistory.html) is
an in-memory history adapter, useful in testing and non-DOM environments like SSR.

## Local and absolute URLs

History provides two types of URL strings:

- Local URLs can be used as arguments for
[push](https://smikhalevski.github.io/react-corsair/interfaces/history.History.html#push) and
[replace](https://smikhalevski.github.io/react-corsair/interfaces/history.History.html#replace) methods.

- Absolute URLs reflect `window.location.href`. 

All history adapters produce local URLs in the same way: 

```ts
const helloRoute = createRoute('/hello');

history.toURL(helloRoute);
// ⮕ '/hello'
```

But absolute URLs are produced differently:

```ts
createBrowserHistory().toAbsoluteURL(helloRoute);
// ⮕ '/hello'

createHashHistory().toAbsoluteURL(helloRoute);
// ⮕ '#/hello'

createMemoryHistory(['/']).toAbsoluteURL(helloRoute);
// ⮕ '/hello'
```

A [`basePathname`](https://smikhalevski.github.io/react-corsair/interfaces/history.HistoryOptions.html#basePathname)
can be prepended to an absolute URL:

```ts
createBrowserHistory({ basePathname: '/wow' }).toAbsoluteURL(helloRoute);
// ⮕ '/wow/hello'

createHashHistory({ basePathname: '/wow' }).toAbsoluteURL(helloRoute);
// ⮕ '/wow#/hello'
```

## Search strings

When history serializes a URL, it uses an adapter to stringify search params:

```ts
const helloRoute = createRoute<{ color: string }>('/hello');

history.toURL(helloRoute.getLocation({ color: 'red' }));
// ⮕ '/hello?color=red'
```

By default, history serializes
[search params](https://smikhalevski.github.io/react-corsair/interfaces/react_corsair.Location.html#searchParams) with
[`jsonSearchParamsSerializer`](https://smikhalevski.github.io/react-corsair/variables/history.jsonSearchParamsSerializer.html)
which serializes individual params with
[`JSON`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON):

```ts
interface ShopParams {
  pageIndex: number;
  categories: string[];
  sortBy: 'price' | 'rating';
  available: boolean;
}

const shopRoute = createRoute<ShopParams>('/shop');

history.toURL(helloRoute.getLocation({
  pageIndex: 3,
  categories: ['electronics', 'gifts'],
  sortBy: 'price',
  available: true
}));
// ⮕ '/shop?pageIndex=3&categories=["electronics","gifts"]&sortBy=price&available=true'
```

`jsonSearchParamsSerializer` allows you to store complex data structures in a URL.

You can create
[a custom search params adapter](https://smikhalevski.github.io/react-corsair/interfaces/history.HistoryOptions.html#searchParamsSerializer)
and provide it to a history. Here's how to create
a basic adapter that uses [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams): 

```ts
createBrowserHistory({
  searchParamsSerializer: {

    parse: search => Object.fromEntries(new URLSearchParams(search)),

    stringify: params => new URLSearchParams(params).toString(),
  }
});
```

## Links

Inside components use [`<Link>`](https://smikhalevski.github.io/react-corsair/functions/history.Link.html)
for navigation:

```tsx
import { Link } from 'react-corsair/history';

function FavouritesPage() {
  return (
    <Link to={productRoute.getLocation({ sku: 42 })}>
      {'Go to a product 42'}
    </Link>
  );
}
```

Links can automatically [prefetch](#prefetching) a route component and [related data](#data-loading):

```tsx
<Link
  to={productRoute.getLocation({ sku: 42 })}
  isPrefetched={true}
>
  {'Go to a product 42'}
</Link>
```

## Navigation blocking

Navigation blocking is a way to prevent navigation from happening. This is typical if a user attempts to navigate while
there are unsaved changes. Usually, in such situation, a prompt or a custom UI should be shown to the user to confirm
the navigation.

Show a browser confirmation popup to the user:

```tsx
useHistoryBlocker(() => {
  return hasUnsavedChanges && !confirm('Discard unsaved changes?')
});
```

With [`proceed`](https://smikhalevski.github.io/react-corsair/interfaces/history.HistoryTransaction.html#proceed) and
[`cancel`](https://smikhalevski.github.io/react-corsair/interfaces/history.HistoryTransaction.html#cancel) you can
handle a navigation transaction in an asynchronous manner: 

```tsx
useHistoryBlocker(transaction => {
  if (!hasUnsavedChanges) {
    // No unsaved changes, proceed with the navigation
    transaction.proceed();
    return;
  }

  if (!confirm('Discard unsaved changes?')) {
    // User decided to keep unsaved changes
    transaction.cancel();
  }
});
```

Ask user to confirm the navigation only if there are unsaved changes:

```tsx
const transaction = useHistoryBlocker(() => hasUnsavedChanges);
// or
// const transaction = useHistoryBlocker(hasUnsavedChanges);

transaction && (
  <dialog open={true}>
    <p>{'Discard unsaved changes?'}</p>

    <button onClick={transaction.proceed}>{'Discard'}</button>
    <button onClick={transaction.cancel}>{'Cancel'}</button>
  </dialog>
)
```

Always ask user to confirm the navigation:

```tsx
const transaction = useHistoryBlocker();
```

# Server-side rendering

Routes can be rendered on the server side and then hydrated on the client side.

To enable hydration on the client, create
a [`Router`](https://smikhalevski.github.io/react-corsair/classes/react_corsair.Router.html) and call
[`hydrateRouter`](https://smikhalevski.github.io/react-corsair/functions/react_corsair.hydrateRouter.html) instead of
[`Router.navigate`](https://smikhalevski.github.io/react-corsair/classes/react_corsair.Router.html#navigate):

```tsx
import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { createBrowserHistory, HistoryProvider } from 'react-router/history';
import { hydrateRouter, Router, RouterProvider } from 'react-router';

const history = createBrowserHistory();

const router = new Router({ routes: [helloRoute] });

// 🟡 Start router hydration instead on navigating
hydrateRouter(router, history.location);

hydrateRoot(
  document, 
  <HistoryProvider value={history}>
    <RouterProvider value={router}/>
  </HistoryProvider>
);
```

> [!IMPORTANT]\
> The location passed to `hydrateRouter` and set of routes passed to the `Router` must be the same as ones used during
> the server-side rendering. Otherwise, hydration would have undefined behavior. 

[`hydrateRouter`](https://smikhalevski.github.io/react-corsair/functions/react_corsair.hydrateRouter.html)
must be called only once, and only one router on the client side can receive the dehydrated state from the server.

On the server, you can either render your app contents [as a string](#render-to-string) and send it to the client in one
go, or [stream the contents](#streaming-ssr).

## Rendering disposition

By default, during when SSR is used all routes are rendered both on the server side and on the client side. You can
prevent server-side rendering for a route by specifying
the [`renderingDisposition`](https://smikhalevski.github.io/react-corsair/interfaces/react_corsair.RouteOptions.html#renderingDisposition)
option:

```ts
const helloRoute = createRoute({
  pathname: '/hello',
  component: HelloPage,
  renderingDisposition: 'client'
});
```

Now `helloRoute` is rendered on the client-side only.

Rendering disposition can be set to:

<dl>
<dt>"server"</dt>
<dd>Route is rendered on the server during SSR and hydrated on the client.</dd>
<dt>"client"</dt>
<dd>Route is rendered on the client. Loading state is rendered on the server during SSR.</dd>
</dl>

## Render to string

Use [`SSRRouter`](https://smikhalevski.github.io/react-corsair/classes/ssr.SSRRouter.html) to render your app as an HTML
string:

```tsx
import { createServer } from 'http';
import { renderToString } from 'react-dom/server';
import { RouterProvider } from 'react-corsair';
import { createMemoryHistory, HistoryProvider } from 'react-corsair/history';
import { SSRRouter } from 'react-corsair/ssr';

const server = createServer(async (request, response) => {
  
  // 1️⃣ Create a new history and a new router for each request
  const history = createMemoryHistory([request.url]);

  const router = new SSRRouter({ routes: [helloRoute] });
  
  // 2️⃣ Navigate router to a requested location
  router.navigate(history.location);

  let html;

  // 3️⃣ Re-render until there are no more changes
  while (await router.hasChanges()) {
    html = renderToString(
      <HistoryProvider value={history}>
        <RouterProvider value={router}/>
      </HistoryProvider>
    );
  }

  // 4️⃣ Attach dehydrated route states
  html += router.nextHydrationChunk();

  // 5️⃣ Send the rendered HTML to the client
  response.end(html);
});

server.listen(8080);
```

You may also need to attach the chunk with your application code:

```ts
html += '<script src="/client.js" async></script>';
```

A new router and a new history must be created for each request, so the results that are stored in router are served in
response to a particular request.

[`hasChanges`](https://smikhalevski.github.io/react-corsair/classes/ssr.SSRRouter.html#hasChanges) would
resolve with `true` if state of some routes have changed during rendering.

The hydration chunk returned
by [`nextHydrationChunk`](https://smikhalevski.github.io/react-corsair/classes/ssr.SSRRouter.html#nextHydrationChunk)
contains the `<script>` tag that hydrates the router for which
[`hydrateRouter`](https://smikhalevski.github.io/react-corsair/functions/react_corsair.hydrateRouter.html)
is invoked on the client side.

## Streaming SSR

React can stream parts of your app while it is being rendered. React Corsair provides
API to inject its hydration chunks into a streaming process. The API is different for NodeJS streams and
[Readable Web Streams](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream).

In NodeJS environment
use [`PipeableSSRRouter`](https://smikhalevski.github.io/react-corsair/classes/ssr_node.PipeableSSRRouter.html)

```tsx
import { createServer } from 'http';
import { renderToPipeableStream } from 'react-dom/server';
import { RouterProvider } from 'react-corsair';
import { createMemoryHistory, HistoryProvider } from 'react-corsair/history';
import { PipeableSSRRouter } from 'react-corsair/ssr/node';

const server = createServer((request, response) => {

  // 1️⃣ Create a new history and a new router for each request
  const history = createMemoryHistory([request.url]);

  const router = new PipeableSSRRouter(response, { routes: [helloRoute] });

  // 2️⃣ Navigate router to a requested location
  router.navigate(history.location);

  const stream = renderToPipeableStream(
    <HistoryProvider value={history}>
      <RouterProvider value={router}/>
    </HistoryProvider>,
    {
      bootstrapScripts: ['/client.js'],

      onShellReady() {
        // 3️⃣ Pipe the rendering output to the router's stream
        stream.pipe(router.stream);
      },
    }
  );
});

server.listen(8080);
```

Router hydration chunks are streamed to the client along with chunks rendered by React.

### Readable web streams support

To enable streaming in a modern environment,
use [`ReadableSSRRouter`](https://smikhalevski.github.io/react-corsair/classes/ssr.ReadableSSRRouter.html)

```tsx
import { createServer } from 'http';
import { renderToPipeableStream } from 'react-dom/server';
import { RouterProvider } from 'react-corsair';
import { createMemoryHistory, HistoryProvider } from 'react-corsair/history';
import { ReadableSSRRouter } from 'react-corsair/ssr';

async function handler(request) {

  // 1️⃣ Create a new history and a new router for each request
  const history = createMemoryHistory([request.url]);

  const router = new ReadableSSRRouter({ routes: [helloRoute] });

  // 2️⃣ Navigate router to a requested location
  router.navigate(history.location);
  
  const stream = await renderToReadableStream(
    <HistoryProvider value={history}>
      <RouterProvider value={router}/>
    </HistoryProvider>,
    {
      bootstrapScripts: ['/client.js'],
    }
  );

  // 3️⃣ Pipe the response through the router
  return new Response(stream.pipeThrough(router), {
    headers: { 'content-type': 'text/html' },
  });
}
```

Router hydration chunks are streamed to the client along with chunks rendered by React.

## State serialization

By default, route state is serialized using
[`JSON.stringify`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)
which has quite a few limitations. If your route [loads data](#data-loading) that may contain circular references,
or non-serializable data like `BigInt`, use a custom state serialization.

On the client, pass
a [`stateParser`](https://smikhalevski.github.io/react-corsair/interfaces/react_corsair.HydrateRouterOptions.html#stateParser)
option to `hydrateRouter`:

```tsx
import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { createBrowserHistory, HistoryProvider } from 'react-router/history';
import { hydrateRouter, Router, RouterProvider } from 'react-router';
import JSONMarshal from 'json-marshal';

const history = createBrowserHistory();

const router = new Router({ routes: [helloRoute] });

hydrateRouter(router, history.location, {
  // 🟡 Pass a custom state parser
  stateParser: JSONMarshal.parse
});

hydrateRoot(
  document,
  <HistoryProvider value={history}>
    <RouterProvider value={router}/>
  </HistoryProvider>
);
```

On the server, pass
a [`stateStringifier`](https://smikhalevski.github.io/react-corsair/interfaces/ssr.SSRRouterOptions.html#stateStringifier)
option to [`SSRRouter`](#render-to-string),
[`PipeableSSRRouter`](#streaming-ssr),
or [`ReadableSSRRouter`](#readable-web-streams-support), depending on your setup:

```ts
import { ReadableSSRRouter } from 'react-corsair/ssr';
import JSONMarshal from 'json-marshal';

const router = new ReadableSSRRouter({
  routes: [helloRoute],
  stateStringifier: JSONMarshal.stringify
});
```

> [!TIP]\
> Read more about [JSON Marshal](https://github.com/smikhalevski/json-marshal#readme), it can stringify and parse any
> data structure.

## Content-Security-Policy support

By default,
[`nextHydrationChunk`](https://smikhalevski.github.io/react-corsair/classes/ssr.SSRRouter.html#nextHydrationChunk)
renders an inline `<script>` tag without any attributes. To enable the support of
the [`script-src`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src)
directive of the `Content-Security-Policy` header, provide
the [`nonce`](https://smikhalevski.github.io/react-corsair/interfaces/ssr.SSRRouterOptions.html#nonce) option
to `SSRRouter` or any of its subclasses:

```ts
const router = new SSRRouter({
  routes: [helloRoute],
  nonce: '2726c7f26c'
});
```

Send the header with this nonce in the server response:

```
Content-Security-Policy: script-src 'nonce-2726c7f26c'
```

# Cookbook

## Route masking

Route masking allows you to render a different route than one that was matched by the history.

Router is navigated by history changes:

```ts
history.subscribe(() => {
  router.navigate(history.location);
});
```

User navigates to a `/foo` location:

```ts
history.push('/foo');
```

You can intercept the router navigation before it is rendered (and before data loaders are triggered) and supersede
the navigation:

```ts
router.subscribe(event => {
  if (event.type === 'navigate' && event.location.pathname === '/foo') {
    router.navigate(barRoute);
  }
});
```

Now regardless of what route was matched by `/foo`, router would render `barRoute`.

This technique can be used to render a login page whenever the non-authenticated user tries to reach a page that
requires login. Here's how to achieve this:

```ts
const adminRoute = createRoute('/admin', AdminPage);

const loginPage = createRoute('/login', LoginPage);

// A set of routes that require user to be logged in
const privateRoutes = new Set([adminRoute]);

// User status provided by your application
const isLoggedIn = false;

router.subscribe(event => {
  if (
    !isLoggedIn &&
    event.type === 'navigate' &&
    event.controller !== null &&
    privateRoutes.has(event.controller.route)) {
    router.navigate(loginPage);
  }
});
```

<hr/>

<p align="center">:octocat: :heart:</p>
