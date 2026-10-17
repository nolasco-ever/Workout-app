import React, { useEffect, useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, View } from 'react-native';
import { SegmentedControl } from '../inputs/SegmentedControl';
import { useTheme } from '../../theme';

export interface PagerPage<T extends string> {
  value: T;
  label: string;
  /** The page's content; it owns its own scrolling if it can overflow. */
  render: () => React.ReactNode;
}

interface Props<T extends string> {
  pages: PagerPage<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Around the control; the pages run edge to edge and pad themselves. */
  controlPadding?: number;
}

/**
 * The segmented control with its pages beneath: a tap on a segment slides
 * to its page, a swipe between pages moves the segment. The pages fill the
 * height they are given, so each one scrolls on its own when it overflows.
 * Used by the how-to screen and History.
 */
export function SegmentedPager<T extends string>({ pages, value, onChange, controlPadding }: Props<T>) {
  const { spacing } = useTheme();
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [width, setWidth] = useState(0);
  const index = Math.max(0, pages.findIndex(p => p.value === value));
  // The page the swipe settled on, so a programmatic scroll does not echo back as a change.
  const settled = useRef(index);
  useEffect(() => {
    if (width > 0 && settled.current !== index) {
      scroll.current?.scrollTo({ x: index * width, animated: true });
    }
  }, [index, width]);
  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width <= 0) return;
    const at = Math.round(e.nativeEvent.contentOffset.x / width);
    settled.current = at;
    const page = pages[at];
    if (page && page.value !== value) onChange(page.value);
  };
  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: controlPadding ?? spacing.lg }}>
        <SegmentedControl<T> options={pages.map(p => ({ value: p.value, label: p.label }))} value={value} onChange={onChange} />
      </View>
      <ScrollView
        ref={scroll}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onLayout={e => {
          const w = e.nativeEvent.layout.width;
          setWidth(w);
          // Land on the current page without an animation once the width is known.
          if (w > 0) scroll.current?.scrollTo({ x: index * w, animated: false });
        }}
        onMomentumScrollEnd={onEnd}
        style={{ flex: 1, marginTop: spacing.md }}
        contentContainerStyle={{ width: width > 0 ? width * pages.length : undefined }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Nothing renders until the width is known: a page laid out without one lets its text run on in one line. */}
        {width > 0 &&
          pages.map(p => (
            <View key={p.value} style={{ width, flexShrink: 0, overflow: 'hidden' }}>
              {p.render()}
            </View>
          ))}
      </ScrollView>
    </View>
  );
}
