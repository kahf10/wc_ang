// Dagi United site configuration.
// CSV URLs come from the Dagi United Google Sheet: File > Share > Publish to web.
window.WC_ANG_CONFIG = {
  groupName: "Dagi United",
  theme: "dagi-united",
  tournamentName: "World Cup 2026 Prediction League",
  leaderboardCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRnLp2ksNr8-mJBBnJdARFQr6mArvL6tHsSnBSlZPll-kScOI0GiYS8QZPjS1zpq6qOZQOEodBUk6jN/pub?gid=1685826949&single=true&output=csv",
  predictionPulseCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRnLp2ksNr8-mJBBnJdARFQr6mArvL6tHsSnBSlZPll-kScOI0GiYS8QZPjS1zpq6qOZQOEodBUk6jN/pub?gid=1957921948&single=true&output=csv",
  resultsCsvUrl: "",
  resultsLimit: 9,
  // Apps Script Web App URL for shared prediction sync. Leave blank to fall
  // back to device-only (localStorage) predictions. See tools/SETUP.md.
  predictionsApiUrl: "https://script.google.com/macros/s/AKfycbzRi2n0OiYgILb59ebAP7SWpAAD-4xEk5C6nkakHkWjnJ1SvP-y4JgFO7K7fznR7iZI/exec",
};
