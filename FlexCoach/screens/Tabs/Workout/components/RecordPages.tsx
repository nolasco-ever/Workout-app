import React, { useRef, useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StatusBar, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DistanceUnit, PersonalRecord, WeightUnit } from '../../../../data/models';
import { recordGain } from '../../../../data/engine/stats';
import { formatRecordValue } from '../../../../data/engine/units';
import { BadgeHalo } from '../../../../components/achievements/BadgeHalo';
import { PrimaryButton } from '../../../../components/buttons/PrimaryButton';
import { CustomText } from '../../../../components/text/customText';
import { Icon } from '../../../../components/icons/Icon';
import { generalIcons } from '../../../../components/icons/icon-library';
import { useComfortableColumn } from '../../../../components/layout/useComfortableColumn';
import { useTheme } from '../../../../theme';
import { ironDark } from '../../../../theme/palette';

/** Black like the badge celebration, in light mode too; so the colours on it are the dark theme's. */
const GROUND = '#000000';
const dark = ironDark;
/** The trophy's circle; the halo spreads past it. */
const TROPHY = 132;
const HALO_BOX = 220;

const Page = ({ pr, n, of, width, weightUnit, distanceUnit }: { pr: PersonalRecord; n: number; of: number; width: number; weightUnit: WeightUnit; distanceUnit: DistanceUnit }) => {
  const { spacing, fonts } = useTheme();
  const column = useComfortableColumn();
  const value = formatRecordValue(pr.kind, pr.value, weightUnit, distanceUnit);
  const gain = recordGain(pr, weightUnit, distanceUnit);
  return (
    <View
      accessible
      accessibilityLabel={`New record, ${n} of ${of}. ${pr.exerciseName}, ${value}${gain ? `, up ${gain.gain.slice(1)} from ${gain.from}` : ''}`}
      style={{ width, justifyContent: 'center' }}
    >
      <View style={[{ alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.xl }, column]}>
      <View style={{ width: HALO_BOX, height: HALO_BOX, alignItems: 'center', justifyContent: 'center' }}>
        <BadgeHalo color={dark.accent} badgeSize={HALO_BOX} />
        <View style={{ width: TROPHY, height: TROPHY, borderRadius: TROPHY / 2, backgroundColor: dark.accentTint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon icon={generalIcons.trophy} color={dark.accent} size={68} weight="fill" />
        </View>
      </View>
      <CustomText variant="overline" color={dark.accent}>New record{of > 1 ? ` · ${n} of ${of}` : ''}</CustomText>
      <CustomText variant="heading" color={dark.ink} centered style={{ fontSize: 22, lineHeight: 28 }}>{pr.exerciseName}</CustomText>
      <CustomText color={dark.ink} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} style={{ fontFamily: fonts.display.bold, fontSize: 64, lineHeight: 70, letterSpacing: -1, fontVariant: ['tabular-nums'] }}>{value}</CustomText>
      {gain && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: 14, borderRadius: 999, backgroundColor: dark.successTint }}>
          <CustomText variant="bodyStrong" color={dark.success}>{gain.gain}</CustomText>
          <CustomText variant="body" color={dark.inkMuted}>from {gain.from}</CustomText>
        </View>
      )}
      </View>
    </View>
  );
};

/**
 * The records a workout set, one full-screen page each, before its summary
 * (v1 #8, the "DonePR" boards): swipe or Next between them; Skip, and the last
 * page's button, go on to the summary.
 */
export const RecordPages = ({ records, weightUnit, distanceUnit, onDone }: { records: PersonalRecord[]; weightUnit: WeightUnit; distanceUnit: DistanceUnit; onDone: () => void }) => {
  const { spacing } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const column = useComfortableColumn();
  const [index, setIndex] = useState(0);
  const pager = useRef<React.ElementRef<typeof ScrollView>>(null);
  const last = index >= records.length - 1;

  const onSettle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / width);
    if (page !== index) setIndex(page);
  };
  const next = () => {
    pager.current?.scrollTo({ x: (index + 1) * width, animated: true });
    setIndex(index + 1);
  };

  return (
    <View style={{ flex: 1, backgroundColor: GROUND, paddingTop: insets.top, paddingBottom: insets.bottom + spacing.lg }}>
      <StatusBar barStyle="light-content" />
      <View style={{ alignItems: 'flex-end', paddingHorizontal: spacing.md, minHeight: 44 }}>
        <TouchableOpacity onPress={onDone} accessibilityRole="button" accessibilityLabel="Skip to your workout" hitSlop={6} style={{ height: 44, paddingHorizontal: 14, justifyContent: 'center' }}>
          <CustomText variant="label" color={dark.inkMuted}>Skip</CustomText>
        </TouchableOpacity>
      </View>
      <ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={records.length > 1}
        onMomentumScrollEnd={onSettle}
        style={{ flex: 1 }}
        contentContainerStyle={{ alignItems: 'stretch' }}
      >
        {records.map((pr, i) => (
          <Page key={`${pr.exerciseId}-${pr.kind}`} pr={pr} n={i + 1} of={records.length} width={width} weightUnit={weightUnit} distanceUnit={distanceUnit} />
        ))}
      </ScrollView>
      <View style={[{ paddingHorizontal: spacing.xl, gap: spacing.lg, alignItems: 'center' }, column]}>
        {records.length > 1 && (
          <View accessibilityLabel={`Record ${index + 1} of ${records.length}`} style={{ flexDirection: 'row', gap: 6 }}>
            {records.map((pr, i) => (
              <View key={`${pr.exerciseId}-${pr.kind}`} style={{ width: i === index ? 18 : 7, height: 7, borderRadius: 4, backgroundColor: i === index ? dark.accent : dark.surfaceRaised }} />
            ))}
          </View>
        )}
        <View style={{ alignSelf: 'stretch' }}>
          <PrimaryButton label={last ? 'See your workout' : 'Next record'} onPress={last ? onDone : next} />
        </View>
      </View>
    </View>
  );
};
