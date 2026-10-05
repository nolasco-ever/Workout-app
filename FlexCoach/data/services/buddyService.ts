import { Activity, ActivityKind, ActivityReaction, Id, InviteCode, Occurrence, Plan, PublicProfile, Session, SharingPrefs, UserProfile } from '../models';
import { deleteField } from '@react-native-firebase/firestore';
import { newId } from '../engine/ids';
import { today } from '../engine/dates';
import { buildPublicProfile, formatInviteCode, generateInviteCode, inviteUrl, isStreakMilestone } from '../engine/buddies';
import { summarizeCycle } from '../engine/stats';
import { recordSeries, sharedDetail, sharedExercisesOf, withSharingDefaults } from '../engine/sharing';
import { formatRecordValue, formatWeight } from '../engine/units';
import { buddyRepository } from '../repositories/buddyRepository';
import { userRepository } from '../repositories/userRepository';
import { sessionRepository } from '../repositories/sessionRepository';
import { achievementRepository } from '../repositories/achievementRepository';
import { planRepository } from '../repositories/planRepository';
import { cycleRepository } from '../repositories/cycleRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import { NotificationTarget, PersonalRecord, WeightUnit } from '../models';

/**
 * Buddies: the Iron Card people scan to add each other, the summary each
 * buddy can see, the activity feed, and the few notifications buddies get
 * about each other. Everything a buddy sees is written by its owner into
 * their own subtree; the security rules decide who can read it.
 */

const firstName = (name: string | null | undefined): string => (name?.trim() ? name.trim().split(/\s+/)[0] : 'Your buddy');

/**
 * Rebuild the owner's Iron Card from their history and write it where
 * buddies (and the card code) can read it. Called after anything that
 * changes the numbers on it.
 */
export const refreshPublicProfile = async (uid: Id, profileHint: UserProfile | null, sessionsHint?: Session[]): Promise<PublicProfile> => {
  const profile = profileHint ?? (await userRepository.get(uid));
  const [sessions, unlocks, plans, cycles] = await Promise.all([
    sessionsHint ? Promise.resolve(sessionsHint) : sessionRepository.listAll(uid),
    achievementRepository.list(uid),
    planRepository.list(uid),
    cycleRepository.listAll(uid),
  ]);
  const finished = cycles.filter(c => c.status === 'completed').sort((a, b) => b.updatedAt - a.updatedAt);
  const last = finished[0];
  const lastRate = last ? summarizeCycle(last, sessions.filter(s => s.cycleId === last.id), []).completionRate : null;
  const active = cycles.find(c => c.status === 'active');
  const todayDate = today();
  const lastScheduled = active
    ? [...active.occurrences].filter(o => o.workoutId && o.date <= todayDate && o.status !== 'scheduled' && o.status !== 'in_progress').sort((a, b) => (a.date < b.date ? 1 : -1))[0]
    : undefined;
  const card = buildPublicProfile({
    uid,
    profile,
    sessions,
    unlocks,
    plans,
    lastCycleCompletionRate: lastRate,
    skippedLastScheduled: lastScheduled?.status === 'skipped',
    todayDate,
  });
  await userRepository.writePublicProfile(card);
  if (profile?.inviteCode) {
    await buddyRepository.writeInviteCode({ code: profile.inviteCode, uid, card, updatedAt: card.updatedAt }).catch(err => console.warn('invite code refresh failed', err));
  }
  return card;
};

/** The account's card code, made on first use. Returns the bare code (no FLX- prefix). */
export const ensureInviteCode = async (uid: Id, profile: UserProfile | null): Promise<string> => {
  if (profile?.inviteCode) return profile.inviteCode;
  let code = generateInviteCode();
  for (let attempt = 0; attempt < 5 && (await buddyRepository.getInviteCode(code)); attempt++) code = generateInviteCode();
  const card = await refreshPublicProfile(uid, profile);
  await buddyRepository.writeInviteCode({ code, uid, card, updatedAt: card.updatedAt });
  await userRepository.update(uid, { inviteCode: code });
  return code;
};

export const lookupInviteCode = (code: string): Promise<InviteCode | null> => buddyRepository.getInviteCode(code);

/** Where a card stands relative to me. */
export type CardRelation = 'self' | 'accepted' | 'none';

export const relationTo = async (uid: Id, otherUid: Id): Promise<CardRelation> => {
  if (uid === otherUid) return 'self';
  const row = await buddyRepository.get(uid, otherUid);
  return row?.status === 'accepted' ? 'accepted' : 'none';
};

