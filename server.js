// Serves the app and proxies the AI coach request so the API key stays on the server.

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
const MAX_BODY_BYTES = 100_000;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

const COACH_SYSTEM = `You are an aim coach for PC shooter players. You receive the results of a blind mouse-sensitivity test: the player did short flick rounds, each at a different hidden sensitivity measured in cm/360 (centimetres of mouse travel per full turn; higher means slower). Per round you get the score (accuracy divided by median time to hit), accuracy, median time to hit, and how often the player's first stop overshot or undershot the target.

Write a short coaching note in plain text, no markdown, under 200 words:
- the recommended sensitivity in cm/360 and as the in-game value for the player's game at their DPI
- what the data shows: where performance drops off on each side, and the overshoot/undershoot pattern
- how much to trust the result, given that single rounds are noisy
- two or three concrete next steps

Use only numbers that appear in the data.`;

let client = null;

async function coach(session) {
  client ??= new Anthropic();
  const response = await client.beta.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low' },
    system: COACH_SYSTEM,
    messages: [{ role: 'user', content: JSON.stringify(session, null, 2) }],
  });
  if (response.stop_reason === 'refusal') {
    throw Object.assign(new Error('The coach declined this request.'), { status: 502 });
  }
  return response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();
}

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw Object.assign(new Error('Request too large.'), { status: 413 });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw Object.assign(new Error('Invalid JSON.'), { status: 400 });
  }
}

async function handleCoach(req, res) {
  try {
    const session = await readJson(req);
    if (!Array.isArray(session?.rounds) || session.rounds.length === 0) {
      return sendJson(res, 400, { error: 'No rounds to analyse.' });
    }
    sendJson(res, 200, { text: await coach(session) });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      sendJson(res, 503, { error: 'The server has no valid Anthropic API key. Set ANTHROPIC_API_KEY and restart.' });
    } else if (err instanceof Anthropic.RateLimitError) {
      sendJson(res, 429, { error: 'The coach is rate limited. Try again in a moment.' });
    } else if (err instanceof Anthropic.APIError) {
      console.error('Claude API error:', err.status, err.message);
      sendJson(res, 502, { error: 'The coach is unavailable right now.' });
    } else if (err.status) {
      sendJson(res, err.status, { error: err.message });
    } else {
      // The SDK throws a plain Error when it finds no credentials at all.
      console.error(err);
      sendJson(res, 503, { error: 'AI coaching is not configured. Set ANTHROPIC_API_KEY and restart the server.' });
    }
  }
}

async function serveStatic(req, res) {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const filePath = path.join(PUBLIC_DIR, urlPath === '/' ? 'index.html' : urlPath);
  if (!filePath.startsWith(PUBLIC_DIR + path.sep)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const body = await fs.readFile(filePath);
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(filePath)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
  }
}

const server = http.createServer((req, res) => {
  if (req.url === '/api/coach' && req.method === 'POST') return handleCoach(req, res);
  if (req.method === 'GET' || req.method === 'HEAD') return serveStatic(req, res);
  res.writeHead(405).end();
});

server.listen(PORT, () => {
  console.log(`Sensitivity Finder running at http://localhost:${PORT}`);
});
