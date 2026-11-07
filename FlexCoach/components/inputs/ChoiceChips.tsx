import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { CustomText } from '../text/customText';
import { useTheme } from '../../theme';

interface Props<T extends string> {
  options: { value: T; label: string }[];
  /** One value, or several when more than one chip can be on. */
  value: T | T[] | null;
  onChange: (value: T) => void;
  scroll?: boolean;
}

/** Chips: one on, or several when `value` is a list. Scrolls horizontally when there are many options. */
export function ChoiceChips<T extends string>({ options, value, onChange, scroll = false }: Props<T>) {
  const { colors, radius, spacing } = useTheme();
  const chips = options.map(o => {
    const on = Array.isArray(value) ? value.includes(o.value) : o.value === value;
    return (
      // Pressable, not TouchableOpacity: the opacity dip read as a dim, laggy chip while the list behind recomputed.
      <Pressable
        key={o.value}
        onPress={() => onChange(o.value)}
        accessibilityRole="button"
        accessibilityState={{ selected: on }}
        style={({ pressed }) => ({ backgroundColor: on || pressed ? colors.accent : colors.surfaceRaised, borderRadius: radius.pill, paddingHorizontal: spacing.md + 2, paddingVertical: spacing.sm })}
      >
        {({ pressed }) => <CustomText variant="label" color={on || pressed ? colors.onAccent : colors.ink}>{o.label}</CustomText>}
      </Pressable>
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