/**
 * Add a buddy from their card. No request and no waiting: they shared the
 * card, so adding makes it mutual right away, and they're told.
 */
export const addBuddy = async (uid: Id, profile: UserProfile | null, target: InviteCode): Promise<void> => {
  const myCode = await ensureInviteCode(uid, profile);
  await buddyRepository.add(
    { uid, displayName: profile?.displayName ?? null, photoUrl: profile?.photoUrl ?? null, inviteCode: myCode },
    { uid: target.uid, displayName: target.card.displayName, photoUrl: target.card.photoUrl, inviteCode: target.code },
  );
  await notificationRepository
    .createForUser(target.uid, {
      id: `buddy_added:${uid}:${Date.now()}`,
      kind: 'buddy_added',
      title: `${profile?.displayName ?? 'Someone'} added you as a buddy`,
      body: "You'll see each other's streaks, workouts and shared plans. Tap to see their card.",
      target: { screen: 'buddy', uid, displayName: profile?.displayName ?? null },
      push: true,
    })
    .catch(err => console.warn('buddy added notification failed', err));
  // The card is what they'll look at next; make sure it exists and is fresh.
  refreshPublicProfile(uid, profile).catch(() => undefined);
};

/**
 * Remove a buddy. They're told first: the rules only let a buddy write to
 * someone's feed while the relationship exists, so the notification has to
 * land before the rows go. Either side can add the other again from the
 * card.
 */
export const removeBuddy = async (uid: Id, profile: UserProfile | null, otherUid: Id): Promise<void> => {
  const name = profile?.displayName ?? 'A buddy';
  await notificationRepository
    .createForUser(otherUid, {
      id: `buddy_removed:${uid}:${Date.now()}`,
      kind: 'buddy_removed',
      title: `${name} removed you as a buddy`,
      body: "You'll no longer see each other's activity or plans. Their card still adds them back any time.",
      target: { screen: 'buddies' },
      push: true,
    })
    .catch(err => console.warn('buddy removed notification failed', err));
  await buddyRepository.remove(uid, otherUid);
};

/** Text for the share sheet: the same link the QR code carries. */
export const shareMessage = (code: string, displayName: string | null): string =>
  `${displayName ? `${displayName.split(' ')[0]} wants` : 'Someone wants'} to be your buddy on FlexCoach. Tap to see their Iron Card and add them: ${inviteUrl(code)}`;

/**
 * Write a line to my own activity list. The id names the event, so writing
 * the same event twice (a double tap on Finish, a retried save) overwrites
 * one line instead of adding a second.
 */
export const recordActivity = async (uid: Id, id: string, kind: ActivityKind, title: string, detail: string | null = null, at: number = Date.now(), extra: Pick<Activity, 'sessionId' | 'records' | 'exercises' | 'record'> = {}): Promise<void> => {
  const item: Activity = { id, ownerId: uid, kind, title, detail, at, createdAt: at, updatedAt: at, ...extra };
  await buddyRepository.addActivity(uid, item);
};

type BuddyNotificationKind = 'buddy_streak' | 'buddy_achievement' | 'buddy_workout' | 'buddy_skipped' | 'buddy_plan_shared';

/**
 * Put the same item in every accepted buddy's feed. The server pushes it
 * to their phones; if their app is open it shows as an in-app banner.
 */
const notifyBuddies = async (uid: Id, idSuffix: string, kind: BuddyNotificationKind, title: string, body: string, target: NotificationTarget): Promise<void> => {
  const buddies = (await buddyRepository.list(uid)).filter(b => b.status === 'accepted');
  await Promise.all(
    buddies.map(b =>
      notificationRepository.createForUser(b.userId, { id: `${kind}:${uid}:${idSuffix}`, kind, title, body, target, push: true }).catch(err => console.warn('buddy notify failed', err)),
    ),
  );
};

/**
 * After a finished session: refresh the card, note the workout (and any
 * records) in the activity list, and tell buddies about a streak milestone.
 */
