const LOCAL_PRED_PREFIX = "wc-ang-pred";
const USER_PREFIX = "wc-ang-user";
const SYNC_INTERVAL_MS = 45 * 1000;

let apiUrl = "";
let remoteCache = {}; // matchId -> { manager: pick }
let pollHandle = null;

export function getCurrentUser() {
  try {
    return localStorage.getItem(`${USER_PREFIX}:${window.location.pathname}`) || null;
  } catch {
    return null;
  }
}

export function setCurrentUser(name) {
  try {
    const key = `${USER_PREFIX}:${window.location.pathname}`;
    if (name) {
      localStorage.setItem(key, name);
    } else {
      localStorage.removeItem(key);
    }
  } catch (e) {
    console.warn("Could not save user:", e);
  }
  window.dispatchEvent(new CustomEvent("wc:user-changed", { detail: { user: name || null } }));
}

export function initPredictionsSync(config) {
  apiUrl = config?.predictionsApiUrl || "";
  if (pollHandle) {
    window.clearInterval(pollHandle);
    pollHandle = null;
  }
  if (!apiUrl) return;

  refreshRemoteCache();
  pollHandle = window.setInterval(refreshRemoteCache, SYNC_INTERVAL_MS);
}

async function refreshRemoteCache() {
  if (!apiUrl) return;
  try {
    const response = await fetch(apiUrl, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rows = await response.json();

    const next = {};
    for (const row of rows) {
      if (!row.matchId || !row.manager) continue;
      if (!next[row.matchId]) next[row.matchId] = {};
      next[row.matchId][row.manager] = row.pick;
    }
    remoteCache = next;
    window.dispatchEvent(new CustomEvent("wc:predictions-synced"));
  } catch (e) {
    console.warn("Could not sync predictions:", e);
  }
}

export function savePrediction(matchId, pick) {
  const user = getCurrentUser();
  if (!user) return false;

  if (apiUrl) {
    if (!remoteCache[matchId]) remoteCache[matchId] = {};
    remoteCache[matchId][user] = pick;
  } else {
    try {
      localStorage.setItem(localPredKey(user, matchId), pick);
    } catch (e) {
      console.warn("Could not save prediction:", e);
      return false;
    }
  }

  window.dispatchEvent(new CustomEvent("wc:prediction-saved", { detail: { matchId, pick, user } }));

  if (apiUrl) {
    fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ manager: user, matchId, pick }),
    }).catch((e) => console.warn("Could not sync prediction to server:", e));
  }

  return true;
}

export function getPrediction(matchId, manager = getCurrentUser()) {
  if (!manager) return null;

  if (apiUrl) {
    return remoteCache[matchId]?.[manager] || null;
  }

  try {
    return localStorage.getItem(localPredKey(manager, matchId)) || null;
  } catch {
    return null;
  }
}

export function getAllPicksForMatch(matchId) {
  if (!apiUrl) return {};
  return remoteCache[matchId] || {};
}

function localPredKey(manager, matchId) {
  return `${LOCAL_PRED_PREFIX}:${window.location.pathname}:${manager}:${matchId}`;
}
