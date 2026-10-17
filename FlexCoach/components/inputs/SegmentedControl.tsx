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
 * A small tab bar for switching between views of one screen: segments in a
 * raised track, the selected one on a surface pill that slides across. Each
 * segment is as wide as its label needs, plus an equal share of the spare
 * room, so a long label gets a longer pill rather than a smaller type size.
 * For two or three options; chips are for longer lists.
 */
export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  const { colors, spacing, radius } = useTheme();
  const index = Math.max(0, options.findIndex(o => o.value === value));
  // Where each segment landed in the track, so the pill can take its exact place.
  const [frames, setFrames] = useState<Record<string, { x: number; width: number }>>({});
  const pillX = useRef(new Animated.Value(0)).current;
  const pillWidth = useRef(new Animated.Value(0)).current;
  const settled = useRef(false);
  const frame = frames[options[index]?.value];
  useEffect(() => {
    if (!frame) return;
    if (!settled.current) {
      // The first layout places the pill without an animation.
      pillX.setValue(frame.x);
      pillWidth.setValue(frame.width);
      settled.current = true;
      return;
    }
    Animated.parallel([
      Animated.timing(pillX, { toValue: frame.x, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(pillWidth, { toValue: frame.width, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start();
  }, [frame, pillX, pillWidth]);

  const pad = 3;
  const onSegmentLayout = (key: string) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    setFrames(prev => (prev[key]?.x === x && prev[key]?.width === width ? prev : { ...prev, [key]: { x, width } }));
  };

  return (
    <View accessibilityRole="tablist" style={{ flexDirection: 'row', padding: pad, borderRadius: radius.pill, backgroundColor: colors.surfaceRaised }}>
      {frame && (
        <Animated.View pointerEvents="none" style={{ position: 'absolute', top: pad, bottom: pad, left: pillX, width: pillWidth, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }} />
      )}
      {options.map(o => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            onLayout={onSegmentLayout(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={{ flexGrow: 1, flexShrink: 0, flexBasis: 'auto', paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, alignItems: 'center', justifyContent: 'center' }}
          >
            <CustomText variant="label" color={on ? colors.ink : colors.inkMuted} numberOfLines={1}>{o.label}</CustomText>
          </Pressable>
        );
      })}
    </View>
  );
}
