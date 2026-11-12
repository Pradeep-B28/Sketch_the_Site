import { COPY, t } from "./copy.js";
import { shareText } from "./engine/sketch.js";
import { getWhatsAppShareUrl, getSiteUrl } from "./links.js";

export class ResultUI {
  constructor() {
    this.headlineEl = document.getElementById("build-headline");
    this.plainNoteEl = document.getElementById("result-plain-note");
    this.btnShareWhatsApp = document.getElementById("btn-share-whatsapp");

    this.currentResult = null;
    this.currentMissions = null;

    this.init();
  }

  init() {
    if (this.btnShareWhatsApp) {
      this.btnShareWhatsApp.addEventListener("click", () => {
        if (!this.currentResult) return;
        const link = getSiteUrl();
        const text = shareText(this.currentResult, this.currentMissions, link);
        const url = getWhatsAppShareUrl(text);
        window.open(url, "_blank", "noopener,noreferrer");
      });
    }
  }

  update(result, missions) {
    this.currentResult = result;
    this.currentMissions = missions;

    if (this.headlineEl && result) {
      this.headlineEl.textContent = result.headline || "";
    }

    if (this.plainNoteEl) {
      this.plainNoteEl.textContent = t("result.plain") || "It works, but it looks plain. That part is your job.";
    }
  }

  setHeadlineText(text) {
    if (this.headlineEl) {
      this.headlineEl.textContent = text;
    }
  }
}
