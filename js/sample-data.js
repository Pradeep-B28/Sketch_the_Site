// LOCKED. Do not edit. The hand-drawn strokes behind the "Try a sample sketch" button.
import { newSketch, addStroke } from "./engine/sketch.js";

// A small fixed wobble (-1, 0 or 1) so the strokes look hand drawn but are the same every time.
function wobbler(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return (s >> 8) % 3 - 1;
  };
}

function roughRect(x, y, w, h, seed) {
  const wob = wobbler(seed), pts = [];
  const side = (x0, y0, x1, y1) => {
    const steps = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 8));
    for (let i = 0; i < steps; i++) pts.push([Math.round(x0 + ((x1 - x0) * i) / steps) + wob(), Math.round(y0 + ((y1 - y0) * i) / steps) + wob()]);
  };
  side(x, y, x + w, y);
  side(x + w, y, x + w, y + h);
  side(x + w, y + h, x, y + h);
  side(x, y + h, x, y - 2);
  return pts;
}

function roughLine(x, y, w, seed) {
  const wob = wobbler(seed), pts = [];
  for (let i = 0; i <= w; i += 6) pts.push([x + i, y + (i % 24 < 12 ? -3 : 3) + wob()]);
  return pts;
}

// [what the visitor is drawing, stroke]
export const SAMPLE = [
  ["header", roughRect(12, 10, 336, 44, 11)],
  ["image", roughRect(24, 74, 312, 168, 23)],
  ["text", roughRect(40, 262, 280, 34, 37)],
  ["text", roughLine(44, 318, 264, 41)],
  ["button", roughRect(118, 356, 124, 46, 53)]
];

export function sampleStrokes() {
  return SAMPLE.map(([, points]) => points.map((p) => [...p]));
}

// Builds the sample as a normal sketch, using the same checks as drawing it.
export function sampleSketch() {
  let s = newSketch();
  for (const points of sampleStrokes()) s = addStroke(s, points).sketch;
  return s;
}
