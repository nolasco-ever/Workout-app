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
  /** The one action color. Use sparingly. */
  accent: string;
  /** Text on top of the accent. */
  onAccent: string;
  /** Soft tint of the accent for selected states. */
  accentTint: string;
  success: string;
  successTint: string;
  warning: string;
  warningTint: string;
  error: string;
  errorTint: string;
  info: string;
  infoTint: string;
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
  success: '#2E9E6B',
  successTint: '#DDF3E8',
  warning: '#D99A1E',
  warningTint: '#FAF0D6',
  error: '#D64B4B',
  errorTint: '#F9E0E0',
  info: '#3B7DD8',
  infoTint: '#DFEAFA',
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
  success: '#4FC78F',
  successTint: '#1C3328',
  warning: '#F0B545',
  warningTint: '#3A2F17',
  error: '#EF6B6B',
  errorTint: '#3B2020',
  info: '#6FA3EE',
  infoTint: '#1B2A40',
  scrim: 'rgba(0, 0, 0, 0.6)',
  transparent: 'rgba(0, 0, 0, 0)',
};
