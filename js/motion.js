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
