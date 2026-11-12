import { COPY, t } from "./copy.js";
import { MISSION_IDS } from "./engine/sketch.js";
import { isReducedMotion } from "./motion.js";

const SVG_NS = "http://www.w3.org/2000/svg";

export class MissionsUI {
  constructor(options = {}) {
    this.onShowWhere = options.onShowWhere || (() => {});

    this.container = document.getElementById("missions-list");
    this.progressText = document.getElementById("missions-count");
    this.progressRing = document.getElementById("missions-progress-ring");
    this.completeBanner = document.getElementById("missions-complete-banner");
    this.confettiContainer = document.getElementById("missions-confetti");
    this.announcer = document.getElementById("announcer");

    this.lastHeadline = "";
    this.init();
  }

  init() {
    this.render();
  }

  render() {
    if (!this.container) return;
    this.container.replaceChildren();

    MISSION_IDS.forEach((id) => {
      const row = document.createElement("div");
      row.className = "mission-row";
      row.id = `mission-row-${id}`;
      row.setAttribute("data-id", id);

      // Header row
      const header = document.createElement("div");
      header.className = "mission-header";

      // Tick circle
      const tick = document.createElementNS(SVG_NS, "svg");
      tick.setAttribute("class", "mission-tick");
      tick.setAttribute("viewBox", "0 0 24 24");
      tick.setAttribute("width", "22");
      tick.setAttribute("height", "22");
      tick.setAttribute("fill", "none");

      const circle = document.createElementNS(SVG_NS, "circle");
      circle.setAttribute("class", "tick-circle");
      circle.setAttribute("cx", "12");
      circle.setAttribute("cy", "12");
      circle.setAttribute("r", "10");
      circle.setAttribute("stroke", "var(--border)");
      circle.setAttribute("stroke-width", "2");

      const check = document.createElementNS(SVG_NS, "path");
      check.setAttribute("class", "tick-check");
      check.setAttribute("d", "M 7 12.5 L 10.5 16 L 17 8.5");
      check.setAttribute("stroke", "currentColor");
      check.setAttribute("stroke-width", "2.5");
      check.setAttribute("stroke-linecap", "round");
      check.setAttribute("stroke-linejoin", "round");

      tick.appendChild(circle);
      tick.appendChild(check);
      header.appendChild(tick);

      // Title
      const title = document.createElement("span");
      title.className = "mission-title";
      title.textContent = t(`missions.${id}.title`);
      header.appendChild(title);

      // Expand arrow
      const toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.className = "mission-expand-btn";
      toggleBtn.setAttribute("aria-expanded", "false");
      toggleBtn.setAttribute("aria-label", `Toggle details for ${t(`missions.${id}.title`)}`);
      toggleBtn.textContent = "+";
      header.appendChild(toggleBtn);

      row.appendChild(header);

      // Body (details)
      const body = document.createElement("div");
      body.className = "mission-body";
      body.hidden = true;

      const hint = document.createElement("p");
      hint.className = "mission-hint";
      hint.textContent = t(`missions.${id}.hint`);
      body.appendChild(hint);

      const exampleBox = document.createElement("div");
      exampleBox.className = "mission-example";
      const exampleLabel = document.createElement("span");
      exampleLabel.className = "example-label";
      exampleLabel.textContent = t("missions.exampleLabel") || "Example";
      exampleBox.appendChild(exampleLabel);

      const codePre = document.createElement("pre");
      codePre.className = "example-code";
      codePre.textContent = t(`missions.${id}.example`);
      exampleBox.appendChild(codePre);
      body.appendChild(exampleBox);

      const showBtn = document.createElement("button");
      showBtn.type = "button";
      showBtn.className = "btn btn-secondary btn-sm btn-show-where";
      showBtn.textContent = t("missions.show") || "Show me where";
      body.appendChild(showBtn);

      row.appendChild(body);

      // Toggle accordion
      const toggle = () => {
        const isOpen = !body.hidden;
        body.hidden = isOpen;
        toggleBtn.textContent = isOpen ? "+" : "−";
        toggleBtn.setAttribute("aria-expanded", String(!isOpen));
      };

      header.addEventListener("click", toggle);

      this.container.appendChild(row);
    });
  }

  update(missionsResult) {
    if (!missionsResult) return;

    const { items, done, total, complete, headline } = missionsResult;

    // Announce headline if changed
    if (headline && headline !== this.lastHeadline) {
      this.lastHeadline = headline;
      if (this.announcer) {
        this.announcer.textContent = headline;
      }
    }

    // Update progress text
    if (this.progressText) {
      this.progressText.textContent = t("missions.progress", { done, total }) || `${done} of ${total} upgrades done.`;
    }

    // Update progress ring
    if (this.progressRing) {
      const radius = 18;
      const circumference = 2 * Math.PI * radius;
      const progress = total > 0 ? done / total : 0;
      const offset = circumference * (1 - progress);
      this.progressRing.style.strokeDashoffset = String(offset);
    }

    // Update rows
    items.forEach((item) => {
      const row = document.getElementById(`mission-row-${item.id}`);
      if (!row) return;

      const wasDone = row.classList.contains("is-done");
      row.classList.toggle("is-done", item.done);

      const showBtn = row.querySelector(".btn-show-where");
      if (showBtn) {
        if (item.range) {
          showBtn.style.display = "inline-flex";
          showBtn.onclick = (e) => {
            e.stopPropagation();
            this.onShowWhere(item.range);
          };
        } else {
          showBtn.style.display = "none";
        }
      }
    });

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
