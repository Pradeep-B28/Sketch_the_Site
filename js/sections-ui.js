import { CONFIG } from "../config.js";
import { COPY, t } from "./copy.js";
import { getProgramUrl, getSalesWhatsAppUrl } from "./links.js";

const SVG_NS = "http://www.w3.org/2000/svg";

export class SectionsUI {
  constructor() {
    this.howSection = document.getElementById("section-how");
    this.privacySection = document.getElementById("section-privacy");
    this.hoodSection = document.getElementById("section-hood");
    this.ctaSection = document.getElementById("section-cta");

    this.init();
  }

  init() {
    this.renderHow();
    this.renderPrivacy();
    this.renderHood(null);
    this.renderCTA();
  }

  renderHow() {
    if (!this.howSection) return;
    this.howSection.replaceChildren();

    const title = document.createElement("h2");
    title.className = "info-section-title";
    title.textContent = t("how.heading") || "How it works";
    this.howSection.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "how-grid";

    const steps = [
      { num: "1", text: t("how.one"), icon: "draw" },
      { num: "2", text: t("how.two"), icon: "build" },
      { num: "3", text: t("how.three"), icon: "code" }
    ];

    steps.forEach((s) => {
      const card = document.createElement("div");
      card.className = "how-card";

      const numBadge = document.createElement("span");
      numBadge.className = "how-num";
      numBadge.textContent = s.num;
      card.appendChild(numBadge);

      const p = document.createElement("p");
      p.className = "how-text";
      p.textContent = s.text;
      card.appendChild(p);

      grid.appendChild(card);
    });

    this.howSection.appendChild(grid);
  }

  renderPrivacy() {
    if (!this.privacySection) return;
    this.privacySection.replaceChildren();

    const wrap = document.createElement("div");
    wrap.className = "privacy-wrapper";

    const shieldSvg = document.createElementNS(SVG_NS, "svg");
    shieldSvg.setAttribute("class", "privacy-shield-icon");
    shieldSvg.setAttribute("viewBox", "0 0 24 24");
    shieldSvg.setAttribute("width", "36");
    shieldSvg.setAttribute("height", "36");
    shieldSvg.setAttribute("fill", "none");
    shieldSvg.setAttribute("stroke", "var(--brand)");
    shieldSvg.setAttribute("stroke-width", "2");
    shieldSvg.setAttribute("stroke-linecap", "round");
    shieldSvg.setAttribute("stroke-linejoin", "round");

    const shieldPath = document.createElementNS(SVG_NS, "path");
    shieldPath.setAttribute("d", "M 12 22 C 12 22 20 18 20 12 L 20 5 L 12 2 L 4 5 L 4 12 C 4 18 12 22 12 22 Z");
    const checkPath = document.createElementNS(SVG_NS, "path");
    checkPath.setAttribute("d", "M 9 12 L 11 14 L 15 10");

    shieldSvg.appendChild(shieldPath);
    shieldSvg.appendChild(checkPath);
    wrap.appendChild(shieldSvg);

    const content = document.createElement("div");
    content.className = "privacy-content";

    const line = document.createElement("p");
    line.className = "privacy-line";
    line.textContent = t("privacy.line") || "Your sketch and code are saved only on this device. No account, no server.";
    content.appendChild(line);

    const proofTitle = document.createElement("h3");
    proofTitle.className = "proof-title";
    proofTitle.textContent = t("privacy.proofTitle") || "Check it yourself";
    content.appendChild(proofTitle);

    const proof = document.createElement("p");
    proof.className = "proof-body";
    proof.textContent = t("privacy.proof") || "Load this page, turn on airplane mode, and it still works.";
    content.appendChild(proof);

    wrap.appendChild(content);
    this.privacySection.appendChild(wrap);
  }

  renderHood(result) {
    if (!this.hoodSection) return;
    this.hoodSection.replaceChildren();

    const title = document.createElement("h2");
    title.className = "info-section-title";
    title.textContent = t("hood.heading") || "What happens when you press Build";
    this.hoodSection.appendChild(title);

    const grid = document.createElement("div");
    grid.className = "hood-grid";

    const cards = [
      {
        title: t("hood.boxTitle"),
        body: t("hood.box"),
        live: result ? t("hood.boxLive", { boxes: result.boxes }) : null
      },
      {
        title: t("hood.rulesTitle"),
        body: t("hood.rules"),
        live: result
          ? t("hood.rulesLive", {
              header: result.counts.header,
              image: result.counts.image,
              text: result.counts.heading + result.counts.text,
              button: result.counts.button
            })
          : null
      },
      {
        title: t("hood.sortTitle"),
        body: t("hood.sort"),
        live: result ? t("hood.sortLive", { rows: result.dsa.rows }) : null
      },
      {
        title: t("hood.codeTitle"),
        body: t("hood.code"),
        live: result
          ? t("hood.codeLive", {
              tags: result.dsa.tags,
              rules: result.dsa.rules,
              lines: result.lines
            })
          : null
      }
    ];

    cards.forEach((c) => {
      const card = document.createElement("div");
      card.className = "hood-card";

      const h3 = document.createElement("h3");
      h3.className = "hood-card-title";
      h3.textContent = c.title;
      card.appendChild(h3);

      const p = document.createElement("p");
      p.className = "hood-card-body";
      p.textContent = c.body;
      card.appendChild(p);

      if (c.live) {
        const liveP = document.createElement("p");
        liveP.className = "hood-live-text";
        liveP.textContent = c.live;
        card.appendChild(liveP);
      }

      grid.appendChild(card);
    });

    this.hoodSection.appendChild(grid);
  }

  renderCTA() {
    if (!this.ctaSection) return;
    this.ctaSection.replaceChildren();

    const title = document.createElement("h2");
    title.className = "cta-title";
    title.textContent = t("cta.title") || "Want to build real websites from scratch?";
    this.ctaSection.appendChild(title);

    const body = document.createElement("p");
    body.className = "cta-body";
    body.textContent = t("cta.body", { program: CONFIG.program.name });
    this.ctaSection.appendChild(body);

    const btnRow = document.createElement("div");
    btnRow.className = "cta-buttons";

    const progBtn = document.createElement("a");
    progBtn.className = "btn btn-primary";
    progBtn.href = getProgramUrl();
    progBtn.target = "_blank";
    progBtn.rel = "noopener noreferrer";
    progBtn.textContent = t("cta.button") || "Explore the program";
    btnRow.appendChild(progBtn);

    const salesUrl = getSalesWhatsAppUrl();
    if (salesUrl) {
      const waBtn = document.createElement("a");
      waBtn.className = "btn btn-secondary";
      waBtn.href = salesUrl;
      waBtn.target = "_blank";
      waBtn.rel = "noopener noreferrer";
      waBtn.textContent = t("cta.whatsApp") || "Talk to us on WhatsApp";
      btnRow.appendChild(waBtn);
    }

    this.ctaSection.appendChild(btnRow);
  }

  updateLiveNumbers(result) {
    this.renderHood(result);
  }
}
