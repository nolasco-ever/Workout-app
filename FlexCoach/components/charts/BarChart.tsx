import React, { useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Svg, { G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { CustomText } from '../text/customText';
import { useTheme } from '../../theme';
import { linear, niceTicks } from './scale';

export interface Bar {
  label: string;
  value: number;
  /** Tooltip line, e.g. "Sep 14 – 20". */
  detail?: string;
}

interface Props {
  bars: Bar[];
  height?: number;
  format: (v: number) => string;
  /** Index drawn in the accent; the rest use the muted tint. Defaults to the last. */
  emphasize?: number;
  /** Print each column's value above it. */
  showValues?: boolean;
}

const PAD = { top: 24, right: 8, bottom: 22, left: 36 };
const MAX_BAR = 24;

/** Column chart with values printed above each column; the current period is emphasised. */
export const BarChart = ({ bars, height = 160, format, emphasize, showValues = true }: Props) => {
  const { colors, fonts, spacing } = useTheme();
  const [width, setWidth] = useState(0);
  const w = Math.max(0, width - PAD.left - PAD.right);
  const h = height - PAD.top - PAD.bottom;
  const max = Math.max(1, ...bars.map(b => b.value));
  const ticks = niceTicks(0, max, 3);
  const top = ticks.length ? ticks[ticks.length - 1] : max;
  const y = linear([0, top], [PAD.top + h, PAD.top]);
  const band = bars.length ? w / bars.length : 0;
  const barW = Math.min(MAX_BAR, band * 0.6);
  const focus = emphasize ?? bars.length - 1;
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  /** Rounded top, square base. */
  const barPath = (x: number, yTop: number, yBase: number): string => {
    const r = Math.min(4, barW / 2, Math.max(0, yBase - yTop));
    return `M${x} ${yBase} V${yTop + r} Q${x} ${yTop} ${x + r} ${yTop} H${x + barW - r} Q${x + barW} ${yTop} ${x + barW} ${yTop + r} V${yBase} Z`;
  };

  return (
    <View onLayout={onLayout} style={{ width: '100%' }}>
      {width > 0 && (
        <Svg width={width} height={height}>
          {ticks.map(t => (
            <G key={t}>
              <Line x1={PAD.left} x2={PAD.left + w} y1={y.map(t)} y2={y.map(t)} stroke={colors.line} strokeWidth={1} />
              <SvgText x={PAD.left - 6} y={y.map(t) + 4} fontSize={11} fontFamily={fonts.body.medium} fill={colors.inkMuted} textAnchor="end">{format(t)}</SvgText>
            </G>
          ))}
          {bars.map((b, i) => {
            const x = PAD.left + band * i + (band - barW) / 2;
            const fill = i === focus ? colors.accent : colors.accentTint;
            return (
              <G key={i}>
                {b.value > 0 && <Path d={barPath(x, y.map(b.value), PAD.top + h)} fill={fill} />}
                {b.value === 0 && <Rect x={x} y={PAD.top + h - 2} width={barW} height={2} fill={colors.line} />}
                <SvgText x={x + barW / 2} y={height - 6} fontSize={10} fontFamily={fonts.body.medium} fill={i === focus ? colors.ink : colors.inkMuted} textAnchor="middle">{b.label}</SvgText>
                {showValues && b.value > 0 && (
                  <SvgText x={x + barW / 2} y={Math.max(12, y.map(b.value) - 6)} fontSize={10} fontFamily={i === focus ? fonts.body.bold : fonts.body.medium} fill={i === focus ? colors.ink : colors.inkMuted} textAnchor="middle">{format(b.value)}</SvgText>
                )}
              </G>
            );
          })}
        </Svg>
      )}
      {bars[focus]?.detail && (
        <CustomText variant="caption" color={colors.inkMuted} style={{ marginTop: spacing.xs }}>{bars[focus].detail}</CustomText>
      )}
    </View>
  );
};
