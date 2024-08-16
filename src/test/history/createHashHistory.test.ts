import { JSDOM } from 'jsdom';
import { delay } from 'parallel-universe';
import { createHashHistory, SearchParamsAdapter, urlSearchParamsAdapter } from '../../main';

describe('createHashHistory', () => {
  beforeEach(() => {
    const { window } = new JSDOM('', { url: 'http://localhost' });

    Object.assign(global, { window });
  });

  test('pushes location', async () => {
    const aaaLocation = { pathname: '/aaa', searchParams: {}, hash: '' };

    const history = createHashHistory();

    expect(history.location).toEqual({ pathname: '/', searchParams: {}, hash: '', state: undefined });

    history.push(aaaLocation);

    expect(history.location).toEqual(aaaLocation);

    history.back();

    await delay(50);

    expect(history.location).toEqual({ pathname: '/', searchParams: {}, hash: '', state: undefined });
  });

  test('replaces location', async () => {
    const aaaLocation = { pathname: '/aaa', searchParams: {}, hash: '' };
    const bbbLocation = { pathname: '/bbb', searchParams: {}, hash: '' };
    const cccLocation = { pathname: '/ccc', searchParams: {}, hash: '' };

    const history = createHashHistory();

    history.replace(bbbLocation);

    expect(history.location).toEqual(bbbLocation);

    history.back();

    await delay(50);

    expect(history.location).toEqual(bbbLocation);

    history.push(aaaLocation);

    expect(history.location).toEqual(aaaLocation);

    history.replace(cccLocation);

    expect(history.location).toEqual(cccLocation);

    history.back();

    await delay(50);

    expect(history.location).toEqual(bbbLocation);
  });

  test('calls listener on push', () => {
    const aaaLocation = { pathname: '/aaa', searchParams: {}, hash: '' };
    const listenerMock = jest.fn();

    const history = createHashHistory();

    history.subscribe(listenerMock);
    history.push(aaaLocation);

    expect(listenerMock).toHaveBeenCalledTimes(1);
  });

  test('calls listener on replace', () => {
    const aaaLocation = { pathname: '/aaa', searchParams: {}, hash: '' };
    const listenerMock = jest.fn();

    const history = createHashHistory();

    history.subscribe(listenerMock);
    history.replace(aaaLocation);

    expect(listenerMock).toHaveBeenCalledTimes(1);
  });

  test('calls listener on back', () => {
    const aaaLocation = { pathname: '/aaa', searchParams: {}, hash: '' };
    const bbbLocation = { pathname: '/bbb', searchParams: {}, hash: '' };
    const listenerMock = jest.fn();

    const history = createHashHistory();

    history.subscribe(listenerMock);
    history.push(aaaLocation);
    history.push(bbbLocation);
    history.back();
    history.back();
    history.back();
    history.back();

    expect(listenerMock).toHaveBeenCalledTimes(2);
  });

  test('parses query params', async () => {
    const aaaLocation = { pathname: '/aaa', searchParams: { xxx: 111 }, hash: '' };
    const bbbLocation = { pathname: '/bbb', searchParams: { yyy: [111, 222] }, hash: '' };

    const history = createHashHistory();

    history.push(aaaLocation);

    expect(history.location).toEqual({ pathname: '/aaa', searchParams: { xxx: '111' }, hash: '' });

    expect(window.location.href).toBe('http://localhost/#%2Faaa%3Fxxx%3D111');

    history.push(bbbLocation);

    expect(history.location).toEqual({ pathname: '/bbb', searchParams: { yyy: ['111', '222'] }, hash: '' });

    expect(window.location.href).toBe('http://localhost/#%2Fbbb%3Fyyy%3D111%26yyy%3D222');
  });

  test('parses query params with a custom adapter', async () => {
    const searchParamsAdapterMock: SearchParamsAdapter = {
      parse: jest.fn(urlSearchParamsAdapter.parse),
      stringify: jest.fn(urlSearchParamsAdapter.stringify),
    };

    const aaaLocation = { pathname: '/aaa', searchParams: { xxx: 111 }, hash: '' };

    const history = createHashHistory({ searchParamsAdapter: searchParamsAdapterMock });

    history.push(aaaLocation);

    expect(searchParamsAdapterMock.parse).toHaveBeenCalledTimes(0);
    expect(searchParamsAdapterMock.stringify).toHaveBeenCalledTimes(1);
    expect(searchParamsAdapterMock.stringify).toHaveBeenNthCalledWith(1, { xxx: 111 });

    history.location;

    expect(searchParamsAdapterMock.stringify).toHaveBeenCalledTimes(1);
    expect(searchParamsAdapterMock.parse).toHaveBeenCalledTimes(1);
    expect(searchParamsAdapterMock.parse).toHaveBeenNthCalledWith(1, 'xxx=111');
  });

  test('creates a URL', async () => {
    expect(createHashHistory().toURL({ pathname: '/aaa', searchParams: { xxx: 111 }, hash: '' })).toBe(
      '#%2Faaa%3Fxxx%3D111'
    );
  });

  test('creates a URL with a default base', async () => {
    expect(
      createHashHistory({ basePathname: 'http://bbb.ccc' }).toURL({
        pathname: '/aaa',
        searchParams: { xxx: 111 },
        hash: '',
      })
    ).toBe('http://bbb.ccc/#%2Faaa%3Fxxx%3D111');
  });
});
