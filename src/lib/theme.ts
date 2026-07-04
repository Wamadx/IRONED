// Dark, grungy — chains & smoke vibe. Single dark theme, swappable accent flavor.
export const C = {
  bg: '#0B0909',
  card: '#171213',
  cardAlt: '#1F1719',
  border: '#2C2124',
  red: '#E02E43',
  redDark: '#8E1B2A',
  ember: '#FF6B4A',
  text: '#F2EDEB',
  textDim: '#A89B98',
  textFaint: '#6E6260',
  good: '#5DBB63',
  smoke: '#3A3134',
};

export type AccentId = 'crimson' | 'violet' | 'emerald' | 'azure' | 'gold';

export const ACCENTS: Record<AccentId, { red: string; redDark: string; ember: string }> = {
  crimson: { red: '#E02E43', redDark: '#8E1B2A', ember: '#FF6B4A' },
  violet: { red: '#8B5CF6', redDark: '#5B21B6', ember: '#C084FC' },
  emerald: { red: '#10B981', redDark: '#065F46', ember: '#6EE7B7' },
  azure: { red: '#3B82F6', redDark: '#1E40AF', ember: '#60A5FA' },
  gold: { red: '#D97706', redDark: '#92400E', ember: '#FBBF24' },
};

export type BgId = 'dark' | 'light' | 'beige';

interface BgPalette {
  bg: string;
  card: string;
  cardAlt: string;
  border: string;
  text: string;
  textDim: string;
  textFaint: string;
  smoke: string;
  statusBar: 'light' | 'dark';
}

export const BACKGROUNDS: Record<BgId, BgPalette> = {
  dark: {
    bg: '#0B0909',
    card: '#171213',
    cardAlt: '#1F1719',
    border: '#2C2124',
    text: '#F2EDEB',
    textDim: '#A89B98',
    textFaint: '#6E6260',
    smoke: '#3A3134',
    statusBar: 'light',
  },
  light: {
    bg: '#F7F5F4',
    card: '#FFFFFF',
    cardAlt: '#EFEAE8',
    border: '#DDD5D2',
    text: '#1A1414',
    textDim: '#5B504D',
    textFaint: '#948A87',
    smoke: '#C9C0BD',
    statusBar: 'dark',
  },
  beige: {
    bg: '#F1E9DC',
    card: '#FAF4E8',
    cardAlt: '#E9DFCE',
    border: '#D8CBB4',
    text: '#2A2118',
    textDim: '#6B5D4B',
    textFaint: '#9C8D77',
    smoke: '#CBBBA0',
    statusBar: 'dark',
  },
};

/** Palette values are read inline at render time, so mutating C re-skins the app on re-render. */
export function applyTheme(bg: BgId, accent: AccentId): void {
  const { statusBar: _sb, ...colors } = BACKGROUNDS[bg] ?? BACKGROUNDS.dark;
  Object.assign(C, colors, ACCENTS[accent] ?? ACCENTS.crimson);
}

const BASE_F = {
  title: 26,
  h1: 20,
  h2: 16,
  body: 14,
  small: 12,
};

/** Font sizes — read inline at render time; mutated by applyFontScale. */
export const F = { ...BASE_F };

export type FontScaleId = 'small' | 'default' | 'large' | 'xl';

export const FONT_SCALES: Record<FontScaleId, number> = {
  small: 0.88,
  default: 1,
  large: 1.12,
  xl: 1.25,
};

export function applyFontScale(id: FontScaleId): void {
  const s = FONT_SCALES[id] ?? 1;
  for (const k of Object.keys(BASE_F) as (keyof typeof BASE_F)[]) {
    F[k] = Math.round(BASE_F[k] * s);
  }
}

export type UiFlavor = 'modern' | 'boxy' | 'alien';

interface ShapeTokens {
  radius: number;
  radiusSm: number;
  btnRadius: number;
  /** wonky per-corner radii [tl, tr, br, bl] — overrides radius when set */
  radii: [number, number, number, number] | null;
  btnRadii: [number, number, number, number] | null;
  borderW: number;
  /** borders use the text color (thick cartoon outlines) instead of the border color */
  inkBorders: boolean;
  upper: boolean;
  /** max random tilt per card, degrees (alien disorientation) */
  tiltMax: number;
  /** every card invents its own shape: random blob corners, uneven border widths, offsets */
  freeform: boolean;
  shadow: object;
}

/** Shape tokens — read inline at render time like C and F. */
export const S: ShapeTokens = {
  radius: 14,
  radiusSm: 8,
  btnRadius: 10,
  radii: null,
  btnRadii: null,
  borderW: 1,
  inkBorders: false,
  upper: false,
  tiltMax: 0,
  freeform: false,
  shadow: {},
};

/**
 * 'boxy'  = early-2000s web: square corners, thick borders, hard offset shadows, SHOUTY buttons.
 * 'alien' = Alien Hominid flash-site energy: thick cartoon outlines, lopsided corners,
 *           slightly tilted cards — deliberately disoriented and non-linear.
 */
export function applyUiFlavor(f: UiFlavor): void {
  if (f === 'boxy') {
    Object.assign(S, {
      radius: 3,
      radiusSm: 2,
      btnRadius: 2,
      radii: null,
      btnRadii: null,
      borderW: 2,
      inkBorders: false,
      upper: true,
      tiltMax: 0,
      freeform: false,
      shadow: {
        shadowColor: '#000',
        shadowOffset: { width: 4, height: 4 },
        shadowOpacity: 0.85,
        shadowRadius: 0,
        elevation: 5,
      },
    });
  } else if (f === 'alien') {
    Object.assign(S, {
      radius: 18,
      radiusSm: 10,
      btnRadius: 14,
      radii: [22, 5, 26, 7],
      btnRadii: [18, 4, 20, 5],
      borderW: 3,
      inkBorders: true,
      upper: false,
      tiltMax: 2.2,
      freeform: true,
      shadow: {
        shadowColor: '#000',
        shadowOffset: { width: 5, height: 5 },
        shadowOpacity: 0.6,
        shadowRadius: 0,
        elevation: 6,
      },
    });
  } else {
    Object.assign(S, {
      radius: 14,
      radiusSm: 8,
      btnRadius: 10,
      radii: null,
      btnRadii: null,
      borderW: 1,
      inkBorders: false,
      upper: false,
      tiltMax: 0,
      freeform: false,
      shadow: {},
    });
  }
}
