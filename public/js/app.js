import { GAMES, gameById, toCm360, conversions } from './sens.js';
import { createSearch, estimateBest, evalQuadratic } from './optimizer.js';
import { createTrainer } from './trainer.js';
import { buildSummary, requestCoaching } from './summary.js';

const STORAGE_KEY = 'sensfinder.setup';
const MIN_CM = 8;
const MAX_CM = 150;

const $ = (sel) => document.querySelector(sel);
const screens = { setup: $('#setup'), play: $('#play'), results: $('#results') };
const form = $('#setup-form');

let trainer = null;
let lastSession = null;

function show(name) {
  for (const [key, el] of Object.entries(screens)) el.hidden = key !== name;
  if (name === 'play') trainer?.resize();
}

function loadSetup() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

function saveSetup(setup) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(setup));
  } catch {
    // Storage is optional.
  }
}

function readForm() {
  const data = new FormData(form);
  const game = gameById(data.get('game'));
  const sens = Number(data.get('sens'));
  const dpi = Number(data.get('dpi'));
  return {
    game: game.id,
    sens,
    dpi,
    rounds: Number(data.get('rounds')),
    targets: Number(data.get('targets')),
    warmup: data.get('warmup') === 'on',
    cm360: sens > 0 && dpi > 0 ? toCm360(dpi, sens, game.yaw) : null,
  };
}

function initForm() {
  const select = form.elements.game;
  for (const g of GAMES) select.add(new Option(g.name, g.id));
  const saved = { game: 'cs2', sens: 1, dpi: 800, rounds: 7, targets: 10, warmup: true, ...loadSetup() };
  select.value = saved.game;
  form.elements.sens.value = saved.sens;
  form.elements.dpi.value = saved.dpi;
  form.elements.rounds.value = saved.rounds;
  form.elements.targets.value = saved.targets;
  form.elements.warmup.checked = saved.warmup;
  updateCurrent();
}

function updateCurrent() {
  const { cm360 } = readForm();
  $('#current-cm').textContent = cm360 ? `Your current sensitivity: ${cm360.toFixed(1)} cm/360` : '';
}

const clamp = (x) => Math.min(MAX_CM, Math.max(MIN_CM, x));

async function runTest(setup, range) {
  show('play');
  trainer ??= createTrainer($('#scene'));
  const search = createSearch({ ...range, rounds: setup.rounds });
  const rounds = [];
  let message = 'The sensitivity changes every round and stays hidden so it does not bias you.';

  if (setup.warmup) {
    await trainer.runRound({ cm360: setup.cm360, dpi: setup.dpi, targets: setup.targets, label: 'Warm-up', message });
    message = 'Warm-up done. Scored rounds start now.';
  }

  for (let i = 1; !search.done; i++) {
    const cm360 = search.next();
    const result = await trainer.runRound({
      cm360,
      dpi: setup.dpi,
      targets: setup.targets,
      label: `Round ${i}/${setup.rounds}`,
      message,
    });
    search.report(result.score);
    rounds.push({ round: i, cm360, ...result });
    message = `Last round: ${result.hits}/${result.clicks} clicks hit, median ${Math.round(result.medianTimeMs)} ms.`;
  }

  const best = estimateBest(search.samples);
  lastSession = { setup, range, rounds, best };
  renderResults(lastSession);
  show('results');
}

function renderResults(session) {
  const { setup, rounds, best } = session;
  $('#best-cm').textContent = best.cm360.toFixed(1);
  $('#dpi-label').textContent = setup.dpi;

  const convBody = $('#conversions tbody');
  convBody.replaceChildren(
    ...conversions(best.cm360, setup.dpi).map((g) => row([g.name, g.sens.toFixed(3)], g.id === setup.game)),
  );

  const roundBody = $('#rounds-table tbody');
  roundBody.replaceChildren(
    ...[...rounds]
      .sort((a, b) => a.cm360 - b.cm360)
      .map((r) =>
        row([
          r.cm360.toFixed(1),
          r.score.toFixed(0),
          `${Math.round(r.accuracy * 100)}%`,
          `${Math.round(r.medianTimeMs)} ms`,
          `${Math.round(r.overshootRate * 100)}%`,
          `${Math.round(r.undershootRate * 100)}%`,
        ]),
      ),
  );

  $('#summary').textContent = buildSummary(session);
  $('#coach-out').textContent = '';
  $('#coach-btn').disabled = false;
  drawChart(session);
}

