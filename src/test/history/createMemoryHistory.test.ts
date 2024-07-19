import { createMemoryHistory } from '../../main';

describe('createMemoryHistory', () => {
  test('throws if there is no initial entry', () => {
    expect(() => createMemoryHistory({ initialEntries: [] })).toThrow(new Error('Expected at least one initial entry'));
  });

  test('pushes location', () => {
    const aaaLocation = { pathname: '/aaa', searchParams: {}, hash: '' };
    const bbbLocation = { pathname: '/bbb', searchParams: {}, hash: '' };
    const cccLocation = { pathname: '/ccc', searchParams: {}, hash: '' };

    const history = createMemoryHistory({
      initialEntries: [aaaLocation],
    });

    expect(history.location).toEqual(aaaLocation);

    history.push(bbbLocation);

    expect(history.location).toEqual(bbbLocation);

    history.back();

    expect(history.location).toEqual(aaaLocation);

    history.push(cccLocation);

    expect(history.location).toEqual(cccLocation);

    history.back();

    expect(history.location).toEqual(aaaLocation);
  });

  test('replaces location', () => {
    const aaaLocation = { pathname: '/aaa', searchParams: {}, hash: '' };
    const bbbLocation = { pathname: '/bbb', searchParams: {}, hash: '' };
    const cccLocation = { pathname: '/ccc', searchParams: {}, hash: '' };

    const history = createMemoryHistory({
      initialEntries: [aaaLocation],
    });

    history.replace(bbbLocation);

    expect(history.location).toEqual(bbbLocation);

    history.back();

    expect(history.location).toEqual(bbbLocation);

    history.push(aaaLocation);

    expect(history.location).toEqual(aaaLocation);

    history.replace(cccLocation);

    expect(history.location).toEqual(cccLocation);

    history.back();

    expect(history.location).toEqual(bbbLocation);
  });

  test('calls listener on push', () => {
    const aaaLocation = { pathname: '/aaa', searchParams: {}, hash: '' };
    const bbbLocation = { pathname: '/bbb', searchParams: {}, hash: '' };
    const listenerMock = jest.fn();

    const history = createMemoryHistory({
      initialEntries: [aaaLocation],
    });

    history.subscribe(listenerMock);
    history.push(bbbLocation);

    expect(listenerMock).toHaveBeenCalledTimes(1);
  });

  test('calls listener on replace', () => {
    const aaaLocation = { pathname: '/aaa', searchParams: {}, hash: '' };
    const bbbLocation = { pathname: '/bbb', searchParams: {}, hash: '' };
    const listenerMock = jest.fn();

    const history = createMemoryHistory({
      initialEntries: [aaaLocation],
    });

    history.subscribe(listenerMock);
    history.replace(bbbLocation);

    expect(listenerMock).toHaveBeenCalledTimes(1);
  });

  test('calls listener on back', () => {
    const listenerMock = jest.fn();

    const history = createMemoryHistory({
      initialEntries: [
        { pathname: '/aaa', searchParams: {}, hash: '' },
        { pathname: '/bbb', searchParams: {}, hash: '' },
        { pathname: '/ccc', searchParams: {}, hash: '' },
      ],
    });

    history.subscribe(listenerMock);
    history.back();
    history.back();
    history.back();

    expect(listenerMock).toHaveBeenCalledTimes(2);
  });
});
