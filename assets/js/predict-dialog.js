import { getCurrentUser, savePrediction, getPrediction } from "./predictions.js?v=predictions-20260616c";

export function initPredictDialog() {
  document.body.appendChild(buildPredictModal());

  window.addEventListener("wc:predict-click", (e) => {
    openPredictDialog(e.detail.match);
  });
}

function buildPredictModal() {
  const dialog = document.createElement("dialog");
  dialog.id = "predict-modal";
  dialog.className = "wc-modal";

  const inner = document.createElement("div");
  inner.className = "wc-modal-inner";

  const header = document.createElement("div");
  header.className = "wc-modal-header";

  const title = document.createElement("h2");
  title.className = "wc-modal-title";
  title.textContent = "Your prediction";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "wc-modal-close";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.textContent = "×";
  closeBtn.addEventListener("click", () => dialog.close());

  header.append(title, closeBtn);

  const body = document.createElement("div");
  body.className = "wc-modal-body";
  body.id = "predict-modal-body";

  inner.append(header, body);
  dialog.appendChild(inner);

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });

  return dialog;
}

function openPredictDialog(match) {
  if (!getCurrentUser()) {
    window.dispatchEvent(new CustomEvent("wc:open-user-modal"));
    return;
  }

  const dialog = document.getElementById("predict-modal");
  if (!dialog) return;

  const body = document.getElementById("predict-modal-body");
  if (!body) return;
  body.innerHTML = "";

  const now = new Date();
  const matchDate = new Date(match.date);
  const isStarted = now >= matchDate;
  const existingPick = getPrediction(match.id);

  // Match info
  const matchInfo = document.createElement("div");
  matchInfo.className = "predict-match-info";

  const teamsRow = document.createElement("div");
  teamsRow.className = "predict-teams";

  const homeSpan = document.createElement("span");
  homeSpan.className = "predict-team";
  homeSpan.textContent = match.home?.name || "TBD";

  const vsSpan = document.createElement("span");
  vsSpan.className = "predict-vs";
  vsSpan.textContent = "vs";

  const awaySpan = document.createElement("span");
  awaySpan.className = "predict-team";
  awaySpan.textContent = match.away?.name || "TBD";

  teamsRow.append(homeSpan, vsSpan, awaySpan);

  const dateEl = document.createElement("p");
  dateEl.className = "predict-date";
  dateEl.textContent = formatPredictDate(matchDate);

  matchInfo.append(teamsRow, dateEl);
  body.appendChild(matchInfo);

  if (isStarted) {
    const msg = document.createElement("p");
    msg.className = "predict-locked-msg";
    msg.textContent = existingPick
      ? `Match has started. Your prediction: ${pickLabel(existingPick, match)}`
      : "Match has started. Predictions are now locked.";
    body.appendChild(msg);
    dialog.showModal();
    return;
  }

  // Pick options
  const options = document.createElement("div");
  options.className = "predict-options";

  const picks = [
    { key: "home", label: match.home?.name || "Home win" },
    { key: "draw", label: "Draw" },
    { key: "away", label: match.away?.name || "Away win" },
  ];

  for (const opt of picks) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "predict-option" + (existingPick === opt.key ? " selected" : "");
    btn.dataset.pick = opt.key;
    btn.textContent = opt.label;
    btn.addEventListener("click", () => {
      options.querySelectorAll(".predict-option").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
    });
    options.appendChild(btn);
  }
  body.appendChild(options);

  // Footer
  const footer = document.createElement("div");
  footer.className = "predict-footer";

  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.className = "btn btn-primary predict-save";
  saveBtn.textContent = existingPick ? "Update prediction" : "Save prediction";
  saveBtn.addEventListener("click", () => {
    const selected = options.querySelector(".predict-option.selected");
    if (!selected) return;
    savePrediction(match.id, selected.dataset.pick);
    dialog.close();
  });

  footer.appendChild(saveBtn);
  body.appendChild(footer);

  dialog.showModal();
}

function pickLabel(pick, match) {
  if (pick === "home") return match.home?.name || "Home";
  if (pick === "away") return match.away?.name || "Away";
  return "Draw";
}

function formatPredictDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
