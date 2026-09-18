# Trading Toolkit

A small collection of browser-only trading calculators. No backend, no accounts,
no data leaves the page.

Live: https://viktor-ommm.github.io/trading-tool/

## Tools

| Tool | Route | Status |
| --- | --- | --- |
| Position Size | `/tools/position-size` | ready |
| Stop-Loss | `/tools/stop-loss` | ready |
| Risk / Reward | `/tools/risk-reward` | planned |

**Position Size** — entry and stop are fixed; the size is what gives way. Returns
the direction, share count, notional size, the fee breakdown, and the break-even
price.

**Stop-Loss** — size is fixed; the stop moves. Returns the long and short stop
prices, their exit fees, and the break-even price on each side.

Both read the same maths from `src/lib/risk.ts`.

### Fees

Every result is after fees. "Risk per trade" means the **total** loss at the stop
— price move plus the entry fee plus the exit fee — so the position comes out
smaller, and the stop closer, than a fee-blind calculator would suggest.

Position size solves

```
risk = q·|entry − stop| + q·entry·feeIn + q·stop·feeOut
```

for `q`, so the `Total` row of the result always equals the risk budget exactly.

Break-even is the price where the round trip nets zero after both fees:

```
long:   entry · (1 + feeIn) / (1 − feeOut)
short:  entry · (1 − feeIn) / (1 + feeOut)
```

Defaults are perpetuals on a limit (maker) order: **0.02%** on each leg — typical
non-discounted rates on a major centralised exchange. Both legs are editable: a
stop that triggers as a market order pays taker, **0.055%**, and spot is
typically **0.1%** either way. The numbers live in `src/lib/fees.ts`; check your
own exchange and tier rather than trusting the defaults.

## Development

```bash
npm install
npm run dev         # vite dev server
npm test            # vitest, one pass
npm run test:watch  # vitest, watch mode
npm run build       # type-check + production build
npm run lint
```

CI (`.github/workflows/ci.yml`) runs lint, tests and the build on every pull
request and on every push to `main`.

### Tests

The maths and the validation are pure functions, so they are covered directly:

- `src/lib/risk.test.ts` — sizing, stop placement, break-even, the fee floor
- `src/lib/validation.test.ts` — form rules on both tools
- `src/ui/format.test.ts` — display formatting

The sizing tests do not re-use the formula under test. They rebuild the realised
loss from first principles — buy in, sell out, pay a fee on each notional — and
assert it equals the risk budget. Breaking a fee term in `risk.ts` fails them.

React components are not covered; keep new logic in `src/lib/` so it stays
testable without a DOM.

## Project layout

```
src/
  app/                  # shell: router, sidebar layout, home grid, 404
  ui/                   # shared primitives: Field, Results, icons, formatters
  lib/
    risk.ts             # pure maths, no React
    validation.ts       # form validation
    fees.ts             # default fee rates
  tools/
    registry.ts         # single source of truth for the tool list
    types.ts            # Tool interface
    position-size/
      meta.ts           # id, title, summary, icon
      PositionSizeCalculator.tsx
    stop-loss/
      meta.ts
      StopLossCalculator.tsx
    risk-reward/        # placeholder tool
```

One tool = one menu item = one route. A tool that would need mode tabs is two
tools instead.

## Adding a tool

1. Create `src/tools/<id>/`.
2. Add `meta.ts` exporting `{ id, title, summary, icon }`. The order of entries
   in `registry.ts` is the order shown in the sidebar and on the home grid. The `id` becomes the
   public URL (`/tools/<id>`), so keep it stable. `icon` is a key from
   `src/ui/icons.tsx` — add a new symbol there if none fits.
3. Put the maths in `src/lib/` as plain functions with no React imports, and the
   form in a default-exported component. Reuse `Field`, `FeeFields`,
   `Results`/`ResultRow`/`ResultGroup` and `ToolPage` from `src/ui/` so the new
   tool matches the rest.
4. Append one entry to `src/tools/registry.ts`:

   ```ts
   {
     ...meta,
     status: 'ready',
     Component: lazy(() => import('./<id>/<Component>')),
   }
   ```

The route, the sidebar link and the home grid card all follow from that entry —
nothing else needs editing.

If you rename or split a tool, add the old id to `movedTools` in the same file
so existing links redirect instead of 404-ing.

## Deployment

`.github/workflows/ci.yml` holds both jobs. `check` runs lint, tests and the
build — on pull requests and on pushes to `main`. `deploy` publishes to GitHub
Pages, and runs only on a push to `main`, only after `check` passes. The build
happens once: `check` uploads the Pages artifact and `deploy` just releases it.

The app is served from a sub-path, so
`vite.config.ts` sets `base: '/trading-tool/'` and the router picks it up via
`import.meta.env.BASE_URL`. The workflow also copies `index.html` to `404.html`
so deep links resolve — GitHub Pages has no SPA rewrite rule.
