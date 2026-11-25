import { describe, expect, it } from 'vitest';
import { StationChallenge, SubmissionLimiter } from './challenge';

describe('Estación Ambato · límite por IP', () => {
  it('acepta el quinto y bloquea el sexto envío dentro de diez segundos', () => {
    const challenge = new StationChallenge();
    expect(challenge.submissions[4].accepted).toBe(true);
    expect(challenge.submissions[5].accepted).toBe(false);
    expect(challenge.submissions.every((item) => item.ip === '192.0.2.38')).toBe(true);
  });
  it('permite reintentar una respuesta incorrecta y resolver', () => {
    const challenge = new StationChallenge();
    challenge.answer('length');
    expect(challenge.solved).toBe(false);
    challenge.answer('connection');
    expect(challenge.solved).toBe(false);
    challenge.answer('rate-limit');
    expect(challenge.solved).toBe(true);
  });
  it('reinicia el estado, los seis envíos y la cuota', () => {
    const challenge = new StationChallenge();
    challenge.answer('rate-limit');
    challenge.reset();
    expect(challenge.solved).toBe(false);
    expect(challenge.feedback).toBe('');
    expect(challenge.submissions.filter((item) => item.accepted)).toHaveLength(5);
  });
  it('libera la ventana a los diez segundos y separa IPs', () => {
    const limiter = new SubmissionLimiter();
    for (let index = 0; index < 5; index++) expect(limiter.send('192.0.2.1', 0)).toBe(true);
    expect(limiter.send('192.0.2.1', 9)).toBe(false);
    expect(limiter.send('192.0.2.2', 9)).toBe(true);
    expect(limiter.send('192.0.2.1', 10)).toBe(true);
  });
});
