import { render } from '@testing-library/react';
import React, { StrictMode } from 'react';
import { noop } from '../main/__utils';
import { ErrorBoundary } from '../main/ErrorBoundary';

console.error = noop;

describe('ErrorBoundary', () => {
  test('renders children', () => {
    const Component = jest.fn(() => <span>{'Hello'}</span>);

    const result = render(
      <StrictMode>
        <ErrorBoundary
          onError={noop}
          fallback={null}
        >
          <Component />
        </ErrorBoundary>
      </StrictMode>
    );

    expect(Component).toHaveBeenCalledTimes(2);
    expect(result.container.innerHTML).toBe('<span>Hello</span>');
  });

  test('calls an error handler', () => {
    const Component = () => {
      throw new Error('expected');
    };

    const handleErrorMock = jest.fn();

    const result = render(
      <StrictMode>
        <ErrorBoundary
          onError={handleErrorMock}
          fallback={<span>{'Goodbye'}</span>}
        >
          <Component />
        </ErrorBoundary>
      </StrictMode>
    );

    expect(handleErrorMock).toHaveBeenCalledTimes(1);
    expect(handleErrorMock).toHaveBeenNthCalledWith(1, new Error('expected'));
    expect(result.container.innerHTML).toBe('<span>Goodbye</span>');
  });

  test('does not catch an error if error was thrown in a fallback', () => {
    const Component = () => {
      throw new Error('expected1');
    };

    const FallbackComponent = () => {
      throw new Error('expected2');
    };

    const handleErrorMock = jest.fn();

    expect(() =>
      render(
        <StrictMode>
          <ErrorBoundary
            onError={handleErrorMock}
            fallback={<FallbackComponent />}
          >
            <Component />
          </ErrorBoundary>
        </StrictMode>
      )
    ).toThrow(new Error('expected2'));

    expect(handleErrorMock).toHaveBeenCalledTimes(0);
  });

  test('does not catch an error thrown in an error handler', () => {
    const Component = () => {
      throw new Error('expected1');
    };

    const handleErrorMock = jest.fn(() => {
      throw new Error('expected2');
    });

    expect(() =>
      render(
        <StrictMode>
          <ErrorBoundary
            onError={handleErrorMock}
            fallback={<span>{'Goodbye'}</span>}
          >
            <Component />
          </ErrorBoundary>
        </StrictMode>
      )
    ).toThrow(new Error('expected2'));
  });

  test('catches an error thrown in an error handler of a nested boundary', () => {
    const Component = () => {
      throw new Error('expected0');
    };

    const handleErrorMock1 = jest.fn(() => {
      throw new Error('expected1');
    });

    const handleErrorMock2 = jest.fn();

    const result = render(
      <StrictMode>
        <ErrorBoundary
          onError={handleErrorMock2}
          fallback={<span>{'Goodbye2'}</span>}
        >
          <ErrorBoundary
            onError={handleErrorMock1}
            fallback={<span>{'Goodbye1'}</span>}
          >
            <Component />
          </ErrorBoundary>
        </ErrorBoundary>
      </StrictMode>
    );

    expect(handleErrorMock1).toHaveBeenCalledTimes(1);
    expect(handleErrorMock1).toHaveBeenNthCalledWith(1, new Error('expected0'));
    expect(handleErrorMock2).toHaveBeenCalledTimes(1);
    expect(handleErrorMock2).toHaveBeenNthCalledWith(1, new Error('expected1'));
    expect(result.container.innerHTML).toBe('<span>Goodbye2</span>');
  });
});
