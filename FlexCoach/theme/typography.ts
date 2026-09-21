/**
 * Sora for display and headings, Manrope for everything else. Font family
 * names are the PostScript names, which match the bundled file names, so
 * the same string works on iOS and Android.
 */
export const fonts = {
  display: {
    medium: 'Sora-Medium',
    semibold: 'Sora-SemiBold',
    bold: 'Sora-Bold',
  },
  body: {
    regular: 'Manrope-Regular',
    medium: 'Manrope-Medium',
    semibold: 'Manrope-SemiBold',
    bold: 'Manrope-Bold',
  },
} as const;

export interface TextStyleToken {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
  textTransform?: 'uppercase';
}

/** The type scale. Stay on it. */
export const typography = {
  /** Big numbers on insight tiles and the cycle summary. */
  display: { fontFamily: fonts.display.bold, fontSize: 32, lineHeight: 36, letterSpacing: -0.5 },
  /** Screen titles. */
  title: { fontFamily: fonts.display.bold, fontSize: 24, lineHeight: 28, letterSpacing: -0.3 },
  /** Section and card headings. */
  heading: { fontFamily: fonts.display.semibold, fontSize: 18, lineHeight: 22 },
  /** Emphasised body text, list item titles. */
  bodyStrong: { fontFamily: fonts.body.semibold, fontSize: 16, lineHeight: 22 },
  body: { fontFamily: fonts.body.regular, fontSize: 16, lineHeight: 22 },
  /** Buttons and tabs. */
  label: { fontFamily: fonts.body.bold, fontSize: 14, lineHeight: 18 },
  caption: { fontFamily: fonts.body.medium, fontSize: 12, lineHeight: 16 },
  /** Small uppercase labels above values. */
  overline: { fontFamily: fonts.body.bold, fontSize: 11, lineHeight: 14, letterSpacing: 0.6, textTransform: 'uppercase' as const },
} satisfies Record<string, TextStyleToken>;

export type TypographyToken = keyof typeof typography;
