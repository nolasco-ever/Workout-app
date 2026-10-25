import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, LayoutAnimation, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from '../../../../components/layout/SafeAreaView';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { sessionRepository } from '../../../../data/repositories/sessionRepository';
import { LocalDate, Session } from '../../../../data/models';
import { fromLocalDate, today } from '../../../../data/engine/dates';
import { countWorkingSets, totalVolumeKg } from '../../../../data/engine/stats';
import { formatWeight } from '../../../../data/engine/units';
import { CalendarMonth, StreakRun, calendarMonths, summarizeStreaks, trainingDays } from '../../../../data/engine/streaks';
import { CustomText } from '../../../../components/text/customText';
import { SurfaceCard } from '../../../../components/cards/SurfaceCard';
import { BottomSheet } from '../../../../components/overlays/BottomSheet';
import { Icon } from '../../../../components/icons/Icon';
import { directionIcons } from '../../../../components/icons/icon-library';
import { useComfortableColumn } from '../../../../components/layout/useComfortableColumn';
import { useTabScrollInset } from '../../../../navigation/useTabBarInset';
import { useTheme } from '../../../../theme';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const ROW_HEIGHT = 44;
/** Today's circle. */
const DOT = 34;
/** The weekday letters' row, with its rule underneath. */
const HEADER_HEIGHT = 30;

