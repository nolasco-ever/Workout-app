import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { DistanceUnit } from '../../../../data/models';
import { CardioScreenKind, CardioStat, paceSecPer, speedPerHour } from '../../../../data/engine/cardioScreen';
import { formatDuration, toDisplayDistance } from '../../../../data/engine/units';
import { CustomText } from '../../../../components/text/customText';
import { Icon } from '../../../../components/icons/Icon';
import { cardioControlIcons, cardioIcons, directionIcons } from '../../../../components/icons/icon-library';
import { GlassIconButton } from '../../../../components/buttons/GlassIconButton';
import { RouteMap } from '../../../../components/maps/RouteMap';
import { useTheme } from '../../../../theme';

interface Props {
  name: string;
  kind: CardioScreenKind;
  elapsedSec: number;
  running: boolean;
  /** The entry is already logged (End on the Watch): only End is left, to finish. */
  logged: boolean;
  distanceM: number | null;
  /** Null without a fresh Watch reading. */
  bpm: number | null;
  kcal: number | null;
  unit: DistanceUnit;
  busy: boolean;
  /** Outdoors, the route so far (v1 #10.8): drawn behind the panel once it has a point. Null indoors. */
  route: { lat: number; lon: number }[] | null;
  onBack: () => void;
  onStart: () => void;
  onPause: () => void;
  onEnd: () => void;
}

const LABEL: Record<CardioStat, string> = { distance: 'Distance', pace: 'Pace', speed: 'Speed', heartRate: 'Heart rate', calories: 'Calories' };

/** A glass surface on iOS 26, the raised surface elsewhere (Android, older iOS). */
const Glass = ({ style, children, onLayout }: { style: object; children: React.ReactNode; onLayout?: (height: number) => void }) => {
  const { colors } = useTheme();
  return (
    <LiquidGlassView effect="regular" onLayout={onLayout ? e => onLayout(e.nativeEvent.layout.height) : undefined} style={[style, { borderWidth: 1, borderColor: colors.line }, !isLiquidGlassSupported && { backgroundColor: colors.surface }]}>
      {children}
    </LiquidGlassView>
  );
};

/**
 * The cardio screen (v1 #10.6, the "Cardio redesign" boards): the exercise's
 * name on top, the kind's icon in rings that pulse with the heart rate, and
 * one glass panel at the bottom with the time, what the Watch measures for
 * this kind, and round Start, Pause and End. Outdoor kinds get the map behind
 * the panel in 10.8; until then they show the rings too.
 */
