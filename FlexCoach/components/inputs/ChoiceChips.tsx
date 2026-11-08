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
  /** With a list `value`: each chip that's on shows its place in the list, so tap order reads as an order (v1 #10 schedule days). */
  numbered?: boolean;
}

/** Chips: one on, or several when `value` is a list. Scrolls horizontally when there are many options. */
export function ChoiceChips<T extends string>({ options, value, onChange, scroll = false, numbered = false }: Props<T>) {
  const { colors, radius, spacing } = useTheme();
  const chips = options.map(o => {
    const on = Array.isArray(value) ? value.includes(o.value) : o.value === value;
    const place = numbered && on && Array.isArray(value) ? value.indexOf(o.value) + 1 : null;
    return (
      // Pressable, not TouchableOpacity: the opacity dip read as a dim, laggy chip while the list behind recomputed.
      <Pressable
        key={o.value}
        onPress={() => onChange(o.value)}
        accessibilityRole="button"
        accessibilityState={{ selected: on }}
        accessibilityLabel={place ? `${o.label}, ${place}` : undefined}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.xs + 2, backgroundColor: on || pressed ? colors.accent : colors.surfaceRaised, borderRadius: radius.pill, paddingLeft: place ? spacing.sm : spacing.md + 2, paddingRight: spacing.md + 2, paddingVertical: spacing.sm })}
      >
        {({ pressed }) => (
          <>
            {place && (
              <View style={{ minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 4, backgroundColor: colors.onAccent, alignItems: 'center', justifyContent: 'center' }}>
                <CustomText variant="caption" color={colors.accent} style={{ fontWeight: '800' }}>{place}</CustomText>
              </View>
            )}
            <CustomText variant="label" color={on || pressed ? colors.onAccent : colors.ink}>{o.label}</CustomText>
          </>
        )}
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
