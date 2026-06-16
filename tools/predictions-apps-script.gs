// Predictions sync backend — paste this into Extensions > Apps Script on the
// league's Google Sheet, then deploy as a Web App. See SETUP.md in this folder.
//
// Storage: a "Predictions" tab gets created automatically on first write/read.
// Columns: manager | match_id | pick | updated_at
//
// Admin override: since this script runs against your own Sheet, anyone with
// Edit access to the Sheet (just you and Abrham) can open the "Predictions"
// tab and change/delete any row directly. No extra code needed for that.

const SHEET_NAME = "Predictions";
const VALID_PICKS = ["home", "draw", "away"];

function doGet(e) {
  const sheet = getSheet();
  const rows = sheet.getDataRange().getValues();
  rows.shift(); // header

  const data = rows
    .filter((row) => row[0] && row[1])
    .map((row) => ({
      manager: String(row[0]),
      matchId: String(row[1]),
      pick: String(row[2] || ""),
      updatedAt: row[3] ? String(row[3]) : "",
    }));

  return jsonResponse(data);
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ ok: false, error: "Invalid JSON" });
  }

  const manager = String(body.manager || "").trim();
  const matchId = String(body.matchId || "").trim();
  const pick = String(body.pick || "").trim();

  if (!manager || !matchId || VALID_PICKS.indexOf(pick) === -1) {
    return jsonResponse({ ok: false, error: "Invalid payload" });
  }

  const sheet = getSheet();
  const rows = sheet.getDataRange().getValues();
  let targetRow = -1;

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === manager && String(rows[i][1]) === matchId) {
      targetRow = i + 1; // sheet rows are 1-indexed
      break;
    }
  }

  const now = new Date().toISOString();
  if (targetRow === -1) {
    sheet.appendRow([manager, matchId, pick, now]);
  } else {
    sheet.getRange(targetRow, 3).setValue(pick);
    sheet.getRange(targetRow, 4).setValue(now);
  }

  return jsonResponse({ ok: true });
}

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["manager", "match_id", "pick", "updated_at"]);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
