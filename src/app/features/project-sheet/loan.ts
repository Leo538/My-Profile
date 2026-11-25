export type AmortizationSystem = 'french' | 'german';

export interface LoanPayment {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface LoanSchedule {
  rows: LoanPayment[];
  totalInterest: number;
  totalPaid: number;
}

const roundMoney = (amount: number): number => Math.round((amount + Number.EPSILON) * 100) / 100;

/** Annual nominal rate, monthly payments and amounts rounded to cents. */
export function calculateLoan(
  principal: number,
  annualRate: number,
  months: number,
  system: AmortizationSystem,
): LoanSchedule {
  if (
    !Number.isFinite(principal) ||
    principal <= 0 ||
    !Number.isFinite(annualRate) ||
    annualRate < 0 ||
    !Number.isInteger(months) ||
    months < 1
  ) {
    throw new RangeError(
      'El capital y los meses deben ser positivos y la tasa no puede ser negativa.',
    );
  }
  const monthlyRate = annualRate / 12 / 100;
  const fixedPayment =
    monthlyRate === 0
      ? principal / months
      : (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
  const fixedPrincipal = roundMoney(principal / months);
  const rows: LoanPayment[] = [];
  let balance = roundMoney(principal);

  for (let month = 1; month <= months; month++) {
    const interest = roundMoney(balance * monthlyRate);
    let principalPayment =
      system === 'german' ? fixedPrincipal : roundMoney(fixedPayment - interest);
    principalPayment = Math.min(principalPayment, balance);
    if (month === months) principalPayment = balance;
    balance = roundMoney(balance - principalPayment);
    rows.push({
      month,
      payment: roundMoney(principalPayment + interest),
      principal: principalPayment,
      interest,
      balance,
    });
  }

  const totalInterest = roundMoney(rows.reduce((total, row) => total + row.interest, 0));
  return { rows, totalInterest, totalPaid: roundMoney(principal + totalInterest) };
}
