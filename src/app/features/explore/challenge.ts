export type Diagnosis = 'length' | 'connection' | 'rate-limit';

export interface Submission {
  index: number;
  ip: string;
  seconds: number;
  accepted: boolean;
}

/** Sliding window for the local simulation. Rejected attempts do not consume quota. */
export class SubmissionLimiter {
  private accepted: { ip: string; seconds: number }[] = [];

  constructor(
    readonly limit = 5,
    readonly windowSeconds = 10,
  ) {}

  send(ip: string, seconds: number): boolean {
    this.accepted = this.accepted.filter((item) => seconds - item.seconds < this.windowSeconds);
    const allowed = this.accepted.filter((item) => item.ip === ip).length < this.limit;
    if (allowed) this.accepted.push({ ip, seconds });
    return allowed;
  }

  reset(): void {
    this.accepted = [];
  }
}

export class StationChallenge {
  readonly limiter = new SubmissionLimiter();
  submissions: Submission[] = [];
  solved = false;
  feedback = '';

  constructor() {
    this.reset();
  }

  answer(diagnosis: Diagnosis): void {
    this.solved = diagnosis === 'rate-limit';
    this.feedback = this.solved
      ? 'Diagnóstico correcto. El sexto envío supera el límite de la misma IP.'
      : 'Revisa los tiempos y la IP. Los mensajes son cortos y la conexión sigue activa. Puedes intentarlo de nuevo.';
  }

  reset(): void {
    this.limiter.reset();
    this.solved = false;
    this.feedback = '';
    this.submissions = [0, 2, 4, 6, 8, 9].map((seconds, index) => ({
      index: index + 1,
      ip: '192.0.2.38',
      seconds,
      accepted: this.limiter.send('192.0.2.38', seconds),
    }));
  }
}
