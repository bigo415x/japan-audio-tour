// Transcript placeholders for every chapter.
// Replace the "" strings with the real transcripts when deploying.
// Structure: TRANSCRIPTS[tourId][stopIndex] = { es: "...", en: "..." }
// English ("en") is only needed for the bilingual Hakone tours.

window.TRANSCRIPTS = {
  shibuya: {
    0: { es: "" }, 1: { es: "" }, 2: { es: "" }, 3: { es: "" }, 4: { es: "" }, 5: { es: "" },
    6: { es: "" }, 7: { es: "" }, 8: { es: "" }, 9: { es: "" }, 10: { es: "" }, 11: { es: "" },
  },
  asakusa: {
    0: { es: "" }, 1: { es: "" }, 2: { es: "" }, 3: { es: "" }, 4: { es: "" }, 5: { es: "" },
    6: { es: "" }, 7: { es: "" }, 8: { es: "" }, 9: { es: "" }, 10: { es: "" },
  },
  shinjuku: {
    0: { es: "" }, 1: { es: "" }, 2: { es: "" }, 3: { es: "" },
    4: { es: "" }, 5: { es: "" }, 6: { es: "" }, 7: { es: "" },
  },
  gion: {
    0: { es: "" }, 1: { es: "" }, 2: { es: "" }, 3: { es: "" }, 4: { es: "" }, 5: { es: "" },
    6: { es: "" }, 7: { es: "" }, 8: { es: "" }, 9: { es: "" }, 10: { es: "" }, 11: { es: "" },
  },
  "philosophers-path": {
    0: { es: "" }, 1: { es: "" }, 2: { es: "" }, 3: { es: "" }, 4: { es: "" },
    5: { es: "" }, 6: { es: "" }, 7: { es: "" }, 8: { es: "" },
  },
  "hakone-morning": {
    0: { es: "", en: "" }, 1: { es: "", en: "" }, 2: { es: "", en: "" },
    3: { es: "", en: "" }, 4: { es: "", en: "" }, 5: { es: "", en: "" },
    6: { es: "", en: "" }, 7: { es: "", en: "" }, 8: { es: "", en: "" },
  },
  "hakone-full-loop": {
    0:  { es: "", en: "" }, 1:  { es: "", en: "" }, 2:  { es: "", en: "" },
    3:  { es: "", en: "" }, 4:  { es: "", en: "" }, 5:  { es: "", en: "" },
    6:  { es: "", en: "" }, 7:  { es: "", en: "" }, 8:  { es: "", en: "" },
    9:  { es: "", en: "" }, 10: { es: "", en: "" }, 11: { es: "", en: "" },
    12: { es: "", en: "" }, 13: { es: "", en: "" }, 14: { es: "", en: "" },
    15: { es: "", en: "" }, 16: { es: "", en: "" },
  },
};

window.getTranscript = function (tourId, stopIndex, lang) {
  const tour = (window.TRANSCRIPTS[tourId] || {})[stopIndex];
  if (!tour) return "";
  return tour[lang] || tour.es || "";
};
