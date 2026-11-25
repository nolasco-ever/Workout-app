/**
 * "Iron" palette: warm graphite neutrals with an oxide-orange accent.
 * Chosen 2026-09-21. Every screen color should come from these tokens.
 */
export interface ColorTokens {
  /** Page background. */
  ground: string;
  /** Cards, list rows, sheets. */
  surface: string;
  /** Slightly lifted surface: chips, icon buttons, inputs. */
  surfaceRaised: string;
  /** Primary text and icons. */
  ink: string;
  /** Secondary text. */
  inkMuted: string;
  /** Disabled text and inactive icons. */
  inactive: string;
  /** Hairlines and dividers. */
  line: string;
  /**
   * The one action color: buttons, links, the streak and new-record moments only
   * (owner, 2026-11-25, B22-13 colour A "Spark"). Data and selection are neutral.
   */
  accent: string;
  /** Text on top of the accent. */
  onAccent: string;
  /** Soft tint of the accent, for the streak and new-record moments. */
  accentTint: string;
  /** Data marks: the focused bar, chart lines, top muscles on the body map, record values. */
  data: string;
  /** Second-level data: the body map's other muscles. */
  dataSoft: string;
  /** Unfocused bars and quiet data fills. */
  dataMuted: string;
  /** Selected chip or calendar day: an inverted fill. */
  selected: string;
  /** Text and icons on `selected`. */
  onSelected: string;
  /** Soft background for a selected row. */
  selectedTint: string;
  success: string;
  successTint: string;
  warning: string;
  warningTint: string;
  error: string;
  errorTint: string;
  info: string;
  infoTint: string;
  /**
   * Tint laid over the iOS tab bar's Liquid Glass; null keeps the system look.
   * Dark mode only, a touch darker than the default (owner, 2026-11-25, B22-12).
   */
  tabBarGlass: string | null;
  /** Android's solid tab bar. */
  tabBarGround: string;
  /** Overlay behind modals. */
  scrim: string;
  transparent: string;
}

export const ironLight: ColorTokens = {
  ground: '#F4F3F1',
  surface: '#FFFFFF',
  surfaceRaised: '#ECEAE6',
  ink: '#1A1A1C',
  inkMuted: '#6E6B6A',
  inactive: '#A19D9A',
  line: '#E6E3DF',
  accent: '#E2602A',
  onAccent: '#FFFFFF',
  accentTint: '#FBE7DD',
  data: '#1A1A1C',
  dataSoft: '#9A9692',
  dataMuted: '#DAD7D2',
  selected: '#1A1A1C',
  onSelected: '#FFFFFF',
  selectedTint: '#ECEAE6',
  success: '#2E9E6B',
  successTint: '#DDF3E8',
  warning: '#D99A1E',
  warningTint: '#FAF0D6',
  error: '#D64B4B',
  errorTint: '#F9E0E0',
  info: '#3B7DD8',
  infoTint: '#DFEAFA',
  tabBarGlass: null,
  tabBarGround: '#F4F3F1',
  scrim: 'rgba(26, 26, 28, 0.45)',
  transparent: 'rgba(0, 0, 0, 0)',
};

export const ironDark: ColorTokens = {
  ground: '#141517',
  surface: '#1E1F22',
  surfaceRaised: '#2A2B2F',
  ink: '#F2F1EF',
  inkMuted: '#9A9895',
  inactive: '#6E6C69',
  line: '#2B2C30',
  accent: '#FF7A3D',
  onAccent: '#1A1A1C',
  accentTint: '#3A2418',
  data: '#E9E6E1',
  dataSoft: '#8F8C88',
  dataMuted: '#3A3B3F',
  selected: '#F2F1EF',
  onSelected: '#1A1A1C',
  selectedTint: '#2A2B2F',
  success: '#4FC78F',
  successTint: '#1C3328',
  warning: '#F0B545',
  warningTint: '#3A2F17',
  error: '#EF6B6B',
  errorTint: '#3B2020',
  info: '#6FA3EE',
  infoTint: '#1B2A40',
  tabBarGlass: 'rgba(6, 6, 8, 0.45)',
  tabBarGround: '#0D0E10',
  scrim: 'rgba(0, 0, 0, 0.6)',
  transparent: 'rgba(0, 0, 0, 0)',
};
