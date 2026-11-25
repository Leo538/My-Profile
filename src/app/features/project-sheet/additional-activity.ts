export type IrrigationLevel = 'short' | 'medium' | 'long';

type Membership = readonly number[];
const soil: readonly Membership[] = [
  [0, 0, 15, 28],
  [22, 36, 50],
  [44, 56, 64, 64],
];
const temperature: readonly Membership[] = [
  [0, 0, 12, 20],
  [18, 25, 32],
  [30, 38, 50, 50],
];
const humidity: readonly Membership[] = [
  [0, 0, 30, 45],
  [40, 60, 80],
  [70, 85, 100, 100],
];
const radiation: readonly Membership[] = [
  [0, 0, 300, 700],
  [500, 1000, 1500],
  [1300, 1700, 2000, 2000],
];
const outputs: readonly Membership[] = [
  [0, 0, 4, 10],
  [8, 15, 22],
  [20, 26, 30, 30],
];
const levels: readonly IrrigationLevel[] = ['short', 'medium', 'long'];

export function clamp(value: number, min: number, max: number): number {
  return Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : min;
}

function membership(value: number, points: Membership): number {
  if (points.length === 3) {
    const [a, b, c] = points;
    if (value === b) return 1;
    if (value > a && value < b) return (value - a) / (b - a);
    if (value > b && value < c) return (c - value) / (c - b);
    return 0;
  }
  const [a, b, c, d] = points;
  if (value >= b && value <= c) return 1;
  if (value > a && value < b) return (value - a) / (b - a);
  if (value > c && value < d) return (d - value) / (d - c);
  return 0;
}

/** Port of the repository's default membership/rule/Mamdani model.
 * Source: Sistema_Riego-IA commit 00adbfeb, logica/fuzzy/{membresia,reglas,inferencia}.py.
 * This preview uses the base parameters; it does not run the genetic optimizer. */
export function calculateIrrigation(
  soilHumidity: number,
  airTemperature: number,
  relativeHumidity = 60,
  par = 1000,
): { minutes: number; level: IrrigationLevel } {
  const degrees = [
    soil.map((shape) => membership(clamp(soilHumidity, 0, 64), shape)),
    temperature.map((shape) => membership(clamp(airTemperature, 0, 50), shape)),
    humidity.map((shape) => membership(clamp(relativeHumidity, 0, 100), shape)),
    radiation.map((shape) => membership(clamp(par, 0, 2000), shape)),
  ];
  const activations = [0, 0, 0];
  for (let s = 0; s < 3; s++)
    for (let t = 0; t < 3; t++)
      for (let h = 0; h < 3; h++)
        for (let p = 0; p < 3; p++) {
          const score = 2 - s + t + (2 - h) + p;
          const output = score <= 2 ? 0 : score <= 5 ? 1 : 2;
          activations[output] = Math.max(
            activations[output],
            Math.min(degrees[0][s], degrees[1][t], degrees[2][h], degrees[3][p]),
          );
        }
  let area = 0;
  let moment = 0;
  let previous = 0;
  for (let index = 0; index <= 600; index++) {
    const x = index * 0.05;
    const value = Math.max(
      ...outputs.map((shape, output) => Math.min(membership(x, shape), activations[output])),
    );
    if (index > 0) {
      area += (previous + value) * 0.025;
      moment += ((x - 0.05) * previous + x * value) * 0.025;
    }
    previous = value;
  }
  const minutes = area > 1e-9 ? moment / area : 15;
  const outputDegrees = outputs.map((shape) => membership(minutes, shape));
  const level = levels[outputDegrees.indexOf(Math.max(...outputDegrees))];
  return { minutes, level };
}

export function calculateOrderTotal(quantity: number, price = 1.5): number {
  return Math.round(Math.trunc(clamp(quantity, 1, 12)) * price * 100) / 100;
}

export function nextOrderStage(stage: number): number {
  return Math.min(3, Math.max(0, Math.trunc(stage)) + 1);
}

export function adjustChannel(value: number, percentage: number): number {
  return Math.min(255, Math.floor((clamp(value, 0, 255) * clamp(percentage, 0, 200)) / 100));
}
