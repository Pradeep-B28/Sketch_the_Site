import { CONFIG } from "../config.js";
import { COPY, t } from "./copy.js";
import { newSketch, generate, missions } from "./engine/sketch.js";
import { loadTheme, saveTheme, loadSketch, loadCode, saveCode } from "./store.js";
import { initLoader, animateTyping, animateCountUp, initScrollReveal } from "./motion.js";
import { DrawUI } from "./draw-ui.js";
import { CodeUI } from "./code-ui.js";
import { PreviewUI } from "./preview-ui.js";
import { MissionsUI } from "./missions-ui.js";
import { ResultUI } from "./result-ui.js";
import { SectionsUI } from "./sections-ui.js";

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
let codeUI = null;
let previewUI = null;
let missionsUI = null;
let resultUI = null;
let sectionsUI = null;

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

function onBuildMoment(result) {
  state.built = true;
  state.code = result.code;
  state.lastGeneratedCode = result.code;

  setStep("code");
  setPhoneView("code");
  render();

  const announcer = document.getElementById("announcer");
  if (announcer) {
    announcer.textContent = result.headline;
  }

  const typeDuration = CONFIG.typeMs || 1200;
  const countUpDuration = CONFIG.countUpMs || 700;

  animateCountUp(resultUI.headlineEl, result.headline, countUpDuration);

  animateTyping(codeUI.textarea, result.code, typeDuration, () => {
    codeUI.setValue(result.code, true);
    previewUI.update(result.code);

    const m = missions(result.code, state.sketch);
    missionsUI.update(m);
    resultUI.update(result, m);
    sectionsUI.updateLiveNumbers(result);
  });
}

function handleCodeChange(newCode) {
  state.code = newCode;
  previewUI.update(newCode);

  const m = missions(newCode, state.sketch);
  missionsUI.update(m);

  const gen = generate(state.sketch);
  resultUI.update(gen, m);
}

function handleCodeReset(defaultCode) {
  state.code = defaultCode;
  previewUI.update(defaultCode);

  const m = missions(defaultCode, state.sketch);
  missionsUI.update(m);

  const gen = generate(state.sketch);
  resultUI.update(gen, m);
}

function handleShowWhere(range) {
  setPhoneView("code");
  if (codeUI) {
    codeUI.selectRange(range.start, range.end);
  }
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

  initTheme();
  initNavigation();

  drawUI = new DrawUI(state, onBuildMoment);
  codeUI = new CodeUI({
    onCodeChange: handleCodeChange,
    onReset: handleCodeReset
  });
  previewUI = new PreviewUI();
  missionsUI = new MissionsUI({
    onShowWhere: handleShowWhere
  });
  resultUI = new ResultUI();
  sectionsUI = new SectionsUI();

  const savedCode = loadCode();
  if (savedCode && state.sketch.boxes.length > 0) {
    state.code = savedCode;
    state.lastGeneratedCode = generate(state.sketch).code;
    state.built = true;

    codeUI.setValue(savedCode, true);
    previewUI.update(savedCode);

    const gen = generate(state.sketch);
    const m = missions(savedCode, state.sketch);
    missionsUI.update(m);
    resultUI.update(gen, m);
    sectionsUI.updateLiveNumbers(gen);
  }

  render();
  initScrollReveal();

  if (window.location.search && window.location.search.includes("test=1")) {
    import("./selftest.js").then(({ runSelfTest }) => {
      runSelfTest();
    });
  }

  initLoader(() => {
    // Loader finished
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