export const afterSessionFinished = async (uid: Id, profile: UserProfile | null, session: Session, records: PersonalRecord[], unit: WeightUnit): Promise<void> => {
  const sessions = await sessionRepository.listAll(uid);
  const card = await refreshPublicProfile(uid, profile, sessions);
  const sharing = withSharingDefaults(profile?.sharing);
  const name = firstName(profile?.displayName);
  const displayName = profile?.displayName ?? null;
  const dist = profile?.distanceUnit ?? 'mi';
  const shared = sharing.records ? records : [];
  const recordLines = shared.map(pr => ({ exerciseName: pr.exerciseName, value: formatRecordValue(pr.kind, pr.value, unit, dist), exerciseId: pr.exerciseId, kind: pr.kind }));
  const activityId = `workout_done:${session.id}`;
  // The workout line and its notification only exist if the owner shares
  // finished workouts; what it carries follows the rest of their prefs.
  if (sharing.workouts) {
    const exercises = sharedExercisesOf(session, sharing) ?? [];
    await recordActivity(uid, activityId, 'workout_done', `Finished ${session.workoutName}`, sharedDetail(session, sharing, unit), session.finishedAt ?? Date.now(), { sessionId: session.id, records: recordLines, exercises });
  }
  for (const pr of shared) {
    const value = formatRecordValue(pr.kind, pr.value, unit, dist);
    // The line carries the exercise's history so buddies get the graph
    // without reading sessions. Without a workout line it stands on its own.
    const record = { exerciseId: pr.exerciseId, kind: pr.kind, value: pr.value, date: session.date, history: recordSeries(sessions, pr.exerciseId, pr.kind) };
    await recordActivity(uid, `record:${session.id}:${pr.exerciseId}:${pr.kind}`, 'record', `New record: ${pr.exerciseName}`, value, Date.now(), { sessionId: sharing.workouts ? session.id : null, record });
  }
  if (sharing.workouts) {
    // Short on purpose: the sets and volume are on the line it opens.
    const recordNote = shared.length === 0 ? 'Tap to see how it went.' : shared.length === 1 ? '1 new record' : `${shared.length} new records`;
    await notifyBuddies(uid, session.id, 'buddy_workout', `${name} finished ${session.workoutName}`, recordNote, { screen: 'buddy_workout', uid, activityId, displayName });
  }
  if (isStreakMilestone(card.currentStreakDays)) {
    await recordActivity(uid, `streak:${card.currentStreakDays}:${session.date}`, 'streak', `${card.currentStreakDays}-day streak`, 'Every day counts.');
    await notifyBuddies(uid, `${card.currentStreakDays}:${session.date}`, 'buddy_streak', `${name} is on a ${card.currentStreakDays}-day streak`, 'Send some encouragement, or go match it.', { screen: 'buddy', uid, displayName });
  }
};

export const afterWorkoutSkipped = async (uid: Id, profile: UserProfile | null, occurrence: Occurrence): Promise<void> => {
  const workout = occurrence.workoutName ?? 'a workout';
  if (withSharingDefaults(profile?.sharing).skips) {
    await recordActivity(uid, `workout_skipped:${occurrence.id}`, 'workout_skipped', `Skipped ${workout}`, 'It happens. Next one counts double.');
    await notifyBuddies(uid, occurrence.id, 'buddy_skipped', `${firstName(profile?.displayName)} skipped ${workout}`, 'A nudge from you might get the next one done.', { screen: 'buddy', uid, displayName: profile?.displayName ?? null });
  }
  refreshPublicProfile(uid, profile).catch(() => undefined);
};

/**
 * React to a buddy's activity line, or take the reaction back with `null`.
 * One reaction per person; a new emoji replaces the old one. The owner
 * hears about it once per line, however often the emoji changes.
 */
export const reactToActivity = async (me: { uid: Id; displayName: string | null }, item: Activity, emoji: string | null): Promise<void> => {
  const reaction: ActivityReaction | null = emoji ? { emoji, at: Date.now(), name: me.displayName } : null;
  await buddyRepository.setReaction(item.ownerId, item.id, me.uid, reaction);
  if (!reaction) return;
  const what = item.kind === 'workout_done' ? item.title.replace(/^Finished /, 'your ') : item.kind === 'record' ? `your ${item.title.replace(/^New record: /, '')} record` : `your ${item.title.toLowerCase()}`;
  const target: NotificationTarget = item.sessionId ? { screen: 'session_detail', sessionId: item.sessionId, workoutName: item.kind === 'workout_done' ? item.title.replace(/^Finished /, '') : null } : { screen: 'workout' };
  await notificationRepository
    .createForUser(item.ownerId, { id: `buddy_reaction:${me.uid}:${item.id}`, kind: 'buddy_reaction', title: `${firstName(me.displayName)} reacted ${emoji} to ${what}`, body: 'Tap to see that workout.', target, push: true })
    .catch(() => undefined); // Only ever created once per line; a changed emoji is a silent update.
};

