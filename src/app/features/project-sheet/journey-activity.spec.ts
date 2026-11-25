import { describe, expect, it } from 'vitest';
import {
  appendSimulatedTransmission,
  createJourneyActivityState,
} from '../journey-map/journey-activity';

describe('Actividad de la torre', () => {
  it('permite el quinto mensaje y bloquea el sexto al continuar un registro guardado', () => {
    let transmissions = createJourneyActivityState().transmissions;
    for (let attempt = 0; attempt < 5; attempt++) {
      transmissions = appendSimulatedTransmission(transmissions);
    }
    expect(transmissions).toHaveLength(5);
    expect(transmissions.every((entry) => entry.accepted)).toBe(true);
    expect(transmissions.at(-1)?.seconds).toBe(8);
    const restored = JSON.parse(JSON.stringify(transmissions));
    const complete = appendSimulatedTransmission(restored);
    expect(complete).toHaveLength(6);
    expect(complete.at(-1)).toEqual({
      index: 6,
      ip: '192.0.2.38',
      seconds: 9,
      accepted: false,
    });
    expect(appendSimulatedTransmission(complete)).toEqual(complete);
  });

  it('reinicia la simulación sin conservar los intentos ni modificar la sesión anterior', () => {
    let original = createJourneyActivityState().transmissions;
    for (let attempt = 0; attempt < 6; attempt++) {
      original = appendSimulatedTransmission(original);
    }
    const reset = createJourneyActivityState();
    expect(reset.policyStage).toBe(0);
    expect(reset.transmissions).toEqual([]);
    expect(appendSimulatedTransmission(reset.transmissions)[0].accepted).toBe(true);
    expect(original).toHaveLength(6);
    expect(original.at(-1)?.accepted).toBe(false);
  });
});