const monthName = (m: CalendarMonth) => new Date(m.year, m.month, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
const longDate = (d: LocalDate) => fromLocalDate(d).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
const inRun = (run: StreakRun | null, d: LocalDate) => !!run && d >= run.start && d <= run.end;

/** "52 min · 21 sets · 12,140 lb": one workout of the day, in a line. */
const describeSession = (s: Session, unit: 'lb' | 'kg'): string => {
  const parts: string[] = [];
  if (s.finishedAt) parts.push(`${Math.max(1, Math.round((s.finishedAt - s.startedAt) / 60000))} min`);
  const sets = countWorkingSets([s]);
  if (sets > 0) parts.push(`${sets} set${sets === 1 ? '' : 's'}`);
  const volume = totalVolumeKg([s]);
  if (volume > 0) parts.push(formatWeight(volume, unit));
  return parts.join(' · ');
};

/**
 * Streaks (build 19 feedback; designed on the canvas, owner 2026-10-24), from
 * the Streak tile on Home: a calendar that
 * pages by month, this month first and earlier ones a swipe to the right
 * (owner: horizontal, not one long scroll). A day with a finished workout
 * is a green number, and today a circle, green once it has one and orange
 * until then; a tapped green day opens its workouts, each opening its detail.
 * The current and best streak sit under it, then what counts toward one.
 */
export const StreaksScreen = () => {
  const navigation = useNavigation();
  const { colors, spacing, radius } = useTheme();
  const column = useComfortableColumn();
  const bottomInset = useTabScrollInset();
  const { uid, profile } = useAuth();
  const unit = profile?.weightUnit ?? 'lb';
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [openDay, setOpenDay] = useState<LocalDate | null>(null);
  const [pageWidth, setPageWidth] = useState(0);
  const [page, setPage] = useState(0);
  const list = useRef<FlatList<CalendarMonth>>(null);
  const todayDate = today();

  useEffect(() => {
    if (!uid) return;
    let live = true;
    sessionRepository.listCompleted(uid).then(s => { if (live) setSessions(s); }).catch(() => { if (live) setSessions([]); });
    return () => { live = false; };
  }, [uid]);

  const days = useMemo(() => trainingDays(sessions ?? []), [sessions]);
  const { current, best } = useMemo(() => summarizeStreaks(days.keys(), todayDate), [days, todayDate]);
  const months = useMemo(() => calendarMonths([...days.keys()].sort()[0] ?? null, todayDate), [days, todayDate]);
  // Oldest first, opening on this month: a swipe to the right goes back in time, as a paper calendar does.
  useEffect(() => setPage(months.length - 1), [months.length]);
  // The card is as tall as the month on it (four to six weeks), easing to the next one's height.
  const showPage = (next: number) => {
    if (next === page) return;
    LayoutAnimation.configureNext(LayoutAnimation.create(200, 'easeInEaseOut', 'scaleY'));
    setPage(next);
  };
  const goTo = (to: number) => {
    const next = Math.max(0, Math.min(months.length - 1, to));
    showPage(next);
    list.current?.scrollToIndex({ index: next, animated: true });
  };

  const daysWord = (n: number) => `${n} day${n === 1 ? '' : 's'}`;

  const monthGrid = (m: CalendarMonth) => (
    <View style={{ width: pageWidth, paddingHorizontal: spacing.sm }}>
      <View style={{ flexDirection: 'row', height: HEADER_HEIGHT - 6, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.line, marginBottom: 6 }}>
        {WEEKDAYS.map((w, i) => (
          <CustomText key={i} variant="sectionLabel" color={colors.ink} centered style={{ flex: 1 }}>{w}</CustomText>
        ))}
      </View>
      {m.weeks.map((week, wi) => (
        <View key={wi} style={{ flexDirection: 'row', height: ROW_HEIGHT }}>
          {week.map((d, di) => {
            if (!d) return <View key={di} style={{ flex: 1 }} />;
            const trained = days.has(d);
            const isToday = d === todayDate;
            // A day with a workout is a green number; today is a circle, green once it has one, orange until then.
            const number = (
              <View style={[{ width: DOT, height: DOT, borderRadius: DOT / 2, alignItems: 'center', justifyContent: 'center' }, isToday && { backgroundColor: trained ? colors.success : colors.accent }]}>
                <CustomText variant="bodyStrong" color={isToday ? colors.ground : trained ? colors.success : d > todayDate ? colors.inactive : colors.inkMuted}>
                  {Number(d.slice(8))}
                </CustomText>
              </View>
            );
            return (
              <View key={di} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                {trained ? (
                  <TouchableOpacity onPress={() => setOpenDay(d)} hitSlop={4} accessibilityRole="button" accessibilityLabel={`${longDate(d)}, workout done`}>
                    {number}
                  </TouchableOpacity>
                ) : (
                  <View accessible accessibilityLabel={isToday ? `Today, ${longDate(d)}, no workout yet` : longDate(d)}>{number}</View>
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );

  const shown = months[page];
  const openSessions = openDay ? days.get(openDay) ?? [] : [];
  const dayLine = openDay && inRun(current, openDay) && current ? `Day ${Math.round((fromLocalDate(openDay).getTime() - fromLocalDate(current.start).getTime()) / 86_400_000) + 1} of your current streak` : null;

  return (
    <SafeAreaView edges={['left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl + bottomInset }, column]}>
        {sessions === null ? (
          <ActivityIndicator color={colors.inkMuted} style={{ paddingVertical: spacing.xxl }} />
        ) : (
          <>

            <View style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <TouchableOpacity onPress={() => goTo(page - 1)} disabled={page === 0} hitSlop={8} accessibilityRole="button" accessibilityLabel="Previous month" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: page === 0 ? 0.3 : 1 }}>
                  <Icon icon={directionIcons.angleLeft} size={20} color={colors.ink} />
                </TouchableOpacity>
                <CustomText variant="heading" accessibilityRole="header">{shown ? monthName(shown) : ''}</CustomText>
                <TouchableOpacity onPress={() => goTo(page + 1)} disabled={page >= months.length - 1} hitSlop={8} accessibilityRole="button" accessibilityLabel="Next month" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: page >= months.length - 1 ? 0.3 : 1 }}>
                  <Icon icon={directionIcons.angleRight} size={20} color={colors.ink} />
                </TouchableOpacity>
              </View>
              <View onLayout={e => setPageWidth(Math.floor(e.nativeEvent.layout.width))} style={{ borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, paddingTop: spacing.md, paddingBottom: spacing.xs, overflow: 'hidden' }}>
                {pageWidth > 0 && (
                  <FlatList
                    ref={list}
                    data={months}
                    keyExtractor={m => `${m.year}-${m.month}`}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    initialScrollIndex={months.length - 1}
                    getItemLayout={(_, index) => ({ length: pageWidth, offset: pageWidth * index, index })}
                    onMomentumScrollEnd={e => showPage(Math.round(e.nativeEvent.contentOffset.x / pageWidth))}
                    style={{ height: HEADER_HEIGHT + (shown?.weeks.length ?? 5) * ROW_HEIGHT }}
                    renderItem={({ item }) => monthGrid(item)}
                  />
                )}
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.lg }}>
              <CustomText variant="caption" color={colors.success}>{`Current streak: ${daysWord(current?.length ?? 0)}`}</CustomText>
              <CustomText variant="caption" color={colors.accent}>{`Best: ${daysWord(best?.length ?? 0)}`}</CustomText>
            </View>

            <SurfaceCard style={{ gap: spacing.sm }}>
              <CustomText variant="bodyStrong">Your streak</CustomText>
              <CustomText variant="body">A streak tracks the days in a row with a finished workout.</CustomText>
              <CustomText variant="body" color={colors.inkMuted}>A day with nothing logged, including a rest day, ends it, so a walk in the park or a run on the treadmill will keep your streak going.</CustomText>
            </SurfaceCard>
          </>
        )}
      </ScrollView>

      <BottomSheet open={openDay !== null} title={openDay ? longDate(openDay) : ''} onClose={() => setOpenDay(null)}>
        <View style={{ gap: spacing.md }}>
          {dayLine && <CustomText variant="caption" color={colors.success}>{dayLine}</CustomText>}
          <SurfaceCard style={{ padding: 0 }}>
            {openSessions.map((s, i) => (
              <TouchableOpacity
                key={s.id}
                onPress={() => {
                  setOpenDay(null);
                  (navigation as any).navigate('SessionDetailScreen', { sessionId: s.id, workoutName: s.workoutName });
                }}
                accessibilityRole="button"
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <CustomText variant="bodyStrong">{s.workoutName}</CustomText>
                  <CustomText variant="caption" color={colors.inkMuted}>{describeSession(s, unit)}</CustomText>
                </View>
                <Icon icon={directionIcons.angleRight} size={18} color={colors.inkMuted} />
              </TouchableOpacity>
            ))}
          </SurfaceCard>
          <CustomText variant="caption" color={colors.inkMuted}>Tap a workout for every exercise and set.</CustomText>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
};
