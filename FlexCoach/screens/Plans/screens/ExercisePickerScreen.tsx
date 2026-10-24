import React, { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { FlatList, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from '../../../components/layout/SafeAreaView';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Equipment, Exercise, ExerciseCategory, MuscleGroup, Session, Workout } from '../../../data/models';
import { PastExercise, pastExercisesLike } from '../../../data/engine/sessionExtras';
import { sessionRepository } from '../../../data/repositories/sessionRepository';
import { CATEGORY_OPTIONS, comparableExercises, EQUIPMENT_OPTIONS, getCatalogExercise, MUSCLE_GROUPS, searchCatalog } from '../../../data/catalog/exerciseCatalog';
import { newEntry, swapEntry } from '../../../data/services/planService';
import { pickAdd, pickSwap } from '../../Tabs/Workout/components/swapChannel';
import { CustomText } from '../../../components/text/customText';
import { TextField } from '../../../components/inputs/TextField';
import { ChoiceChips } from '../../../components/inputs/ChoiceChips';
import { PrimaryButton } from '../../../components/buttons/PrimaryButton';
import { BottomSheet } from '../../../components/overlays/BottomSheet';
import { Icon } from '../../../components/icons/Icon';
import { generalIcons } from '../../../components/icons/icon-library';
import { useTheme } from '../../../theme';
import { MuscleMap } from '../../../components/anatomy/MuscleMap';
import { PlansStackParams } from '../routes';
import { usePlanEditor } from '../PlanEditorContext';
import { useAuth } from '../../../data/auth/AuthProvider';
import { useFold } from '../../../data/fold/useFold';
import { useSessionOrientation } from '../../../navigation/useSessionOrientation';

const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const ROW_HEIGHT = 84;

/** What the search covers by default: the catalog without stretches, which hide behind the Stretching type. */
const DEFAULT_COUNT = searchCatalog({}).length;

interface RowProps {
  item: Exercise;
  inWorkout: boolean;
  /** The muscle filter in effect, so a row can say when it only hits it as a secondary muscle. */
  muscle: MuscleGroup | 'all';
  onOpen: (ex: Exercise) => void;
  onAdd: (ex: Exercise) => void;
  /** Swap mode: the action swaps rather than adds, and says so. */
  swap?: boolean;
}

/** Memoised so the long list only re-renders rows whose data changed. */
const ExerciseRow = React.memo(({ item, inWorkout, muscle, onOpen, onAdd, swap = false }: RowProps) => {
  const { colors, spacing, radius } = useTheme();
  const alsoHits = muscle !== 'all' && !item.primaryMuscles.includes(muscle);
  return (
    <View style={{ height: ROW_HEIGHT, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
      <TouchableOpacity onPress={() => onOpen(item)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <MuscleMap primary={item.primaryMuscles} secondary={item.secondaryMuscles} height={64} views="auto" />
        <View style={{ flex: 1 }}>
          <CustomText variant="bodyStrong" numberOfLines={1}>{item.name}</CustomText>
          <CustomText variant="caption" color={colors.inkMuted} numberOfLines={2}>
            {item.primaryMuscles.map(title).join(', ')}{alsoHits ? ` · also ${muscle}` : ''}{item.equipment ? ` · ${title(item.equipment)}` : ''}{inWorkout ? ' · added' : ''}
          </CustomText>
        </View>
        {/* The whole row opens the how-to; the icon is there so people know it does. */}
        <Icon icon={generalIcons.info} size={20} color={colors.inkMuted} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onAdd(item)}
        disabled={inWorkout}
        hitSlop={8}
        style={{ width: 40, height: 40, borderRadius: radius.sm, backgroundColor: inWorkout ? colors.surfaceRaised : colors.accentTint, alignItems: 'center', justifyContent: 'center' }}
      >
        <Icon icon={inWorkout ? generalIcons.check : swap ? generalIcons.swap : generalIcons.plus} size={20} color={inWorkout ? colors.inkMuted : colors.accent} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  );
});

/** A "previously done" card: the figure on the left, the words on the right, so it reads like a row and a long name has the width. */
const CARD_WIDTH = 248;
const CARD_MAP_HEIGHT = 72;

/** One card in the "previously done" strip: the row's content, side by side. The figure of the primary muscle's side, the name, the muscles and equipment, and the swap button. */
const PastCard = React.memo(({ past, onOpen, onSwap }: { past: PastExercise; onOpen: (ex: Exercise) => void; onSwap: (ex: Exercise) => void }) => {
  const { colors, spacing, radius } = useTheme();
  const ex = past.exercise;
  return (
    <TouchableOpacity onPress={() => onOpen(ex)} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={ex.name} style={{ width: CARD_WIDTH, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line }}>
      <MuscleMap primary={ex.primaryMuscles} secondary={ex.secondaryMuscles} height={CARD_MAP_HEIGHT} views="auto" />
      <View style={{ flex: 1, gap: spacing.xs }}>
        <CustomText variant="bodyStrong" numberOfLines={2}>{ex.name}</CustomText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <CustomText variant="caption" color={colors.inkMuted} numberOfLines={2} style={{ flex: 1 }}>
            {ex.primaryMuscles.map(title).join(', ')}{ex.equipment ? ` · ${title(ex.equipment)}` : ''}
          </CustomText>
          <TouchableOpacity
            onPress={() => onSwap(ex)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Swap in ${ex.name}`}
            style={{ width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon icon={generalIcons.swap} size={18} color={colors.accent} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

type PickerParams = {
  /**
   * Plan editor: add to this workout of the draft. Session: hand the pick
   * to the running workout. Swap: a stand-in for one of its exercises.
   */
  ExercisePickerScreen:
    | { workoutId: string; mode?: undefined; excludeIds?: undefined; planWorkouts?: undefined; sessionExerciseId?: undefined; exerciseId?: undefined; replaceEntryId?: string }
    /** `planWorkouts`: an empty quick workout can be filled with one of them from a link at the top. */
    | { mode: 'session'; excludeIds: string[]; planWorkouts?: Workout[]; workoutId?: undefined; sessionExerciseId?: undefined; exerciseId?: undefined; replaceEntryId?: undefined }
    | { mode: 'swap'; sessionExerciseId: string; exerciseId: string; excludeIds: string[]; planWorkouts?: undefined; workoutId?: undefined; replaceEntryId?: undefined };
};

/**
 * The one exercise picker: the catalog with search and filters. In the
 * plan editor a pick joins the draft's workout, or with `replaceEntryId`
 * takes that entry's place (comparable ones first, as in a workout); from a
 * running session it goes back through swapChannel, either added on the end
 * (mode 'session') or standing in for one exercise (mode 'swap').
 */
export const ExercisePickerScreen = () => {
  useSessionOrientation();
  const navigation = useNavigation<NativeStackNavigationProp<PlansStackParams>>();
  const { params } = useRoute<RouteProp<PickerParams, 'ExercisePickerScreen'>>();
  const sessionMode = params.mode === 'session' || params.mode === 'swap';
  const { colors, spacing, radius } = useTheme();
  const { draft, update } = usePlanEditor();
  const replaceEntryId = params.replaceEntryId;
  const replacing = replaceEntryId ? draft?.workouts.find(w => w.id === params.workoutId)?.exercises.find(e => e.id === replaceEntryId) : undefined;
  // Swapping, in a running workout or in the plan editor: comparable exercises lead and the pick takes a place.
  const swapMode = params.mode === 'swap' || !!replacing;
  const swapping = params.mode === 'swap' && params.exerciseId ? getCatalogExercise(params.exerciseId) : replacing ? getCatalogExercise(replacing.exerciseId) : null;
  const { uid, profile } = useAuth();
  const unit = profile?.weightUnit ?? 'lb';
  // Held like a book, the keyboard would claim a half and push this sheet onto the other, over the content it came from: the search waits for a tap.
  const book = useFold().posture === 'book';
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroup | 'all'>('all');
  const [equipment, setEquipment] = useState<Equipment | 'any'>('any');
  const [category, setCategory] = useState<ExerciseCategory | 'any'>('any');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const planWorkouts = params.mode === 'session' ? params.planWorkouts ?? [] : [];
  const activeFilters = (muscle === 'all' ? 0 : 1) + (equipment === 'any' ? 0 : 1) + (category === 'any' ? 0 : 1);

  const workout = params.workoutId ? draft?.workouts.find(w => w.id === params.workoutId) : undefined;
  const already = useMemo(() => new Set(sessionMode ? params.excludeIds ?? [] : workout?.exercises.map(e => e.exerciseId) ?? []), [sessionMode, params.excludeIds, workout]);

  // The catalog search is deferred so a tapped chip or a typed letter paints at once and the list follows.
  const filters = useDeferredValue({ query, muscle, equipment, category });
  const results = useMemo(() => {
    const { query: q, muscle: m, equipment: eq, category: c } = filters;
    const found = searchCatalog({
      query: q,
      muscle: m === 'all' ? undefined : m,
      equipment: eq === 'any' ? undefined : eq,
      category: c === 'any' ? undefined : c,
    }).filter(e => !swapping || e.id !== swapping.id);
    // Swapping: the closest stand-ins lead the list until a search or filter says otherwise.
    if (swapping && !q && m === 'all' && eq === 'any' && c === 'any') {
      const lead = comparableExercises(swapping, already);
      const leadIds = new Set(lead.map(e => e.id));
      return [...lead, ...found.filter(e => !leadIds.has(e.id))].slice(0, 120);
    }
    return found.slice(0, 120);
  }, [filters, swapping, already]);

  // Swapping: what the lifter has done before for the same muscle, with their last log of each, from their history.
  const [history, setHistory] = useState<Session[] | null>(null);
  useEffect(() => {
    if (!swapping || !uid) return;
    let on = true;
    sessionRepository.listCompleted(uid).then(s => { if (on) setHistory(s); }).catch(() => { if (on) setHistory([]); });
    return () => { on = false; };
  }, [swapping, uid]);
  const past = useMemo(() => (swapping && history ? pastExercisesLike(swapping, history, already) : []), [swapping, history, already]);
  const browsing = !filters.query && filters.muscle === 'all' && filters.equipment === 'any' && filters.category === 'any';
  const stripShown = swapMode && browsing && past.length > 0;

  const workoutId = params.workoutId;
  const add = useCallback(
    (ex: Exercise) => {
      if (params.mode === 'swap' && params.sessionExerciseId) pickSwap(params.sessionExerciseId, ex);
      else if (sessionMode) pickAdd(ex);
      else if (replaceEntryId)
        update(p => ({
          ...p,
          workouts: p.workouts.map(w => (w.id === workoutId ? { ...w, exercises: w.exercises.map(e => (e.id === replaceEntryId ? swapEntry(e, ex, p.goal, unit) : e)) } : w)),
        }));
      else
        update(p => ({
          ...p,
          workouts: p.workouts.map(w => (w.id === workoutId ? { ...w, exercises: [...w.exercises, newEntry(ex, w.exercises.length, p.goal, unit)] } : w)),
        }));
      navigation.goBack();
    },
    [params.mode, params.sessionExerciseId, sessionMode, replaceEntryId, update, navigation, workoutId, unit],
  );
  // The how-to carries the same action as the row, so a pick can be made from there without coming back to the list.
  const sessionExerciseId = params.sessionExerciseId;
  const open = useCallback(
    (ex: Exercise) => navigation.navigate('ExerciseDetailScreen', swapMode && sessionExerciseId ? { exerciseId: ex.id, swapForSessionExerciseId: sessionExerciseId } : sessionMode ? { exerciseId: ex.id, addToSession: true } : { exerciseId: ex.id, addToWorkoutId: workoutId, replaceEntryId }),
    [navigation, swapMode, sessionExerciseId, sessionMode, workoutId, replaceEntryId],
  );

  if (!sessionMode && (!draft || !workout)) return null;

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <View style={{ padding: spacing.lg, gap: spacing.md }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <TextField id="exercise-search" placeholder={`Search ${DEFAULT_COUNT} exercises`} value={query} onChangeText={setQuery} autoFocus={!book} autoCorrect={false} returnKeyType="search" />
          </View>
          <TouchableOpacity
            onPress={() => setFiltersOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={activeFilters ? `Filters, ${activeFilters} active` : 'Filters'}
            style={{ width: 48, height: 48, borderRadius: radius.md, backgroundColor: activeFilters ? colors.accent : colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon icon={generalIcons.sliders} size={20} color={activeFilters ? colors.onAccent : colors.ink} />
            {activeFilters > 0 && (
              <View style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, backgroundColor: colors.ink, borderWidth: 2, borderColor: colors.ground, alignItems: 'center', justifyContent: 'center' }}>
                <CustomText variant="overline" color={colors.ground}>{activeFilters}</CustomText>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
      {planWorkouts.length > 0 && (
        <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
          {/* Session mode runs in the Workout stack, where this modal lives; the Plans stack never shows the button. */}
          <PrimaryButton label="Copy a workout from my plan" icon={generalIcons.copy} variant="outline" onPress={() => (navigation as any).navigate('ActivePlanWorkoutsScreen', { workouts: planWorkouts })} />
        </View>
      )}
      {!swapMode && (
        <CustomText variant="caption" color={colors.inkMuted} style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
          {sessionMode ? "Tap an exercise to see how it's done, or + to add it to this workout. Your plan stays as it is." : "Tap an exercise to see how it's done, or + to add it straight away."}
        </CustomText>
      )}
      <FlatList showsVerticalScrollIndicator={false}
        data={results}
        keyExtractor={e => e.id}
        keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
        ListHeaderComponent={
          stripShown ? (
            <View style={{ gap: spacing.sm, marginHorizontal: -spacing.lg, marginBottom: spacing.md }}>
              <CustomText variant="overline" color={colors.inkMuted} style={{ paddingHorizontal: spacing.lg }}>Previously done</CustomText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
                {past.map(p => <PastCard key={p.exercise.id} past={p} onOpen={open} onSwap={add} />)}
              </ScrollView>
              <CustomText variant="overline" color={colors.inkMuted} style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>Similar exercises</CustomText>
            </View>
          ) : undefined
        }
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.line }} />}
        ListEmptyComponent={<CustomText variant="body" color={colors.inkMuted} centered style={{ padding: spacing.xl }}>No exercises match.</CustomText>}
        // Row offsets are only known without the strip above them.
        getItemLayout={stripShown ? undefined : (_, index) => ({ length: ROW_HEIGHT + 1, offset: (ROW_HEIGHT + 1) * index, index })}
        initialNumToRender={10}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
        renderItem={({ item }) => <ExerciseRow item={item} inWorkout={already.has(item.id)} muscle={muscle} onOpen={open} onAdd={add} swap={swapMode} />}
      />

      <BottomSheet
        open={filtersOpen}
        title="Filters"
        onClose={() => setFiltersOpen(false)}
        footer={
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <PrimaryButton label="Clear" variant="quiet" disabled={activeFilters === 0} onPress={() => { setMuscle('all'); setEquipment('any'); setCategory('any'); }} />
            </View>
            <View style={{ flex: 2 }}>
              <PrimaryButton label={`Show ${results.length === 120 ? '120+' : results.length} exercise${results.length === 1 ? '' : 's'}`} onPress={() => setFiltersOpen(false)} />
            </View>
          </View>
        }
      >
        <View style={{ gap: spacing.sm }}>
          <CustomText variant="overline" color={colors.inkMuted}>Muscle</CustomText>
          <ChoiceChips<MuscleGroup | 'all'> options={[{ value: 'all', label: 'All' }, ...MUSCLE_GROUPS.map(m => ({ value: m, label: title(m) }))]} value={muscle} onChange={setMuscle} />
        </View>
        <View style={{ gap: spacing.sm }}>
          <CustomText variant="overline" color={colors.inkMuted}>Equipment</CustomText>
          <ChoiceChips<Equipment | 'any'> options={[{ value: 'any', label: 'Any' }, ...EQUIPMENT_OPTIONS]} value={equipment} onChange={setEquipment} />
        </View>
        <View style={{ gap: spacing.sm }}>
          <CustomText variant="overline" color={colors.inkMuted}>Type</CustomText>
          <ChoiceChips<ExerciseCategory | 'any'> options={[{ value: 'any', label: 'Any' }, ...CATEGORY_OPTIONS]} value={category} onChange={setCategory} />
          <CustomText variant="caption" color={colors.inkMuted}>Stretches only show when you pick Stretching.</CustomText>
        </View>
      </BottomSheet>
    </SafeAreaView>
  );
};
