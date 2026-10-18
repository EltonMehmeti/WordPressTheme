// Plain-language read of the results, plus the optional AI coach call.

const pct = (x) => `${Math.round(x * 100)}%`;
const cm = (x) => `${x.toFixed(1)} cm/360`;

export function buildSummary(session) {
  const { rounds, best, setup, range } = session;
  const sorted = [...rounds].sort((a, b) => a.cm360 - b.cm360);
  const top = rounds.reduce((acc, r) => (r.score > acc.score ? r : acc));
  const lines = [];

  lines.push(
    best.method === 'fit'
      ? `Your scores peak around ${cm(best.cm360)} (curve fitted across all ${rounds.length} rounds).`
      : `Your best round was at ${cm(best.cm360)}. The scores were too noisy to fit a clear curve, so treat this as a rough pick.`,
  );

  const change = best.cm360 / setup.cm360;
  if (Math.abs(change - 1) < 0.08) {
    lines.push(`That is close to your current ${cm(setup.cm360)}, so your sensitivity is already a good fit.`);
  } else {
    const dir = change > 1 ? 'slower' : 'faster';
    lines.push(`That is about ${pct(Math.abs(change - 1))} ${dir} than your current ${cm(setup.cm360)}.`);
  }

  const fast = sorted[0];
  const slow = sorted[sorted.length - 1];
  if (fast.overshootRate > slow.overshootRate + 0.15) {
    lines.push(
      `At the fastest setting you tested (${cm(fast.cm360)}) your first stop went past the target ${pct(fast.overshootRate)} of the time, against ${pct(slow.overshootRate)} at the slowest.`,
    );
  }
  if (slow.undershootRate > fast.undershootRate + 0.15) {
    lines.push(
      `At the slowest setting (${cm(slow.cm360)}) you stopped short ${pct(slow.undershootRate)} of the time and needed a second correction.`,
    );
  }

  const nearEdge = best.cm360 < range.min * 1.1 || best.cm360 > range.max * 0.9;
  if (nearEdge) {
    lines.push('The best value sits near the edge of the tested range. Run a retest around it to make sure the real peak is not outside.');
  }
  lines.push(`Top round: ${top.hits}/${top.clicks} clicks hit, median ${Math.round(top.medianTimeMs)} ms per target.`);
  if (rounds.some((r) => r.rawInput === false)) {
    lines.push('Note: your browser did not give raw mouse input, so OS pointer acceleration may have skewed the test. Chrome or Edge give the most accurate results.');
  }
  return lines.join(' ');
}

export async function requestCoaching(payload) {
  let res;
  try {
    res = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error('Could not reach the server. Start it with "npm start" to use the AI coach.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Coach request failed (${res.status}).`);
  return data.text;
}
