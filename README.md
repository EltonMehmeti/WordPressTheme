# Sensitivity Finder

A browser aim trainer that finds the mouse sensitivity you aim best with. You play short
flick rounds at different hidden sensitivities, a search algorithm closes in on your best one,
and the result is converted to the setting for each game. An optional AI coach (Claude) explains
the results.

## Run it

```bash
npm install
npm start                      # http://localhost:3000
```

To use the AI coach, set an Anthropic API key before starting:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
npm start
```

Without a key everything works except the "Get coaching" button. Use Chrome or Edge so the
browser passes raw mouse input (no OS acceleration), and play fullscreen.

## How it works

1. **One game-neutral unit.** Sensitivity is measured in cm/360, the distance your mouse travels
   for a full turn: `cm/360 = 360 / (DPI × sens × yaw) × 2.54`. Yaw values: CS2 and Apex 0.022,
   Valorant 0.07, Overwatch 2 0.0066 (`public/js/sens.js`).
2. **Flick drill** (`public/js/trainer.js`). A first-person canvas scene with pointer lock. Raw
   mouse counts become camera rotation at the round's cm/360. Every target records time to hit,
   clicks, and where your first stop landed: past the target (overshoot), short of it (undershoot),
   or on it.
3. **Search** (`public/js/optimizer.js`). Each round's score is accuracy divided by median time to
   hit. A golden-section search over log(cm/360) picks the next sensitivity to test, starting
   from half to double your current one. At the end a quadratic fit through all rounds smooths
   out lucky and unlucky rounds. If the fit isn't a clean peak, the best round is used.
4. **Results.** Best cm/360, the setting for each game at your DPI, a score chart, an
   overshoot/undershoot table, and a plain summary. "Retest around this value" runs a narrower
   search (±30%) around the result.
5. **AI coach** (`server.js`). The server sends the round data to Claude and returns a short
   coaching note. The API key stays on the server.

## Tests

```bash
npm test
```

## Ideas for next steps

- Tracking and micro-adjustment drills, combined into one score
- Bayesian optimization instead of golden-section, which copes better with noisy rounds
- Saved history so results can be compared across days
- More games (and their FOV/yaw quirks)
