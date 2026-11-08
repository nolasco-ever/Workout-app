import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import { SortableRows } from '../../../../components/lists/SortableRows';
import { newId } from '../../../../data/engine/ids';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Id, RotationSchedule, ScheduleDay, WeeklySchedule, Weekday } from '../../../../data/models';
import { CustomText } from '../../../../components/text/customText';
import { SurfaceCard } from '../../../../components/cards/SurfaceCard';
import { ChoiceChips } from '../../../../components/inputs/ChoiceChips';
import { SegmentedControl } from '../../../../components/inputs/SegmentedControl';
import { PrimaryButton } from '../../../../components/buttons/PrimaryButton';
import { Stepper } from '../../../../components/inputs/Stepper';
import { Icon } from '../../../../components/icons/Icon';
import { directionIcons, generalIcons } from '../../../../components/icons/icon-library';
import { useTheme } from '../../../../theme';
import { EditorMode, PlansStackParams } from '../../routes';
import { StepRoot } from '../StepRoot';
import { usePlanEditor } from '../../PlanEditorContext';
import { StepFooter } from '../StepFooter';
import { dayNames } from '../planSummary';
import { scheduledIds } from '../../../../data/engine/scheduleDays';
import { CycleHelpButton } from '../CycleHelpSheet';

const DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** The step itself: its own screen on a phone, a pane of the workspace on a wide window. */
export const PlanScheduleStep = ({ mode, embedded = false }: { mode: EditorMode; embedded?: boolean }) => {
  const navigation = useNavigation<NativeStackNavigationProp<PlansStackParams>>();
  const { colors, spacing } = useTheme();
  const { draft, update } = usePlanEditor();
  // The weekday shown in the fixed-weekdays editor, and the rotation day that is open.
  const [weekday, setWeekday] = useState<number>(draft?.schedule.mode === 'weekly' ? draft.schedule.startWeekday : 1);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  // Rotation days can repeat (several rest days), so give each a stable local key for dragging and opening.
  const [slotItems, setSlotItems] = useState<{ key: string; day: ScheduleDay }[]>([]);
  const daySig = (day: ScheduleDay) => day.join(',');
  const slotsSig = draft?.schedule.mode === 'rotation' ? draft.schedule.slots.map(daySig).join('|') : '';
  useEffect(() => {
    if (!draft || draft.schedule.mode !== 'rotation') return;
    const slots = draft.schedule.slots;
    setSlotItems(prev => (prev.map(i => daySig(i.day)).join('|') === slotsSig ? prev : slots.map((day, i) => ({ key: prev[i]?.key ?? newId(), day }))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotsSig]);
  if (!draft) return null;

  const plan = draft;
  // A day's pills: what's on it first, in its order (numbered), then the rest of the plan's items.
  const pillsFor = (day: ScheduleDay) => [
    ...day.map(id => plan.workouts.find(w => w.id === id)).filter(w => !!w),
    ...plan.workouts.filter(w => !day.includes(w.id)),
  ].map(w => ({ value: w.id, label: w.name }));
  const toggle = (day: ScheduleDay, id: Id): ScheduleDay => (day.includes(id) ? day.filter(d => d !== id) : [...day, id]);

  const setMode = (mode: 'rotation' | 'weekly') =>
    update(p => {
      if (p.schedule.mode === mode) return p;
      const schedule: RotationSchedule | WeeklySchedule =
        mode === 'rotation'
          ? { mode: 'rotation', slots: [...p.workouts.map(w => [w.id]), []], passesPerCycle: 1 }
          : { mode: 'weekly', weekdays: [[], [], [], [], [], [], []], startWeekday: 1, weeksPerCycle: 1 };
      return { ...p, schedule };
    });

  const setRotation = (fn: (s: RotationSchedule) => RotationSchedule) =>
    update(p => (p.schedule.mode === 'rotation' ? { ...p, schedule: fn(p.schedule) } : p));
  const setWeekly = (fn: (s: WeeklySchedule) => WeeklySchedule) =>
    update(p => (p.schedule.mode === 'weekly' ? { ...p, schedule: fn(p.schedule) } : p));

  const reorderSlots = (items: { key: string; day: ScheduleDay }[]) => {
    setSlotItems(items);
    setRotation(s => ({ ...s, slots: items.map(i => i.day) }));
  };
  const addDay = () => {
    const key = newId();
    reorderSlots([...slotItems, { key, day: [] }]);
    setOpenKey(key);
  };

  const scheduledCount = scheduledIds(plan.schedule).length;
  const problem = scheduledCount === 0 ? 'Put at least one workout on the schedule.' : null;

  return (
    <StepRoot embedded={embedded}>
      <Animated.ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg}}>
        <View style={{ gap: spacing.sm }}>
          <ChoiceChips<'rotation' | 'weekly'>
            options={[
              { value: 'rotation', label: 'Rotation' },
              { value: 'weekly', label: 'Fixed weekdays' },
            ]}
            value={plan.schedule.mode}
            onChange={setMode}
          />
          <CustomText variant="caption" color={colors.inkMuted}>
            {plan.schedule.mode === 'rotation'
              ? 'Repeat a sequence day after day, whatever the weekday. If you miss a day and push it, everything shifts along.'
              : 'Pin workouts to weekdays. Pushing a missed workout only shifts within the week, so Monday stays Monday.'}
          </CustomText>
        </View>

        {plan.schedule.mode === 'rotation' ? (
          <>
            <SurfaceCard style={{ padding: 0, overflow: 'hidden' }}>
              {slotItems.length > 0 ? (
                <SortableRows
                  items={slotItems}
                  keyOf={i => i.key}
                  onReorder={reorderSlots}
                  scrollableRef={scrollRef}
                  // An open day stays put: no drag, no X, and only its chevron closes it.
                  lockedTrailing={item =>
                    openKey === item.key ? (
                      <Pressable onPress={() => setOpenKey(null)} hitSlop={6} accessibilityRole="button" accessibilityLabel="Close day" style={{ paddingVertical: spacing.lg, paddingHorizontal: spacing.md }}>
                        <Icon icon={directionIcons.angleUp} size={20} color={colors.inkMuted} />
                      </Pressable>
                    ) : undefined
                  }
                  renderRow={(item, i) => {
                    const open = openKey === item.key;
                    const names = dayNames(plan, item.day);
                    return (
                      <View style={{ paddingLeft: spacing.lg }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Pressable
                            onPress={() => setOpenKey(item.key)}
                            disabled={open}
                            accessibilityRole="button"
                            accessibilityState={{ expanded: open }}
                            accessibilityLabel={`Day ${i + 1}, ${names ?? 'Rest'}`}
                            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md }}
                          >
                            <View style={{ width: 52 }}>
                              <CustomText variant="overline" color={colors.inkMuted}>Day {i + 1}</CustomText>
                            </View>
                            <View style={{ flex: 1 }}>
                              {!open && <CustomText variant={names ? 'bodyStrong' : 'body'} color={names ? colors.ink : colors.inkMuted}>{names ?? 'Rest'}</CustomText>}
                            </View>
                          </Pressable>
                          {!open && (
                            <Pressable onPress={() => reorderSlots(slotItems.filter(s => s.key !== item.key))} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Remove day ${i + 1}`} style={{ padding: spacing.sm }}>
                              <Icon icon={generalIcons.xMark} size={20} color={colors.inkMuted} />
                            </Pressable>
                          )}
                        </View>
                        {open && (
                          <View style={{ paddingBottom: spacing.md }}>
                            <ChoiceChips<string>
                              options={pillsFor(item.day)}
                              value={item.day}
                              numbered
                              onChange={id => reorderSlots(slotItems.map(s => (s.key === item.key ? { ...s, day: toggle(s.day, id) } : s)))}
                            />
                          </View>
                        )}
                      </View>
                    );
                  }}
                />
              ) : (
                <CustomText variant="body" color={colors.inkMuted} style={{ padding: spacing.lg }}>No days yet. Add a day below.</CustomText>
              )}
            </SurfaceCard>
            <PrimaryButton label="Add a day" icon={generalIcons.plus} variant="outline" onPress={addDay} />
            <SurfaceCard style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Stepper label="Passes per cycle" value={plan.schedule.passesPerCycle} min={1} max={8} onChange={v => setRotation(s => ({ ...s, passesPerCycle: v }))} />
                </View>
                <CycleHelpButton />
              </View>
              <CustomText variant="caption" color={colors.inkMuted}>
                One cycle is {plan.schedule.slots.length * plan.schedule.passesPerCycle} days. Your targets hold for the cycle; at the end you get a report card and the app decides, from every workout in it, whether weights or reps should go up. Tap ? for more.
              </CustomText>
            </SurfaceCard>
          </>
        ) : (
          <>
            <SegmentedControl<string>
              options={DAY_SHORT.map((d, i) => ({ value: String(i), label: d }))}
              value={String(weekday)}
              onChange={v => setWeekday(Number(v))}
              marked={plan.schedule.weekdays.flatMap((day, i) => (day.length ? [String(i)] : []))}
              equal
            />
            <SurfaceCard style={{ gap: spacing.md }}>
              <CustomText variant="overline" color={colors.inkMuted}>{DAY[weekday]}</CustomText>
              <ChoiceChips<string>
                options={pillsFor(plan.schedule.weekdays[weekday])}
                value={plan.schedule.weekdays[weekday]}
                numbered
                onChange={id =>
                  setWeekly(s => {
                    const weekdays = [...s.weekdays] as WeeklySchedule['weekdays'];
                    weekdays[weekday] = toggle(weekdays[weekday], id);
                    return { ...s, weekdays };
                  })
                }
              />
              <CustomText variant="caption" color={colors.inkMuted}>Nothing picked is a rest day.</CustomText>
            </SurfaceCard>
            <SurfaceCard style={{ gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Stepper label="Weeks per cycle" value={plan.schedule.weeksPerCycle} min={1} max={12} onChange={v => setWeekly(s => ({ ...s, weeksPerCycle: v }))} />
                </View>
                <CycleHelpButton />
              </View>
              <CustomText variant="caption" color={colors.inkMuted}>
                Your targets hold for the cycle; at the end you get a report card and the app decides, from every workout in it, whether weights or reps should go up. Tap ? for more.
              </CustomText>
              <CustomText variant="overline" color={colors.inkMuted}>Week starts on</CustomText>
              <ChoiceChips<string>
                options={DAY.map((d, i) => ({ value: String(i), label: d.slice(0, 3) }))}
                value={String(plan.schedule.startWeekday)}
                onChange={v => setWeekly(s => ({ ...s, startWeekday: Number(v) as Weekday }))}
              />
            </SurfaceCard>
          </>
        )}
      </Animated.ScrollView>
      {!embedded && (mode === 'edit' ? (
        <StepFooter label="Done" problem={problem} onPress={() => navigation.goBack()} />
      ) : (
        <StepFooter label="Next: Review" problem={problem} onPress={() => navigation.navigate('PlanReviewScreen', { mode })} />
      ))}
    </StepRoot>
  );
};
