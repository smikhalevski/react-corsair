import { expect, test, vi } from 'vitest';
import { Writable } from 'stream';
import { NodeSSRRouter } from '../../../main/ssr/node/index.js';
import { createRoute } from '../../../main/index.js';

test('sends hydration chunk after the content chunk', async () => {
  const writeMock = vi.fn();

  const writable = new Writable({
    write(chunk, _encoding, callback) {
      writeMock(chunk.toString());
      callback();
    },
  });

  const route = createRoute('/aaa');
  const router = new NodeSSRRouter({ routes: [route] });

  router.navigate(route);
  router.rootController.setData('zzz');

  router.stream.pipe(writable);
  writable.write('aaa</script>');

  expect(writeMock).toHaveBeenCalledTimes(2);
  expect(writeMock).toHaveBeenNthCalledWith(1, 'aaa</script>');
  expect(writeMock).toHaveBeenNthCalledWith(
    2,
    '<script>var s=window.__REACT_CORSAIR_SSR_STATE__=window.__REACT_CORSAIR_SSR_STATE__||new Map();s.set(0,"{\\"status\\":\\"ready\\",\\"data\\":\\"zzz\\"}");var e=document.currentScript;e&&e.parentNode.removeChild(e);</script>'
  );
});

test('does not send hydration chunk if nothing has changed', async () => {
  const writeMock = vi.fn();

  const writable = new Writable({
    write(chunk, _encoding, callback) {
      writeMock(chunk.toString());
      callback();
    },
  });

  const route = createRoute('/aaa');
  const router = new NodeSSRRouter({ routes: [route] });

  router.navigate(route);
  router.rootController.setData('zzz');

  writable.write('aaa</script>');
  router.stream.pipe(writable);
  writable.write('bbb');
  writable.write('ccc</script>');

  expect(writeMock).toHaveBeenCalledTimes(4);
  expect(writeMock).toHaveBeenNthCalledWith(1, 'aaa</script>');
  expect(writeMock).toHaveBeenNthCalledWith(
    2,
    '<script>var s=window.__REACT_CORSAIR_SSR_STATE__=window.__REACT_CORSAIR_SSR_STATE__||new Map();s.set(0,"{\\"status\\":\\"ready\\",\\"data\\":\\"zzz\\"}");var e=document.currentScript;e&&e.parentNode.removeChild(e);</script>'
  );
  expect(writeMock).toHaveBeenNthCalledWith(3, 'bbb');
  expect(writeMock).toHaveBeenNthCalledWith(4, 'ccc</script>');
});
