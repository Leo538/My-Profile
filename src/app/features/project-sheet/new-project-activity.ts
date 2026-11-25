export type IotIrrigationDecision = 'irrigate' | 'wait' | 'adequate' | 'wet' | 'unavailable';

function percent(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0;
}

/** Decision thresholds from Vinculacion-Sistema-Riego's irrigationRecommendation.ts. */
export function recommendIotIrrigation(
  soil: number | null,
  rainProbability: number,
): IotIrrigationDecision {
  if (soil === null || !Number.isFinite(soil)) return 'unavailable';
  const rain = percent(rainProbability);
  if (soil < 30) return rain < 40 ? 'irrigate' : 'wait';
  return soil <= 60 ? 'adequate' : 'wet';
}

export const DEMO_BATCH_PAIRS = 12;
export const DEMO_TRANSFER_PAIRS = 6;
export const DEMO_SALE_CENTS = 1800;
export type SlipperStage = 'awaiting' | 'warehouse' | 'transit' | 'local' | 'sold';
export type SlipperAction = 'receive-batch' | 'dispatch' | 'receive-transfer' | 'sell';
export interface SlipperDemoState {
  readonly stage: SlipperStage;
  readonly warehouse: number;
  readonly transit: number;
  readonly local: number;
  readonly sold: number;
  readonly cashCents: number;
}

export function createSlipperDemo(): SlipperDemoState {
  return { stage: 'awaiting', warehouse: 0, transit: 0, local: 0, sold: 0, cashCents: 0 };
}

/** A local teaching example: no requests, real stock mutations or production pricing. */
export function advanceSlipperDemo(
  state: SlipperDemoState,
  action: SlipperAction,
): SlipperDemoState {
  switch (action) {
    case 'receive-batch':
      return state.stage === 'awaiting'
        ? { ...state, stage: 'warehouse', warehouse: state.warehouse + DEMO_BATCH_PAIRS }
        : state;
    case 'dispatch':
      return state.stage === 'warehouse' && state.warehouse >= DEMO_TRANSFER_PAIRS
        ? {
            ...state,
            stage: 'transit',
            warehouse: state.warehouse - DEMO_TRANSFER_PAIRS,
            transit: state.transit + DEMO_TRANSFER_PAIRS,
          }
        : state;
    case 'receive-transfer':
      return state.stage === 'transit' && state.transit >= DEMO_TRANSFER_PAIRS
        ? {
            ...state,
            stage: 'local',
            transit: state.transit - DEMO_TRANSFER_PAIRS,
            local: state.local + DEMO_TRANSFER_PAIRS,
          }
        : state;
    case 'sell':
      return state.stage === 'local' && state.local >= 1
        ? {
            ...state,
            stage: 'sold',
            local: state.local - 1,
            sold: state.sold + 1,
            cashCents: state.cashCents + DEMO_SALE_CENTS,
          }
        : state;
  }
}
