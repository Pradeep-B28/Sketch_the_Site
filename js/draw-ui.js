import { CONFIG } from "../config.js";
import { COPY, t } from "./copy.js";
import { PAGE, addStroke, removeBox, setKind, nextKind, generate } from "./engine/sketch.js";
import { sampleStrokes } from "./sample-data.js";
import { saveSketch, saveCode } from "./store.js";
import { isReducedMotion } from "./motion.js";

const SVG_NS = "http://www.w3.org/2000/svg";

export class DrawUI {
  constructor(state, onBuild) {
    this.state = state;
    this.onBuild = onBuild;
    this.isDrawing = false;
    this.currentPoints = [];
    this.tapHintShown = false;
    this.isSamplePlaying = false;

    this.wrapper = document.getElementById("draw-wrapper");
    this.svg = document.getElementById("draw-canvas");
    this.boxesGroup = document.getElementById("draw-boxes-group");
    this.currentStrokePath = document.getElementById("draw-current-stroke");
    this.emptyStateGroup = document.getElementById("draw-empty-state");
    this.feedbackEl = document.getElementById("stroke-feedback");
    this.countBadge = document.getElementById("draw-count");
    this.tapHintBanner = document.getElementById("tap-hint-banner");
    this.screenReaderList = document.getElementById("draw-boxes-list");

    this.btnUndo = document.getElementById("btn-undo");
    this.btnClear = document.getElementById("btn-clear");
    this.btnSample = document.getElementById("btn-sample");
    this.btnBuild = document.getElementById("btn-build");

    this.clearConfirm = document.getElementById("clear-confirm");
    this.btnClearYes = document.getElementById("btn-clear-yes");
    this.btnClearNo = document.getElementById("btn-clear-no");

    this.rebuildConfirm = document.getElementById("rebuild-confirm");
    this.btnRebuildYes = document.getElementById("btn-rebuild-yes");
    this.btnRebuildNo = document.getElementById("btn-rebuild-no");

    this.init();
  }

  init() {
    this.bindPointerEvents();
    this.bindToolbar();
    this.bindConfirms();
    this.bindTapHint();
    this.render();
  }

  pushHistory() {
    this.state.history.push({
      v: this.state.sketch.v,
      boxes: this.state.sketch.boxes.map((b) => ({ ...b })),
      nextId: this.state.sketch.nextId
    });
    if (this.state.history.length > 30) {
      this.state.history.shift();
    }
  }

  getPointerPos(e) {
    const rect = this.svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * PAGE.w;
    const y = ((e.clientY - rect.top) / rect.height) * PAGE.h;
    return [
      Math.max(0, Math.min(PAGE.w, Math.round(x))),
      Math.max(0, Math.min(PAGE.h, Math.round(y)))
    ];
  }

  bindPointerEvents() {
    if (!this.svg) return;

    this.svg.addEventListener("pointerdown", (e) => {
      if (this.isSamplePlaying) return;
      if (e.button !== 0 && e.pointerType === "mouse") return;

      this.isDrawing = true;
      this.currentPoints = [this.getPointerPos(e)];
      this.svg.setPointerCapture(e.pointerId);

      this.clearFeedback();
      this.updateCurrentStroke();
    });

    this.svg.addEventListener("pointermove", (e) => {
      if (!this.isDrawing) return;
      const pt = this.getPointerPos(e);
      const last = this.currentPoints[this.currentPoints.length - 1];
      if (!last || Math.hypot(pt[0] - last[0], pt[1] - last[1]) >= 2) {
        this.currentPoints.push(pt);
        this.updateCurrentStroke();
      }
    });

    const finishStroke = (e) => {
      if (!this.isDrawing) return;
      this.isDrawing = false;
      try {
        this.svg.releasePointerCapture(e.pointerId);
      } catch (err) {
        // Pointer was not captured or already released
      }

      if (this.currentPoints.length < 2) {
        this.currentPoints = [];
        this.updateCurrentStroke();
        return;
      }

      this.pushHistory();
      const res = addStroke(this.state.sketch, this.currentPoints);
      this.currentPoints = [];
      this.updateCurrentStroke();

      if (res.ok) {
        this.state.sketch = res.sketch;
        saveSketch(this.state.sketch);
        this.render(res.box.id);

        if (!this.tapHintShown && this.state.sketch.boxes.length === 1) {
          this.showTapHint();
        }
      } else {
        this.state.history.pop();
        this.showStrokeFailure(res.reason);
      }
    };

    this.svg.addEventListener("pointerup", finishStroke);
    this.svg.addEventListener("pointercancel", finishStroke);
  }

