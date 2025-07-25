import { describe, expect, test, vi } from 'vitest';
import { delay } from 'parallel-universe';
import { Writable } from 'stream';
import { PipeableSSRRouter } from '../../../main/ssr/node/index.js';
import { createRoute } from '../../../main/index.js';

describe('PipeableSSRRouter', () => {
  test('sends hydration chunk after the content chunk', async () => {
    const writeMock = vi.fn();

    const outputStream = new Writable({
      write(chunk, _encoding, callback) {
        writeMock(chunk.toString());
        callback();
      },
    });

    const route = createRoute('/aaa');
    const router = new PipeableSSRRouter(outputStream, { routes: [route] });

    router.navigate(route);
    router.rootController.setData('zzz');

    router.stream.write('aaa</script>');

    await delay(200);

    expect(writeMock).toHaveBeenCalledTimes(2);
    expect(writeMock).toHaveBeenNthCalledWith(1, 'aaa</script>');
    expect(writeMock).toHaveBeenNthCalledWith(
      2,
      '<script>var s=window.__REACT_CORSAIR_SSR_STATE__=window.__REACT_CORSAIR_SSR_STATE__||new Map();s.set(0,"{\\"status\\":\\"ready\\",\\"data\\":\\"zzz\\"}");var e=document.currentScript;e&&e.parentNode.removeChild(e);</script>'
    );
  });

  test('does not send hydration chunk if nothing has changed', async () => {
    const writeMock = vi.fn();

    const outputStream = new Writable({
      write(chunk, _encoding, callback) {
        writeMock(chunk.toString());
        callback();
      },
    });

    const route = createRoute('/aaa');
    const router = new PipeableSSRRouter(outputStream, { routes: [route] });

    router.navigate(route);
    router.rootController.setData('zzz');

    router.stream.write('aaa</script>');
    router.stream.write('bbb');
    router.stream.write('ccc</script>');

    await delay(200);

    expect(writeMock).toHaveBeenCalledTimes(4);
    expect(writeMock).toHaveBeenNthCalledWith(1, 'aaa</script>');
    expect(writeMock).toHaveBeenNthCalledWith(
      2,
      '<script>var s=window.__REACT_CORSAIR_SSR_STATE__=window.__REACT_CORSAIR_SSR_STATE__||new Map();s.set(0,"{\\"status\\":\\"ready\\",\\"data\\":\\"zzz\\"}");var e=document.currentScript;e&&e.parentNode.removeChild(e);</script>'
    );
    expect(writeMock).toHaveBeenNthCalledWith(3, 'bbb');
    expect(writeMock).toHaveBeenNthCalledWith(4, 'ccc</script>');
  });
});
