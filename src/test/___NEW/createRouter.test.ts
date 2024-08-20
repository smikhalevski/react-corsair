import { createMemoryHistory } from '../../main';
import { createRoute } from '../../main/____NEW/createRoute';
import { createRouter } from '../../main/____NEW/createRouter';

describe('createRouter', () => {
  test('', () => {
    const history = createMemoryHistory({
      initialEntries: ['/'],
    });

    const router = createRouter({
      routes: [
        //
        createRoute('/aaa'),
        createRoute('/bbb'),
      ],
    });

    history.subscribe(() => {
      router.navigate(history.location);
    });

    router.navigate(history.location);

    history.push('/aaa');
  });
});
