import React, { useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { CustomText } from '../../../../components/text/customText';
import { formatDuration } from '../../../../data/engine/units';
import { useTheme } from '../../../../theme';

/**
 * Countdown that starts when `startedAt` changes. Rendered as a strip above
 * the button bar so it never covers the set rows.
 */
export const RestTimer = ({ startedAt, durationSec, onDismiss }: { startedAt: number | null; durationSec: number; onDismiss: () => void }) => {
  const { colors, radius, spacing } = useTheme();
  const [remaining, setRemaining] = useState(durationSec);

  useEffect(() => {
    if (startedAt === null) return;
    const tick = () => setRemaining(Math.max(0, Math.round(durationSec - (Date.now() - startedAt) / 1000)));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [startedAt, durationSec]);

  if (startedAt === null) return null;
  const done = remaining <= 0;
  const progress = 1 - remaining / durationSec;

  return (
    <TouchableOpacity onPress={onDismiss} activeOpacity={0.9}>
      <View style={{ backgroundColor: done ? colors.successTint : colors.surfaceRaised, borderRadius: radius.md, padding: spacing.md, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${Math.min(100, progress * 100)}%`, backgroundColor: done ? colors.successTint : colors.accentTint }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <CustomText variant="label" color={done ? colors.success : colors.ink}>
            {done ? 'Rest over. Go.' : 'Rest'}
          </CustomText>
          <CustomText variant="heading" color={done ? colors.success : colors.ink}>
            {formatDuration(remaining)}
          </CustomText>
        </View>
        <CustomText variant="caption" color={colors.inkMuted}>
          {done ? 'Tap to dismiss' : 'Tap to skip'}
        </CustomText>
      </View>
    </TouchableOpacity>
  );
};
