const FALLBACK: [number, number, number] = [112, 210, 235];

function channels(hex: string): [number, number, number] {
  const value = hex.trim().replace("#", "");
  const full =
    value.length === 3
      ? value
          .split("")
          .map((character) => character + character)
          .join("")
      : value;
  if (!/^[a-f\d]{6}$/i.test(full)) return FALLBACK;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

function toHex(rgb: [number, number, number]) {
  return `#${rgb
    .map((value) =>
      Math.round(Math.min(Math.max(value, 0), 255))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

function mix(hex: string, target: [number, number, number], ratio: number) {
  const rgb = channels(hex);
  return toHex([
    rgb[0] + (target[0] - rgb[0]) * ratio,
    rgb[1] + (target[1] - rgb[1]) * ratio,
    rgb[2] + (target[2] - rgb[2]) * ratio,
  ]);
}

export function lighten(hex: string, ratio: number) {
  return mix(hex, [255, 255, 255], ratio);
}

export function darken(hex: string, ratio: number) {
  return mix(hex, [0, 0, 0], ratio);
}

/** Alpha overlays keep gradients readable without stacking extra views. */
export function withAlpha(hex: string, alpha: number) {
  const rgb = channels(hex);
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${Math.min(Math.max(alpha, 0), 1)})`;
}

export function luminance(hex: string) {
  const [r, g, b] = channels(hex)
    .map((value) => value / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}

export function isLightColor(hex: string) {
  return luminance(hex) > 0.42;
}

export type CardPalette = {
  /** Diagonal gradient stops for the plastic card face. */
  gradient: [string, string, string];
  /** Primary text laid over the gradient. */
  ink: string;
  /** Secondary labels over the gradient. */
  inkMuted: string;
  /** Hairline borders and dividers over the gradient. */
  hairline: string;
  /** Frosted plate fill behind the issuer logo. */
  glassFill: string;
  /** Frosted plate border behind the issuer logo. */
  glassBorder: string;
  /** Tint applied to the issuer logo artwork itself. */
  glassInk: string;
  /** Whether the face is light enough to need dark ink. */
  light: boolean;
};

export function cardPalette(color: string): CardPalette {
  const light = isLightColor(color);
  return {
    gradient: [lighten(color, light ? 0.1 : 0.24), color, darken(color, 0.34)],
    ink: light ? darken(color, 0.82) : "#ffffff",
    inkMuted: light
      ? withAlpha(darken(color, 0.8), 0.66)
      : "rgba(255, 255, 255, 0.72)",
    hairline: light
      ? withAlpha(darken(color, 0.8), 0.18)
      : "rgba(255, 255, 255, 0.22)",
    glassFill: light
      ? "rgba(255, 255, 255, 0.42)"
      : "rgba(255, 255, 255, 0.16)",
    glassBorder: light
      ? "rgba(255, 255, 255, 0.7)"
      : "rgba(255, 255, 255, 0.34)",
    glassInk: light ? darken(color, 0.7) : lighten(color, 0.9),
    light,
  };
}
