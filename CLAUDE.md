# wc_ang — Claude Code project notes

This is a static, no-build-step World Cup 2026 prediction site for three
independent friend leagues, each living in its own folder:

- `dagi-united/` (Kahf's group)
- `tikur-abay/` (Abrham's group)
- `squad/` (Abrham's other group)

Each league folder has its own `config.js` + `index.html` but shares all the
code in `assets/js/` and `assets/wc2026/`. Theming is done via
`body.theme-*` classes + CSS custom properties in `style.css`.

## Running it locally

No build step. Just serve the repo root as static files, e.g.:

```
npx serve -l 5500 .
```

Then open a league with a **trailing slash**, e.g.
`http://localhost:5500/tikur-abay/` — without the trailing slash the
relative `<script>` tags fail to resolve and the page renders blank.

## Data sources (per league, in each `config.js`)

- `leaderboardCsvUrl` — published-to-web CSV of the `Landing_CSV` tab in
  that league's Google Sheet. Feeds the standings table.
- `predictionPulseCsvUrl` — published-to-web CSV of the `Prediction_Pulse`
  tab. Feeds the recent-picks strip.
- `predictionsApiUrl` — a deployed Google Apps Script Web App URL that
  reads/writes a `Predictions` tab in the same Sheet. This is what powers
  **live cross-device prediction sync** (everyone's picks visible to each
  other once they've made their own). Leave this blank and the site
  silently falls back to device-only localStorage predictions (the old
  behavior) — nothing breaks, it just isn't shared.

See `tools/SETUP.md` for exact step-by-step instructions on:
1. Publishing the right Sheet tabs to the web as CSV.
2. Deploying `tools/predictions-apps-script.gs` as a Web App (the
   "Who has access: Anyone" setting is critical — without it the public
   site can't call it).

To wire up `tikur-abay/` or `squad/`, copy that league's existing Google
Sheet (so you're not risking the live one), publish `Landing_CSV` and
`Prediction_Pulse` from the **copy** as CSV, deploy the Apps Script against
the copy, and drop the three resulting URLs into that league's `config.js`.

## Admin / data-override model

There is **no in-app admin UI**. "Admin" just means whoever has **Edit**
access to the Google Sheet can directly edit/delete rows (e.g. in the
`Predictions` tab) at any time. Keep Sheet edit access limited to the
people who should be able to do this.

## Things intentionally NOT built yet

- "(biased)" tagging for viewing others' predictions before/after making
  your own pick — discussed and explicitly deferred, don't add it unless
  asked.
- Standings columns for "correct win predictions" / "correct tie
  predictions" per manager — discussed conceptually, exact column design
  not finalized.

## Branching

New feature work happens on `feature/kahf-changes` (or similar branches),
never directly on `main`. `main` is what's actually deployed live for
real users — do not merge or push to it without explicit sign-off from
both Kahf and Abrham.

## Repo hygiene

- Never commit raw spreadsheet exports (`.xlsx`, `.csv`) or `.claude/` —
  see `.gitignore`. These are local working files only.
