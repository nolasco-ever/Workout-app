import React, { useState } from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AchievementFamilyId } from '../../data/models';
import { ACHIEVEMENT_FAMILIES, MATERIALS, materialFor } from '../../data/engine/achievements';
import { Badge3D, BadgeLighting, DEFAULT_LIGHTING, DEFAULT_SPIN, SpinFeel } from '../../components/achievements/Badge3D';
import { badgeOverlayFor } from '../../components/achievements/badgeModels';
import { CustomText } from '../../components/text/customText';
import { SurfaceCard } from '../../components/cards/SurfaceCard';
import { useTheme } from '../../theme';

const STAGE = '#141416';

const Chip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => {
  const { colors, spacing, radius } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} accessibilityRole="button" accessibilityState={{ selected: active }} style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.pill, backgroundColor: active ? colors.accent : colors.surfaceRaised }}>
      <CustomText variant="label" color={active ? colors.onAccent : colors.ink}>{label}</CustomText>
    </TouchableOpacity>
  );
};

/** A number with a minus and a plus, for tuning by eye. */
const Dial = ({ label, value, onChange, step, format = v => String(v) }: { label: string; value: number; onChange: (v: number) => void; step: (v: number, dir: 1 | -1) => number; format?: (v: number) => string }) => {
  const { colors, spacing } = useTheme();
  const Button = ({ dir }: { dir: 1 | -1 }) => (
    <TouchableOpacity onPress={() => onChange(step(value, dir))} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={`${label} ${dir > 0 ? 'up' : 'down'}`} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }}>
      <CustomText variant="bodyStrong">{dir > 0 ? '+' : '−'}</CustomText>
    </TouchableOpacity>
  );
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      <CustomText variant="body" style={{ flex: 1 }}>{label}</CustomText>
      <Button dir={-1} />
      <CustomText variant="bodyStrong" style={{ minWidth: 72, textAlign: 'center' }}>{format(value)}</CustomText>
      <Button dir={1} />
    </View>
  );
};

const scale = (k: number) => (v: number, dir: 1 | -1) => Math.round(dir > 0 ? v * k : v / k);
const add = (d: number, min: number, max: number) => (v: number, dir: 1 | -1) => Math.min(max, Math.max(min, v + d * dir));

/**
 * Design review: every badge of every family, unlocked, as the spinning
 * 3D model the app will ship, with the lighting and the spin feel
 * adjustable on the spot. Behind `features.badgePreview`; not for testers.
 */
export const BadgePreviewScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const [family, setFamily] = useState<AchievementFamilyId>('workouts');
  const [tier, setTier] = useState(1);
  const [lighting, setLighting] = useState<BadgeLighting>(DEFAULT_LIGHTING);
  const [spin, setSpin] = useState<SpinFeel>(DEFAULT_SPIN);

  const tiers = MATERIALS.map((_, i) => i + 1).filter(t => badgeOverlayFor(family, t) !== undefined);
  const shownTier = tiers.includes(tier) ? tier : tiers[tiers.length - 1];
  const name = ACHIEVEMENT_FAMILIES.find(f => f.id === family)?.name ?? family;

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl }}>
        <View style={{ backgroundColor: STAGE, borderRadius: radius.lg, alignItems: 'center', paddingVertical: spacing.lg, gap: spacing.sm }}>
          <Badge3D key={`${family}:${shownTier}`} family={family} tier={shownTier} lighting={lighting} spin={spin} style={{ width: 300, height: 300 }} />
          <CustomText variant="bodyStrong" color="#FFFFFF">{name} · {materialFor(shownTier)}</CustomText>
          <CustomText variant="caption" color="rgba(255,255,255,0.6)">Drag sideways to turn it. Flick to spin.</CustomText>
        </View>

        <View style={{ gap: spacing.sm }}>
          <CustomText variant="overline" color={colors.inkMuted}>Family</CustomText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {ACHIEVEMENT_FAMILIES.map(f => (
              <Chip key={f.id} label={f.name} active={f.id === family} onPress={() => setFamily(f.id)} />
            ))}
          </View>
        </View>
        <View style={{ gap: spacing.sm }}>
          <CustomText variant="overline" color={colors.inkMuted}>Tier</CustomText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {tiers.map(t => (
              <Chip key={t} label={`${t} · ${materialFor(t)}`} active={t === shownTier} onPress={() => setTier(t)} />
            ))}
          </View>
        </View>

        <SurfaceCard style={{ gap: spacing.md }}>
          <CustomText variant="heading">Lighting</CustomText>
          <Dial label="Environment" value={lighting.environment} step={scale(1.25)} onChange={environment => setLighting({ ...lighting, environment })} format={v => `${Math.round(v / 1000)}k`} />
          <Dial label="Sun" value={lighting.sun} step={scale(1.25)} onChange={sun => setLighting({ ...lighting, sun })} format={v => `${Math.round(v / 1000)}k`} />
          <Dial label="Sun colour" value={lighting.kelvin} step={add(500, 2000, 12000)} onChange={kelvin => setLighting({ ...lighting, kelvin })} format={v => `${v}K`} />
        </SurfaceCard>
        <SurfaceCard style={{ gap: spacing.md }}>
          <CustomText variant="heading">Spin</CustomText>
          <Dial label="Turn per point" value={spin.radiansPerPoint} step={(v, dir) => Math.max(0.002, +(v + 0.002 * dir).toFixed(3))} onChange={radiansPerPoint => setSpin({ ...spin, radiansPerPoint })} format={v => v.toFixed(3)} />
          <Dial label="Coasting" value={spin.deceleration} step={(v, dir) => Math.min(0.9995, Math.max(0.99, +(v + 0.0005 * dir).toFixed(4)))} onChange={deceleration => setSpin({ ...spin, deceleration })} format={v => v.toFixed(4)} />
          <CustomText variant="caption" color={colors.inkMuted}>Higher coasting keeps a flick going longer. Send me the numbers you land on.</CustomText>
        </SurfaceCard>
      </ScrollView>
    </SafeAreaView>
  );
};
