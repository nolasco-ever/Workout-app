import React, { useMemo, useState } from 'react';
import { FlatList, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Exercise } from '../../../../data/models';
import { comparableExercises, getCatalogExercise, searchCatalog } from '../../../../data/catalog/exerciseCatalog';
import { CustomText } from '../../../../components/text/customText';
import { TextField } from '../../../../components/inputs/TextField';
import { Icon } from '../../../../components/icons/Icon';
import { generalIcons } from '../../../../components/icons/icon-library';
import { MuscleMap } from '../../../../components/anatomy/MuscleMap';
import { useTheme } from '../../../../theme';
import { WorkoutStackParams } from '../WorkoutStack';
import { pickSwap } from '../components/swapChannel';

const title = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const ROW_HEIGHT = 84;

type Row = { kind: 'header'; key: string; label: string } | { kind: 'exercise'; key: string; exercise: Exercise };

/**
 * Pick a stand-in for one exercise of the running session. Comparable
 * exercises (same muscles, same kind of measurement, closest equipment
 * first) come first; a search covers the whole catalog.
 */
export const SwapExerciseScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<WorkoutStackParams>>();
  const { params } = useRoute<RouteProp<WorkoutStackParams, 'SwapExerciseScreen'>>();
  const { colors, spacing, radius } = useTheme();
  const [query, setQuery] = useState('');
  const current = getCatalogExercise(params.exerciseId);
  const exclude = useMemo(() => new Set(params.excludeIds), [params.excludeIds]);

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    const q = query.trim();
    if (current && !q) {
      const comparable = comparableExercises(current, exclude);
      if (comparable.length) {
        out.push({ kind: 'header', key: 'h-comparable', label: `Comparable to ${current.name}` });
        for (const e of comparable) out.push({ kind: 'exercise', key: `c-${e.id}`, exercise: e });
      }
    }
    if (q) {
      const results = searchCatalog({ query: q }).filter(e => e.id !== params.exerciseId && !exclude.has(e.id)).slice(0, 80);
      out.push({ kind: 'header', key: 'h-search', label: results.length ? 'All exercises' : 'No matches' });
      for (const e of results) out.push({ kind: 'exercise', key: `s-${e.id}`, exercise: e });
    }
    return out;
  }, [query, current, exclude, params.exerciseId]);

  const pick = (e: Exercise) => {
    pickSwap(params.sessionExerciseId, e);
    navigation.goBack();
  };

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <View style={{ padding: spacing.lg, gap: spacing.sm }}>
        <TextField id="swap-search" placeholder="Search all exercises" value={query} onChangeText={setQuery} autoCorrect={false} returnKeyType="search" />
        <CustomText variant="caption" color={colors.inkMuted}>
          The swap is for this workout only. Your plan keeps {current?.name ?? 'the original'}.
        </CustomText>
      </View>
      <FlatList
        data={rows}
        keyExtractor={r => r.key}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
        renderItem={({ item }) =>
          item.kind === 'header' ? (
            <CustomText variant="overline" color={colors.inkMuted} style={{ paddingTop: spacing.md, paddingBottom: spacing.xs }}>{item.label}</CustomText>
          ) : (
            <TouchableOpacity
              onPress={() => pick(item.exercise)}
              accessibilityRole="button"
              accessibilityLabel={`Swap to ${item.exercise.name}`}
              style={{ height: ROW_HEIGHT, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
            >
              <MuscleMap primary={item.exercise.primaryMuscles} secondary={item.exercise.secondaryMuscles} height={64} views="auto" />
              <View style={{ flex: 1 }}>
                <CustomText variant="bodyStrong" numberOfLines={1}>{item.exercise.name}</CustomText>
                <CustomText variant="caption" color={colors.inkMuted} numberOfLines={2}>
                  {item.exercise.primaryMuscles.map(title).join(', ')}{item.exercise.equipment ? ` · ${title(item.exercise.equipment)}` : ''}
                </CustomText>
              </View>
              <View style={{ width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.accentTint, alignItems: 'center', justifyContent: 'center' }}>
                <Icon icon={generalIcons.swap} size={20} color={colors.accent} strokeWidth={2.5} />
              </View>
            </TouchableOpacity>
          )
        }
        ListEmptyComponent={
          <CustomText variant="body" color={colors.inkMuted} style={{ paddingTop: spacing.lg }}>
            Nothing comparable in the catalog. Search for what you have in mind.
          </CustomText>
        }
      />
    </SafeAreaView>
  );
};