export const afterWorkoutPushed = async (uid: Id, profile: UserProfile | null, occurrence: Occurrence, toDate: string): Promise<void> => {
  if (!withSharingDefaults(profile?.sharing).skips) return;
  await recordActivity(uid, `workout_pushed:${occurrence.id}:${toDate}`, 'workout_pushed', `Moved ${occurrence.workoutName ?? 'a workout'}`, toDate === today() ? 'Doing it today instead.' : `Now on ${toDate}.`);
};

/**
 * Save new sharing prefs and bring every line the owner has already
 * written in step with them: finished workouts are rebuilt from their
 * sessions (so turning something back on restores it), lines of a kind
 * that is now private are removed, and the card is refreshed. Past
 * record and skip lines can't be recreated once removed.
 */
export const applySharingPrefs = async (uid: Id, profile: UserProfile | null, prefs: SharingPrefs): Promise<void> => {
  await userRepository.update(uid, { sharing: prefs });
  const updated: UserProfile | null = profile ? { ...profile, sharing: prefs } : null;
  const unit = profile?.weightUnit ?? 'lb';
  const lines = await buddyRepository.listAllActivity(uid);
  for (const line of lines) {
    try {
      if (line.kind === 'workout_done') {
        if (!prefs.workouts) {
          await buddyRepository.removeActivity(uid, line.id);
          continue;
        }
        const session = line.sessionId ? await sessionRepository.get(uid, line.sessionId) : null;
        const patch: Record<string, unknown> = {
          records: prefs.records ? line.records ?? [] : deleteField(),
          updatedAt: Date.now(),
        };
        if (session) {
          patch.detail = sharedDetail(session, prefs, unit);
          patch.exercises = sharedExercisesOf(session, prefs) ?? [];
        } else {
          // The session is gone; keep what is allowed and strip the rest.
          if (!prefs.totals) patch.detail = null;
          if (!prefs.sets && !prefs.reps && !prefs.weight) patch.exercises = (line.exercises ?? []).map(e => ({ name: e.name, measurement: e.measurement }));
        }
        await buddyRepository.patchActivity(uid, line.id, patch);
      } else if (line.kind === 'record') {
        if (!prefs.records) await buddyRepository.removeActivity(uid, line.id);
        else if (!prefs.workouts && line.sessionId) await buddyRepository.patchActivity(uid, line.id, { sessionId: null, updatedAt: Date.now() });
      } else if ((line.kind === 'workout_skipped' || line.kind === 'workout_pushed') && !prefs.skips) {
        await buddyRepository.removeActivity(uid, line.id);
      }
    } catch (err) {
      console.warn('sharing rewrite failed for', line.id, err);
    }
  }
  await refreshPublicProfile(uid, updated).catch(err => console.warn('card refresh failed', err));
};

export const afterCycleFinished = async (uid: Id, cycleId: Id, cycleNumber: number, completionRate: number): Promise<void> => {
  await recordActivity(uid, `cycle_done:${cycleId}`, 'cycle_done', `Finished cycle ${cycleNumber}`, `${Math.round(completionRate * 100)}% of workouts done`);
};

/** Flip a plan's buddy visibility; sharing it is worth a line in the feed and a push to every buddy. */
export const setPlanVisibleToBuddies = async (uid: Id, profile: UserProfile | null, plan: Plan, visible: boolean): Promise<void> => {
  await planRepository.setVisibleToBuddies(uid, plan.id, visible);
  if (visible && !plan.visibleToBuddies) {
    const workouts = `${plan.workouts.length} workout${plan.workouts.length === 1 ? '' : 's'}`;
    await recordActivity(uid, `plan_shared:${plan.id}`, 'plan_shared', `Shared a plan: ${plan.name}`, workouts);
    await notifyBuddies(uid, plan.id, 'buddy_plan_shared', `${firstName(profile?.displayName)} shared a plan: ${plan.name}`, `${workouts}. Use it in sync or save a copy.`, {
      screen: 'buddy_plan',
      ownerUid: uid,
      planId: plan.id,
      ownerName: profile?.displayName ?? null,
    });
  }
  refreshPublicProfile(uid, profile).catch(() => undefined);
};

/** Copy a buddy's shared plan into my account as an editable draft that remembers who made it. */
/** Save a buddy's plan under My plans: an independent copy, or one that keeps following their edits. */
export const copyBuddyPlan = (uid: Id, plan: Plan, owner: { uid: Id; displayName: string | null }, synced = false): Promise<Plan> => planRepository.copyTo(uid, plan, owner, newId, synced);

export { formatInviteCode };
