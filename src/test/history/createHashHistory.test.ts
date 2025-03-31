import { JSDOM } from 'jsdom';
import { delay } from 'parallel-universe';
import { createHashHistory } from '../../main';

import { jsonSearchParamsAdapter } from '../../main/history/jsonSearchParamsAdapter';

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

    expect(history.location).toEqual({ pathname: '/aaa', searchParams: { xxx: 111 }, hash: '' });

    expect(window.location.href).toBe('http://localhost/#/aaa?xxx=111');

    history.push(bbbLocation);

    expect(history.location).toEqual({ pathname: '/bbb', searchParams: { yyy: [111, 222] }, hash: '' });

    expect(window.location.href).toBe('http://localhost/#/bbb?yyy=%255B111%252C222%255D');
  });

  test('parses query params with a custom adapter', async () => {
    jest.spyOn(jsonSearchParamsAdapter, 'parse');
    jest.spyOn(jsonSearchParamsAdapter, 'stringify');

    const aaaLocation = { pathname: '/aaa', searchParams: { xxx: 111 }, hash: '' };

    const history = createHashHistory();

    history.push(aaaLocation);

    expect(jsonSearchParamsAdapter.parse).toHaveBeenCalledTimes(0);
    expect(jsonSearchParamsAdapter.stringify).toHaveBeenCalledTimes(1);
    expect(jsonSearchParamsAdapter.stringify).toHaveBeenNthCalledWith(1, { xxx: 111 });

    history.location;

    expect(jsonSearchParamsAdapter.stringify).toHaveBeenCalledTimes(1);
    expect(jsonSearchParamsAdapter.parse).toHaveBeenCalledTimes(1);
    expect(jsonSearchParamsAdapter.parse).toHaveBeenNthCalledWith(1, 'xxx=111');
  });

  test('creates an absolute URL', async () => {
    expect(createHashHistory().toAbsoluteURL({ pathname: '/aaa/bbb', searchParams: { xxx: 111 }, hash: '' })).toBe(
      '#/aaa/bbb?xxx=111'
    );
  });

  test('creates an absolute URL with a default base', async () => {
    expect(
      createHashHistory({ basePathname: 'http://bbb.ccc' }).toAbsoluteURL({
        pathname: '/aaa',
        searchParams: { xxx: 111 },
        hash: '',
      })
    ).toBe('http://bbb.ccc/#/aaa?xxx=111');
  });
});
