import React, { useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedRef } from 'react-native-reanimated';
import { SortableRows } from '../../../components/lists/SortableRows';
import { newId } from '../../../data/engine/ids';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Id, RotationSchedule, WeeklySchedule, Weekday } from '../../../data/models';
import { CustomText } from '../../../components/text/customText';
import { SurfaceCard } from '../../../components/cards/SurfaceCard';
import { ChoiceChips } from '../../../components/inputs/ChoiceChips';
import { Stepper } from '../../../components/inputs/Stepper';
import { Icon } from '../../../components/icons/Icon';
import { directionIcons, generalIcons } from '../../../components/icons/icon-library';
import { useTheme } from '../../../theme';
import { PlansStackParams } from '../PlansStack';
import { usePlanEditor } from '../PlanEditorContext';
import { StepFooter } from '../components/StepFooter';
import { workoutName } from '../components/planSummary';

const DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const PlanScheduleScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<PlansStackParams>>();
  const { params } = useRoute<RouteProp<PlansStackParams, 'PlanScheduleScreen'>>();
  const { colors, spacing } = useTheme();
  const { draft, update } = usePlanEditor();
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  // Rotation slots can repeat (several rest days), so give each a stable local key for dragging.
  const [slotItems, setSlotItems] = useState<{ key: string; workoutId: Id | null }[]>([]);
  const slotsSig = draft?.schedule.mode === 'rotation' ? draft.schedule.slots.join('|') : '';
  useEffect(() => {
    if (!draft || draft.schedule.mode !== 'rotation') return;
    const slots = draft.schedule.slots;
    setSlotItems(prev => (prev.map(i => i.workoutId).join('|') === slots.join('|') ? prev : slots.map((workoutId, i) => ({ key: prev[i]?.workoutId === workoutId ? prev[i].key : newId(), workoutId }))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotsSig]);
  if (!draft) return null;

  const plan = draft;
  const options = [{ value: 'rest', label: 'Rest' }, ...plan.workouts.map(w => ({ value: w.id, label: w.name }))];

  const setMode = (mode: 'rotation' | 'weekly') =>
    update(p => {
      if (p.schedule.mode === mode) return p;
      const schedule: RotationSchedule | WeeklySchedule =
        mode === 'rotation'
          ? { mode: 'rotation', slots: [...p.workouts.map(w => w.id), null], passesPerCycle: 1 }
          : { mode: 'weekly', weekdays: [null, null, null, null, null, null, null], startWeekday: 1, weeksPerCycle: 1 };
      return { ...p, schedule };
    });

  const setRotation = (fn: (s: RotationSchedule) => RotationSchedule) =>
    update(p => (p.schedule.mode === 'rotation' ? { ...p, schedule: fn(p.schedule) } : p));
  const setWeekly = (fn: (s: WeeklySchedule) => WeeklySchedule) =>
    update(p => (p.schedule.mode === 'weekly' ? { ...p, schedule: fn(p.schedule) } : p));

  const reorderSlots = (items: { key: string; workoutId: Id | null }[]) => {
    setSlotItems(items);
    setRotation(s => ({ ...s, slots: items.map(i => i.workoutId) }));
  };

  const scheduledCount =
    plan.schedule.mode === 'rotation' ? plan.schedule.slots.filter(Boolean).length : plan.schedule.weekdays.filter(Boolean).length;
  const problem = scheduledCount === 0 ? 'Put at least one workout on the schedule.' : null;

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <Animated.ScrollView ref={scrollRef} contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
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
                  renderRow={(item, i) => (
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: spacing.lg }}>
                      <View style={{ width: 52 }}>
                        <CustomText variant="overline" color={colors.inkMuted}>Day {i + 1}</CustomText>
                      </View>
                      <View style={{ flex: 1, paddingVertical: spacing.md }}>
                        <CustomText variant={item.workoutId ? 'bodyStrong' : 'body'} color={item.workoutId ? colors.ink : colors.inkMuted}>{workoutName(plan, item.workoutId)}</CustomText>
                      </View>
                      <TouchableOpacity onPress={() => reorderSlots(slotItems.filter(s => s.key !== item.key))} hitSlop={6} style={{ padding: spacing.sm }}>
                        <Icon icon={generalIcons.xMark} size={20} color={colors.inkMuted} />
                      </TouchableOpacity>
                    </View>
                  )}
                />
              ) : (
                <CustomText variant="body" color={colors.inkMuted} style={{ padding: spacing.lg }}>No days yet. Add workouts and rest days below.</CustomText>
              )}
            </SurfaceCard>
            <View style={{ gap: spacing.sm }}>
              <CustomText variant="overline" color={colors.inkMuted}>Add a day</CustomText>
              <ChoiceChips<string>
                options={options}
                value={null}
                onChange={v => setRotation(s => ({ ...s, slots: [...s.slots, v === 'rest' ? null : (v as Id)] }))}
              />
            </View>
            <SurfaceCard>
              <Stepper label="Passes per cycle" value={plan.schedule.passesPerCycle} min={1} max={8} onChange={v => setRotation(s => ({ ...s, passesPerCycle: v }))} />
              <CustomText variant="caption" color={colors.inkMuted}>
                One cycle is {plan.schedule.slots.length * plan.schedule.passesPerCycle} days. You'll get a review at the end of each.
              </CustomText>
            </SurfaceCard>
          </>
        ) : (
          <>
            <SurfaceCard style={{ padding: 0 }}>
              {plan.schedule.weekdays.map((slot, i) => (
                <View key={i} style={{ borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}>
                  <TouchableOpacity onPress={() => setEditingDay(editingDay === i ? null : i)} style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.lg, gap: spacing.md }}>
                    <View style={{ width: 44 }}>
                      <CustomText variant="overline" color={colors.inkMuted}>{DAY_SHORT[i]}</CustomText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <CustomText variant={slot ? 'bodyStrong' : 'body'} color={slot ? colors.ink : colors.inkMuted}>{workoutName(plan, slot)}</CustomText>
                    </View>
                    <Icon icon={editingDay === i ? directionIcons.angleUp : directionIcons.angleDown} size={18} color={colors.inactive} />
                  </TouchableOpacity>
                  {editingDay === i && (
                    <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg }}>
                      <ChoiceChips<string>
                        options={options}
                        value={slot ?? 'rest'}
                        onChange={v => {
                          setWeekly(s => {
                            const weekdays = [...s.weekdays] as WeeklySchedule['weekdays'];
                            weekdays[i] = v === 'rest' ? null : (v as Id);
                            return { ...s, weekdays };
                          });
                          setEditingDay(null);
                        }}
                      />
                    </View>
                  )}
                </View>
              ))}
            </SurfaceCard>
            <SurfaceCard style={{ gap: spacing.sm }}>
              <Stepper label="Weeks per cycle" value={plan.schedule.weeksPerCycle} min={1} max={12} onChange={v => setWeekly(s => ({ ...s, weeksPerCycle: v }))} />
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
      <StepFooter label="Next: Review" problem={problem} onPress={() => navigation.navigate('PlanReviewScreen', { mode: params.mode })} />
    </SafeAreaView>
  );
};
