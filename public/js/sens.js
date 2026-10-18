// Sensitivity math. Everything is expressed in cm/360: how far the mouse
// travels for one full turn. Higher cm/360 = slower sensitivity.

export const GAMES = [
  { id: 'cs2', name: 'Counter-Strike 2', yaw: 0.022 },
  { id: 'valorant', name: 'Valorant', yaw: 0.07 },
  { id: 'apex', name: 'Apex Legends', yaw: 0.022 },
  { id: 'overwatch', name: 'Overwatch 2', yaw: 0.0066 },
];

const CM_PER_INCH = 2.54;

export function gameById(id) {
  return GAMES.find((g) => g.id === id) ?? GAMES[0];
}

export function toCm360(dpi, sens, yaw) {
  return (360 / (dpi * sens * yaw)) * CM_PER_INCH;
}

export function fromCm360(cm360, dpi, yaw) {
  return (360 * CM_PER_INCH) / (cm360 * dpi * yaw);
}

// Degrees of camera rotation per raw mouse count.
export function degreesPerCount(cm360, dpi) {
  return 360 / ((cm360 / CM_PER_INCH) * dpi);
}

export function conversions(cm360, dpi) {
  return GAMES.map((g) => ({ ...g, sens: fromCm360(cm360, dpi, g.yaw) }));
}