function row(cells, highlight = false) {
  const tr = document.createElement('tr');
  if (highlight) tr.className = 'highlight';
  for (const c of cells) {
    const td = document.createElement('td');
    td.textContent = c;
    tr.append(td);
  }
  return tr;
}

function drawChart({ rounds, best, range }) {
  const canvas = $('#chart');
  const css = getComputedStyle(document.documentElement);
  const color = (name) => css.getPropertyValue(name).trim();
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);

  const pad = { l: 44, r: 16, t: 16, b: 36 };
  const lo = Math.log(Math.min(range.min, ...rounds.map((r) => r.cm360)));
  const hi = Math.log(Math.max(range.max, ...rounds.map((r) => r.cm360)));
  const maxScore = Math.max(...rounds.map((r) => r.score)) * 1.15;
  const x = (cm360) => pad.l + ((Math.log(cm360) - lo) / (hi - lo)) * (w - pad.l - pad.r);
  const y = (score) => h - pad.b - (Math.max(0, score) / maxScore) * (h - pad.t - pad.b);

  ctx.strokeStyle = color('--border');
  ctx.fillStyle = color('--muted');
  ctx.font = '12px system-ui, sans-serif';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad.l, pad.t);
  ctx.lineTo(pad.l, h - pad.b);
  ctx.lineTo(w - pad.r, h - pad.b);
  ctx.stroke();
  ctx.textAlign = 'center';
  for (const tick of [10, 15, 20, 30, 40, 50, 70, 100, 150]) {
    if (Math.log(tick) < lo || Math.log(tick) > hi) continue;
    ctx.fillText(String(tick), x(tick), h - pad.b + 16);
  }
  ctx.fillText('cm/360 (slower →)', (pad.l + w - pad.r) / 2, h - 4);
  ctx.save();
  ctx.translate(12, (pad.t + h - pad.b) / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('score', 0, 0);
  ctx.restore();

  if (best.fit && best.fit.p2 < 0) {
    ctx.strokeStyle = color('--accent');
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const cm360 = Math.exp(lo + ((hi - lo) * i) / 60);
      const py = y(evalQuadratic(best.fit, cm360));
      if (i === 0) ctx.moveTo(x(cm360), py);
      else ctx.lineTo(x(cm360), py);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = color('--fg');
  for (const r of rounds) {
    ctx.beginPath();
    ctx.arc(x(r.cm360), y(r.score), 4, 0, 2 * Math.PI);
    ctx.fill();
  }

  ctx.strokeStyle = color('--accent');
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x(best.cm360), pad.t);
  ctx.lineTo(x(best.cm360), h - pad.b);
  ctx.stroke();
  ctx.setLineDash([]);
}

form.addEventListener('input', updateCurrent);
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const setup = readForm();
  if (!setup.cm360) return;
  saveSetup(setup);
  runTest(setup, { min: clamp(setup.cm360 / 2), max: clamp(setup.cm360 * 2) });
});

$('#retest').addEventListener('click', () => {
  const { setup, best } = lastSession;
  runTest(setup, { min: clamp(best.cm360 / 1.3), max: clamp(best.cm360 * 1.3) });
});

$('#restart').addEventListener('click', () => show('setup'));

$('#coach-btn').addEventListener('click', async () => {
  const btn = $('#coach-btn');
  const out = $('#coach-out');
  btn.disabled = true;
  out.textContent = 'Asking the coach…';
  const { setup, range, rounds, best } = lastSession;
  try {
    out.textContent = await requestCoaching({
      game: gameById(setup.game).name,
      dpi: setup.dpi,
      currentSens: setup.sens,
      currentCm360: setup.cm360,
      testedRange: range,
      recommendedCm360: best.cm360,
      estimateMethod: best.method,
      conversions: conversions(best.cm360, setup.dpi).map((g) => ({ game: g.name, sens: g.sens })),
      rounds: rounds.map(({ details, ...r }) => r),
    });
  } catch (err) {
    out.textContent = err.message;
    btn.disabled = false;
  }
});

window.addEventListener('resize', () => {
  if (!screens.results.hidden && lastSession) drawChart(lastSession);
});

initForm();
