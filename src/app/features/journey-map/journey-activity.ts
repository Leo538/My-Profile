import { Submission, SubmissionLimiter } from '../explore/challenge';

export interface JourneyActivityState {
  policyStage: number;
  transmissions: readonly Submission[];
}

export function createJourneyActivityState(): JourneyActivityState {
  return { policyStage: 0, transmissions: [] };
}

const TRANSMISSION_TIMES = [0, 2, 4, 6, 8, 9] as const;
const EXAMPLE_IP = '192.0.2.38';

/** Rebuild the short simulation from its accepted history, including after reopening a sheet. */
export function appendSimulatedTransmission(entries: readonly Submission[]): Submission[] {
  const count = Math.min(entries.length + 1, TRANSMISSION_TIMES.length);
  const limiter = new SubmissionLimiter();
  return TRANSMISSION_TIMES.slice(0, count).map((seconds, index) => ({
    index: index + 1,
    ip: EXAMPLE_IP,
    seconds,
    accepted: limiter.send(EXAMPLE_IP, seconds),
  }));
}
