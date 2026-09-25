import React, { useEffect, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, View } from 'react-native';
import { CustomText } from '../text/customText';
import { useTheme } from '../../theme';

export interface WheelOption<T> {
  value: T;
  label: string;
}

interface Props<T> {
  options: WheelOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Odd number of rows shown at once. */
  visibleRows?: number;
  accessibilityLabel: string;
}

const ITEM_HEIGHT = 40;

/**
 * A scrollable column that snaps to one option, like the drums of a native
 * time picker. The row in the middle is the selected one. Put several side
 * by side for hours, minutes and AM/PM.
 */
export function WheelPicker<T extends string | number>({ options, value, onChange, visibleRows = 5, accessibilityLabel }: Props<T>) {
  const { colors, radius } = useTheme();
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const selectedIndex = Math.max(0, options.findIndex(o => o.value === value));
  const [liveIndex, setLiveIndex] = useState(selectedIndex);
  const pad = (ITEM_HEIGHT * (visibleRows - 1)) / 2;

  // Follow the value when it changes from outside (e.g. the sheet reopens).
  useEffect(() => {
    if (selectedIndex !== liveIndex) {
      setLiveIndex(selectedIndex);
      scroll.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex]);

  const indexAt = (e: NativeSyntheticEvent<NativeScrollEvent>) => Math.min(options.length - 1, Math.max(0, Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT)));

  const commit = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = indexAt(e);
    setLiveIndex(i);
    if (options[i] && options[i].value !== value) onChange(options[i].value);
  };

  return (
    <View style={{ flex: 1, height: ITEM_HEIGHT * visibleRows }} accessibilityLabel={accessibilityLabel} accessibilityValue={{ text: options[selectedIndex]?.label }}>
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: pad, height: ITEM_HEIGHT, borderRadius: radius.sm, backgroundColor: colors.surfaceRaised }} />
      <ScrollView
        ref={scroll}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        contentOffset={{ x: 0, y: selectedIndex * ITEM_HEIGHT }}
        contentContainerStyle={{ paddingVertical: pad }}
        onLayout={() => scroll.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false })}
        onScroll={e => setLiveIndex(indexAt(e))}
        scrollEventThrottle={32}
        onMomentumScrollEnd={commit}
        onScrollEndDrag={commit}
        nestedScrollEnabled
      >
        {options.map((o, i) => {
          const distance = Math.abs(i - liveIndex);
          return (
            <View key={String(o.value)} style={{ height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center', opacity: distance === 0 ? 1 : distance === 1 ? 0.55 : 0.3 }}>
              <CustomText variant={distance === 0 ? 'heading' : 'body'} color={distance === 0 ? colors.ink : colors.inkMuted}>{o.label}</CustomText>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
