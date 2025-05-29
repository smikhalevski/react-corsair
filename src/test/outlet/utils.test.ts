/**
 * @vitest-environment jsdom
 */

import { describe, expect, test, vi } from 'vitest';
import { render } from '@testing-library/react';
import { createMemoElement } from '../../main/outlet/utils.js';
import { StrictMode } from 'react';

describe('createMemoElement', () => {
  test('renders a component', () => {
    const MockComponent = vi.fn(() => 'AAA');

    const result = render(createMemoElement(MockComponent), { wrapper: StrictMode });

    expect(result.container.innerHTML).toBe('AAA');
    expect(MockComponent).toHaveBeenCalledTimes(2);
  });

  test('does not re-render if a component did not change', () => {
    const MockComponent = vi.fn(() => 'AAA');

    const result = render(createMemoElement(MockComponent), { wrapper: StrictMode });

    result.rerender(createMemoElement(MockComponent));

    expect(result.container.innerHTML).toBe('AAA');
    expect(MockComponent).toHaveBeenCalledTimes(2);
  });

  test('re-renders if a component has changed', () => {
    const MockComponent1 = vi.fn(() => 'AAA');
    const MockComponent2 = vi.fn(() => 'BBB');

    const result = render(createMemoElement(MockComponent1), { wrapper: StrictMode });

    result.rerender(createMemoElement(MockComponent2));

    expect(result.container.innerHTML).toBe('BBB');
    expect(MockComponent1).toHaveBeenCalledTimes(2);
    expect(MockComponent2).toHaveBeenCalledTimes(2);
  });
});
