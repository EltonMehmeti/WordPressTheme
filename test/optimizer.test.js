import test from 'node:test';
import assert from 'node:assert/strict';
import { createSearch, estimateBest, fitQuadratic } from '../public/js/optimizer.js';

// Score that peaks at `peak` cm/360, falling off with log distance.
const scoreAt = (peak) => (cm360) => 100 - 80 * Math.log(cm360 / peak) ** 2;

function run(score, { min = 20, max = 80, rounds = 8 } = {}) {
  const search = createSearch({ min, max, rounds });
  while (!search.done) search.report(score(search.next()));
  return search;
}

test('search tests the requested number of rounds inside the range', () => {
  const search = run(scoreAt(40));
  assert.equal(search.samples.length, 8);
  assert.equal(search.next(), null);
  for (const s of search.samples) assert.ok(s.cm360 > 20 && s.cm360 < 80);
});

test('search and fit find the peak of a clean curve', () => {
  for (const peak of [25, 40, 65]) {
    const best = estimateBest(run(scoreAt(peak)).samples);
    assert.equal(best.method, 'fit');
    assert.ok(Math.abs(best.cm360 / peak - 1) < 0.02, `peak ${peak}, got ${best.cm360}`);
  }
});

test('noisy scores still land near the peak', () => {
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) - 0.5;
  const noisy = (cm360) => scoreAt(40)(cm360) + rand() * 6;
  const best = estimateBest(run(noisy, { rounds: 10 }).samples);
  assert.ok(Math.abs(best.cm360 / 40 - 1) < 0.15, `got ${best.cm360}`);
});

test('falls back to the best round when the fit is not concave', () => {
  const samples = [
    { cm360: 20, score: 50 },
    { cm360: 30, score: 40 },
    { cm360: 45, score: 45 },
    { cm360: 60, score: 70 },
  ];
  const best = estimateBest(samples);
  assert.equal(best.method, 'best-round');
  assert.equal(best.cm360, 60);
});

test('fit needs three distinct sensitivities', () => {
  assert.equal(fitQuadratic([{ cm360: 30, score: 1 }, { cm360: 30, score: 2 }, { cm360: 40, score: 3 }]), null);
});
