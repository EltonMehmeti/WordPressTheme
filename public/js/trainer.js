// First-person flick drill on a canvas. Mouse counts are turned into camera
// rotation with the round's cm/360, just like a game does with raw input.

import { degreesPerCount } from './sens.js';

const DEG = Math.PI / 180;
const H_FOV = 103;
const TARGET_RADIUS = 1.6; // degrees
const FLICK_MIN = 10;
const FLICK_MAX = 60;
const PITCH_SPREAD = 12;
const SETTLE_PEAK_SPEED = 40; // deg/s the flick must reach before it can "settle"
const SETTLE_SPEED = 15; // deg/s below which the crosshair counts as stopped
const SETTLE_HOLD_MS = 50;
const LOCK_GRACE_MS = 100; // ignore the movement spike some browsers send on lock

const COLORS = {
  sky: '#10141c',
  grid: 'rgba(160, 180, 210, 0.16)',
  horizon: 'rgba(160, 180, 210, 0.45)',
  target: '#ff5a4e',
  targetEdge: '#ffd0cc',
  crosshair: '#7dffb2',
  text: '#e8edf5',
  muted: '#9aa6b8',
};

function direction(yaw, pitch) {
  const y = yaw * DEG;
  const p = pitch * DEG;
  return [Math.cos(p) * Math.sin(y), Math.sin(p), Math.cos(p) * Math.cos(y)];
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function angleBetween(a, b) {
  return Math.acos(Math.min(1, Math.max(-1, dot(a, b)))) / DEG;
}

function wrapYaw(deg) {
  return ((((deg + 180) % 360) + 360) % 360) - 180;
}

function median(xs) {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function createTrainer(canvas) {
  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let yaw = 0;
  let pitch = 0;
  let locked = false;
  let lockedAt = 0;
  let rawInput = null;
  let round = null;
  let frame = 0;

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  async function requestLock() {
    try {
      await canvas.requestPointerLock({ unadjustedMovement: true });
      rawInput = true;
    } catch {
      // Firefox/Safari don't support unadjusted movement: OS acceleration may apply.
      rawInput = false;
      try {
        await canvas.requestPointerLock();
      } catch {
        // The user can click again.
      }
    }
  }

  function spawnTarget() {
    const dist = FLICK_MIN + Math.random() * (FLICK_MAX - FLICK_MIN);
    const angle = Math.random() * 2 * Math.PI;
    const dYaw = Math.cos(angle) * dist;
    let dPitch = Math.sin(angle) * Math.min(dist, PITCH_SPREAD);
    if (Math.abs(pitch + dPitch) > 45) dPitch = -dPitch;
    const now = performance.now();
    round.target = {
      yaw: wrapYaw(yaw + dYaw),
      pitch: pitch + dPitch,
      spawnedAt: now,
      startYaw: yaw,
      startPitch: pitch,
      distance: angleBetween(direction(yaw, pitch), direction(yaw + dYaw, pitch + dPitch)),
      peakSpeed: 0,
      slowSince: null,
      firstStop: null,
    };
    round.lastYaw = yaw;
    round.lastPitch = pitch;
    round.lastFrameAt = now;
  }

  // How far along the start->target line the crosshair is: 1 = on the target,
  // above 1 = past it.
  function progress(t) {
    const dYaw = wrapYaw(t.yaw - t.startYaw);
    const dPitch = t.pitch - t.startPitch;
    const cYaw = wrapYaw(yaw - t.startYaw);
    const cPitch = pitch - t.startPitch;
    return (cYaw * dYaw + cPitch * dPitch) / (dYaw * dYaw + dPitch * dPitch);
  }

  function classifyStop(t, ratio) {
    const tolerance = TARGET_RADIUS / t.distance;
    if (ratio > 1 + tolerance) return 'over';
    if (ratio < 1 - tolerance) return 'under';
    return 'on';
  }

  function trackSettle(now) {
    const t = round?.target;
    if (!t || t.firstStop) return;
    const dt = now - round.lastFrameAt;
    if (dt <= 0) return;
    const moved = angleBetween(direction(round.lastYaw, round.lastPitch), direction(yaw, pitch));
    const speed = (moved / dt) * 1000;
    round.lastYaw = yaw;
    round.lastPitch = pitch;
    round.lastFrameAt = now;
    t.peakSpeed = Math.max(t.peakSpeed, speed);

    if (t.peakSpeed < SETTLE_PEAK_SPEED || speed >= SETTLE_SPEED) {
      t.slowSince = null;
      return;
    }
    t.slowSince ??= now;
    const ratio = progress(t);
    if (now - t.slowSince >= SETTLE_HOLD_MS && ratio > 0.3) {
      t.firstStop = { ratio, kind: classifyStop(t, ratio) };
    }
  }

  function onMouseMove(e) {
    if (!locked || !round?.target) return;
    if (performance.now() - lockedAt < LOCK_GRACE_MS) return;
    const dpc = round.degPerCount;
    yaw = wrapYaw(yaw + e.movementX * dpc);
    pitch = Math.max(-85, Math.min(85, pitch - e.movementY * dpc));
  }

  function onMouseDown(e) {
    if (e.button !== 0 || !round) return;
    if (!locked) {
      requestLock();
      return;
    }
    const t = round.target;
    if (!t) return;
    round.clicks++;
    const offset = angleBetween(direction(yaw, pitch), direction(t.yaw, t.pitch));
    if (offset > TARGET_RADIUS) return;

    const now = performance.now();
    const ratio = t.firstStop?.ratio ?? progress(t);
    round.hits.push({
      timeMs: now - t.spawnedAt,
      distance: t.distance,
      stop: t.firstStop?.kind ?? classifyStop(t, ratio),
      stopRatio: ratio,
    });
    if (round.hits.length >= round.targets) finishRound();
    else spawnTarget();
  }

  function onLockChange() {
    locked = document.pointerLockElement === canvas;
    if (locked) {
      lockedAt = performance.now();
      // Fresh target on start or resume so paused time never counts.
      if (round) spawnTarget();
    } else if (round) {
      round.target = null;
    }
  }

  function finishRound() {
    const r = round;
    round = null;
    document.exitPointerLock();
    const times = r.hits.map((h) => h.timeMs);
    const count = (kind) => r.hits.filter((h) => h.stop === kind).length;
    const accuracy = r.clicks ? r.hits.length / r.clicks : 0;
    const medianTimeMs = median(times);
    r.resolve({
      hits: r.hits.length,
      clicks: r.clicks,
      accuracy,
      medianTimeMs,
      overshootRate: count('over') / r.hits.length,
      undershootRate: count('under') / r.hits.length,
      // Hits per second at this accuracy; higher is better.
      score: (100 * accuracy) / (medianTimeMs / 1000),
      rawInput,
      details: r.hits,
    });
  }

  function project(dir, basis, focal) {
    const z = dot(dir, basis.f);
    if (z <= 0.05) return null;
    return [width / 2 + (dot(dir, basis.r) / z) * focal, height / 2 - (dot(dir, basis.u) / z) * focal, z];
  }

  function drawLine(points, basis, focal) {
    ctx.beginPath();
    let open = false;
    for (const [py, pp] of points) {
      const s = project(direction(py, pp), basis, focal);
      if (!s) {
        open = false;
        continue;
      }
      if (open) ctx.lineTo(s[0], s[1]);
      else ctx.moveTo(s[0], s[1]);
      open = true;
    }
    ctx.stroke();
  }

  function draw() {
    const y = yaw * DEG;
    const p = pitch * DEG;
    const basis = {
      f: direction(yaw, pitch),
      r: [Math.cos(y), 0, -Math.sin(y)],
      u: [-Math.sin(p) * Math.sin(y), Math.cos(p), -Math.sin(p) * Math.cos(y)],
    };
    const focal = width / 2 / Math.tan((H_FOV / 2) * DEG);

    ctx.fillStyle = COLORS.sky;
    ctx.fillRect(0, 0, width, height);

    ctx.lineWidth = 1;
    ctx.strokeStyle = COLORS.grid;
    for (let gy = -180; gy < 180; gy += 15) {
      const pts = [];
      for (let gp = -75; gp <= 75; gp += 5) pts.push([gy, gp]);
      drawLine(pts, basis, focal);
    }
    for (let gp = -75; gp <= 75; gp += 15) {
      if (gp === 0) continue;
      const pts = [];
      for (let gy = -180; gy <= 180; gy += 5) pts.push([gy, gp]);
      drawLine(pts, basis, focal);
    }
    ctx.strokeStyle = COLORS.horizon;
    const horizon = [];
    for (let gy = -180; gy <= 180; gy += 5) horizon.push([gy, 0]);
    drawLine(horizon, basis, focal);

    const t = round?.target;
    if (t && locked) {
      const s = project(direction(t.yaw, t.pitch), basis, focal);
      if (s) {
        const r = (Math.tan(TARGET_RADIUS * DEG) / s[2]) * focal;
        ctx.beginPath();
        ctx.arc(s[0], s[1], r, 0, 2 * Math.PI);
        ctx.fillStyle = COLORS.target;
        ctx.fill();
        ctx.strokeStyle = COLORS.targetEdge;
        ctx.stroke();
      }
    }

    const cx = width / 2;
    const cy = height / 2;
    ctx.strokeStyle = COLORS.crosshair;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy);
    ctx.lineTo(cx - 3, cy);
    ctx.moveTo(cx + 3, cy);
    ctx.lineTo(cx + 8, cy);
    ctx.moveTo(cx, cy - 8);
    ctx.lineTo(cx, cy - 3);
    ctx.moveTo(cx, cy + 3);
    ctx.lineTo(cx, cy + 8);
    ctx.stroke();

    if (round) drawHud();
  }

  function drawHud() {
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.text;
    ctx.font = '600 15px system-ui, sans-serif';
    ctx.fillText(`${round.label} · Target ${Math.min(round.hits.length + 1, round.targets)}/${round.targets}`, width / 2, 32);

    if (!locked) {
      ctx.fillStyle = 'rgba(8, 10, 14, 0.72)';
      ctx.fillRect(0, height / 2 - 90, width, 180);
      ctx.fillStyle = COLORS.text;
      ctx.font = '600 22px system-ui, sans-serif';
      const resumed = round.started;
      ctx.fillText(resumed ? 'Paused · click to resume' : `${round.label} · click to start`, width / 2, height / 2 - 20);
      ctx.fillStyle = COLORS.muted;
      ctx.font = '15px system-ui, sans-serif';
      const lines = round.message ? [round.message] : [];
      lines.push('Flick to each red target and click it. Esc pauses.');
      lines.forEach((line, i) => ctx.fillText(line, width / 2, height / 2 + 14 + i * 24));
    }
  }

  function loop() {
    const now = performance.now();
    if (round && locked) {
      round.started = true;
      trackSettle(now);
    }
    draw();
    frame = requestAnimationFrame(loop);
  }

  resize();
  window.addEventListener('resize', resize);
  document.addEventListener('pointerlockchange', onLockChange);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);
  frame = requestAnimationFrame(loop);

  return {
    resize,
    // Plays one round at the given sensitivity and resolves with its stats.
    runRound({ cm360, dpi, targets, label, message }) {
      return new Promise((resolve) => {
        round = {
          degPerCount: degreesPerCount(cm360, dpi),
          targets,
          label,
          message,
          clicks: 0,
          hits: [],
          target: null,
          started: false,
          resolve,
        };
        if (locked) spawnTarget();
      });
    },
    destroy() {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      document.removeEventListener('pointerlockchange', onLockChange);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
    },
  };
}
