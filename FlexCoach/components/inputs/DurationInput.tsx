import React, { useEffect, useRef, useState } from 'react';
import { StyleProp, TextInput, TextStyle, View } from 'react-native';
import { CustomText } from '../text/customText';
import { useTheme } from '../../theme';

/** Split whole seconds into the two boxes. */
const split = (seconds: string): { min: string; sec: string } => {
  const n = Number(seconds);
  if (seconds.trim() === '' || !Number.isFinite(n)) return { min: '', sec: '' };
  const s = Math.max(0, Math.round(n));
  return { min: String(Math.floor(s / 60)), sec: String(s % 60) };
};

const join = (min: string, sec: string): string => {
  if (min.trim() === '' && sec.trim() === '') return '';
  const m = Number(min) || 0;
  const s = Number(sec) || 0;
  return String(Math.max(0, Math.round(m * 60 + s)));
};

interface Props {
  /** Whole seconds as text, the same shape the set drafts use. Empty means unset. */
  seconds: string;
  onChange: (seconds: string) => void;
  editable?: boolean;
  /** Style for each box; the caller decides the look so it matches its neighbours. */
  inputStyle?: StyleProp<TextStyle>;
  /** Caption under the boxes, off for the compact set-row layout. */
  captions?: boolean;
  id?: string;
  autoFocus?: boolean;
}

/**
 * Minutes and seconds side by side, editing one seconds value underneath.
 * Twenty minutes on the treadmill reads as 20 : 00, not 1200.
 */
export const DurationInput = ({ seconds, onChange, editable = true, inputStyle, captions = true, id, autoFocus }: Props) => {
  const { colors, spacing } = useTheme();
  const [parts, setParts] = useState(() => split(seconds));
  // Keep the boxes in step with a value set from outside, without fighting the user mid-edit.
  const lastEmitted = useRef(seconds);
  useEffect(() => {
    if (seconds !== lastEmitted.current) {
      lastEmitted.current = seconds;
      setParts(split(seconds));
    }
  }, [seconds]);

  const set = (next: { min: string; sec: string }) => {
    setParts(next);
    const joined = join(next.min, next.sec);
    lastEmitted.current = joined;
    onChange(joined);
  };
  const digits = (t: string) => t.replace(/[^0-9]/g, '');

  const box = (key: 'min' | 'sec', caption: string, first: boolean) => (
    <View style={{ flex: 1 }}>
      <TextInput
        id={id ? `${id}-${key}` : undefined}
        value={parts[key]}
        onChangeText={t => set({ ...parts, [key]: digits(t).slice(0, key === 'sec' ? 2 : 3) })}
        keyboardType="number-pad"
        editable={editable}
        placeholder={key === 'sec' ? '00' : '0'}
        placeholderTextColor={colors.inactive}
        style={inputStyle}
        selectTextOnFocus
        autoFocus={first && autoFocus}
        accessibilityLabel={caption === 'min' ? 'Minutes' : 'Seconds'}
      />
      {captions && (
        <CustomText variant="caption" color={colors.inkMuted} centered>
          {caption}
        </CustomText>
      )}
    </View>
  );

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs }}>
      {box('min', 'min', true)}
      <CustomText variant="bodyStrong" color={colors.inkMuted} style={{ paddingTop: spacing.sm }}>:</CustomText>
      {box('sec', 'sec', false)}
    </View>
  );
};

/** DurationInput dressed like a TextField, with a label above. */
export const DurationField = ({ label, hint, ...rest }: Props & { label: string; hint?: string }) => {
  const { colors, radius, spacing, fonts } = useTheme();
  return (
    <View style={{ gap: spacing.xs }}>
      <CustomText variant="overline" color={colors.inkMuted}>{label}</CustomText>
      <DurationInput
        {...rest}
        inputStyle={{
          fontFamily: fonts.body.medium,
          fontSize: 16,
          color: colors.ink,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.line,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          textAlign: 'center',
        }}
      />
      {hint && <CustomText variant="caption" color={colors.inkMuted}>{hint}</CustomText>}
    </View>
  );
};
