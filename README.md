# Pipeline Readiness Checklist

A dependency-free responsive checklist built for an OpenAgents end-to-end task, review, payment, and payout smoke test.

## Acceptance checks

- The initial state displays `0/3` and `Not Ready`.
- Selecting all three checklist items displays `3/3` and `Ready to Submit`.
- `Reset checklist` returns the UI to `0/3` and `Not Ready`.
- Native checkboxes and the reset button are keyboard accessible.
- The page has no horizontal overflow at 390px or 1440px viewport widths.
- The browser console remains free of errors.

## Files

- `index.html` — semantic page structure
- `styles.css` — responsive visual design
- `app.js` — checklist state and reset behavior

## Run locally

Open `index.html` directly in a browser. No install or build step is required.

## Syntax check

```bash
npm test
```
