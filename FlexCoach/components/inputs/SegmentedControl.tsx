import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, LayoutChangeEvent, Pressable, View } from 'react-native';
import { CustomText } from '../text/customText';
import { useTheme } from '../../theme';

interface Props<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * A small tab bar for switching between views of one screen: equal
 * segments in a raised track, the selected one on a surface pill that
 * slides across. For two or three options; chips are for longer lists.
 */
export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  const { colors, spacing, radius } = useTheme();
  const [width, setWidth] = useState(0);
  const index = Math.max(0, options.findIndex(o => o.value === value));
  const position = useRef(new Animated.Value(index)).current;
  useEffect(() => {
    Animated.timing(position, { toValue: index, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [index, position]);

  const pad = 3;
  const segment = width > 0 ? (width - pad * 2) / options.length : 0;
  const translateX = position.interpolate({ inputRange: [0, Math.max(1, options.length - 1)], outputRange: [0, segment * Math.max(1, options.length - 1)] });
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <View onLayout={onLayout} accessibilityRole="tablist" style={{ flexDirection: 'row', padding: pad, borderRadius: radius.pill, backgroundColor: colors.surfaceRaised }}>
      {segment > 0 && (
        <Animated.View pointerEvents="none" style={{ position: 'absolute', top: pad, bottom: pad, left: pad, width: segment, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, transform: [{ translateX }] }} />
      )}
      {options.map(o => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={{ flex: 1, paddingVertical: spacing.sm, alignItems: 'center', justifyContent: 'center' }}>
            <CustomText variant="label" color={on ? colors.ink : colors.inkMuted}>{o.label}</CustomText>
          </Pressable>
        );
      })}
    </View>
  );
}
