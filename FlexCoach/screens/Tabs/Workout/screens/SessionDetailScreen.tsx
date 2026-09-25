import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { LoggedSet, Session, SessionExercise } from '../../../../data/models';
import { sessionRepository } from '../../../../data/repositories/sessionRepository';
import { totalVolumeKg } from '../../../../data/engine/stats';
import { formatDistance, formatDuration, formatWeight, toDisplayDistance, toDisplayWeight } from '../../../../data/engine/units';
import { fromLocalDate } from '../../../../data/engine/dates';
import { getCatalogExercise } from '../../../../data/catalog/exerciseCatalog';
import { CustomText } from '../../../../components/text/customText';
import { SurfaceCard as Card } from '../../../../components/cards/SurfaceCard';
import { PrimaryButton } from '../../../../components/buttons/PrimaryButton';
import { MuscleMap } from '../../../../components/anatomy/MuscleMap';
import { Icon } from '../../../../components/icons/Icon';
import { HeaderButton } from '../../../../components/headers/HeaderButton';
import { generalIcons } from '../../../../components/icons/icon-library';
import { useTheme } from '../../../../theme';
import { useTabBarInset } from '../../../../navigation/useTabBarInset';
import { SetDraft, SetRow } from '../components/SetRow';
import { fromDraft, toDraft, Units, unitLabels } from '../components/setDrafts';

type Params = { SessionDetailScreen: { sessionId: string } };

const longDate = (d: string) => fromLocalDate(d).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

const Stat = ({ label, value }: { label: string; value: string }) => {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <CustomText variant="overline" color={colors.inkMuted}>{label}</CustomText>
      <CustomText variant="heading">{value}</CustomText>
    </View>
  );
};

/** The two logged values of a set as display text, by measurement. */
const setValues = (ex: SessionExercise, s: LoggedSet, u: Units): [string, string] => {
  switch (ex.measurement) {
    case 'weight_reps':
      return [s.weightKg === null ? '—' : String(toDisplayWeight(s.weightKg, u.weight)), s.reps === null ? '—' : String(s.reps)];
    case 'reps':
      return [s.weightKg ? `+${toDisplayWeight(s.weightKg, u.weight)}` : 'BW', s.reps === null ? '—' : String(s.reps)];
    case 'time':
      return [s.weightKg === null ? '—' : String(toDisplayWeight(s.weightKg, u.weight)), s.durationSec === null ? '—' : String(s.durationSec)];
    case 'distance_time':
      return [s.distanceM === null ? '—' : String(toDisplayDistance(s.distanceM, u.distance)), s.durationSec === null ? '—' : String(s.durationSec)];
  }
};

const describeTarget = (ex: SessionExercise, u: Units): string => {
  const t = ex.target;
  switch (ex.measurement) {
    case 'weight_reps':
      return `${t.sets} × ${t.reps ?? '—'} @ ${formatWeight(t.weightKg, u.weight)}`;
    case 'reps':
      return `${t.sets} × ${t.reps ?? '—'}${t.weightKg ? ` +${formatWeight(t.weightKg, u.weight)}` : ''}`;
    case 'time':
      return `${t.sets} × ${formatDuration(t.durationSec)}`;
    case 'distance_time':
      return `${formatDistance(t.distanceM, u.distance)} in ${formatDuration(t.durationSec)}`;
  }
};

/**
 * A logged workout, read-only by default: every exercise with the weight,
 * reps and done state of each set. Edit turns the rows into the same inputs
 * the live session uses so a mistyped number can be fixed afterwards.
 */
