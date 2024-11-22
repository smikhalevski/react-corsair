```tsx
const history = createBrowserHistory();

const router = new Router({
  routes: []
});

hydrateRouter(router, history.location);
```

```tsx
const history = createMemoryHistory(request.url);

const router = new SSRRouter({
  routes: []
});

let html;
do {
  html = renderToString(<App/>);
} while (await manager.hasChanges() || await router.hasChanges());

html += router.nextHydrationChunk();

respose.end(html);
```
