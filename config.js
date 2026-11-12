// Every setting lives here. Change values here, never in other files.

export const CONFIG = {
  version: "1.0.0",

  // The live address. Set in Phase 4 (deploy). Used for the share message and link previews.
  siteUrl: "https://sketch-the-site.vercel.app",

  // Sales WhatsApp: digits only, country code first. Empty hides the "Talk to us" button.
  salesWhatsApp: "",
  whatsAppText: "Hi, I tried Sketch to Site. I want to know more about the {program}.",

  // The program the CTA sells. Always use the full name. page is its page on wrench-wise.com, or "" for the main site.
  program: {
    name: "Certification Program in AI-Powered Software Engineering & DSA",
    page: ""
  },

  website: "https://wrench-wise.com",
  utm: { source: "sketch-to-site", medium: "web-project", campaign: "sketch-to-site" },

  loaderMs: 800,     // the loader never runs longer than this
  snapMs: 260,       // a rough stroke snaps into a clean box
  typeMs: 1200,      // the code "types" itself out for this long
  countUpMs: 700,    // headline numbers count up for this long
  previewDelayMs: 250, // wait this long after the last key press before refreshing the preview
  sampleStrokeMs: 450, // each stroke of the sample sketch draws itself for this long

  // Switches. false hides the feature completely, with no errors.
  features: {
    darkTheme: true,
    sample: true,
    missions: true,
    download: true,
    share: true,
    underTheHood: true
  }
};
