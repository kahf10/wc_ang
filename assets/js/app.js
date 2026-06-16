import { getSiteConfig, validateSiteConfig } from "./config.js";
import { requireElement, setHidden, setStatus } from "./dom.js";
import { renderLeagueLayout } from "./layout.js?v=predictions-20260616b";
import { loadLeaderboard } from "./leaderboard.js?v=predictions-20260616b";
import { renderWcResultsStrip } from "../wc2026/wc-results-strip.js?v=predictions-20260616b";
import { initUserPicker } from "./user-picker.js";
import { initPredictDialog } from "./predict-dialog.js";
import { renderPredictSwiper } from "./predict-swiper.js?v=predictions-20260616b";
import { initPredictionsSync } from "./predictions.js?v=predictions-20260616c";

const WC_RESULTS_REFRESH_MS = 60 * 60 * 1000;

bootstrap();

function bootstrap() {
  const config = getSiteConfig();

  try {
    renderLeagueLayout(config);
    initUserPicker();
    initPredictDialog();
    initPredictionsSync(config);
    const elements = getRequiredElements();
    const missingConfig = validateSiteConfig(config);

    if (missingConfig.length > 0) {
      showConfigurationError(missingConfig, elements);
      return;
    }

    loadLeaderboard(config, elements);
    loadWcResultsStrip(config);
  } catch (error) {
    showFatalError(error);
  }
}

function getRequiredElements() {
  return {
    heroStatus: requireElement("hero-status"),
    footerUpdated: requireElement("footer-updated"),
    boardStatus: requireElement("board-status"),
    tableWrap: requireElement("table-wrap"),
    boardBody: requireElement("board-body"),
  };
}

function loadWcResultsStrip(config) {
  try {
    const upcomingMountEl = requireElement("wc-upcoming-strip");
    const finalsMountEl = requireElement("wc-finals-strip");
    const predictSwiperMountEl = requireElement("wc-predict-swiper");

    renderWcResultsStrip(upcomingMountEl, { config, variant: "upcoming" }).catch((error) => {
      console.error("Could not render World Cup results strip:", error);
    });
    renderWcResultsStrip(finalsMountEl, { config, variant: "finished" }).catch((error) => {
      console.error("Could not render World Cup finals strip:", error);
    });
    renderPredictSwiper(predictSwiperMountEl, { config }).catch((error) => {
      console.error("Could not render predict swiper:", error);
    });

    window.setInterval(() => {
      renderWcResultsStrip(upcomingMountEl, { config, variant: "upcoming", forceRefresh: true }).catch((error) => {
        console.error("Could not refresh World Cup results strip:", error);
      });
      renderWcResultsStrip(finalsMountEl, { config, variant: "finished", forceRefresh: true }).catch((error) => {
        console.error("Could not refresh World Cup finals strip:", error);
      });
      renderPredictSwiper(predictSwiperMountEl, { config, forceRefresh: true }).catch((error) => {
        console.error("Could not refresh predict swiper:", error);
      });
    }, WC_RESULTS_REFRESH_MS);
  } catch (error) {
    console.error("Could not start World Cup results strip:", error);
  }
}

function showConfigurationError(missingConfig, elements) {
  const message = `Missing required config value(s): ${missingConfig.join(", ")}`;
  setStatus(elements.boardStatus, message, true);
  setHidden(elements.tableWrap, true);
  elements.heroStatus.textContent = "Standings unavailable";
}

function showFatalError(error) {
  const root = document.getElementById("app") || document.body;
  root.innerHTML = `
    <main class="section section-light">
      <div class="container">
        <div class="board-status error" role="alert"></div>
      </div>
    </main>
  `;
  root.querySelector(".board-status").textContent = `Could not start page: ${error.message}`;
}
