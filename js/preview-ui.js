import { COPY, t } from "./copy.js";

export class PreviewUI {
  constructor() {
    this.iframe = document.getElementById("preview");
    this.wrapper = document.getElementById("preview-frame-wrapper");
    this.sweepLine = document.getElementById("preview-sweep-line");
    this.btnPhone = document.getElementById("btn-view-phone");
    this.btnLaptop = document.getElementById("btn-view-laptop");
    this.mode = "phone";

    this.resizeObserver = null;
    this.init();
  }

  init() {
    if (this.iframe) {
      this.iframe.title = t("preview.label") || "Live preview of your website";
    }

    if (this.btnPhone && this.btnLaptop) {
      this.btnPhone.addEventListener("click", () => this.setMode("phone"));
      this.btnLaptop.addEventListener("click", () => this.setMode("laptop"));
    }

    if (window.ResizeObserver && this.wrapper) {
      this.resizeObserver = new ResizeObserver(() => {
        this.applyScale();
      });
      this.resizeObserver.observe(this.wrapper);
    }

    window.addEventListener("resize", () => this.applyScale());

    this.setMode("phone");
  }

  setMode(mode) {
    this.mode = mode;
    if (this.btnPhone && this.btnLaptop && this.wrapper) {
      const isPhone = mode === "phone";
      this.btnPhone.classList.toggle("active", isPhone);
      this.btnLaptop.classList.toggle("active", !isPhone);
      this.wrapper.classList.toggle("mode-phone", isPhone);
      this.wrapper.classList.toggle("mode-laptop", !isPhone);
    }
    this.applyScale();
  }

  applyScale() {
    if (!this.wrapper || !this.iframe) return;

    const isPhone = this.mode === "phone";
    const baseW = isPhone ? 360 : 1024;
    const baseH = 640;

    const containerWidth = this.wrapper.clientWidth;
    if (containerWidth <= 0) return;

    let scale = 1;
    if (isPhone) {
      scale = containerWidth < 360 ? containerWidth / 360 : 1;
    } else {
      scale = containerWidth / 1024;
    }

    this.iframe.style.width = `${baseW}px`;
    this.iframe.style.height = `${baseH}px`;
    this.iframe.style.transform = `scale(${scale})`;
    this.iframe.style.transformOrigin = "top left";

    const scaledH = Math.round(baseH * scale);
    const deviceBar = this.wrapper.querySelector(isPhone ? ".device-bar-phone" : ".device-bar-laptop");
    const barHeight = deviceBar ? deviceBar.offsetHeight : 0;
    this.wrapper.style.height = `${scaledH + barHeight}px`;
  }

  update(code) {
    if (!this.iframe) return;
    this.iframe.srcdoc = code || "";
    this.applyScale();
    this.triggerSweep();
  }

  triggerSweep() {
    if (!this.sweepLine) return;
    this.sweepLine.classList.remove("sweeping");
    void this.sweepLine.offsetWidth;
    this.sweepLine.classList.add("sweeping");
  }
}
