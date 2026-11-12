import { CONFIG } from "../config.js";
import { COPY, t } from "./copy.js";
import { newSketch } from "./engine/sketch.js";
import { loadTheme, saveTheme, loadSketch, loadCode } from "./store.js";
import { initLoader } from "./motion.js";
import { DrawUI } from "./draw-ui.js";

// Global application state
export const state = {
  sketch: newSketch(),
  history: [],
  code: "",
  lastGeneratedCode: "",
  built: false,
  activeStep: "draw",
  phoneView: "draw",
  previewMode: "phone"
};

let drawUI = null;

function initTheme() {
  const toggleBtn = document.getElementById("theme-toggle");
  if (!toggleBtn) return;

  toggleBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "light";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    saveTheme(next);
  });
}

function initNavigation() {
  const stepDraw = document.getElementById("step-draw");
  const stepCode = document.getElementById("step-code");

  if (stepDraw && stepCode) {
    stepDraw.addEventListener("click", () => {
      setStep("draw");
    });
    stepCode.addEventListener("click", () => {
      if (state.built) {
        setStep("code");
      }
    });
  }

  const tabDraw = document.getElementById("tab-draw");
  const tabCode = document.getElementById("tab-code");
  const tabPreview = document.getElementById("tab-preview");

  if (tabDraw && tabCode && tabPreview) {
    tabDraw.addEventListener("click", () => setPhoneView("draw"));
    tabCode.addEventListener("click", () => setPhoneView("code"));
    tabPreview.addEventListener("click", () => setPhoneView("preview"));
  }
}

export function setStep(step) {
  state.activeStep = step;
  const stepDraw = document.getElementById("step-draw");
  const stepCode = document.getElementById("step-code");
  if (stepDraw && stepCode) {
    if (step === "draw") {
      stepDraw.classList.add("active");
      stepCode.classList.remove("active");
    } else {
      stepDraw.classList.remove("active");
      stepCode.classList.add("active");
    }
  }
}

export function setPhoneView(view) {
  state.phoneView = view;
  const toolGrid = document.getElementById("tool-grid");
  if (toolGrid) {
    toolGrid.setAttribute("data-phone-view", view);
  }

  const tabs = {
    draw: document.getElementById("tab-draw"),
    code: document.getElementById("tab-code"),
    preview: document.getElementById("tab-preview")
  };

  for (const [key, tab] of Object.entries(tabs)) {
    if (tab) {
      const active = key === view;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    }
  }
}

function onBuildComplete(result) {
  state.built = true;
  state.code = result.code;
  state.lastGeneratedCode = result.code;
  setStep("code");
  setPhoneView("code");
  render();
}

export function render() {
  const toolGrid = document.getElementById("tool-grid");
  if (!toolGrid) return;

  if (state.built) {
    toolGrid.classList.add("is-built");
  } else {
    toolGrid.classList.remove("is-built");
  }

  if (drawUI) {
    drawUI.render();
  }
}

function init() {
  const savedSketch = loadSketch();
  if (savedSketch) {
    state.sketch = savedSketch;
  }

  const savedCode = loadCode();
  if (savedCode) {
    state.code = savedCode;
    state.built = true;
  }

  initTheme();
  initNavigation();

  drawUI = new DrawUI(state, onBuildComplete);
  render();

  initLoader(() => {
    // Loader complete
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
