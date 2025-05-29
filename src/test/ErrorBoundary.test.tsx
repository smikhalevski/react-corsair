/**
 * @vitest-environment jsdom
 */

import { expect, test, vi } from 'vitest';
import { render } from '@testing-library/react';
import React, { ReactNode, StrictMode } from 'react';
import { ErrorBoundary } from '../main/ErrorBoundary.js';
import { noop } from '../main/utils.js';

console.error = noop;

test('renders children', () => {
  const MockComponent = vi.fn(() => 'BBB');

  const result = render(
    <ErrorBoundary fallback={'AAA'}>
      <MockComponent />
    </ErrorBoundary>,

    { wrapper: StrictMode }
  );

  expect(result.container.innerHTML).toBe('BBB');
  expect(MockComponent).toHaveBeenCalledTimes(2);
});

test('renders fallback', () => {
  const MockComponent = vi.fn(() => {
    throw new Error('expected');
  });

  const result = render(
    <ErrorBoundary fallback={'AAA'}>
      <MockComponent />
    </ErrorBoundary>,
    { wrapper: StrictMode }
  );

  expect(result.container.innerHTML).toBe('AAA');
  expect(MockComponent).toHaveBeenCalledTimes(3);
});

test('calls onError if an error is thrown during rendering', () => {
  const MockComponent = () => {
    throw new Error('expected');
  };

  const handleErrorMock = vi.fn();

  render(
    <ErrorBoundary
      fallback={'AAA'}
      onError={handleErrorMock}
    >
      <MockComponent />
    </ErrorBoundary>,
    { wrapper: StrictMode }
  );

  expect(handleErrorMock).toHaveBeenCalledTimes(1);
  expect(handleErrorMock).toHaveBeenNthCalledWith(1, new Error('expected'), expect.any(ErrorBoundary));
});

test('resets error boundary', () => {
  const MockComponent = vi.fn((): ReactNode => {
    throw new Error('expected');
  });

  const handleErrorMock = vi.fn((_error, errorBoundary) => {
    MockComponent.mockImplementation(() => 'BBB');
    errorBoundary.reset();
  });

  const result = render(
    <ErrorBoundary
      fallback={'AAA'}
      onError={handleErrorMock}
    >
      <MockComponent />
    </ErrorBoundary>,
    { wrapper: StrictMode }
  );

  expect(result.container.innerHTML).toBe('BBB');
  expect(MockComponent).toHaveBeenCalledTimes(5);
  expect(handleErrorMock).toHaveBeenCalledTimes(1);
});

test('rendering throws if onError throws', () => {
  const MockComponent = () => {
    throw new Error('expected1');
  };

  const handleErrorMock = () => {
    throw new Error('expected2');
  };

  expect(() =>
    render(
      <ErrorBoundary
        fallback={'AAA'}
        onError={handleErrorMock}
      >
        <MockComponent />
      </ErrorBoundary>,
      { wrapper: StrictMode }
    )
  ).toThrow(new Error('expected2'));
});

test('rendering throws if fallback throws', () => {
  const MockComponent = () => {
    throw new Error('expected1');
  };

  const MockFallback = () => {
    throw new Error('expected2');
  };

  const handleErrorMock = vi.fn();

  expect(() =>
    render(
      <ErrorBoundary
        fallback={<MockFallback />}
        onError={handleErrorMock}
      >
        <MockComponent />
      </ErrorBoundary>,
      { wrapper: StrictMode }
    )
  ).toThrow(new Error('expected2'));

  expect(handleErrorMock).not.toHaveBeenCalled();
});

test('nested error boundaries', () => {
  const MockComponent = () => {
    throw new Error('expected1');
  };

  const handleErrorMockBbb = vi.fn();
  const handleErrorMockAaa = vi.fn(() => {
    throw new Error('expected2');
  });

  const result = render(
    <ErrorBoundary
      fallback={'BBB'}
      onError={handleErrorMockBbb}
    >
      <ErrorBoundary
        fallback={'AAA'}
        onError={handleErrorMockAaa}
      >
        <MockComponent />
      </ErrorBoundary>
    </ErrorBoundary>,
    { wrapper: StrictMode }
  );

  expect(result.container.innerHTML).toBe('BBB');
  expect(handleErrorMockAaa).toHaveBeenCalledTimes(1);
  expect(handleErrorMockBbb).toHaveBeenCalledTimes(1);
  expect(handleErrorMockAaa).toHaveBeenNthCalledWith(1, new Error('expected1'), expect.any(ErrorBoundary));
  expect(handleErrorMockBbb).toHaveBeenNthCalledWith(1, new Error('expected2'), expect.any(ErrorBoundary));
});
