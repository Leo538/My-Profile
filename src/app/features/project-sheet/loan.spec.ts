import { describe, expect, it } from 'vitest';
import { calculateLoan } from './loan';

describe('Comparación de amortización', () => {
  it('actualiza ambas cuotas al cambiar el plazo y conserva el capital del ejemplo', () => {
    for (const system of ['french', 'german'] as const) {
      let previousPayment = Infinity;
      for (const months of [6, 12, 24, 36]) {
        const loan = calculateLoan(10000, 12, months, system);
        expect(loan.rows).toHaveLength(months);
        expect(loan.rows[0].payment).toBeLessThan(previousPayment);
        expect(loan.rows.at(-1)?.balance).toBe(0);
        expect(loan.rows.reduce((sum, row) => sum + row.principal, 0)).toBeCloseTo(10000, 2);
        previousPayment = loan.rows[0].payment;
      }
    }
  });
  it('compara el mismo capital y termina con saldo cero en ambos sistemas', () => {
    for (const system of ['french', 'german'] as const) {
      const loan = calculateLoan(10000, 12, 12, system);
      expect(loan.rows).toHaveLength(12);
      expect(loan.rows.at(-1)?.balance).toBe(0);
      expect(loan.rows.reduce((sum, row) => sum + row.principal, 0)).toBeCloseTo(10000, 2);
      expect(loan.totalPaid).toBeCloseTo(10000 + loan.totalInterest, 2);
    }
  });

  it('mantiene cuotas francesas y reduce las alemanas con menor interés total', () => {
    const french = calculateLoan(10000, 12, 12, 'french');
    const german = calculateLoan(10000, 12, 12, 'german');
    expect(french.rows[0].payment).toBeCloseTo(french.rows[10].payment, 1);
    expect(german.rows[0].payment).toBeGreaterThan(german.rows[11].payment);
    expect(german.totalInterest).toBeLessThan(french.totalInterest);
  });

  it('reparte el capital con interés cero y absorbe el redondeo en la última cuota', () => {
    const loan = calculateLoan(100, 0, 3, 'french');
    expect(loan.totalInterest).toBe(0);
    expect(loan.rows.map((row) => row.payment)).toEqual([33.33, 33.33, 33.34]);
    expect(loan.rows[2].balance).toBe(0);
  });
});
