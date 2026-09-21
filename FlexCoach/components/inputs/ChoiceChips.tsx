import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { CustomText } from '../text/customText';
import { useTheme } from '../../theme';

interface Props<T extends string> {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  scroll?: boolean;
}

/** Single-select chips. Scrolls horizontally when there are many options. */
export function ChoiceChips<T extends string>({ options, value, onChange, scroll = false }: Props<T>) {
  const { colors, radius, spacing } = useTheme();
  const chips = options.map(o => {
    const on = o.value === value;
    return (
      <TouchableOpacity
        key={o.value}
        onPress={() => onChange(o.value)}
        style={{ backgroundColor: on ? colors.accent : colors.surfaceRaised, borderRadius: radius.pill, paddingHorizontal: spacing.md + 2, paddingVertical: spacing.sm }}
      >
        <CustomText variant="label" color={on ? colors.onAccent : colors.ink}>{o.label}</CustomText>
      </TouchableOpacity>
    );
  });
  if (scroll) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
        {chips}
      </ScrollView>
    );
  }
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>{chips}</View>;
}
