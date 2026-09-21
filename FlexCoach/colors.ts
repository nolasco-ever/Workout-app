import { ColorTokens, ironDark, ironLight, useIsDark } from './theme';

/**
 * Legacy color hook. Existing screens call `colors()` and read the keys
 * below; they are mapped onto the design tokens in `theme/palette.ts` so the
 * whole app picks up the palette without touching every call site. New code
 * should use `useTheme()` from `./theme` instead.
 */
const legacy = (t: ColorTokens) => ({
  background: t.ground,
  onBackground: t.surface,
  iconButton: t.surfaceRaised,
  text: t.ink,
  onPrimaryText: t.onAccent,
  subtext: t.inkMuted,
  primary: t.accent,
  secondary: t.accent,
  accent: t.accent,
  inactive: t.inactive,
  icon: t.ink,
  transparent: t.transparent,
  onBanner: t.ink,
  info: t.infoTint,
  onInfo: t.info,
  success: t.successTint,
  onSuccess: t.success,
  warning: t.warningTint,
  onWarning: t.warning,
  error: t.errorTint,
  onError: t.error,
  lightGrey: t.line,
  googleRed: '#DB4437',
  // Direct access to the full token set for screens mid-migration.
  tokens: t,
});

const legacyLight = legacy(ironLight);
const legacyDark = legacy(ironDark);

export const colors = () => (useIsDark() ? legacyDark : legacyLight);
