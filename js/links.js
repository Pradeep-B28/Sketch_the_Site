import { CONFIG } from "../config.js";

export function getProgramUrl() {
  const base = CONFIG.program.page || CONFIG.website;
  const utm = CONFIG.utm;
  const query = new URLSearchParams({
    utm_source: utm.source,
    utm_medium: utm.medium,
    utm_campaign: utm.campaign
  }).toString();
  return base.includes("?") ? `${base}&${query}` : `${base}?${query}`;
}

export function getSalesWhatsAppUrl() {
  const phone = CONFIG.salesWhatsApp.replace(/\D/g, "");
  if (!phone) return "";
  const text = CONFIG.whatsAppText.replace("{program}", CONFIG.program.name);
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export function getWhatsAppShareUrl(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function getSiteUrl() {
  if (CONFIG.siteUrl) return CONFIG.siteUrl;
  try {
    return window.location.origin + window.location.pathname;
  } catch (err) {
    return "";
  }
}
