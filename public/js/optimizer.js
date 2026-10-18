// Picks which sensitivity to test next and estimates the best one.
// The search runs in log(cm/360) space, so "twice as fast" and "twice as slow"
// are the same distance from the starting point.

const PHI = (Math.sqrt(5) - 1) / 2;

// Golden-section search for the maximum score. Each round is one evaluation,
// so it is driven step by step: next() -> play a round -> report(score).
export function createSearch({ min, max, rounds }) {
  let a = Math.log(min);
  let b = Math.log(max);
  let c = b - PHI * (b - a);
  let d = a + PHI * (b - a);
  let fc = null;
  let fd = null;
  let pending = 'c';
  const samples = [];

  return {
    samples,
    get done() {
      return samples.length >= rounds;
    },
    next() {
      if (samples.length >= rounds) return null;
      return Math.exp(pending === 'c' ? c : d);
    },
    report(score) {
      samples.push({ cm360: Math.exp(pending === 'c' ? c : d), score });
      if (pending === 'c') fc = score;
      else fd = score;

      if (fc === null) {
        pending = 'c';
      } else if (fd === null) {
        pending = 'd';
      } else if (fc >= fd) {
        b = d;
        d = c;
        fd = fc;
        c = b - PHI * (b - a);
        fc = null;
        pending = 'c';
      } else {
        a = c;
        c = d;
        fc = fd;
        d = a + PHI * (b - a);
        fd = null;
        pending = 'd';
      }
    },
  };
}

// Least-squares fit of score = p0 + p1*x + p2*x^2 with x = log(cm/360).
export function fitQuadratic(samples) {
  const pts = samples.map((s) => [Math.log(s.cm360), s.score]);
  if (new Set(pts.map((p) => p[0].toFixed(6))).size < 3) return null;

  // Normal equations: sum of x^(i+j) times p = sum of y*x^i.
  const m = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  const v = [0, 0, 0];
  for (const [x, y] of pts) {
    const pow = [1, x, x * x, x * x * x, x * x * x * x];
    for (let i = 0; i < 3; i++) {
      v[i] += y * pow[i];
      for (let j = 0; j < 3; j++) m[i][j] += pow[i + j];
    }
  }
  const p = solve3(m, v);
  return p && { p0: p[0], p1: p[1], p2: p[2] };
}

export function evalQuadratic(fit, cm360) {
  const x = Math.log(cm360);
  return fit.p0 + fit.p1 * x + fit.p2 * x * x;
}

// Best sensitivity from all rounds. A concave fit smooths out the noise of
// single rounds; otherwise fall back to the best round.
export function estimateBest(samples) {
  if (samples.length === 0) return null;
  const bestSample = samples.reduce((acc, s) => (s.score > acc.score ? s : acc));
  const fit = fitQuadratic(samples);
  if (fit && fit.p2 < 0) {
    const xs = samples.map((s) => Math.log(s.cm360));
    const vertex = -fit.p1 / (2 * fit.p2);
    if (vertex >= Math.min(...xs) && vertex <= Math.max(...xs)) {
      return { cm360: Math.exp(vertex), method: 'fit', fit };
    }
  }
  return { cm360: bestSample.cm360, method: 'best-round', fit };
}

function solve3(m, v) {
  const a = m.map((row, i) => [...row, v[i]]);
  for (let col = 0; col < 3; col++) {
    let pivot = col;
    for (let r = col + 1; r < 3; r++) {
      if (Math.abs(a[r][col]) > Math.abs(a[pivot][col])) pivot = r;
    }
    if (Math.abs(a[pivot][col]) < 1e-12) return null;
    [a[col], a[pivot]] = [a[pivot], a[col]];
    for (let r = 0; r < 3; r++) {
      if (r === col) continue;
      const f = a[r][col] / a[col][col];
      for (let k = col; k < 4; k++) a[r][k] -= f * a[col][k];
    }
  }
  return [a[0][3] / a[0][0], a[1][3] / a[1][1], a[2][3] / a[2][2]];
}
