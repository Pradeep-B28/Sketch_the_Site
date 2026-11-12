import { CONFIG } from "../config.js";
import { COPY, t } from "./copy.js";
import { FILE_NAME, LIMITS, lineCount } from "./engine/sketch.js";
import { saveCode } from "./store.js";

export class CodeUI {
  constructor(options = {}) {
    this.onCodeChange = options.onCodeChange || (() => {});
    this.onReset = options.onReset || (() => {});

    this.textarea = document.getElementById("code");
    this.gutter = document.getElementById("code-gutter");
    this.linesDisplay = document.getElementById("line-count-display");
    this.errorDisplay = document.getElementById("code-error-display");

    this.btnCopy = document.getElementById("btn-copy");
    this.btnReset = document.getElementById("btn-reset");
    this.btnDownload = document.getElementById("btn-download");

    this.resetConfirm = document.getElementById("reset-confirm");
    this.btnResetYes = document.getElementById("btn-reset-yes");
    this.btnResetNo = document.getElementById("btn-reset-no");

    this.debounceTimer = null;
    this.defaultCode = "";

    this.init();
  }

  init() {
    if (!this.textarea) return;

    this.bindTextarea();
    this.bindButtons();
    this.bindConfirms();
    this.updateGutter();
  }

  bindTextarea() {
    this.textarea.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const val = this.textarea.value;
        this.textarea.value = val.substring(0, start) + "  " + val.substring(end);
        this.textarea.selectionStart = this.textarea.selectionEnd = start + 2;
        this.handleInput();
      } else if (e.key === "Escape") {
        this.textarea.blur();
      }
    });

    this.textarea.addEventListener("input", () => {
      this.handleInput();
    });

    this.textarea.addEventListener("scroll", () => {
      if (this.gutter) {
        this.gutter.scrollTop = this.textarea.scrollTop;
      }
    });
  }

  handleInput() {
    this.updateGutter();
    this.updateLineCount();

    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    const delay = CONFIG.previewDelayMs || 250;

    this.debounceTimer = setTimeout(() => {
      const code = this.textarea.value;
      if (code.length > LIMITS.codeLength) {
        if (this.errorDisplay) {
          this.errorDisplay.textContent = t("reasons.codeLong");
        }
        return;
      }

      if (this.errorDisplay) {
        this.errorDisplay.textContent = "";
      }

      saveCode(code);
      this.onCodeChange(code);
    }, delay);
  }

  updateGutter() {
    if (!this.gutter || !this.textarea) return;
    const lines = this.textarea.value.split("\n").length;
    this.gutter.replaceChildren();
    for (let i = 1; i <= lines; i++) {
      const span = document.createElement("span");
      span.textContent = String(i);
      this.gutter.appendChild(span);
    }
  }

  updateLineCount() {
    if (!this.linesDisplay || !this.textarea) return;
    const count = lineCount(this.textarea.value);
    this.linesDisplay.textContent = t("result.yourLines", { lines: count });
  }

  bindButtons() {
    if (this.btnCopy) {
      this.btnCopy.addEventListener("click", () => this.handleCopy());
    }

    if (this.btnReset) {
      this.btnReset.addEventListener("click", () => {
        if (this.resetConfirm) {
          this.resetConfirm.hidden = false;
        }
      });
    }

    if (this.btnDownload) {
      this.btnDownload.addEventListener("click", () => this.handleDownload());
    }
  }

  bindConfirms() {
    if (this.btnResetYes) {
      this.btnResetYes.addEventListener("click", () => {
        if (this.resetConfirm) this.resetConfirm.hidden = true;
        this.setValue(this.defaultCode);
        saveCode(this.defaultCode);
        this.onReset(this.defaultCode);
      });
    }

    if (this.btnResetNo) {
      this.btnResetNo.addEventListener("click", () => {
        if (this.resetConfirm) this.resetConfirm.hidden = true;
      });
    }
  }

  handleCopy() {
    if (!this.textarea || !this.btnCopy) return;
    const code = this.textarea.value;

    const onSuccess = () => {
      const origText = this.btnCopy.textContent;
      this.btnCopy.textContent = t("code.copied") || "Copied";
      this.btnCopy.classList.add("btn-success");
      setTimeout(() => {
        if (this.btnCopy) {
          this.btnCopy.textContent = origText;
          this.btnCopy.classList.remove("btn-success");
        }
      }, 1500);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(onSuccess, () => {
        if (this.errorDisplay) {
          this.errorDisplay.textContent = t("reasons.copyFailed");
        }
      });
    } else {
      this.textarea.select();
      try {
        document.execCommand("copy");
        onSuccess();
      } catch (err) {
        if (this.errorDisplay) {
          this.errorDisplay.textContent = t("reasons.copyFailed");
        }
      }
    }
  }

  handleDownload() {
    if (!this.textarea || !this.btnDownload) return;
    const code = this.textarea.value;
    const blob = new Blob([code], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = FILE_NAME;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const origText = this.btnDownload.textContent;
    this.btnDownload.textContent = t("missions.done") || "Done";
    this.btnDownload.classList.add("btn-success");
    setTimeout(() => {
      if (this.btnDownload) {
        this.btnDownload.textContent = origText;
        this.btnDownload.classList.remove("btn-success");
      }
    }, 1500);
  }

  setValue(code, isDefault = false) {
    if (!this.textarea) return;
    this.textarea.value = code || "";
    if (isDefault) {
      this.defaultCode = code || "";
    }
    this.updateGutter();
    this.updateLineCount();
  }

  getValue() {
    return this.textarea ? this.textarea.value : "";
  }

  selectRange(start, end) {
    if (!this.textarea) return;
    this.textarea.focus();
    this.textarea.setSelectionRange(start, end);

    // Scroll line into view
    const textUpToStart = this.textarea.value.substring(0, start);
    const lineIndex = textUpToStart.split("\n").length - 1;
    const lineHeight = 24; // approximate line height in px
    this.textarea.scrollTop = Math.max(0, lineIndex * lineHeight - 60);
  }
}
