import React, { useEffect, useRef, useState } from 'react';
import { Alert, Image, ScrollView, Switch, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from '../../../../components/layout/SafeAreaView';
import { LoggedSet, Session, WatchMetrics } from '../../../../data/models';
import { SessionResult } from '../../../../data/services/workoutService';
import { sessionRepository } from '../../../../data/repositories/sessionRepository';
import { cardioDoneRows, cardioScreenKind } from '../../../../data/engine/cardioScreen';
import { applyScan, ConsoleReading, editScanned, hasScan, removeScanned, ScanField } from '../../../../data/engine/consoleScan';
import { formatDistance, formatDuration, formatRecordValue, M_PER_MI, parseNumber, toDisplayDistance } from '../../../../data/engine/units';
import { scanConsole } from '../../../../data/services/consoleScanService';
import { onWatchMetrics, watchMetricsFor } from '../../../../data/liveActivity/watchMetrics';
import { onWatchDistance, takeWatchDistance } from '../../../../data/liveActivity/watchDistance';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { CustomText } from '../../../../components/text/customText';
import { Icon } from '../../../../components/icons/Icon';
import { generalIcons } from '../../../../components/icons/icon-library';
import { PrimaryButton } from '../../../../components/buttons/PrimaryButton';
import { SurfaceCard as Card } from '../../../../components/cards/SurfaceCard';
import { BottomSheet } from '../../../../components/overlays/BottomSheet';
import { TextField } from '../../../../components/inputs/TextField';
import { useComfortableColumn } from '../../../../components/layout/useComfortableColumn';
import { useTheme } from '../../../../theme';

const FIELD_LABEL: Record<ScanField, string> = { distance: 'Distance', calories: 'Calories', speed: 'Avg speed' };

/** The set of a session that is one cardio entry, or null. */
export const soleCardioSet = (session: Session): LoggedSet | null =>
  session.exercises.length === 1 && session.exercises[0].measurement === 'distance_time' ? session.exercises[0].sets[0] ?? null : null;

/**
 * The done screen for a session that is one cardio entry (v1 #10.7, the
 * "Cardio · done" boards): the time alone on top, the rest in a table, and,
 * on a machine, "Scan the console" until something scanned is in. Scanned
 * numbers carry a camera mark, open an edit sheet when tapped, and come off
 * with their X (a distance then goes back to the Watch's). Outdoor kinds drop
 * the check and get their route map under the table in 10.8.
 */
export const CardioDone = ({ result, onDone }: { result: SessionResult; onDone: () => void }) => {
  const { colors, spacing, fonts } = useTheme();
  const column = useComfortableColumn();
  const { uid, profile } = useAuth();
  const unit = profile?.distanceUnit ?? 'mi';
  const weightUnit = profile?.weightUnit ?? 'lb';
  const [session, setSession] = useState(result.session);
  const exercise = session.exercises[0];
  const set = exercise.sets[0];
  const kind = cardioScreenKind(exercise.exerciseId);
  const sessionId = session.id;
  const [watch, setWatch] = useState<WatchMetrics | null>(() => session.watch ?? watchMetricsFor(sessionId));
  useEffect(() => onWatchMetrics((id, metrics) => { if (id === sessionId) setWatch(metrics); }), [sessionId]);

  const sessionRef = useRef(session);
  const save = (next: LoggedSet) => {
    const current = sessionRef.current;
    const updated: Session = { ...current, exercises: current.exercises.map(e => (e.id === exercise.id ? { ...e, sets: e.sets.map(st => (st.id === next.id ? next : st)) } : e)) };
    sessionRef.current = updated;
    setSession(updated);
    if (uid) sessionRepository.logSet(uid, current, exercise.id, next).catch(err => console.warn('cardio done save failed', err));
  };

  // The Watch's own final distance can land after End: it fills the entry, unless a scanned one is on it.
  useEffect(
    () =>
      onWatchDistance((setId, meters) => {
        if (setId !== set.id) return;
        takeWatchDistance(setId);
        const st = sessionRef.current.exercises[0]?.sets.find(s => s.id === setId);
        if (!st) return;
        save(st.scan?.distanceM !== undefined ? { ...st, scan: { ...st.scan, prior: { distanceM: meters, watch: true } } } : { ...st, distanceM: meters, distanceSource: 'watch' });
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [set.id, uid],
  );

  // The scan: the photo, the numbers found, and which of them to keep.
  const [found, setFound] = useState<{ uri: string; reading: ConsoleReading; keep: Record<ScanField, boolean> } | null>(null);
  const [scanning, setScanning] = useState(false);
  const scan = async () => {
    setFound(null);
    setScanning(true);
    try {
      const res = await scanConsole(unit);
      if (res.status === 'read') setFound({ uri: res.uri, reading: res.reading, keep: { distance: true, calories: true, speed: true } });
      else if (res.status === 'unread')
        Alert.alert("Couldn't read the console", 'Try again with the screen filling the photo.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retake', onPress: () => { scan().catch(() => undefined); } },
        ]);
      else if (res.status === 'unavailable') Alert.alert("Can't scan here", 'Reading a console needs the latest version of the app.');
    } finally {
      setScanning(false);
    }
  };
  const foundRows = found
    ? ([
        found.reading.distanceM !== undefined && { field: 'distance' as const, value: formatDistance(found.reading.distanceM, unit) },
        found.reading.kcal !== undefined && { field: 'calories' as const, value: `${found.reading.kcal} kcal` },
        found.reading.speedMps !== undefined && { field: 'speed' as const, value: `${((found.reading.speedMps * 3600) / (unit === 'mi' ? M_PER_MI : 1000)).toFixed(1)} ${unit === 'mi' ? 'mph' : 'km/h'}` },
      ].filter(Boolean) as { field: ScanField; value: string }[])
    : [];
  const useFound = () => {
    if (!found) return;
    const keep = (Object.keys(found.keep) as ScanField[]).filter(f => found.keep[f]);
    if (keep.length) save(applyScan(set, found.reading, keep));
    setFound(null);
  };

  // Editing one scanned number, in the units on screen.
  const [editing, setEditing] = useState<{ field: ScanField; text: string; error: string | null } | null>(null);
  const shownValue = (field: ScanField): string => {
    const s = set.scan;
    if (field === 'distance') return String(toDisplayDistance(s?.distanceM ?? null, unit) ?? '');
    if (field === 'calories') return String(s?.kcal ?? '');
    return s?.speedMps === undefined ? '' : ((s.speedMps * 3600) / (unit === 'mi' ? M_PER_MI : 1000)).toFixed(1);
  };
  const saveEdit = () => {
    if (!editing) return;
    const v = parseNumber(editing.text);
    if (v === null || v <= 0) {
      setEditing({ ...editing, error: 'Enter a number above 0.' });
      return;
    }
    const per = unit === 'mi' ? M_PER_MI : 1000;
    const stored = editing.field === 'distance' ? v * per : editing.field === 'speed' ? (v * per) / 3600 : v;
    save(editScanned(set, editing.field, stored));
    setEditing(null);
  };
  const editUnit = editing ? (editing.field === 'distance' ? unit : editing.field === 'speed' ? (unit === 'mi' ? 'mph' : 'km/h') : 'kcal') : undefined;

  const rows = cardioDoneRows(kind, set, watch, unit);
  const records = result.personalRecords;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[{ padding: spacing.xl, paddingBottom: spacing.lg, gap: spacing.lg, flexGrow: 1 }, column]}>
        <View style={{ alignItems: 'center', gap: spacing.md, paddingTop: spacing.xl }}>
          {kind.behind === 'graphic' && (
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.successTint, alignItems: 'center', justifyContent: 'center' }}>
              <Icon icon={generalIcons.check} color={colors.success} size={40} strokeWidth={3} />
            </View>
          )}
          <CustomText variant="title" centered accessibilityRole="header">{exercise.exerciseName} done</CustomText>
          <View style={{ alignItems: 'center', gap: 2 }}>
            <CustomText variant="overline" color={colors.inkMuted}>Time</CustomText>
            <CustomText style={{ fontFamily: fonts.display.bold, fontSize: 56, lineHeight: 62, letterSpacing: -1, fontVariant: ['tabular-nums'] }}>{formatDuration(set.durationSec ?? result.durationSec)}</CustomText>
          </View>
        </View>

        {rows.length > 0 && (
          <Card style={{ paddingVertical: 0, paddingHorizontal: spacing.md }}>
            {rows.map((row, i) => (
              <View key={row.key} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 52, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.line }}>
                {row.scanned ? (
                  <TouchableOpacity
                    onPress={() => setEditing({ field: row.scanned!, text: shownValue(row.scanned!), error: null })}
                    accessibilityRole="button"
                    accessibilityLabel={`${row.label}, ${row.value}, from the console. Edit`}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', minHeight: 52 }}
                  >
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <CustomText variant="body">{row.label}</CustomText>
                      <Icon icon={generalIcons.camera} size={15} color={colors.inkMuted} />
                    </View>
                    <CustomText variant="bodyStrong">{row.value}</CustomText>
                  </TouchableOpacity>
                ) : (
                  <>
                    <CustomText variant="body" style={{ flex: 1 }}>{row.label}</CustomText>
                    <CustomText variant="bodyStrong">{row.value}</CustomText>
                  </>
                )}
                {row.scanned && (
                  <TouchableOpacity
                    onPress={() => save(removeScanned(set, row.scanned!))}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove scanned ${row.label.toLowerCase()}`}
                    style={{ width: 32, height: 32, marginLeft: spacing.xs, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Icon icon={generalIcons.xMark} size={18} color={colors.inkMuted} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </Card>
        )}

        {kind.scan && !hasScan(set) && <PrimaryButton label="Scan the console" variant="outline" icon={generalIcons.camera} busy={scanning} onPress={() => { scan().catch(() => undefined); }} />}

        {records.length > 0 && (
          <Card tone="accent">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
              <Icon icon={generalIcons.trophy} color={colors.accent} size={20} />
              <CustomText variant="heading">{records.length === 1 ? 'New personal record' : `${records.length} new personal records`}</CustomText>
            </View>
            {records.map(pr => (
              <View key={pr.exerciseId} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs }}>
                <CustomText variant="body">{pr.exerciseName}</CustomText>
                <CustomText variant="bodyStrong" color={colors.accent}>{formatRecordValue(pr.kind, pr.value, weightUnit, unit)}</CustomText>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
      <View style={[{ paddingHorizontal: spacing.xl, paddingBottom: spacing.lg }, column]}>
        <PrimaryButton label="Done" onPress={onDone} />
      </View>

      <BottomSheet
        open={found !== null}
        title="From the console"
        onClose={() => setFound(null)}
        footer={
          <View style={{ gap: spacing.sm }}>
            <PrimaryButton label="Use these" onPress={useFound} />
            <PrimaryButton label="Retake" variant="quiet" onPress={() => { scan().catch(() => undefined); }} />
          </View>
        }
      >
        {found && (
          <View style={{ gap: spacing.md }}>
            <Image source={{ uri: found.uri }} resizeMode="cover" accessibilityLabel="The photo of the console" style={{ height: 168, borderRadius: 16, backgroundColor: colors.surfaceRaised }} />
            <CustomText variant="body" color={colors.inkMuted} centered>The numbers you choose to keep will replace the existing numbers. Time stays as the app timed it.</CustomText>
            <Card style={{ paddingVertical: 0, paddingHorizontal: spacing.md }}>
              {foundRows.map((r, i) => (
                <View key={r.field} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 56, gap: spacing.md, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.line }}>
                  <CustomText variant="body" style={{ flex: 1 }}>{FIELD_LABEL[r.field]}</CustomText>
                  <CustomText variant="bodyStrong" color={found.keep[r.field] ? colors.ink : colors.inkMuted}>{r.value}</CustomText>
                  <Switch
                    value={found.keep[r.field]}
                    onValueChange={v => setFound({ ...found, keep: { ...found.keep, [r.field]: v } })}
                    accessibilityLabel={`Keep ${FIELD_LABEL[r.field].toLowerCase()}`}
                    trackColor={{ true: colors.success, false: colors.surfaceRaised }}
                  />
                </View>
              ))}
            </Card>
          </View>
        )}
      </BottomSheet>

      <BottomSheet
        open={editing !== null}
        title={editing ? FIELD_LABEL[editing.field] : ''}
        onClose={() => setEditing(null)}
        footer={
          <View style={{ gap: spacing.sm }}>
            <PrimaryButton label="Save" onPress={saveEdit} />
            <PrimaryButton label="Cancel" variant="quiet" onPress={() => setEditing(null)} />
          </View>
        }
      >
        {editing && (
          <TextField
            label="From the console"
            value={editing.text}
            onChangeText={text => setEditing({ ...editing, text, error: null })}
            keyboardType="decimal-pad"
            autoFocus
            suffix={editUnit}
            error={editing.error}
            accessibilityLabel={`${FIELD_LABEL[editing.field]} in ${editUnit}`}
          />
        )}
      </BottomSheet>
    </SafeAreaView>
  );
};