export const CardioSession = ({ name, kind, elapsedSec, running, logged, distanceM, bpm, kcal, unit, busy, route, onBack, onStart, onPause, onEnd }: Props) => {
  const { colors, spacing, fonts } = useTheme();
  const insets = useSafeAreaInsets();
  const started = running || elapsedSec > 0 || logged;

  // The rings beat with the heart: one swell per beat while the clock runs and a reading is in. Still otherwise.
  const beat = useSharedValue(0);
  useEffect(() => {
    if (!running || !bpm) {
      cancelAnimation(beat);
      beat.value = withTiming(0, { duration: 300 });
      return;
    }
    const period = 60000 / bpm;
    beat.value = withRepeat(
      withSequence(withTiming(1, { duration: period * 0.3, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: period * 0.7, easing: Easing.in(Easing.quad) })),
      -1,
    );
  }, [running, bpm, beat]);
  const ringsStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + beat.value * 0.06 }] }));

  const value = (stat: CardioStat): { text: string; unit: string } => {
    switch (stat) {
      case 'distance': {
        const v = toDisplayDistance(distanceM, unit);
        return { text: v === null ? '—' : v.toFixed(2), unit };
      }
      case 'pace': {
        const p = paceSecPer(distanceM, elapsedSec, unit);
        return { text: p === null ? '—' : formatDuration(p), unit: `per ${unit}` };
      }
      case 'speed': {
        const s = speedPerHour(distanceM, elapsedSec, unit);
        return { text: s === null ? '—' : s.toFixed(1), unit: unit === 'mi' ? 'mph' : 'km/h' };
      }
      case 'heartRate':
        return { text: bpm === null ? '—' : String(bpm), unit: 'bpm' };
      case 'calories':
        return { text: kcal === null ? '—' : String(kcal), unit: 'kcal' };
    }
  };

  const round = (label: string, icon: (typeof cardioControlIcons)[keyof typeof cardioControlIcons], filled: boolean, onPress: () => void) => (
    <TouchableOpacity
      key={label}
      onPress={onPress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: filled ? colors.accent : 'transparent',
        borderWidth: filled ? 0 : 2,
        borderColor: colors.accent,
        opacity: busy ? 0.6 : 1,
      }}
    >
      <Icon icon={icon} size={30} color={filled ? colors.onAccent : colors.accent} />
    </TouchableOpacity>
  );

  const controls = logged
    ? [round('End', cardioControlIcons.end, true, onEnd)]
    : !started
      ? [round('Start', cardioControlIcons.start, true, onStart)]
      : running
        ? [round('Pause', cardioControlIcons.pause, false, onPause), round('End', cardioControlIcons.end, true, onEnd)]
        : [round('Resume', cardioControlIcons.start, false, onStart), round('End', cardioControlIcons.end, true, onEnd)];

  const rings = [
    { size: 300, opacity: 0.1 },
    { size: 236, opacity: 0.18 },
    { size: 176, opacity: 0.3 },
  ];

  const [panelHeight, setPanelHeight] = useState(320);
  const showMap = kind.behind === 'map' && !!route && route.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.ground }}>
      {/* Outdoors the map fills the screen behind the panel; until the first reading (or with location off), the rings. */}
      {showMap && <RouteMap points={route!} live style={StyleSheet.absoluteFill} padding={{ top: insets.top + 72, right: 32, bottom: panelHeight + 24, left: 32 }} />}
      {/* The kind's icon in rings; decoration, so screen readers skip it. */}
      {!showMap && <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={{ position: 'absolute', left: 0, right: 0, top: insets.top + 56, height: 400, alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View style={[{ position: 'absolute', width: 340, height: 340, alignItems: 'center', justifyContent: 'center' }, ringsStyle]}>
          <View style={{ position: 'absolute', width: 340, height: 340, borderRadius: 170, backgroundColor: colors.accent, opacity: 0.08 }} />
          {rings.map(r => (
            <View key={r.size} style={{ position: 'absolute', width: r.size, height: r.size, borderRadius: r.size / 2, borderWidth: 2, borderColor: colors.accent, opacity: r.opacity }} />
          ))}
        </Animated.View>
        <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon icon={cardioIcons[kind.glyph]} size={64} color={colors.accent} weight="fill" />
        </View>
      </View>}

      <View style={{ position: 'absolute', left: spacing.lg, right: spacing.lg, top: insets.top, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
        <GlassIconButton icon={directionIcons.angleLeft} nudgeX={-1} accessibilityLabel="Back" onPress={onBack} />
        <Glass style={{ flexShrink: 1, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 999 }}>
          <CustomText variant="heading" numberOfLines={1} accessibilityRole="header">{name}</CustomText>
        </Glass>
        <View style={{ width: 44 }} />
      </View>

      <Glass onLayout={h => setPanelHeight(h)} style={{ position: 'absolute', left: spacing.sm, right: spacing.sm, bottom: spacing.md + insets.bottom, borderRadius: 32, paddingTop: spacing.lg, paddingBottom: spacing.xl, paddingHorizontal: spacing.md, gap: spacing.md }}>
        <CustomText
          centered
          accessibilityLabel={`Time ${formatDuration(elapsedSec)}`}
          color={started ? colors.ink : colors.inactive}
          style={{ fontFamily: fonts.display.bold, fontSize: 60, lineHeight: 66, letterSpacing: -1, fontVariant: ['tabular-nums'] }}
        >
          {formatDuration(elapsedSec)}
        </CustomText>
        <View style={{ flexDirection: 'row' }}>
          {kind.stats.map(stat => {
            const v = value(stat);
            return (
              <View key={stat} accessible accessibilityLabel={`${LABEL[stat]}, ${v.text === '—' ? 'no reading' : `${v.text} ${v.unit}`}`} style={{ flex: 1, minWidth: 0, alignItems: 'center', gap: 2 }}>
                <CustomText variant="overline" color={colors.inkMuted} numberOfLines={1}>{LABEL[stat]}</CustomText>
                <CustomText variant="title" color={started && v.text !== '—' ? colors.ink : colors.inactive} style={{ fontVariant: ['tabular-nums'] }}>{v.text}</CustomText>
                <CustomText variant="caption" color={colors.inkMuted}>{v.unit}</CustomText>
              </View>
            );
          })}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 28 }}>{controls}</View>
      </Glass>
    </View>
  );
};
