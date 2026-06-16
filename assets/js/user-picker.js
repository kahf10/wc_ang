import { getCurrentUser, setCurrentUser } from "./predictions.js?v=predictions-20260616c";

let knownManagers = [];

export function initUserPicker() {
  const navUser = document.getElementById("nav-user");
  if (!navUser) return;

  const pill = document.createElement("button");
  pill.type = "button";
  pill.id = "user-pill";
  pill.className = "user-pill";
  pill.addEventListener("click", openUserModal);
  navUser.appendChild(pill);
  refreshPill();

  document.body.appendChild(buildUserModal());

  window.addEventListener("wc:managers-loaded", (e) => {
    knownManagers = (e.detail.managers || []).filter(Boolean);
    if (!getCurrentUser()) {
      openUserModal();
    }
  });

  window.addEventListener("wc:user-changed", refreshPill);
  window.addEventListener("wc:open-user-modal", openUserModal);
}

function refreshPill() {
  const pill = document.getElementById("user-pill");
  if (!pill) return;
  const user = getCurrentUser();
  if (user) {
    pill.textContent = `👤 ${user}`;
    pill.classList.add("user-pill-active");
    pill.setAttribute("aria-label", `You are ${user}. Click to change.`);
  } else {
    pill.textContent = "Who are you?";
    pill.classList.remove("user-pill-active");
    pill.setAttribute("aria-label", "Select your manager profile");
  }
}

function buildUserModal() {
  const dialog = document.createElement("dialog");
  dialog.id = "user-modal";
  dialog.className = "wc-modal";

  const inner = document.createElement("div");
  inner.className = "wc-modal-inner";

  const header = document.createElement("div");
  header.className = "wc-modal-header";

  const title = document.createElement("h2");
  title.className = "wc-modal-title";
  title.textContent = "Who are you?";

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "wc-modal-close";
  closeBtn.setAttribute("aria-label", "Close");
  closeBtn.textContent = "×";
  closeBtn.addEventListener("click", () => dialog.close());

  header.append(title, closeBtn);

  const body = document.createElement("div");
  body.className = "wc-modal-body";

  const desc = document.createElement("p");
  desc.textContent = "Pick your manager name to save predictions on this device.";

  const list = document.createElement("div");
  list.id = "user-manager-list";
  list.className = "wc-manager-list";

  body.append(desc, list);
  inner.append(header, body);
  dialog.appendChild(inner);

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) dialog.close();
  });

  return dialog;
}

function openUserModal() {
  const dialog = document.getElementById("user-modal");
  if (!dialog) return;

  const list = document.getElementById("user-manager-list");
  if (!list) return;
  list.innerHTML = "";

  const current = getCurrentUser();

  if (knownManagers.length > 0) {
    const sortedManagers = [...knownManagers].sort((a, b) => a.localeCompare(b));
    for (const name of sortedManagers) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "wc-manager-btn" + (name === current ? " active" : "");
      btn.textContent = name;
      btn.addEventListener("click", () => {
        setCurrentUser(name);
        dialog.close();
      });
      list.appendChild(btn);
    }
  } else {
    const label = document.createElement("label");
    label.className = "wc-name-label";
    label.textContent = "Your name:";
    label.setAttribute("for", "wc-name-input");

    const input = document.createElement("input");
    input.type = "text";
    input.id = "wc-name-input";
    input.className = "wc-name-input";
    input.placeholder = "Enter your name";
    input.value = current || "";

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "btn btn-primary";
    saveBtn.style.marginTop = "0.5rem";
    saveBtn.textContent = "Save";
    saveBtn.addEventListener("click", () => {
      const name = input.value.trim();
      if (name) {
        setCurrentUser(name);
        dialog.close();
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveBtn.click();
    });

    list.append(label, input, saveBtn);
    setTimeout(() => input.focus(), 50);
  }

  dialog.showModal();
}
