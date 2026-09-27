import React, { useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { CustomText } from '../../../../components/text/customText';
import { Icon } from '../../../../components/icons/Icon';
import { generalIcons } from '../../../../components/icons/icon-library';
import { formatDuration } from '../../../../data/engine/units';
import { useTheme } from '../../../../theme';

/** Re-renders once a second while mounted. */
const useTick = (intervalMs: number) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
};

/** Header title: the workout's name with how long it has been running underneath. */
export const SessionTitle = ({ name, startedAt }: { name: string; startedAt: number }) => {
  const { colors } = useTheme();
  useTick(1000);
  const elapsed = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
  return (
    <View style={{ alignItems: 'center' }}>
      <CustomText variant="bodyStrong" numberOfLines={1}>{name}</CustomText>
      <CustomText variant="caption" color={colors.inkMuted} style={{ fontVariant: ['tabular-nums'] }}>
        {formatDuration(elapsed)}
      </CustomText>
    </View>
  );
};

const RING = 40;
const STROKE = 3.5;

/**
 * The rest countdown as a ring in the header: the arc drains as the rest
 * runs and the seconds sit in the middle. Tap to skip. When time is up it
 * turns green with a check and goes away on its own, or on a tap.
 */
export const RestRing = ({ startedAt, durationSec, onDismiss }: { startedAt: number | null; durationSec: number; onDismiss: () => void }) => {
  const { colors } = useTheme();
  useTick(250);
  const remaining = startedAt === null ? durationSec : Math.max(0, Math.round(durationSec - (Date.now() - startedAt) / 1000));
  const done = startedAt !== null && remaining <= 0;

  useEffect(() => {
    if (!done) return;
    const id = setTimeout(onDismiss, 4000);
    return () => clearTimeout(id);
    // onDismiss is a stable setter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  if (startedAt === null) return null;
  const r = (RING - STROKE) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = Math.min(1, Math.max(0, remaining / durationSec));
  const tone = done ? colors.success : colors.accent;

  return (
    <TouchableOpacity onPress={onDismiss} hitSlop={10} accessibilityRole="button" accessibilityLabel={done ? 'Rest over, dismiss' : `Rest, ${remaining} seconds left. Skip`} style={{ width: RING, height: RING, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={RING} height={RING} style={{ position: 'absolute' }}>
        <Circle cx={RING / 2} cy={RING / 2} r={r} stroke={done ? colors.successTint : colors.surfaceRaised} strokeWidth={STROKE} fill="none" />
        <Circle
          cx={RING / 2}
          cy={RING / 2}
          r={r}
          stroke={tone}
          strokeWidth={STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - progress)}
          transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
        />
      </Svg>
      {done ? (
        <Icon icon={generalIcons.check} size={18} color={colors.success} strokeWidth={3} />
      ) : (
        <CustomText variant="caption" color={colors.ink} style={{ fontVariant: ['tabular-nums'], fontSize: 11, lineHeight: 13 }}>
          {remaining >= 60 ? formatDuration(remaining) : String(remaining)}
        </CustomText>
      )}
    </TouchableOpacity>
  );
};
