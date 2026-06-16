import { createElement, clearElement } from "./dom.js";
import { getMatches } from "../wc2026/wc-data.js";
import { getUpcomingMatches } from "../wc2026/wc-results-strip.js";
import { getCurrentUser, getPrediction, savePrediction, getAllPicksForMatch } from "./predictions.js?v=predictions-20260616c";

const SWIPE_THRESHOLD = 70;
const ANIM_MS = 220;

let mountRef = null;
let matches = [];
let currentIndex = 0;
let selectedPick = null;
let drag = null;

export async function renderPredictSwiper(mountEl, options = {}) {
  mountRef = mountEl;
  const allMatches = await getMatches(options);
  const upcoming = getUpcomingMatches(allMatches, new Date()).filter((m) => m.stage === "group");

  const previousMatchId = matches[currentIndex]?.id;
  matches = upcoming;
  const restoredIndex = previousMatchId ? matches.findIndex((m) => m.id === previousMatchId) : -1;
  currentIndex = restoredIndex >= 0 ? restoredIndex : 0;

  draw();
}

window.addEventListener("wc:prediction-saved", () => {
  if (mountRef) draw({ skipAnim: true });
});

window.addEventListener("wc:user-changed", () => {
  if (mountRef) draw({ skipAnim: true });
});

window.addEventListener("wc:predictions-synced", () => {
  if (mountRef) draw({ skipAnim: true });
});

function draw() {
  if (!mountRef) return;
  clearElement(mountRef);

  if (matches.length === 0) {
    mountRef.appendChild(
      createElement("p", { className: "predict-swiper-empty", text: "No upcoming group matches to predict right now." })
    );
    return;
  }

  const widget = createElement("div", { className: "predict-swiper" });
  widget.appendChild(buildHead());
  const viewport = createElement("div", { className: "predict-swiper-viewport" });
  viewport.appendChild(buildSlide(matches[currentIndex]));
  widget.appendChild(viewport);
  widget.appendChild(buildFooter());
  mountRef.appendChild(widget);
}

function buildHead() {
  const head = createElement("div", { className: "predict-swiper-head" });
  head.appendChild(
    createElement("span", {
      className: "predict-swiper-counter",
      text: `Match ${currentIndex + 1} of ${matches.length}`,
    })
  );
  head.appendChild(
    createElement("span", {
      className: "predict-swiper-stage",
      text: matches[currentIndex].group ? `Group ${matches[currentIndex].group}` : "Group stage",
    })
  );
  return head;
}

function buildFooter() {
  const footer = createElement("div", { className: "predict-swiper-footer" });
  const prevBtn = createElement("button", {
    className: "predict-swiper-arrow",
    attrs: { type: "button", "aria-label": "Previous match" },
    text: "‹",
  });
  const nextBtn = createElement("button", {
    className: "predict-swiper-arrow",
    attrs: { type: "button", "aria-label": "Next match" },
    text: "›",
  });
  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex === matches.length - 1;
  prevBtn.addEventListener("click", () => goTo(currentIndex - 1, "right"));
  nextBtn.addEventListener("click", () => goTo(currentIndex + 1, "left"));

  footer.append(
    prevBtn,
    createElement("span", { className: "predict-swiper-hint", text: "Swipe for next match" }),
    nextBtn
  );
  return footer;
}

function buildSlide(match) {
  const card = createElement("div", { className: "predict-swiper-card" });
  selectedPick = getPrediction(match.id);

  card.append(buildTeams(match), buildMeta(match));

  const user = getCurrentUser();
  if (!user) {
    const loginBtn = createElement("button", {
      className: "predict-swiper-login",
      attrs: { type: "button" },
      text: "Who are you? Tap to log in",
    });
    loginBtn.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("wc:open-user-modal"));
    });
    card.appendChild(loginBtn);
    attachSwipe(card);
    return card;
  }

  const now = new Date();
  const isStarted = now >= new Date(match.date);

  if (isStarted) {
    const locked = createElement("div", { className: "predict-swiper-locked" });
    locked.appendChild(createElement("span", { text: "Locked – kickoff has started" }));
    if (selectedPick) {
      locked.appendChild(
        createElement("span", { className: "predict-badge", text: `Your pick: ${pickLabel(match, selectedPick)}` })
      );
    }
    card.appendChild(locked);
    const othersPanel = buildOthersPicks(match, user, selectedPick);
    if (othersPanel) card.appendChild(othersPanel);
    attachSwipe(card);
    return card;
  }

  card.appendChild(buildOptions(match));
  card.appendChild(buildConfirm(match));
  const othersPanel = buildOthersPicks(match, user, selectedPick);
  if (othersPanel) card.appendChild(othersPanel);
  attachSwipe(card);
  return card;
}

function buildOthersPicks(match, user, ownPick) {
  // Hide everyone else's pick until this person has made their own —
  // keeps it fair, no peeking before you commit.
  if (!ownPick) return null;

  const allPicks = getAllPicksForMatch(match.id);
  const others = Object.entries(allPicks).filter(([manager, pick]) => manager !== user && pick);

  if (others.length === 0) return null;

  others.sort((a, b) => a[0].localeCompare(b[0]));

  const panel = createElement("div", { className: "predict-swiper-others" });
  panel.appendChild(createElement("span", { className: "predict-swiper-others-title", text: "Everyone's picks" }));

  const list = createElement("div", { className: "predict-swiper-others-list" });
  for (const [manager, pick] of others) {
    const row = createElement("div", { className: "predict-swiper-others-row" });
    row.appendChild(createElement("span", { className: "predict-swiper-others-name", text: manager }));
    row.appendChild(createElement("span", { className: "predict-swiper-others-pick", text: pickLabel(match, pick) }));
    list.appendChild(row);
  }
  panel.appendChild(list);
  return panel;
}

