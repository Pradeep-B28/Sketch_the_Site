import { CONFIG } from "../config.js";
import { isIntroSeen, markIntroSeen } from "./store.js";

export function isReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function initLoader(onComplete) {
  const loader = document.getElementById("loader");
  const hero = document.querySelector(".hero");

  if (!loader) {
    if (onComplete) onComplete();
    return;
  }

  const skip = isReducedMotion() || isIntroSeen() || document.documentElement.classList.contains("no-loader");
  if (skip) {
    loader.remove();
    if (hero) {
      hero.classList.add("hero-revealed");
    }
    if (onComplete) onComplete();
    return;
  }

  document.body.classList.add("with-loader");

  const duration = Math.min(CONFIG.loaderMs || 800, 800);

  setTimeout(() => {
    loader.classList.add("loader-fade");
    markIntroSeen();

    if (hero) {
      hero.classList.add("hero-revealed");
    }

    setTimeout(() => {
      loader.remove();
      document.body.classList.remove("with-loader");
      if (onComplete) onComplete();
    }, 250);
  }, duration);
}

export function animateTyping(textarea, fullCode, durationMs, onDone) {
  if (!textarea) {
    if (onDone) onDone();
    return;
  }

  if (isReducedMotion() || !durationMs) {
    textarea.value = fullCode;
    if (onDone) onDone();
    return;
  }

  const lines = fullCode.split("\n");
  const totalLines = lines.length;
  const startTime = performance.now();

  const step = (now) => {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / durationMs);
    const visibleLines = Math.max(1, Math.floor(progress * totalLines));

    if (progress < 1) {
      textarea.value = lines.slice(0, visibleLines).join("\n");
      requestAnimationFrame(step);
    } else {
      textarea.value = fullCode;
      if (onDone) onDone();
    }
  };

  requestAnimationFrame(step);
}

export function animateCountUp(element, targetHeadline, durationMs) {
  if (!element) return;

  if (isReducedMotion() || !durationMs) {
    element.textContent = targetHeadline;
    return;
  }

  // Find numbers in the headline: e.g. "5 boxes became 67 lines of real code."
  const numbers = [];
  const regex = /\b\d+\b/g;
  let match;
  while ((match = regex.exec(targetHeadline)) !== null) {
    numbers.push({ val: parseInt(match[0], 10), index: match.index, length: match[0].length });
  }

  if (numbers.length === 0) {
    element.textContent = targetHeadline;
    return;
  }

  const startTime = performance.now();

  const step = (now) => {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / durationMs);

    if (progress < 1) {
      let currentStr = "";
      let lastIndex = 0;
      numbers.forEach((num) => {
        currentStr += targetHeadline.slice(lastIndex, num.index);
        const currentVal = Math.floor(progress * num.val);
        currentStr += String(currentVal);
        lastIndex = num.index + num.length;
      });
      currentStr += targetHeadline.slice(lastIndex);
      element.textContent = currentStr;
      requestAnimationFrame(step);
    } else {
      element.textContent = targetHeadline;
    }
  };

  requestAnimationFrame(step);
}

export function initScrollReveal() {
  if (isReducedMotion()) return;

  const targets = document.querySelectorAll(".info-section, .card");
  if (!window.IntersectionObserver || targets.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  targets.forEach((t) => {
    t.classList.add("reveal-on-scroll");
    observer.observe(t);
  });
}
