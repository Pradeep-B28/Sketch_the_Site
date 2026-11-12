import { CONFIG } from "../config.js";
import { COPY, t } from "./copy.js";
import { generate, missions, lineCount } from "./engine/sketch.js";
import { loadSketch, loadCode, loadTheme, saveTheme } from "./store.js";
import { DrawUI } from "./draw-ui.js";
import { CodeUI } from "./code-ui.js";
import { PreviewUI } from "./preview-ui.js";
import { MissionsUI } from "./missions-ui.js";
import { ResultUI } from "./result-ui.js";
import { SectionsUI } from "./sections-ui.js";
import { animateTyping, animateCountUp, initLoader, initScrollReveal } from "./motion.js";

const state = {
  sketch: { v: 1, boxes: [], nextId: 1 },
  history: [],
  code: "",
  lastGeneratedCode: "",
  lastBuiltSketchHash: "",
  built: false,
  activeStep: "draw",
  phoneView: "draw"
};

let drawUI, codeUI, previewUI, missionsUI, resultUI, sectionsUI;

function initTheme() {
  const toggleBtn = document.getElementById("theme-toggle");
  if (!toggleBtn) return;

  const currentTheme = document.documentElement.getAttribute("data-theme") || loadTheme() || "light";
  document.documentElement.setAttribute("data-theme", currentTheme);

  toggleBtn.addEventListener("click", () => {
    const active = document.documentElement.getAttribute("data-theme");
    const next = active === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    saveTheme(next);
  });
}

function initNavigation() {
  try {
    if (!history.state) {
      history.replaceState({ step: "draw" }, "", window.location.hash || "#draw");
    }
  } catch (e) {}

  const stepDraw = document.getElementById("step-draw");
  const stepCode = document.getElementById("step-code");
  const btnBackToDraw = document.getElementById("btn-back-to-draw");

  if (stepDraw) {
    stepDraw.addEventListener("click", () => {
      try {
        history.pushState({ step: "draw" }, "", "#draw");
      } catch (e) {}
      setStep("draw");
      setPhoneView("draw");
      const drawPanel = document.getElementById("panel-draw");
      if (drawPanel) {
        drawPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  if (stepCode) {
    stepCode.addEventListener("click", () => {
      if (state.built) {
        try {
          history.pushState({ step: "code" }, "", "#code");
        } catch (e) {}
        setStep("code");
        setPhoneView("code");
        const workspacePanel = document.getElementById("panel-workspace");
        if (workspacePanel) {
          workspacePanel.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  }

  if (btnBackToDraw) {
    btnBackToDraw.addEventListener("click", () => {
      try {
        history.pushState({ step: "draw" }, "", "#draw");
      } catch (e) {}
      setStep("draw");
      setPhoneView("draw");
      const drawPanel = document.getElementById("panel-draw");
      if (drawPanel) {
        drawPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  const tabDraw = document.getElementById("tab-draw");
  const tabCode = document.getElementById("tab-code");
  const tabPreview = document.getElementById("tab-preview");

  if (tabDraw && tabCode && tabPreview) {
    tabDraw.addEventListener("click", () => {
      try {
        history.pushState({ step: "draw" }, "", "#draw");
      } catch (e) {}
      setStep("draw");
      setPhoneView("draw");
    });
    tabCode.addEventListener("click", () => {
      try {
        history.pushState({ step: "code" }, "", "#code");
      } catch (e) {}
      setStep("code");
      setPhoneView("code");
    });
    tabPreview.addEventListener("click", () => {
      setPhoneView("preview");
    });
  }

  window.addEventListener("popstate", (e) => {
    const targetStep = e.state?.step || (window.location.hash === "#code" ? "code" : "draw");
    if (targetStep === "draw") {
      setStep("draw");
      setPhoneView("draw");
      const drawPanel = document.getElementById("panel-draw");
      if (drawPanel) {
        drawPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else if (state.built) {
      setStep("code");
      setPhoneView("code");
      const workspacePanel = document.getElementById("panel-workspace");
      if (workspacePanel) {
        workspacePanel.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  });
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

  const toolContainer = document.getElementById("tool-container");
  if (toolContainer) {
    toolContainer.setAttribute("data-step", step);
  }
}

export function setPhoneView(view) {
  state.phoneView = view;
  const toolContainer = document.getElementById("tool-container");
  if (toolContainer) {
    toolContainer.setAttribute("data-phone-view", view);
  }
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
  state.lastBuiltSketchHash = JSON.stringify(state.sketch.boxes);

  try {
    history.pushState({ step: "code" }, "", "#code");
  } catch (e) {}

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
  setStep("code");
  setPhoneView("code");
  const codePanel = document.getElementById("panel-code");
  if (codePanel) {
    codePanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  if (codeUI) {
    codeUI.selectRange(range.start, range.end);
  }
}

export function render() {
  const toolContainer = document.getElementById("tool-container");
  const toolGrid = document.getElementById("tool-grid");
  const stepCode = document.getElementById("step-code");

  if (state.built) {
    if (toolContainer) {
      toolContainer.classList.add("is-built");
      toolContainer.setAttribute("data-built", "true");
    }
    if (toolGrid) toolGrid.classList.add("is-built");
    if (stepCode) stepCode.removeAttribute("disabled");
  } else {
    if (toolContainer) {
      toolContainer.classList.remove("is-built");
      toolContainer.setAttribute("data-built", "false");
    }
    if (toolGrid) toolGrid.classList.remove("is-built");
    if (stepCode) stepCode.setAttribute("disabled", "");
  }

  if (toolContainer) {
    toolContainer.setAttribute("data-step", state.activeStep || "draw");
    toolContainer.setAttribute("data-phone-view", state.phoneView || "draw");
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
    state.lastBuiltSketchHash = JSON.stringify(state.sketch.boxes);
    state.built = true;
    state.activeStep = "code";
    state.phoneView = "code";

    codeUI.setValue(savedCode, true);
    previewUI.update(savedCode);

    const gen = generate(state.sketch);
    const m = missions(savedCode, state.sketch);
    missionsUI.update(m);
    resultUI.update(gen, m);
    sectionsUI.updateLiveNumbers(gen);
  } else {
    state.activeStep = "draw";
    state.phoneView = "draw";
  }

  setStep(state.activeStep);
  setPhoneView(state.phoneView);
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
