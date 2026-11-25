import { describe, expect, it } from 'vitest';
import {
  SlipperAction,
  advanceSlipperDemo,
  createSlipperDemo,
  recommendIotIrrigation,
} from './new-project-activity';

describe('Vinculación: reglas originales de riego IoT', () => {
  it('respeta los umbrales de humedad y la lluvia redondeada del proyecto', () => {
    expect(recommendIotIrrigation(29, 39)).toBe('irrigate');
    expect(recommendIotIrrigation(29, 39.5)).toBe('wait');
    expect(recommendIotIrrigation(29, 40)).toBe('wait');
    expect(recommendIotIrrigation(30, 0)).toBe('adequate');
    expect(recommendIotIrrigation(60, 100)).toBe('adequate');
    expect(recommendIotIrrigation(61, 100)).toBe('wet');
  });
  it('representa falta de sensor y acota la probabilidad como la función original', () => {
    expect(recommendIotIrrigation(null, 0)).toBe('unavailable');
    expect(recommendIotIrrigation(Number.NaN, 0)).toBe('unavailable');
    expect(recommendIotIrrigation(10, -20)).toBe('irrigate');
    expect(recommendIotIrrigation(10, 120)).toBe('wait');
    expect(recommendIotIrrigation(10, Number.NaN)).toBe('irrigate');
  });
});

describe('Pantufladas: recorrido de inventario ficticio', () => {
  const actions: SlipperAction[] = ['receive-batch', 'dispatch', 'receive-transfer', 'sell'];
  it('conserva los doce pares entre ubicaciones y vendidos, y registra USD 18 una vez', () => {
    let state = createSlipperDemo();
    for (const action of actions) {
      state = advanceSlipperDemo(state, action);
      expect(state.warehouse + state.transit + state.local + state.sold).toBe(12);
      for (const stock of [state.warehouse, state.transit, state.local, state.sold])
        expect(stock).toBeGreaterThanOrEqual(0);
    }
    expect(state).toEqual({ stage: 'sold', warehouse: 6, transit: 0, local: 5, sold: 1, cashCents: 1800 });
    expect(advanceSlipperDemo(state, 'sell')).toBe(state);
    expect(createSlipperDemo()).toEqual({ stage: 'awaiting', warehouse: 0, transit: 0, local: 0, sold: 0, cashCents: 0 });
  });
  it('rechaza etapas fuera de orden, doble recepción y stocks insuficientes', () => {
    const initial = createSlipperDemo();
    for (const action of actions.slice(1)) expect(advanceSlipperDemo(initial, action)).toBe(initial);
    const received = advanceSlipperDemo(initial, 'receive-batch');
    expect(advanceSlipperDemo(received, 'receive-batch')).toBe(received);
    const insufficientWarehouse = { ...received, warehouse: 5 };
    expect(advanceSlipperDemo(insufficientWarehouse, 'dispatch')).toBe(insufficientWarehouse);
    const emptyLocal = { ...initial, stage: 'local' as const };
    expect(advanceSlipperDemo(emptyLocal, 'sell')).toBe(emptyLocal);
  });
});
