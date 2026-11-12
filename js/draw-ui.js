import { CONFIG } from "../config.js";
import { COPY, t } from "./copy.js";
import { PAGE, LIMITS, addStroke, removeBox, setKind, nextKind, generate } from "./engine/sketch.js";
import { sampleStrokes } from "./sample-data.js";
import { saveSketch, saveCode } from "./store.js";
import { isReducedMotion } from "./motion.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export class DrawUI {
  constructor(state, onBuild) {
    this.state = state;
    this.onBuild = onBuild;
    this.isDrawing = false;
    this.isResizing = false;
    this.activeBoxId = null;
    this.clipboardBox = null;
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
      if (this.isSamplePlaying || this.isResizing) return;
      if (e.button !== 0 && e.pointerType === "mouse") return;

      this.isDrawing = true;
      this.currentPoints = [this.getPointerPos(e)];
      this.svg.setPointerCapture(e.pointerId);

      this.clearFeedback();
      this.updateCurrentStroke();
    });

    this.svg.addEventListener("click", (e) => {
      if (e.target === this.svg || e.target.id === "draw-canvas" || (e.target.tagName === "rect" && e.target.getAttribute("fill")?.includes("grid"))) {
        this.activeBoxId = null;
        if (this.boxesGroup) {
          this.boxesGroup.querySelectorAll(".drawn-box-group").forEach((el) => el.classList.remove("is-active"));
        }
      }
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
      if (this.activeBoxId === box.id) {
        g.classList.add("is-active");
      }
      g.setAttribute("tabindex", "0");
      g.setAttribute("role", "button");
      g.setAttribute("aria-label", `${t("kinds." + box.kind)} box. Press Enter to change kind, Delete to remove, Ctrl+C to copy.`);
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

      // Label Chip (Top-Left) with starting letter only
      const chipG = document.createElementNS(SVG_NS, "g");
      chipG.setAttribute("class", `box-chip chip-${box.kind}`);
      chipG.setAttribute("transform", `translate(${box.x + 4}, ${box.y + 4})`);
      chipG.setAttribute("role", "button");
      chipG.setAttribute("aria-label", t("kinds." + box.kind));

      const chipWidth = 32;
      const chipBg = document.createElementNS(SVG_NS, "rect");
      chipBg.setAttribute("class", "chip-bg");
      chipBg.setAttribute("width", String(chipWidth));
      chipBg.setAttribute("height", "18");
      chipBg.setAttribute("rx", "9");
      chipBg.setAttribute("stroke-width", "1.2");
      chipG.appendChild(chipBg);

      const iconWrap = document.createElementNS(SVG_NS, "g");
      iconWrap.setAttribute("transform", "translate(4, 3.5)");
      iconWrap.appendChild(this.createKindIcon(box.kind));
      chipG.appendChild(iconWrap);

      const chipLetter = document.createElementNS(SVG_NS, "text");
      chipLetter.setAttribute("class", "chip-letter");
      chipLetter.setAttribute("x", "21");
      chipLetter.setAttribute("y", "12.5");
      chipLetter.setAttribute("text-anchor", "middle");
      const initial = (t("kinds." + box.kind) || box.kind).charAt(0).toUpperCase();
      chipLetter.textContent = initial;
      chipG.appendChild(chipLetter);

      const chipTitle = document.createElementNS(SVG_NS, "title");
      chipTitle.textContent = t("kinds." + box.kind);
      chipG.appendChild(chipTitle);

      chipG.addEventListener("click", (e) => {
        e.stopPropagation();
        this.hideTapHint();
        this.changeBoxKind(box.id);
      });

      g.appendChild(chipG);

      // Copy / Duplicate button (Top-Right, next to remove)
      const copyG = document.createElementNS(SVG_NS, "g");
      copyG.setAttribute("class", "box-copy-btn");
      copyG.setAttribute("transform", `translate(${box.x + box.w - 36}, ${box.y + 3})`);
      copyG.setAttribute("role", "button");
      copyG.setAttribute("aria-label", t("code.copy") || "Copy");

      const copyBg = document.createElementNS(SVG_NS, "circle");
      copyBg.setAttribute("class", "copy-bg");
      copyBg.setAttribute("cx", "7");
      copyBg.setAttribute("cy", "7");
      copyBg.setAttribute("r", "7");
      copyG.appendChild(copyBg);

      const copyRectBack = document.createElementNS(SVG_NS, "rect");
      copyRectBack.setAttribute("x", "4");
      copyRectBack.setAttribute("y", "3.5");
      copyRectBack.setAttribute("width", "5");
      copyRectBack.setAttribute("height", "5");
      copyRectBack.setAttribute("rx", "1");
      copyRectBack.setAttribute("fill", "none");
      copyRectBack.setAttribute("stroke", "#FFFFFF");
      copyRectBack.setAttribute("stroke-width", "1");
      copyG.appendChild(copyRectBack);

      const copyRectFront = document.createElementNS(SVG_NS, "rect");
      copyRectFront.setAttribute("x", "5.5");
      copyRectFront.setAttribute("y", "5.5");
      copyRectFront.setAttribute("width", "5");
      copyRectFront.setAttribute("height", "5");
      copyRectFront.setAttribute("rx", "1");
      copyRectFront.setAttribute("fill", "var(--brand)");
      copyRectFront.setAttribute("stroke", "#FFFFFF");
      copyRectFront.setAttribute("stroke-width", "1");
      copyG.appendChild(copyRectFront);

      const copyTitle = document.createElementNS(SVG_NS, "title");
      copyTitle.textContent = t("code.copy") || "Copy";
      copyG.appendChild(copyTitle);

      copyG.addEventListener("click", (e) => {
        e.stopPropagation();
        this.duplicateBox(box.id);
      });

      g.appendChild(copyG);

      // Remove button (Top-Right)
      const removeG = document.createElementNS(SVG_NS, "g");
      removeG.setAttribute("class", "box-remove-btn");
      removeG.setAttribute("transform", `translate(${box.x + box.w - 18}, ${box.y + 3})`);
      removeG.setAttribute("role", "button");
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

      const removeTitle = document.createElementNS(SVG_NS, "title");
      removeTitle.textContent = t("draw.remove");
      removeG.appendChild(removeTitle);

      removeG.addEventListener("click", (e) => {
        e.stopPropagation();
        this.removeBoxById(box.id);
      });

      g.appendChild(removeG);

      // Resize Handle (Bottom-Right Corner)
      const resizeHandle = document.createElementNS(SVG_NS, "g");
      resizeHandle.setAttribute("class", "box-resize-handle");
      resizeHandle.setAttribute("transform", `translate(${box.x + box.w - 14}, ${box.y + box.h - 14})`);
      resizeHandle.setAttribute("role", "slider");
      resizeHandle.setAttribute("aria-label", "Resize box");

      const hitRect = document.createElementNS(SVG_NS, "rect");
      hitRect.setAttribute("x", "-4");
      hitRect.setAttribute("y", "-4");
      hitRect.setAttribute("width", "20");
      hitRect.setAttribute("height", "20");
      hitRect.setAttribute("fill", "transparent");
      resizeHandle.appendChild(hitRect);

      const resizeCircle = document.createElementNS(SVG_NS, "circle");
      resizeCircle.setAttribute("class", "resize-bg");
      resizeCircle.setAttribute("cx", "7");
      resizeCircle.setAttribute("cy", "7");
      resizeCircle.setAttribute("r", "6");
      resizeHandle.appendChild(resizeCircle);

      const resizeGrip = document.createElementNS(SVG_NS, "path");
      resizeGrip.setAttribute("class", "resize-grip");
      resizeGrip.setAttribute("d", "M 4 8 L 8 4 M 6 10 L 10 6");
      resizeGrip.setAttribute("stroke", "currentColor");
      resizeGrip.setAttribute("stroke-width", "1.2");
      resizeGrip.setAttribute("stroke-linecap", "round");
      resizeHandle.appendChild(resizeGrip);

      const resizeTitle = document.createElementNS(SVG_NS, "title");
      resizeTitle.textContent = "Drag to resize";
      resizeHandle.appendChild(resizeTitle);

      this.bindResizeEvents(resizeHandle, box, rect, removeG, copyG);
      g.appendChild(resizeHandle);

      // Selection on tap/click
      g.addEventListener("pointerdown", (e) => {
        e.stopPropagation();
      });
      g.addEventListener("click", (e) => {
        e.stopPropagation();
        this.activeBoxId = box.id;
        this.boxesGroup.querySelectorAll(".drawn-box-group").forEach((el) => {
          el.classList.toggle("is-active", el.getAttribute("data-id") === String(box.id));
        });
      });

      // Keyboard support
      g.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.changeBoxKind(box.id);
        } else if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          this.removeBoxById(box.id);
        } else if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "C")) {
          e.preventDefault();
          this.clipboardBox = { ...box };
        } else if ((e.ctrlKey || e.metaKey) && (e.key === "v" || e.key === "V")) {
          e.preventDefault();
          if (this.clipboardBox) {
            this.duplicateBox(this.clipboardBox.id);
          }
        } else if ((e.ctrlKey || e.metaKey) && (e.key === "d" || e.key === "D")) {
          e.preventDefault();
          this.duplicateBox(box.id);
        } else if (e.key === "+" || e.key === "=") {
          e.preventDefault();
          this.resizeBoxStep(box.id, 1);
        } else if (e.key === "-" || e.key === "_") {
          e.preventDefault();
          this.resizeBoxStep(box.id, -1);
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

  duplicateBox(id) {
    if (this.state.sketch.boxes.length >= LIMITS.boxes) {
      this.showStrokeFailure("full");
      return;
    }

    const source = this.state.sketch.boxes.find((b) => b.id === id);
    if (!source) return;

    this.pushHistory();

    let newX = source.x + 16;
    let newY = source.y + 16;

    if (newX + source.w > PAGE.w) {
      newX = Math.max(0, PAGE.w - source.w);
    }
    if (newY + source.h > PAGE.h) {
      newY = Math.max(0, PAGE.h - source.h);
    }

    const hasHeader = this.state.sketch.boxes.some((b) => b.kind === "header");
    const targetKind = (source.kind === "header" && hasHeader) ? "text" : source.kind;

    const newId = this.state.sketch.nextId++;
    const newBox = {
      id: newId,
      x: newX,
      y: newY,
      w: source.w,
      h: source.h,
      kind: targetKind
    };

    this.state.sketch.boxes.push(newBox);
    this.activeBoxId = newId;
    saveSketch(this.state.sketch);
    this.render(newId);
  }

  bindResizeEvents(handle, box, rect, removeG, copyG) {
    handle.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      e.preventDefault();

      this.isResizing = true;
      const startClientX = e.clientX;
      const startClientY = e.clientY;
      const startW = box.w;
      const startH = box.h;
      const startX = box.x;
      const startY = box.y;

      const svgRect = this.svg.getBoundingClientRect();
      const scaleX = PAGE.w / svgRect.width;
      const scaleY = PAGE.h / svgRect.height;

      this.pushHistory();

      const onPointerMove = (moveEvt) => {
        moveEvt.preventDefault();
        const dx = (moveEvt.clientX - startClientX) * scaleX;
        const dy = (moveEvt.clientY - startClientY) * scaleY;

        const newW = clamp(Math.round(startW + dx), LIMITS.minSize, PAGE.w - startX);
        const newH = clamp(Math.round(startH + dy), LIMITS.flat, PAGE.h - startY);

        box.w = newW;
        box.h = newH;

        rect.setAttribute("width", String(newW));
        rect.setAttribute("height", String(newH));
        removeG.setAttribute("transform", `translate(${startX + newW - 18}, ${startY + 3})`);
        copyG.setAttribute("transform", `translate(${startX + newW - 36}, ${startY + 3})`);
        handle.setAttribute("transform", `translate(${startX + newW - 14}, ${startY + newH - 14})`);
      };

      const onPointerUp = (upEvt) => {
        handle.removeEventListener("pointermove", onPointerMove);
        handle.removeEventListener("pointerup", onPointerUp);
        handle.removeEventListener("pointercancel", onPointerUp);
        try {
          handle.releasePointerCapture(upEvt.pointerId);
        } catch (_) {}

        this.isResizing = false;
        saveSketch(this.state.sketch);
        this.render(box.id);
      };

      try {
        handle.setPointerCapture(e.pointerId);
      } catch (_) {}
      handle.addEventListener("pointermove", onPointerMove);
      handle.addEventListener("pointerup", onPointerUp);
      handle.addEventListener("pointercancel", onPointerUp);
    });
  }

  resizeBoxStep(id, direction) {
    const box = this.state.sketch.boxes.find((b) => b.id === id);
    if (!box) return;

    this.pushHistory();
    const deltaW = direction * 16;
    const deltaH = direction * 12;

    box.w = clamp(box.w + deltaW, LIMITS.minSize, PAGE.w - box.x);
    box.h = clamp(box.h + deltaH, LIMITS.flat, PAGE.h - box.y);

    saveSketch(this.state.sketch);
    this.render(box.id);
  }
}
