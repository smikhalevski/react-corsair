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

🔥&ensp;[**Live example**](https://codesandbox.io/p/sandbox/react-corsair-example-mzjzcm)

# Introduction

React Corsair is a router that abstracts URLs away from the domain of your application. It doesn't depend on
[`History`](https://developer.mozilla.org/en-US/docs/Web/API/History) but can be easily integrated with it.

Create a component that renders the page of your app:

```ts
export default function UserPage() {
  return 'Hello';
}
```

Create a [`Route`](https://smikhalevski.github.io/react-corsair/classes/Route.html) that lazy-loads the page component:

```ts
import { createRoute } from 'react-corsair';

const userRoute = createRoute({
  pathname: '/user',
  content: () => import('./UserPage')
});
```

Render [`Router`](https://smikhalevski.github.io/react-corsair/classes/RouterProvider.html) component to set up
the router:

```tsx
import { useState } from 'react';
import { Router } from 'react-corsair';

function App() {
  const [location, setLocation] = useState<Location>({
    pathname: '/user',
    searchParams: {},
    hash: ''
  });
  
  return (
    <Router
      location={location}
      routes={[userRoute]}
      onPush={setLocation}
    />
  );
}
```

Access [`Navigation`](https://smikhalevski.github.io/react-corsair/classes/Navigation.html) in components rendered by
the `Router`:

```tsx
import { useNavigation } from 'react-corsair';

export default function UserPage() {
  const navigation = useNavigation();
  
  return 'Hello';
}
```

Navigation allows to push to a new route:

```ts
navigation.push(userRoute);
```