export const SessionDetailScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<Params>>();
  const { params } = useRoute<RouteProp<Params, 'SessionDetailScreen'>>();
  const { colors, spacing, radius } = useTheme();
  const tabBarInset = useTabBarInset();
  const { uid, profile } = useAuth();
  const units: Units = { weight: profile?.weightUnit ?? 'lb', distance: profile?.distanceUnit ?? 'mi' };

  const [session, setSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftSession, setDraftSession] = useState<Session | null>(null);
  const [drafts, setDrafts] = useState<Record<string, SetDraft>>({});

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    sessionRepository.get(uid, params.sessionId).then(s => {
      if (cancelled) return;
      setSession(s);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [uid, params.sessionId]);

  const startEditing = () => {
    if (!session) return;
    const d: Record<string, SetDraft> = {};
    for (const ex of session.exercises) for (const s of ex.sets) d[s.id] = toDraft(ex, s, units);
    setDrafts(d);
    setDraftSession(session);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setDraftSession(null);
  };

  // While editing the only ways out are Save or Cancel: the back button and
  // the swipe-back gesture are removed so a half-edited draft can't be dropped.
  useLayoutEffect(() => {
    navigation.setOptions({
      title: session?.workoutName ?? 'Workout',
      headerBackVisible: !editing,
      gestureEnabled: !editing,
      headerRight: session
        ? () =>
            editing ? (
              <HeaderButton icon={generalIcons.xMark} accessibilityLabel="Cancel editing" onPress={cancelEditing} />
            ) : (
              <HeaderButton icon={generalIcons.penToSquare} accessibilityLabel="Edit workout" onPress={startEditing} />
            )
        : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, session, editing]);

  const toggleDone = (ex: SessionExercise, set: LoggedSet) => {
    setDraftSession(s =>
      s
        ? {
            ...s,
            exercises: s.exercises.map(e =>
              e.id === ex.id ? { ...e, sets: e.sets.map(x => (x.id === set.id ? { ...x, completed: !x.completed, completedAt: !x.completed ? x.completedAt ?? Date.now() : null } : x)) } : e,
            ),
          }
        : s,
    );
  };

  const save = async () => {
    if (!uid || !draftSession) return;
    const next: Session = {
      ...draftSession,
      exercises: draftSession.exercises.map(ex => ({ ...ex, sets: ex.sets.map(s => fromDraft(ex, s, drafts[s.id] ?? toDraft(ex, s, units), units)) })),
    };
    setSaving(true);
    try {
      await sessionRepository.save(uid, next);
      setSession(next);
      setEditing(false);
      setDraftSession(null);
    } catch (err) {
      console.warn(err);
      Alert.alert('Something went wrong', 'The changes were not saved. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const shown = editing && draftSession ? draftSession : session;
  const stats = useMemo(() => {
    if (!shown) return null;
    const setsDone = shown.exercises.reduce((n, ex) => n + ex.sets.filter(s => s.completed).length, 0);
    const duration = shown.finishedAt ? Math.round((shown.finishedAt - shown.startedAt) / 1000) : null;
    return { setsDone, duration, volume: toDisplayWeight(totalVolumeKg([shown]), units.weight) ?? 0 };
  }, [shown, units.weight]);

  if (!loaded || !shown || !stats) {
    return (
      <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        {loaded ? <CustomText variant="body" color={colors.inkMuted} centered>This workout is no longer in your history.</CustomText> : <ActivityIndicator color={colors.accent} />}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={100}>
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: (editing ? spacing.lg : spacing.lg + tabBarInset) }} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View>
            <CustomText variant="overline" color={colors.inkMuted}>{longDate(shown.date)}</CustomText>
            <View style={{ flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm }}>
              <Stat label="Time" value={stats.duration === null ? '—' : formatDuration(stats.duration)} />
              <Stat label="Sets" value={String(stats.setsDone)} />
              <Stat label={`Volume ${units.weight}`} value={Math.round(stats.volume).toLocaleString()} />
            </View>
          </View>

          {[...shown.exercises]
            .sort((a, b) => a.order - b.order)
            .map(ex => {
              const catalog = getCatalogExercise(ex.exerciseId);
              const labels = unitLabels(ex, units);
              return (
                <Card key={ex.id} style={{ padding: spacing.md, gap: spacing.sm }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                    {catalog && <MuscleMap primary={catalog.primaryMuscles} secondary={catalog.secondaryMuscles} height={56} views="auto" />}
                    <View style={{ flex: 1 }}>
                      <CustomText variant="bodyStrong">{ex.exerciseName}</CustomText>
                      <CustomText variant="caption" color={colors.inkMuted}>
                        {catalog?.primaryMuscles.join(', ')}{catalog?.primaryMuscles.length ? ' · ' : ''}target {describeTarget(ex, units)}
                      </CustomText>
                    </View>
                  </View>
                  {editing ? (
                    ex.sets.map(set => (
                      <SetRow
                        key={set.id}
                        set={set}
                        measurement={ex.measurement}
                        draft={drafts[set.id] ?? { a: '', b: '' }}
                        unitLabels={labels}
                        onChange={d => setDrafts(prev => ({ ...prev, [set.id]: d }))}
                        onToggleDone={() => toggleDone(ex, set)}
                        alwaysEditable
                      />
                    ))
                  ) : (
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs }}>
                        <View style={{ width: 28 }} />
                        <CustomText variant="overline" color={colors.inkMuted} style={{ flex: 1, textAlign: 'center' }}>{labels.a}</CustomText>
                        <CustomText variant="overline" color={colors.inkMuted} style={{ flex: 1, textAlign: 'center' }}>{labels.b}</CustomText>
                        <View style={{ width: 32 }} />
                      </View>
                      {ex.sets.map(set => {
                        const [a, b] = setValues(ex, set, units);
                        return (
                          <View key={set.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.line, opacity: set.completed ? 1 : 0.5 }}>
                            <View style={{ width: 28 }}>
                              <CustomText variant="label" color={colors.inkMuted}>{set.setNumber}</CustomText>
                            </View>
                            <CustomText variant="bodyStrong" style={{ flex: 1, textAlign: 'center' }}>{a}</CustomText>
                            <CustomText variant="bodyStrong" style={{ flex: 1, textAlign: 'center' }}>{b}</CustomText>
                            <View style={{ width: 32, height: 32, borderRadius: radius.sm, backgroundColor: set.completed ? colors.successTint : colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
                              <Icon icon={set.completed ? generalIcons.check : generalIcons.minus} size={16} color={set.completed ? colors.success : colors.inkMuted} strokeWidth={3} />
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </Card>
              );
            })}
        </ScrollView>
        {editing && (
          <View style={{ padding: spacing.lg, paddingBottom: spacing.lg + tabBarInset, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.ground }}>
            <PrimaryButton label="Save changes" icon={generalIcons.check} busy={saving} onPress={save} />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
