import { COPY, t } from "./copy.js";
import { MISSION_IDS } from "./engine/sketch.js";
import { isReducedMotion } from "./motion.js";

const SVG_NS = "http://www.w3.org/2000/svg";

export class MissionsUI {
  constructor(options = {}) {
    this.onShowWhere = options.onShowWhere || (() => {});

    this.container = document.getElementById("missions-list");
    this.detailPanel = document.getElementById("mission-detail-panel");
    this.progressText = document.getElementById("missions-count");
    this.progressRing = document.getElementById("missions-progress-ring");
    this.completeBanner = document.getElementById("missions-complete-banner");
    this.confettiContainer = document.getElementById("missions-confetti");
    this.announcer = document.getElementById("announcer");

    this.activeId = null;
    this.lastMissionsResult = null;
    this.lastHeadline = "";

    this.init();
  }

  init() {
    this.render();
  }

  createTickSvg() {
    const tick = document.createElementNS(SVG_NS, "svg");
    tick.setAttribute("class", "mission-tick");
    tick.setAttribute("viewBox", "0 0 20 20");
    tick.setAttribute("width", "18");
    tick.setAttribute("height", "18");
    tick.setAttribute("fill", "none");
    tick.setAttribute("aria-hidden", "true");

    const circle = document.createElementNS(SVG_NS, "circle");
    circle.setAttribute("class", "tick-circle");
    circle.setAttribute("cx", "10");
    circle.setAttribute("cy", "10");
    circle.setAttribute("r", "8.5");
    circle.setAttribute("stroke", "var(--border)");
    circle.setAttribute("stroke-width", "1.75");

    const check = document.createElementNS(SVG_NS, "path");
    check.setAttribute("class", "tick-check");
    check.setAttribute("d", "M 6 10.5 L 8.5 13.5 L 14 7");
    check.setAttribute("stroke", "currentColor");
    check.setAttribute("stroke-width", "2");
    check.setAttribute("stroke-linecap", "round");
    check.setAttribute("stroke-linejoin", "round");

    tick.appendChild(circle);
    tick.appendChild(check);
    return tick;
  }

