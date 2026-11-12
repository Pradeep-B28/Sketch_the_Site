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

  createHowIcon(type) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "how-icon");
    svg.setAttribute("viewBox", "0 0 32 32");
    svg.setAttribute("width", "28");
    svg.setAttribute("height", "28");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "var(--brand)");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");

    if (type === "draw") {
      const p1 = document.createElementNS(SVG_NS, "path");
      p1.setAttribute("d", "M 4 28 L 8 28 L 26 10 L 22 6 L 4 24 Z");
      const p2 = document.createElementNS(SVG_NS, "path");
      p2.setAttribute("d", "M 18 10 L 22 14");
      svg.appendChild(p1);
      svg.appendChild(p2);
    } else if (type === "build") {
      const p1 = document.createElementNS(SVG_NS, "path");
      p1.setAttribute("d", "M 10 9 L 3 16 L 10 23");
      const p2 = document.createElementNS(SVG_NS, "path");
      p2.setAttribute("d", "M 22 9 L 29 16 L 22 23");
      const p3 = document.createElementNS(SVG_NS, "path");
      p3.setAttribute("d", "M 18 6 L 14 26");
      svg.appendChild(p1);
      svg.appendChild(p2);
      svg.appendChild(p3);
    } else {
      // code
      const r = document.createElementNS(SVG_NS, "rect");
      r.setAttribute("x", "4");
      r.setAttribute("y", "4");
      r.setAttribute("width", "24");
      r.setAttribute("height", "24");
      r.setAttribute("rx", "6");
      const p = document.createElementNS(SVG_NS, "path");
      p.setAttribute("d", "M 16 11 L 16 21 M 11 16 L 16 21 L 21 16");
      svg.appendChild(r);
      svg.appendChild(p);
    }

    return svg;
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
      { num: "1", text: t("how.one"), type: "draw" },
      { num: "2", text: t("how.two"), type: "build" },
      { num: "3", text: t("how.three"), type: "code" }
    ];

    steps.forEach((s) => {
      const card = document.createElement("div");
      card.className = "how-card";

      const topRow = document.createElement("div");
      topRow.className = "how-card-top";

      const numBadge = document.createElement("span");
      numBadge.className = "how-num";
      numBadge.textContent = s.num;
      topRow.appendChild(numBadge);

      topRow.appendChild(this.createHowIcon(s.type));
      card.appendChild(topRow);

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

  createHoodPicture(index) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("class", "hood-picture");
    svg.setAttribute("viewBox", "0 0 72 44");
    svg.setAttribute("width", "64");
    svg.setAttribute("height", "40");
    svg.setAttribute("fill", "none");

    if (index === 0) {
      // 1. Bounding box: points with box around them
      const r = document.createElementNS(SVG_NS, "rect");
      r.setAttribute("x", "6");
      r.setAttribute("y", "6");
      r.setAttribute("width", "60");
      r.setAttribute("height", "32");
      r.setAttribute("rx", "4");
      r.setAttribute("stroke", "var(--brand)");
      r.setAttribute("stroke-width", "1.5");
      r.setAttribute("stroke-dasharray", "3 3");
      svg.appendChild(r);

      const pts = [[14, 12], [28, 26], [42, 16], [58, 30], [20, 32], [50, 10]];
      pts.forEach(([cx, cy]) => {
        const c = document.createElementNS(SVG_NS, "circle");
        c.setAttribute("cx", String(cx));
        c.setAttribute("cy", String(cy));
        c.setAttribute("r", "2");
        c.setAttribute("fill", "var(--accent)");
        svg.appendChild(c);
      });
    } else if (index === 1) {
      // 2. Decision rules: hierarchy/ladder
      const r1 = document.createElementNS(SVG_NS, "rect");
      r1.setAttribute("x", "6");
      r1.setAttribute("y", "4");
      r1.setAttribute("width", "60");
      r1.setAttribute("height", "8");
      r1.setAttribute("rx", "2");
      r1.setAttribute("fill", "rgba(124, 58, 237, 0.25)");
      r1.setAttribute("stroke", "var(--kind-header)");

      const r2 = document.createElementNS(SVG_NS, "rect");
      r2.setAttribute("x", "6");
      r2.setAttribute("y", "15");
      r2.setAttribute("width", "40");
      r2.setAttribute("height", "14");
      r2.setAttribute("rx", "2");
      r2.setAttribute("fill", "rgba(8, 145, 178, 0.25)");
      r2.setAttribute("stroke", "var(--kind-image)");

      const r3 = document.createElementNS(SVG_NS, "rect");
      r3.setAttribute("x", "50");
      r3.setAttribute("y", "18");
      r3.setAttribute("width", "16");
      r3.setAttribute("height", "8");
      r3.setAttribute("rx", "4");
      r3.setAttribute("fill", "rgba(5, 150, 105, 0.25)");
      r3.setAttribute("stroke", "var(--kind-button)");

      const r4 = document.createElementNS(SVG_NS, "line");
      r4.setAttribute("x1", "6");
      r4.setAttribute("y1", "36");
      r4.setAttribute("x2", "66");
      r4.setAttribute("y2", "36");
      r4.setAttribute("stroke", "var(--kind-text)");
      r4.setAttribute("stroke-width", "2");
      r4.setAttribute("stroke-dasharray", "2 3");

      svg.appendChild(r1);
      svg.appendChild(r2);
      svg.appendChild(r3);
      svg.appendChild(r4);
    } else if (index === 2) {
      // 3. Sorting and grouping: boxes falling into rows
      const row1 = document.createElementNS(SVG_NS, "rect");
      row1.setAttribute("x", "6");
      row1.setAttribute("y", "6");
      row1.setAttribute("width", "60");
      row1.setAttribute("height", "13");
      row1.setAttribute("rx", "3");
      row1.setAttribute("fill", "var(--surface-2)");
      row1.setAttribute("stroke", "var(--border)");

      const it1 = document.createElementNS(SVG_NS, "rect");
      it1.setAttribute("x", "10");
      it1.setAttribute("y", "9");
      it1.setAttribute("width", "24");
      it1.setAttribute("height", "7");
      it1.setAttribute("rx", "2");
      it1.setAttribute("fill", "var(--brand-soft)");
      it1.setAttribute("stroke", "var(--brand)");

      const it2 = document.createElementNS(SVG_NS, "rect");
      it2.setAttribute("x", "38");
      it2.setAttribute("y", "9");
      it2.setAttribute("width", "24");
      it2.setAttribute("height", "7");
      it2.setAttribute("rx", "2");
      it2.setAttribute("fill", "var(--brand-soft)");
      it2.setAttribute("stroke", "var(--brand)");

      const row2 = document.createElementNS(SVG_NS, "rect");
      row2.setAttribute("x", "6");
      row2.setAttribute("y", "23");
      row2.setAttribute("width", "60");
      row2.setAttribute("height", "13");
      row2.setAttribute("rx", "3");
      row2.setAttribute("fill", "var(--surface-2)");
      row2.setAttribute("stroke", "var(--border)");

      const it3 = document.createElementNS(SVG_NS, "rect");
      it3.setAttribute("x", "22");
      it3.setAttribute("y", "26");
      it3.setAttribute("width", "28");
      it3.setAttribute("height", "7");
      it3.setAttribute("rx", "3.5");
      it3.setAttribute("fill", "var(--brand-soft)");
      it3.setAttribute("stroke", "var(--brand)");

      svg.appendChild(row1);
      svg.appendChild(it1);
      svg.appendChild(it2);
      svg.appendChild(row2);
      svg.appendChild(it3);
    } else {
      // 4. Code generation: box becoming tag
      const box = document.createElementNS(SVG_NS, "rect");
      box.setAttribute("x", "4");
      box.setAttribute("y", "12");
      box.setAttribute("width", "22");
      box.setAttribute("height", "18");
      box.setAttribute("rx", "3");
      box.setAttribute("stroke", "var(--accent)");
      box.setAttribute("stroke-width", "1.5");

      const arrow = document.createElementNS(SVG_NS, "path");
      arrow.setAttribute("d", "M 30 21 L 40 21 M 37 18 L 40 21 L 37 24");
      arrow.setAttribute("stroke", "var(--brand)");
      arrow.setAttribute("stroke-width", "1.5");
      arrow.setAttribute("stroke-linecap", "round");

      const tagTxt = document.createElementNS(SVG_NS, "text");
      tagTxt.setAttribute("x", "46");
      tagTxt.setAttribute("y", "25");
      tagTxt.setAttribute("font-family", "ui-monospace, monospace");
      tagTxt.setAttribute("font-size", "10");
      tagTxt.setAttribute("font-weight", "700");
      tagTxt.setAttribute("fill", "var(--brand-strong)");
      tagTxt.textContent = "<tag>";

      svg.appendChild(box);
      svg.appendChild(arrow);
      svg.appendChild(tagTxt);
    }

    return svg;
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

    cards.forEach((c, idx) => {
      const card = document.createElement("div");
      card.className = "hood-card";

      const topRow = document.createElement("div");
      topRow.className = "hood-card-header";

      const h3 = document.createElement("h3");
      h3.className = "hood-card-title";
      h3.textContent = c.title;
      topRow.appendChild(h3);

      topRow.appendChild(this.createHoodPicture(idx));
      card.appendChild(topRow);

      const p = document.createElement("p");
      p.className = "hood-card-body";
      p.textContent = c.body;
      card.appendChild(p);

      if (c.live) {
        const liveP = document.createElement("div");
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
