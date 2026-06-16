# Setting up shared prediction sync (per league)

Each league (Dagi United, Tikur Abay, Squad) needs this done once, on its own
Google Sheet. Free, no new accounts.

1. Open the league's Google Sheet.
2. **Extensions > Apps Script**.
3. Delete any placeholder code, then paste in the contents of
   `predictions-apps-script.gs` (in this folder).
4. Save the project (give it any name, e.g. "Predictions API").
5. **Deploy > New deployment**.
   - Click the gear icon next to "Select type" and choose **Web app**.
   - Execute as: **Me**.
   - Who has access: **Anyone**.
   - Click **Deploy**.
6. Google will ask you to authorize the script (it's your own script acting
   on your own Sheet) — click through "Advanced" > "Go to ... (unsafe)" if
   warned, then **Allow**. This warning is normal for personal Apps Script
   projects that haven't been submitted for Google's app review.
7. Copy the **Web app URL** it gives you (ends in `/exec`).
8. Paste that URL into the matching league's `config.js` as
   `predictionsApiUrl`, e.g.:
   ```js
   predictionsApiUrl: "https://script.google.com/macros/s/AKfycb.../exec",
   ```
9. Repeat for the other leagues' Sheets.

A "Predictions" tab will appear automatically in the Sheet the first time
anyone submits a pick. You and Abrham can open that tab anytime and edit or
delete rows directly — that's the admin override, no extra tooling needed.

If `predictionsApiUrl` is left blank for a league, that league's site falls
back to the old device-only (localStorage) behavior automatically.

## Redeploying after editing the script

If you ever change `predictions-apps-script.gs` and need to update the live
script: **Deploy > Manage deployments > edit (pencil) > New version > Deploy**.
Creating a brand new deployment instead would change the URL and break the
existing `predictionsApiUrl` references.
