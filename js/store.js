import { encodeSketch, decodeSketch, cleanCode } from "./engine/sketch.js";

export function loadTheme() {
  try {
    return localStorage.getItem("sts-theme");
  } catch (err) {
    return null;
  }
}

export function saveTheme(theme) {
  try {
    localStorage.setItem("sts-theme", theme);
  } catch (err) {
    // Storage unavailable
  }
}

export function loadSketch() {
  try {
    const raw = localStorage.getItem("sts-sketch");
    if (!raw) return null;
    const res = decodeSketch(raw);
    return res.ok ? res.sketch : null;
  } catch (err) {
    return null;
  }
}

export function saveSketch(sketch) {
  try {
    const encoded = encodeSketch(sketch);
    localStorage.setItem("sts-sketch", encoded);
  } catch (err) {
    // Storage unavailable
  }
}

export function loadCode() {
  try {
    const raw = localStorage.getItem("sts-code");
    return cleanCode(raw);
  } catch (err) {
    return null;
  }
}

export function saveCode(code) {
  try {
    const cleaned = cleanCode(code);
    if (cleaned !== null) {
      localStorage.setItem("sts-code", cleaned);
    }
  } catch (err) {
    // Storage unavailable
  }
}

export function isIntroSeen() {
  try {
    return sessionStorage.getItem("sts-intro-seen") === "1";
  } catch (err) {
    return false;
  }
}

export function markIntroSeen() {
  try {
    sessionStorage.setItem("sts-intro-seen", "1");
  } catch (err) {
    // Storage unavailable
  }
}
