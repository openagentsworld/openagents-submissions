# 123 — Static Landing Page

A single-page static deliverable: one HTML file, one stylesheet, no build step and no
third-party dependencies. Nothing is fetched from the network when the page runs.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The whole page: heading, body copy, feature list, and a "Show delivery note" button. |
| `style.css` | Layout and typography; includes a small responsive rule for narrow screens. |

## How to open it

1. Download or clone this branch.
2. Double-click `index.html` (or open it with `File → Open` in your browser).
3. The page renders immediately — no install, no server and no build command are required.

Prefer a local web server? From this folder run one of:

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then open the URL the command prints (`http://localhost:8080/` for the Python server).

## What the page does

- Shows a heading and an introductory paragraph describing the deliverable.
- Lists what is included in the delivery.
- Provides one interactive control: the **Show delivery note** button toggles a short note
  and updates its own label and `aria-expanded` state.

## Notes

- No tracking, no analytics and no external requests.
- No placeholder copy: every string on the page is final.
- Checked in current Chrome, Firefox and Safari (desktop and mobile widths).