  render() {
    if (!this.container) return;
    this.container.replaceChildren();

    MISSION_IDS.forEach((id) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "mission-chip";
      chip.id = `mission-chip-${id}`;
      chip.setAttribute("data-id", id);
      chip.setAttribute("aria-expanded", "false");

      chip.appendChild(this.createTickSvg());

      const label = document.createElement("span");
      label.className = "mission-chip-label";
      label.textContent = t(`missions.${id}.title`);
      chip.appendChild(label);

      chip.addEventListener("click", () => {
        this.toggleDetail(id);
      });

      this.container.appendChild(chip);
    });
  }

  toggleDetail(id) {
    if (this.activeId === id) {
      this.activeId = null;
    } else {
      this.activeId = id;
    }

    // Update chip active states
    MISSION_IDS.forEach((mid) => {
      const chip = document.getElementById(`mission-chip-${mid}`);
      if (chip) {
        const isActive = mid === this.activeId;
        chip.classList.toggle("active", isActive);
        chip.setAttribute("aria-expanded", String(isActive));
      }
    });

    this.renderDetail();
  }

  renderDetail() {
    if (!this.detailPanel) return;

    if (!this.activeId) {
      this.detailPanel.hidden = true;
      this.detailPanel.replaceChildren();
      return;
    }

    const id = this.activeId;
    this.detailPanel.hidden = false;
    this.detailPanel.replaceChildren();

    const currentItem = this.lastMissionsResult?.items?.find((x) => x.id === id);

    const content = document.createElement("div");
    content.className = "detail-content";

    const topRow = document.createElement("div");
    topRow.className = "detail-top-row";

    const title = document.createElement("h3");
    title.className = "detail-title";
    title.textContent = t(`missions.${id}.title`);
    topRow.appendChild(title);

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "detail-close-btn";
    closeBtn.setAttribute("aria-label", "Close details");
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", () => this.toggleDetail(id));
    topRow.appendChild(closeBtn);

    content.appendChild(topRow);

    const hint = document.createElement("p");
    hint.className = "detail-hint";
    hint.textContent = t(`missions.${id}.hint`);
    content.appendChild(hint);

    const exampleBox = document.createElement("div");
    exampleBox.className = "detail-example-box";

    const exampleLabel = document.createElement("span");
    exampleLabel.className = "example-label";
    exampleLabel.textContent = t("missions.exampleLabel") || "Example";
    exampleBox.appendChild(exampleLabel);

    const codePre = document.createElement("pre");
    codePre.className = "example-code";
    codePre.textContent = t(`missions.${id}.example`);
    exampleBox.appendChild(codePre);

    content.appendChild(exampleBox);

    const showBtn = document.createElement("button");
    showBtn.type = "button";
    showBtn.id = "btn-mission-show";
    showBtn.className = "btn btn-secondary btn-sm btn-show-where";
    showBtn.textContent = t("missions.show") || "Show me where";

    if (currentItem && currentItem.range) {
      showBtn.style.display = "inline-flex";
      showBtn.addEventListener("click", () => {
        this.onShowWhere(currentItem.range);
      });
    } else {
      showBtn.style.display = "none";
    }

    content.appendChild(showBtn);
    this.detailPanel.appendChild(content);
  }

  update(missionsResult) {
    if (!missionsResult) return;
    this.lastMissionsResult = missionsResult;

    const { items, done, total, complete, headline } = missionsResult;

    // Announce headline if changed
    if (headline && headline !== this.lastHeadline) {
      this.lastHeadline = headline;
      if (this.announcer) {
        this.announcer.textContent = headline;
      }
    }

    // Update progress text beside ring
    if (this.progressText) {
      this.progressText.textContent = t("missions.progress", { done, total }) || `${done} of ${total} upgrades done.`;
    }

    // Update progress ring (r = 14, circumference = 87.96)
    if (this.progressRing) {
      const radius = 14;
      const circumference = 2 * Math.PI * radius;
      const progress = total > 0 ? done / total : 0;
      const offset = circumference * (1 - progress);
      this.progressRing.style.strokeDashoffset = String(offset);
    }

    // Update chip items
    items.forEach((item) => {
      const chip = document.getElementById(`mission-chip-${item.id}`);
      if (chip) {
        chip.classList.toggle("is-done", item.done);
      }
    });

    // Update currently open detail panel if active
    if (this.activeId) {
      const showBtn = this.detailPanel?.querySelector(".btn-show-where");
      if (showBtn) {
        const currentItem = items.find((x) => x.id === this.activeId);
        if (currentItem && currentItem.range) {
          showBtn.style.display = "inline-flex";
          showBtn.onclick = () => this.onShowWhere(currentItem.range);
        } else {
          showBtn.style.display = "none";
        }
      }
    }

    // Handle complete celebration
    if (this.completeBanner) {
      this.completeBanner.hidden = !complete;
    }

    if (complete && !isReducedMotion()) {
      this.triggerConfetti();
    }
  }

  triggerConfetti() {
    if (!this.confettiContainer) return;
    this.confettiContainer.replaceChildren();

    const colors = ["#059669", "#0891B2", "#7C3AED", "#B45309", "#10B981", "#22D3EE"];
    for (let i = 0; i < 28; i++) {
      const sq = document.createElement("div");
      sq.className = "confetti-square";
      const color = colors[i % colors.length];
      const left = Math.random() * 100;
      const delay = Math.random() * 200;
      const rot = Math.random() * 360;
      sq.style.backgroundColor = color;
      sq.style.left = `${left}%`;
      sq.style.animationDelay = `${delay}ms`;
      sq.style.transform = `rotate(${rot}deg)`;
      this.confettiContainer.appendChild(sq);
    }

    setTimeout(() => {
      if (this.confettiContainer) {
        this.confettiContainer.replaceChildren();
      }
    }, 2200);
  }
}
