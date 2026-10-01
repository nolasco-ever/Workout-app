import React from 'react';
import { View } from 'react-native';
import { Activity } from '../../data/models';
import { CustomText } from '../text/customText';
import { SurfaceCard } from '../cards/SurfaceCard';
import { useTheme } from '../../theme';

/** "Finished Lower Body" → "This workout"; "New record: Bench Press" → "Bench Press record". */
const lineLabel = (item: Activity): string =>
  item.kind === 'workout_done' ? 'This workout' : item.kind === 'record' ? `${item.title.replace(/^New record: /, '')} record` : item.title;

/**
 * What buddies said about one of my own workouts: a line per activity
 * entry (the workout itself, each record set in it) with who reacted how.
 * Renders nothing when nobody has reacted yet.
 */
export const OwnReactions = ({ items }: { items: Activity[] }) => {
  const { colors, spacing, radius } = useTheme();
  const lines = items.filter(i => Object.keys(i.reactions ?? {}).length > 0).sort((a, b) => (a.kind === 'workout_done' ? -1 : b.kind === 'workout_done' ? 1 : 0));
  if (lines.length === 0) return null;
  return (
    <View style={{ gap: spacing.sm }}>
      <CustomText variant="overline" color={colors.inkMuted}>Reactions from buddies</CustomText>
      <SurfaceCard style={{ padding: 0 }}>
        {lines.map((item, i) => (
          <View key={item.id} style={{ padding: spacing.md, paddingHorizontal: spacing.lg, gap: spacing.xs, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: colors.line }}>
            <CustomText variant="bodyStrong">{lineLabel(item)}</CustomText>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              {Object.entries(item.reactions ?? {})
                .sort((a, b) => a[1].at - b[1].at)
                .map(([uid, r]) => (
                  <View key={uid} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm, height: 28, borderRadius: radius.pill, backgroundColor: colors.surfaceRaised }}>
                    <CustomText variant="caption" style={{ fontSize: 15, lineHeight: 18 }}>{r.emoji}</CustomText>
                    <CustomText variant="caption" color={colors.inkMuted}>{r.name?.split(' ')[0] ?? 'A buddy'}</CustomText>
                  </View>
                ))}
            </View>
          </View>
        ))}
      </SurfaceCard>
    </View>
  );
};
