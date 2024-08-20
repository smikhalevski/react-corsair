import { createSlotManager } from '../../main/___/createSlotManager';

describe('createSlotManager', () => {
  test('', () => {
    const manager = createSlotManager(undefined, {});

    expect(manager.routeState).toEqual({ status: 'notFound' });
  });
});
