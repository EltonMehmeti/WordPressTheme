import test from 'node:test';
import assert from 'node:assert/strict';
import { toCm360, fromCm360, degreesPerCount, gameById, conversions } from '../public/js/sens.js';

test('CS2 at 800 DPI and sens 1 is about 52 cm/360', () => {
  assert.ok(Math.abs(toCm360(800, 1, gameById('cs2').yaw) - 51.95) < 0.01);
});

test('fromCm360 inverts toCm360', () => {
  const yaw = gameById('valorant').yaw;
  const cm = toCm360(1600, 0.35, yaw);
  assert.ok(Math.abs(fromCm360(cm, 1600, yaw) - 0.35) < 1e-9);
});

test('CS2 to Valorant uses the usual 3.18 ratio', () => {
  const conv = Object.fromEntries(conversions(toCm360(800, 1, 0.022), 800).map((g) => [g.id, g.sens]));
  assert.ok(Math.abs(conv.cs2 / conv.valorant - 0.07 / 0.022) < 1e-9);
});

test('one cm/360 worth of counts turns exactly 360 degrees', () => {
  const cm360 = 40;
  const dpi = 800;
  const counts = (cm360 / 2.54) * dpi;
  assert.ok(Math.abs(counts * degreesPerCount(cm360, dpi) - 360) < 1e-9);
});
