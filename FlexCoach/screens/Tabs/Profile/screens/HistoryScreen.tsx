import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { Session } from '../../../../data/models';
import { sessionRepository } from '../../../../data/repositories/sessionRepository';
import { countWorkingSets, totalVolumeKg } from '../../../../data/engine/stats';
import { formatDuration, toDisplayWeight } from '../../../../data/engine/units';
import { fromLocalDate } from '../../../../data/engine/dates';
import { dateLabel } from '../../../../components/charts/scale';
import { CustomText } from '../../../../components/text/customText';
import { SurfaceCard } from '../../../../components/cards/SurfaceCard';
import { Icon } from '../../../../components/icons/Icon';
import { directionIcons, generalIcons } from '../../../../components/icons/icon-library';
import { useTheme } from '../../../../theme';
import { useTabScrollInset } from '../../../../navigation/useTabBarInset';
import { ProfileStackParams } from '../ProfileStack';

const monthOf = (d: string) => fromLocalDate(d).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

/** Every completed workout, newest first, grouped by month. Tap one to see its sets. */
export const HistoryScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParams>>();
  const { colors, spacing } = useTheme();
  const bottomInset = useTabScrollInset();
  const { uid, profile } = useAuth();
  const unit = profile?.weightUnit ?? 'lb';
  const [sessions, setSessions] = useState<Session[] | null>(null);

  // Re-read on every focus so edits made on the detail screen show up.
  useFocusEffect(
    useCallback(() => {
      if (!uid) return;
      let cancelled = false;
      sessionRepository.listCompleted(uid).then(list => {
        if (!cancelled) setSessions([...list].sort((a, b) => b.startedAt - a.startedAt));
      });
      return () => {
        cancelled = true;
      };
    }, [uid]),
  );

  const groups: { month: string; sessions: Session[] }[] = [];
  for (const s of sessions ?? []) {
    const month = monthOf(s.date);
    const last = groups[groups.length - 1];
    if (last && last.month === month) last.sessions.push(s);
    else groups.push({ month, sessions: [s] });
  }

  return (
    <SafeAreaView edges={['left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.lg + bottomInset }}>
        {sessions === null && <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xxl }} />}
        {sessions !== null && sessions.length === 0 && (
          <View style={{ alignItems: 'center', gap: spacing.md, paddingTop: spacing.xxl }}>
            <Icon icon={generalIcons.clock} size={36} color={colors.inactive} />
            <CustomText variant="heading" centered>No workouts yet</CustomText>
            <CustomText variant="body" color={colors.inkMuted} centered>Finish a workout and it shows up here with every set you logged.</CustomText>
          </View>
        )}
        {groups.map(group => (
          <View key={group.month} style={{ gap: spacing.sm }}>
            <CustomText variant="overline" color={colors.inkMuted}>{group.month}</CustomText>
            <SurfaceCard style={{ padding: 0 }}>
              {group.sessions.map((s, i) => {
                const sets = countWorkingSets([s]);
                const volume = Math.round(toDisplayWeight(totalVolumeKg([s]), unit) ?? 0);
                const duration = s.finishedAt ? formatDuration(Math.round((s.finishedAt - s.startedAt) / 1000)) : null;
                return (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => navigation.navigate('SessionDetailScreen', { sessionId: s.id })}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}
                  >
                    <View style={{ flex: 1 }}>
                      <CustomText variant="bodyStrong">{s.workoutName}</CustomText>
                      <CustomText variant="caption" color={colors.inkMuted}>
                        {dateLabel(s.date)} · {sets} set{sets === 1 ? '' : 's'}{volume ? ` · ${volume.toLocaleString()} ${unit}` : ''}{duration ? ` · ${duration}` : ''}
                      </CustomText>
                    </View>
                    <Icon icon={directionIcons.angleRight} size={18} color={colors.inactive} />
                  </TouchableOpacity>
                );
              })}
            </SurfaceCard>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};
