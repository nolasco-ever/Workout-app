import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedProps, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { CustomText } from '../text/customText';
import { useTheme } from '../../theme';
import { linear, niceDomain, niceTicks, shortDate } from './scale';

const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface LinePoint {
  /** ISO date, used for the x axis and the tooltip. */
  date: string;
  value: number;
  /** Optional second value drawn as a muted line underneath (e.g. a trend). */
  secondary?: number;
}

interface Props {
  points: LinePoint[];
  height?: number;
  /** Formats values for the axis and tooltip. */
  format: (v: number) => string;
  /** Horizontal reference line, e.g. a target weight. */
  reference?: { value: number; label: string } | null;
  /** Called while scrubbing with the active point, and null on release. */
  onScrub?: (point: LinePoint | null) => void;
}

const PAD = { top: 12, right: 12, bottom: 22, left: 40 };

/**
 * Single-series line with a scrub gesture: drag anywhere on the plot and a
 * hairline snaps to the nearest date, with the value shown above.
 */
export const LineChart = ({ points, height = 180, format, reference = null, onScrub }: Props) => {
  const { colors, fonts, spacing } = useTheme();
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const activeX = useSharedValue(0);
  const activeY = useSharedValue(0);
  const scrubbing = useSharedValue(0);

  const plot = useMemo(() => {
    const w = Math.max(0, width - PAD.left - PAD.right);
    const h = height - PAD.top - PAD.bottom;
    const values = points.flatMap(p => [p.value, ...(p.secondary !== undefined ? [p.secondary] : [])]);
    if (reference) values.push(reference.value);
    const domain: [number, number] = points.length ? niceDomain(values) : [0, 1];
    const y = linear(domain, [PAD.top + h, PAD.top]);
    const x = linear([0, Math.max(1, points.length - 1)], [PAD.left, PAD.left + w]);
    const xs = points.map((_, i) => x.map(i));
    const ys = points.map(p => y.map(p.value));
    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xs[i].toFixed(1)} ${ys[i].toFixed(1)}`).join(' ');
    const secondaryPath = points.every(p => p.secondary !== undefined)
      ? points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xs[i].toFixed(1)} ${y.map(p.secondary!).toFixed(1)}`).join(' ')
      : null;
    return { w, h, x, y, xs, ys, path, secondaryPath, ticks: niceTicks(domain[0], domain[1]) };
  }, [points, width, height, reference]);

  const select = (index: number | null) => {
    setActive(index);
    onScrub?.(index === null ? null : points[index]);
  };

  const nearest = (px: number): number => {
    'worklet';
    if (plot.xs.length === 0) return 0;
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < plot.xs.length; i++) {
      const d = Math.abs(plot.xs[i] - px);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  };

  const pan = Gesture.Pan()
    .activateAfterLongPress(0)
    .minDistance(0)
    .onBegin(e => {
      const i = nearest(e.x);
      activeX.value = plot.xs[i];
      activeY.value = plot.ys[i];
      scrubbing.value = withTiming(1, { duration: 120 });
      runOnJS(select)(i);
    })
    .onUpdate(e => {
      const i = nearest(e.x);
      if (plot.xs[i] !== activeX.value) {
        activeX.value = plot.xs[i];
        activeY.value = plot.ys[i];
        runOnJS(select)(i);
      }
    })
    .onFinalize(() => {
      scrubbing.value = withTiming(0, { duration: 160 });
      runOnJS(select)(null);
    });

  const hairline = useAnimatedProps(() => ({ x1: activeX.value, x2: activeX.value, opacity: scrubbing.value }));
  const dot = useAnimatedProps(() => ({ cx: activeX.value, cy: activeY.value, opacity: scrubbing.value }));
  const tooltipStyle = useAnimatedStyle(() => ({
    opacity: scrubbing.value,
    transform: [{ translateX: Math.min(Math.max(activeX.value - 44, 0), Math.max(0, width - 88)) }],
  }));

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const activePoint = active !== null ? points[active] : null;
  const last = points[points.length - 1];

  return (
    <View onLayout={onLayout} style={{ width: '100%' }}>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: -2, width: 88, alignItems: 'center', zIndex: 1 }, tooltipStyle]}>
        <View style={{ backgroundColor: colors.ink, borderRadius: 8, paddingHorizontal: spacing.sm, paddingVertical: 4, alignItems: 'center' }}>
          <CustomText variant="label" color={colors.ground}>{activePoint ? format(activePoint.value) : ''}</CustomText>
          <CustomText variant="caption" color={colors.inactive}>{activePoint ? shortDate(activePoint.date) : ''}</CustomText>
        </View>
      </Animated.View>
      <GestureDetector gesture={pan}>
        <View>
          {width > 0 && (
            <Svg width={width} height={height}>
              {plot.ticks.map(t => (
                <G key={t}>
                  <Line x1={PAD.left} x2={PAD.left + plot.w} y1={plot.y.map(t)} y2={plot.y.map(t)} stroke={colors.line} strokeWidth={1} />
                  <SvgText x={PAD.left - 6} y={plot.y.map(t) + 4} fontSize={11} fontFamily={fonts.body.medium} fill={colors.inkMuted} textAnchor="end">
                    {format(t)}
                  </SvgText>
                </G>
              ))}
              {reference && (
                <G>
                  <Line x1={PAD.left} x2={PAD.left + plot.w} y1={plot.y.map(reference.value)} y2={plot.y.map(reference.value)} stroke={colors.inkMuted} strokeWidth={1} strokeDasharray="4 4" />
                  <SvgText x={PAD.left + plot.w} y={plot.y.map(reference.value) - 4} fontSize={10} fontFamily={fonts.body.semibold} fill={colors.inkMuted} textAnchor="end">
                    {reference.label}
                  </SvgText>
                </G>
              )}
              {points.length > 0 && (
                <>
                  <SvgText x={PAD.left} y={height - 6} fontSize={11} fontFamily={fonts.body.medium} fill={colors.inkMuted}>{shortDate(points[0].date)}</SvgText>
                  <SvgText x={PAD.left + plot.w} y={height - 6} fontSize={11} fontFamily={fonts.body.medium} fill={colors.inkMuted} textAnchor="end">{shortDate(last.date)}</SvgText>
                </>
              )}
              {plot.secondaryPath && <Path d={plot.secondaryPath} fill="none" stroke={colors.inkMuted} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" strokeOpacity={0.5} />}
              <Path d={plot.path} fill="none" stroke={colors.accent} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {points.length > 0 && (
                <>
                  <Circle cx={plot.xs[plot.xs.length - 1]} cy={plot.ys[plot.ys.length - 1]} r={6} fill={colors.surface} />
                  <Circle cx={plot.xs[plot.xs.length - 1]} cy={plot.ys[plot.ys.length - 1]} r={4} fill={colors.accent} />
                </>
              )}
              <AnimatedLine animatedProps={hairline} y1={PAD.top} y2={PAD.top + plot.h} stroke={colors.ink} strokeWidth={1} />
              <AnimatedCircle animatedProps={dot} r={7} fill={colors.surface} stroke={colors.accent} strokeWidth={2.5} />
            </Svg>
          )}
        </View>
      </GestureDetector>
    </View>
  );
};
