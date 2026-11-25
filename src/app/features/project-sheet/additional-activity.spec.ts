import { describe, expect, it } from 'vitest';
import {
  adjustChannel,
  calculateIrrigation,
  calculateOrderTotal,
  nextOrderStage,
} from './additional-activity';

describe('Actividades de los proyectos de las terrazas', () => {
  it('reproduce referencias calculadas por el modelo Python original de riego', () => {
    // Original Sistema_Riego-IA: calcular_riego(temp, soil, HR=60, PAR=1000).
    const reference = [
      [36, 25, 15],
      [0, 50, 26.28577380952381],
      [64, 0, 3.7142261904761904],
      [52, 10, 4.08328125],
      [26, 33, 17.97095390372906],
      [45, 19, 12.057072111004695],
    ];
    for (const [soil, temperature, expected] of reference)
      expect(calculateIrrigation(soil, temperature).minutes).toBeCloseTo(expected, 7);
    expect(calculateIrrigation(0, 50).level).toBe('long');
    expect(calculateIrrigation(64, 0).level).toBe('short');
  });
  it('mantiene el modelo acotado incluso con entradas fuera del rango', () => {
    expect(calculateIrrigation(-100, 200)).toEqual(calculateIrrigation(0, 50));
    expect(calculateIrrigation(200, -30)).toEqual(calculateIrrigation(64, 0));
    for (let soil = 0; soil <= 64; soil += 4)
      for (let temperature = 0; temperature <= 50; temperature += 5) {
        const result = calculateIrrigation(soil, temperature);
        expect(result.minutes).toBeGreaterThanOrEqual(0);
        expect(result.minutes).toBeLessThanOrEqual(30);
      }
  });
  it('calcula el importe de un pedido ficticio y finaliza sus etapas', () => {
    expect(calculateOrderTotal(2)).toBe(3);
    expect(calculateOrderTotal(12)).toBe(18);
    expect(calculateOrderTotal(99)).toBe(18);
    let stage = 0;
    for (let step = 0; step < 10; step++) stage = nextOrderStage(stage);
    expect(stage).toBe(3);
  });
  it('ajusta canales como el editor original, conservando el límite de ocho bits', () => {
    expect(adjustChannel(127, 100)).toBe(127);
    expect(adjustChannel(127, 80)).toBe(101);
    expect(adjustChannel(200, 200)).toBe(255);
    expect(adjustChannel(255, 0)).toBe(0);
  });
});
