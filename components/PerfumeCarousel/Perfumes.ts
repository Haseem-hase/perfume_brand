// Edit this list to add / remove perfumes.
// `glass` = bottle colour, `liquid` = perfume juice colour, `glow` = colour of the light at the bottom of the page.

export type Perfume = {
  name: string;
  glass: string;
  liquid: string;
  cap: string;
  glow: string;
};

export const PERFUMES: Perfume[] = [
  { name: "OUD NOIR",     glass: "#2a1a14", liquid: "#8a4b1f", cap: "#c9a35b", glow: "#c9742f" },
  { name: "BLEU ROYAL",   glass: "#12206b", liquid: "#2f56d9", cap: "#d7dbe6", glow: "#2f6fd9" },
  { name: "VERT ÉMERAUDE",glass: "#0f2a22", liquid: "#1f8f6a", cap: "#c9a35b", glow: "#1fae83" },
  { name: "ROSE FUMÉ",    glass: "#3a1a2c", liquid: "#c4527f", cap: "#e8c6b4", glow: "#d6568a" },
  { name: "AMBRE SOLEIL", glass: "#3a2306", liquid: "#e09a22", cap: "#d7dbe6", glow: "#e0a030" },
  { name: "VIOLET NUIT",  glass: "#20103f", liquid: "#6a3fd0", cap: "#c9a35b", glow: "#7a4fe0" },
  { name: "BLANC MUSC",   glass: "#2b2d33", liquid: "#e6e1d6", cap: "#c9a35b", glow: "#9aa0b0" },
];
