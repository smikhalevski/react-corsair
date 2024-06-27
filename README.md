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

# Introduction

React Corsair is a router that abstracts URLs away from the domain of your application.

Create a component that renders the page of your app:

```ts
export default function UserPage() {
  return 'Hello';
}
```

Create a [`Route`](https://smikhalevski.github.io/react-corsair/classes/Route.html) that lazy-loads the page component:

```ts
import { Route } from 'react-corsair';

const userRoute = new Route('/user', () => import('./UserPage'));
```

Render [`RouterProvider`](https://smikhalevski.github.io/react-corsair/classes/RouterProvider.html) component to set up
the router:

```tsx
import { useState } from 'react';
import { RouterProvider } from 'react-corsair';

function App() {
  const [url, setURL] = useState('/user');
  
  return (
    <RouterProvider
      url={url}
      routes={[userRoute]}
      onNavigate={setURL}
    />
  );
}
```

Access [`Router`](https://smikhalevski.github.io/react-corsair/classes/Router.html) in components rendered by
the `RouterProvider`:

```ts
export default function UserPage() {
  const router = useRouter();
  
  return 'Hello';
}
```

Router allows to navigate to a new route:

```ts
router.navigate(userRoute);
```