function buildTeams(match) {
  const teams = createElement("div", { className: "predict-swiper-teams" });
  teams.append(
    buildTeamBlock(match.home),
    createElement("span", { className: "predict-swiper-vs", text: "vs" }),
    buildTeamBlock(match.away)
  );
  return teams;
}

function buildTeamBlock(side) {
  const block = createElement("div", { className: "predict-swiper-team" });
  const flag = createElement("img", {
    className: "predict-swiper-flag",
    attrs: { src: side?.flagPath || "", width: "48", height: "36", loading: "lazy", alt: side?.name || "" },
  });
  if (!side?.flagPath) flag.style.display = "none";
  flag.addEventListener("error", () => {
    flag.style.display = "none";
  });
  block.append(flag, createElement("span", { className: "predict-swiper-team-name", text: side?.name || "TBD" }));
  return block;
}

function buildMeta(match) {
  return createElement("div", {
    className: "predict-swiper-meta",
    text: new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(match.date)),
  });
}

function buildOptions(match) {
  const options = createElement("div", { className: "predict-swiper-options" });
  const choices = [
    { pick: "home", label: match.home?.name || "Home" },
    { pick: "draw", label: "Draw" },
    { pick: "away", label: match.away?.name || "Away" },
  ];

  for (const choice of choices) {
    const btn = createElement("button", {
      className: `predict-swiper-option${selectedPick === choice.pick ? " selected" : ""}`,
      attrs: { type: "button", "data-pick": choice.pick },
      text: choice.label,
    });
    btn.addEventListener("click", () => {
      selectedPick = choice.pick;
      options.querySelectorAll(".predict-swiper-option").forEach((el) => {
        el.classList.toggle("selected", el.dataset.pick === selectedPick);
      });
      const confirmBtn = options.parentElement?.querySelector(".predict-swiper-confirm");
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = "Confirm pick";
        confirmBtn.classList.remove("saved");
      }
    });
    options.appendChild(btn);
  }

  return options;
}

function buildConfirm(match) {
  const btn = createElement("button", {
    className: "predict-swiper-confirm",
    attrs: { type: "button" },
    text: "Confirm pick",
  });
  btn.disabled = !selectedPick;

  btn.addEventListener("click", () => {
    if (!selectedPick) return;
    savePrediction(match.id, selectedPick);
    btn.textContent = "Saved ✓";
    btn.classList.add("saved");
    btn.disabled = true;
    window.setTimeout(() => {
      if (currentIndex < matches.length - 1) {
        goTo(currentIndex + 1, "left");
      }
    }, 500);
  });

  return btn;
}

function pickLabel(match, pick) {
  if (pick === "home") return match.home?.name || "Home";
  if (pick === "away") return match.away?.name || "Away";
  return "Draw";
}

function goTo(index, direction) {
  if (index < 0 || index > matches.length - 1) return;
  const viewport = mountRef?.querySelector(".predict-swiper-viewport");
  const card = viewport?.querySelector(".predict-swiper-card");
  if (!card) {
    currentIndex = index;
    draw();
    return;
  }

  card.style.transition = `transform ${ANIM_MS}ms ease, opacity ${ANIM_MS}ms ease`;
  card.style.transform = `translateX(${direction === "left" ? "-110%" : "110%"})`;
  card.style.opacity = "0";

  window.setTimeout(() => {
    currentIndex = index;
    draw();
    const newCard = mountRef?.querySelector(".predict-swiper-card");
    if (newCard) {
      newCard.style.transform = `translateX(${direction === "left" ? "110%" : "-110%"})`;
      newCard.style.opacity = "0";
      requestAnimationFrame(() => {
        newCard.style.transition = `transform ${ANIM_MS}ms ease, opacity ${ANIM_MS}ms ease`;
        newCard.style.transform = "translateX(0)";
        newCard.style.opacity = "1";
      });
    }
  }, ANIM_MS);
}

function attachSwipe(card) {
  card.addEventListener("pointerdown", onPointerDown);
}

function onPointerDown(e) {
  if (e.target.closest("button")) return;
  const card = e.currentTarget;
  drag = { startX: e.clientX, startY: e.clientY, dx: 0, pointerId: e.pointerId, card };
  card.setPointerCapture(e.pointerId);
  card.style.transition = "none";
  card.addEventListener("pointermove", onPointerMove);
  card.addEventListener("pointerup", onPointerUp);
  card.addEventListener("pointercancel", onPointerUp);
}

function onPointerMove(e) {
  if (!drag || e.pointerId !== drag.pointerId) return;
  const dx = e.clientX - drag.startX;
  const dy = e.clientY - drag.startY;
  if (Math.abs(dy) > Math.abs(dx) * 1.3) return;
  drag.dx = dx;
  drag.card.style.transform = `translateX(${dx}px)`;
  drag.card.style.opacity = String(Math.max(1 - Math.abs(dx) / 300, 0.4));
}

function onPointerUp(e) {
  if (!drag || e.pointerId !== drag.pointerId) return;
  const { dx, card } = drag;
  card.removeEventListener("pointermove", onPointerMove);
  card.removeEventListener("pointerup", onPointerUp);
  card.removeEventListener("pointercancel", onPointerUp);
  drag = null;

  if (dx <= -SWIPE_THRESHOLD && currentIndex < matches.length - 1) {
    goTo(currentIndex + 1, "left");
  } else if (dx >= SWIPE_THRESHOLD && currentIndex > 0) {
    goTo(currentIndex - 1, "right");
  } else {
    card.style.transition = `transform ${ANIM_MS}ms ease, opacity ${ANIM_MS}ms ease`;
    card.style.transform = "translateX(0)";
    card.style.opacity = "1";
  }
}