  updateCurrentStroke() {
    if (!this.currentStrokePath) return;
    if (this.currentPoints.length < 2) {
      this.currentStrokePath.setAttribute("d", "");
      return;
    }
    const d = this.currentPoints.map((p, idx) => (idx === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(" ");
    this.currentStrokePath.setAttribute("d", d);
  }

  showStrokeFailure(reason) {
    const text = t("reasons.stroke." + reason) || t("reasons.stroke.invalid");
    this.showFeedback(text);

    if (this.wrapper) {
      this.wrapper.classList.remove("shake");
      void this.wrapper.offsetWidth;
      this.wrapper.classList.add("shake");
      setTimeout(() => {
        if (this.wrapper) this.wrapper.classList.remove("shake");
      }, 300);
    }
  }

  showFeedback(text) {
    if (this.feedbackEl) {
      this.feedbackEl.textContent = text;
    }
  }

  clearFeedback() {
    if (this.feedbackEl) {
      this.feedbackEl.textContent = "";
    }
  }

  showTapHint() {
    if (this.tapHintBanner) {
      this.tapHintBanner.hidden = false;
    }
  }

  hideTapHint() {
    this.tapHintShown = true;
    if (this.tapHintBanner) {
      this.tapHintBanner.hidden = true;
    }
  }

  bindTapHint() {
    const closeBtn = this.tapHintBanner?.querySelector(".tap-hint-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.hideTapHint());
    }
  }

  bindToolbar() {
    if (this.btnUndo) {
      this.btnUndo.addEventListener("click", () => {
        if (this.state.history.length === 0) return;
        this.state.sketch = this.state.history.pop();
        saveSketch(this.state.sketch);
        this.render();
      });
    }

    if (this.btnClear) {
      this.btnClear.addEventListener("click", () => {
        if (this.state.sketch.boxes.length === 0) return;
        if (this.clearConfirm) {
          this.clearConfirm.hidden = false;
        }
      });
    }

    if (this.btnSample) {
      this.btnSample.addEventListener("click", () => {
        this.playSample();
      });
    }

    if (this.btnBuild) {
      this.btnBuild.addEventListener("click", () => {
        this.handleBuildClick();
      });
    }
  }

  bindConfirms() {
    if (this.btnClearYes) {
      this.btnClearYes.addEventListener("click", () => {
        if (this.clearConfirm) this.clearConfirm.hidden = true;
        this.pushHistory();
        this.state.sketch = { v: 1, boxes: [], nextId: 1 };
        saveSketch(this.state.sketch);
        this.render();
      });
    }

    if (this.btnClearNo) {
      this.btnClearNo.addEventListener("click", () => {
        if (this.clearConfirm) this.clearConfirm.hidden = true;
      });
    }

    if (this.btnRebuildYes) {
      this.btnRebuildYes.addEventListener("click", () => {
        if (this.rebuildConfirm) this.rebuildConfirm.hidden = true;
        this.executeBuild();
      });
    }

    if (this.btnRebuildNo) {
      this.btnRebuildNo.addEventListener("click", () => {
        if (this.rebuildConfirm) this.rebuildConfirm.hidden = true;
      });
    }
  }

  handleBuildClick() {
    if (this.state.sketch.boxes.length === 0) return;

    if (this.state.built && this.state.code) {
      const codeEl = document.getElementById("code");
      const currentCode = codeEl ? codeEl.value : this.state.code;
      const lastCode = this.state.lastGeneratedCode;

      if (lastCode && currentCode !== lastCode) {
        if (this.rebuildConfirm) {
          this.rebuildConfirm.hidden = false;
        }
        return;
      }
    }

    this.executeBuild();
  }

  executeBuild() {
    const result = generate(this.state.sketch);
    this.state.code = result.code;
    this.state.lastGeneratedCode = result.code;
    this.state.lastBuiltSketchHash = JSON.stringify(this.state.sketch.boxes);
    this.state.built = true;
    saveCode(this.state.code);
    saveSketch(this.state.sketch);

    if (this.onBuild) {
      this.onBuild(result);
    }
    this.render();
  }

  playSample() {
    if (this.state.sketch.boxes.length > 0 || this.isSamplePlaying) return;

    this.isSamplePlaying = true;
    if (this.btnSample) this.btnSample.disabled = true;

    const strokes = sampleStrokes();

    if (isReducedMotion()) {
      this.pushHistory();
      let cur = this.state.sketch;
      for (const pts of strokes) {
        const res = addStroke(cur, pts);
        if (res.ok) cur = res.sketch;
      }
      this.state.sketch = cur;
      saveSketch(this.state.sketch);
      this.isSamplePlaying = false;
      this.render();
      return;
    }

    let strokeIdx = 0;
    const playNext = () => {
      if (strokeIdx >= strokes.length) {
        this.isSamplePlaying = false;
        this.render();
        if (!this.tapHintShown) {
          this.showTapHint();
        }
        return;
      }

      const pts = strokes[strokeIdx];
      const strokeTime = CONFIG.sampleStrokeMs || 450;
      const startTime = performance.now();

      const animateStroke = (now) => {
        const progress = Math.min(1, (now - startTime) / strokeTime);
        const count = Math.max(2, Math.floor(progress * pts.length));
        this.currentPoints = pts.slice(0, count);
        this.updateCurrentStroke();

        if (progress < 1) {
          requestAnimationFrame(animateStroke);
        } else {
          this.currentPoints = [];
          this.updateCurrentStroke();

          this.pushHistory();
          const res = addStroke(this.state.sketch, pts);
          if (res.ok) {
            this.state.sketch = res.sketch;
            saveSketch(this.state.sketch);
            this.render(res.box.id);
          }

          strokeIdx++;
          setTimeout(playNext, CONFIG.snapMs || 260);
        }
      };

      requestAnimationFrame(animateStroke);
    };

    playNext();
  }

  createKindIcon(kind) {
    const iconG = document.createElementNS(SVG_NS, "g");
    iconG.setAttribute("class", "chip-icon");

    if (kind === "header") {
      const top = document.createElementNS(SVG_NS, "rect");
      top.setAttribute("x", "0");
      top.setAttribute("y", "2");
      top.setAttribute("width", "11");
      top.setAttribute("height", "3");
      top.setAttribute("rx", "1");
      top.setAttribute("fill", "currentColor");
      const bottom = document.createElementNS(SVG_NS, "rect");
      bottom.setAttribute("x", "0");
      bottom.setAttribute("y", "7");
      bottom.setAttribute("width", "11");
      bottom.setAttribute("height", "1.5");
      bottom.setAttribute("rx", "0.75");
      bottom.setAttribute("fill", "currentColor");
      bottom.setAttribute("opacity", "0.4");
      iconG.appendChild(top);
      iconG.appendChild(bottom);
    } else if (kind === "image") {
      const rect = document.createElementNS(SVG_NS, "rect");
      rect.setAttribute("x", "0");
      rect.setAttribute("y", "1");
      rect.setAttribute("width", "12");
      rect.setAttribute("height", "9");
      rect.setAttribute("rx", "1.5");
      rect.setAttribute("stroke", "currentColor");
      rect.setAttribute("stroke-width", "1.2");
      rect.setAttribute("fill", "none");
      const dot = document.createElementNS(SVG_NS, "circle");
      dot.setAttribute("cx", "3.5");
      dot.setAttribute("cy", "3.8");
      dot.setAttribute("r", "1");
      dot.setAttribute("fill", "currentColor");
      const hill = document.createElementNS(SVG_NS, "path");
      hill.setAttribute("d", "M 1 8 L 4 5 L 7.5 8 L 9 6.5 L 11 8");
      hill.setAttribute("stroke", "currentColor");
      hill.setAttribute("stroke-width", "1");
      hill.setAttribute("fill", "none");
      iconG.appendChild(rect);
      iconG.appendChild(dot);
      iconG.appendChild(hill);
    } else if (kind === "button") {
      const pill = document.createElementNS(SVG_NS, "rect");
      pill.setAttribute("x", "0");
      pill.setAttribute("y", "2");
      pill.setAttribute("width", "12");
      pill.setAttribute("height", "7");
      pill.setAttribute("rx", "3.5");
      pill.setAttribute("stroke", "currentColor");
      pill.setAttribute("stroke-width", "1.2");
      pill.setAttribute("fill", "currentColor");
      pill.setAttribute("fill-opacity", "0.2");
      iconG.appendChild(pill);
    } else {
      // text
      const l1 = document.createElementNS(SVG_NS, "rect");
      l1.setAttribute("x", "0");
      l1.setAttribute("y", "2");
      l1.setAttribute("width", "11");
      l1.setAttribute("height", "1.5");
      l1.setAttribute("rx", "0.75");
      l1.setAttribute("fill", "currentColor");
      const l2 = document.createElementNS(SVG_NS, "rect");
      l2.setAttribute("x", "0");
      l2.setAttribute("y", "5");
      l2.setAttribute("width", "8");
      l2.setAttribute("height", "1.5");
      l2.setAttribute("rx", "0.75");
      l2.setAttribute("fill", "currentColor");
      const l3 = document.createElementNS(SVG_NS, "rect");
      l3.setAttribute("x", "0");
      l3.setAttribute("y", "8");
      l3.setAttribute("width", "10");
      l3.setAttribute("height", "1.5");
      l3.setAttribute("rx", "0.75");
      l3.setAttribute("fill", "currentColor");
      iconG.appendChild(l1);
      iconG.appendChild(l2);
      iconG.appendChild(l3);
    }

    return iconG;
  }

  render(snapBoxId = null) {
    if (!this.boxesGroup) return;

    this.boxesGroup.replaceChildren();

    const boxes = this.state.sketch.boxes;
    const count = boxes.length;

    // Empty state
    if (this.emptyStateGroup) {
      this.emptyStateGroup.style.display = count === 0 ? "block" : "none";
    }

    // Screen reader list
    if (this.screenReaderList) {
      this.screenReaderList.replaceChildren();
      boxes.forEach((b, idx) => {
        const li = document.createElement("li");
        li.textContent = `Box ${idx + 1}: ${t("kinds." + b.kind)} at position (${b.x}, ${b.y}), size ${b.w} by ${b.h}`;
        this.screenReaderList.appendChild(li);
      });
    }

    // Render each box
    boxes.forEach((box) => {
      const g = document.createElementNS(SVG_NS, "g");
      g.setAttribute("class", `drawn-box-group kind-${box.kind}`);
      g.setAttribute("tabindex", "0");
      g.setAttribute("role", "button");
      g.setAttribute("aria-label", `${t("kinds." + box.kind)} box. Press Enter to change kind, Delete to remove.`);
      g.setAttribute("data-id", String(box.id));

      if (snapBoxId === box.id) {
        g.classList.add("box-snapping");
      }

      // Main rectangle
      const rect = document.createElementNS(SVG_NS, "rect");
      rect.setAttribute("class", `box-rect box-rect-${box.kind}`);
      rect.setAttribute("x", String(box.x));
      rect.setAttribute("y", String(box.y));
      rect.setAttribute("width", String(box.w));
      rect.setAttribute("height", String(box.h));
      rect.setAttribute("rx", box.kind === "button" ? "16" : "8");
      g.appendChild(rect);

      // Label Chip (Top-Left)
      const chipG = document.createElementNS(SVG_NS, "g");
      chipG.setAttribute("class", `box-chip chip-${box.kind}`);
      chipG.setAttribute("transform", `translate(${box.x + 4}, ${box.y + 4})`);

      const chipWidth = box.kind === "header" || box.kind === "button" ? 68 : 58;
      const chipBg = document.createElementNS(SVG_NS, "rect");
      chipBg.setAttribute("class", "chip-bg");
      chipBg.setAttribute("width", String(chipWidth));
      chipBg.setAttribute("height", "18");
      chipBg.setAttribute("rx", "9");
      chipG.appendChild(chipBg);

      const iconWrap = document.createElementNS(SVG_NS, "g");
      iconWrap.setAttribute("transform", "translate(5, 3.5)");
      iconWrap.appendChild(this.createKindIcon(box.kind));
      chipG.appendChild(iconWrap);

      const chipText = document.createElementNS(SVG_NS, "text");
      chipText.setAttribute("class", "chip-text");
      chipText.setAttribute("x", "22");
      chipText.setAttribute("y", "12.5");
      chipText.textContent = t("kinds." + box.kind);
      chipG.appendChild(chipText);

      chipG.addEventListener("click", (e) => {
        e.stopPropagation();
        this.hideTapHint();
        this.changeBoxKind(box.id);
      });

      g.appendChild(chipG);

      // Remove button (Top-Right)
      const removeG = document.createElementNS(SVG_NS, "g");
      removeG.setAttribute("class", "box-remove-btn");
      removeG.setAttribute("transform", `translate(${box.x + box.w - 18}, ${box.y + 3})`);
      removeG.setAttribute("aria-label", t("draw.remove"));

      const removeBg = document.createElementNS(SVG_NS, "circle");
      removeBg.setAttribute("class", "remove-bg");
      removeBg.setAttribute("cx", "7");
      removeBg.setAttribute("cy", "7");
      removeBg.setAttribute("r", "7");
      removeG.appendChild(removeBg);

      const removeCross = document.createElementNS(SVG_NS, "path");
      removeCross.setAttribute("class", "remove-cross");
      removeCross.setAttribute("d", "M 4.5 4.5 L 9.5 9.5 M 9.5 4.5 L 4.5 9.5");
      removeCross.setAttribute("stroke", "currentColor");
      removeCross.setAttribute("stroke-width", "1.5");
      removeCross.setAttribute("stroke-linecap", "round");
      removeG.appendChild(removeCross);

      removeG.addEventListener("click", (e) => {
        e.stopPropagation();
        this.removeBoxById(box.id);
      });

      g.appendChild(removeG);

      // Keyboard support
      g.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.changeBoxKind(box.id);
        } else if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          this.removeBoxById(box.id);
        }
      });

      this.boxesGroup.appendChild(g);
    });

    // Update Toolbar states
    if (this.countBadge) {
      this.countBadge.textContent = t("draw.count", { count, max: 12 });
    }

    if (this.btnUndo) {
      this.btnUndo.disabled = this.state.history.length === 0 || this.isSamplePlaying;
    }

    if (this.btnClear) {
      this.btnClear.disabled = count === 0 || this.isSamplePlaying;
    }

    if (this.btnSample) {
      this.btnSample.style.display = count === 0 ? "inline-flex" : "none";
      this.btnSample.disabled = this.isSamplePlaying;
    }

    if (this.btnBuild) {
      if (this.state.built) {
        this.btnBuild.textContent = t("draw.rebuild");
        const currentHash = JSON.stringify(this.state.sketch.boxes);
        const hasChanged = currentHash !== (this.state.lastBuiltSketchHash || "");
        this.btnBuild.disabled = count === 0 || this.isSamplePlaying || !hasChanged;
      } else {
        this.btnBuild.textContent = t("draw.build");
        this.btnBuild.disabled = count === 0 || this.isSamplePlaying;
      }
    }
  }

  changeBoxKind(id) {
    const next = nextKind(this.state.sketch, id);
    if (!next) return;

    this.pushHistory();
    const res = setKind(this.state.sketch, id, next);
    if (res.ok) {
      this.state.sketch = res.sketch;
      saveSketch(this.state.sketch);
      this.render();
    } else {
      this.state.history.pop();
      const text = t("reasons.kind." + res.reason) || t("reasons.kind.unknown");
      this.showFeedback(text);
    }
  }

  removeBoxById(id) {
    this.pushHistory();
    const res = removeBox(this.state.sketch, id);
    if (res.ok) {
      this.state.sketch = res.sketch;
      saveSketch(this.state.sketch);
      this.render();
    } else {
      this.state.history.pop();
    }
  }
}
