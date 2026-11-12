import { COPY, t } from "./copy.js";

export class PreviewUI {
  constructor() {
    this.iframe = document.getElementById("preview");
    this.wrapper = document.querySelector(".preview-frame-wrapper");
    this.sweepLine = document.getElementById("preview-sweep-line");
    this.btnPhone = document.getElementById("btn-view-phone");
    this.btnLaptop = document.getElementById("btn-view-laptop");
    this.mode = "phone";

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
  }

  update(code) {
    if (!this.iframe) return;
    this.iframe.srcdoc = code || "";
    this.triggerSweep();
  }

  triggerSweep() {
    if (!this.sweepLine) return;
    this.sweepLine.classList.remove("sweeping");
    void this.sweepLine.offsetWidth;
    this.sweepLine.classList.add("sweeping");
  }
}
