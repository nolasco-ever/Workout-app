import { Activity, ActivityKind, Buddy, Id, InviteCode, Occurrence, Plan, PublicProfile, Session, UserProfile } from '../models';
import { newId } from '../engine/ids';
import { today } from '../engine/dates';
import { buildPublicProfile, formatInviteCode, generateInviteCode, isStreakMilestone } from '../engine/buddies';
import { countWorkingSets, totalVolumeKg, summarizeCycle } from '../engine/stats';
import { formatWeight } from '../engine/units';
import { buddyRepository } from '../repositories/buddyRepository';
import { userRepository } from '../repositories/userRepository';
import { sessionRepository } from '../repositories/sessionRepository';
import { achievementRepository } from '../repositories/achievementRepository';
import { planRepository } from '../repositories/planRepository';
import { cycleRepository } from '../repositories/cycleRepository';
import { notificationRepository } from '../repositories/notificationRepository';
import { PersonalRecord, WeightUnit } from '../models';

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

/** Where a scanned card stands relative to me. */
export type CardRelation = 'self' | 'accepted' | 'pending_sent' | 'pending_received' | 'none';

export const relationTo = async (uid: Id, otherUid: Id): Promise<CardRelation> => {
  if (uid === otherUid) return 'self';
  const row = await buddyRepository.get(uid, otherUid);
  return row?.status ?? 'none';
};

export const sendBuddyRequest = async (uid: Id, profile: UserProfile | null, target: InviteCode): Promise<void> => {
  await buddyRepository.sendRequest(
    { uid, displayName: profile?.displayName ?? null, photoUrl: profile?.photoUrl ?? null },
    { uid: target.uid, displayName: target.card.displayName, photoUrl: target.card.photoUrl },
  );
  await notificationRepository
    .createForUser(target.uid, {
      id: `buddy_request:${uid}`,
      kind: 'buddy_request',
      title: `${profile?.displayName ?? 'Someone'} wants to be your buddy`,
      body: 'Accept and you\'ll see each other\'s streaks, workouts and shared plans.',
      target: { screen: 'buddies' },
      push: true,
    })
    .catch(err => console.warn('buddy request notification failed', err));
};

export const acceptBuddyRequest = async (uid: Id, profile: UserProfile | null, other: Buddy): Promise<void> => {
  await buddyRepository.accept(uid, other.userId);
  await notificationRepository
    .createForUser(other.userId, {
      id: `buddy_accepted:${uid}`,
      kind: 'buddy_accepted',
      title: `${profile?.displayName ?? 'Your buddy'} accepted your request`,
      body: "You're buddies now. Their activity shows up on Home.",
      target: { screen: 'buddy', uid, displayName: profile?.displayName ?? null },
      push: true,
    })
    .catch(err => console.warn('buddy accepted notification failed', err));
  // The card is what they'll look at next; make sure it exists and is fresh.
  refreshPublicProfile(uid, profile).catch(() => undefined);
};

export const removeBuddy = (uid: Id, otherUid: Id): Promise<void> => buddyRepository.remove(uid, otherUid);

/** Write a line to my own activity list. */
export const recordActivity = async (uid: Id, kind: ActivityKind, title: string, detail: string | null = null, at: number = Date.now()): Promise<void> => {
  const item: Activity = { id: newId(), ownerId: uid, kind, title, detail, at, createdAt: at, updatedAt: at };
  await buddyRepository.addActivity(uid, item);
};

/** Put the same item in every accepted buddy's feed (and phone). */
const notifyBuddies = async (uid: Id, idSuffix: string, kind: 'buddy_streak' | 'buddy_achievement', title: string, body: string, displayName: string | null): Promise<void> => {
  const buddies = (await buddyRepository.list(uid)).filter(b => b.status === 'accepted');
  await Promise.all(
    buddies.map(b =>
      notificationRepository.createForUser(b.userId, { id: `${kind}:${uid}:${idSuffix}`, kind, title, body, target: { screen: 'buddy', uid, displayName }, push: true }).catch(err => console.warn('buddy notify failed', err)),
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
  const sets = countWorkingSets([session]);
  const volume = totalVolumeKg([session]);
  await recordActivity(uid, 'workout_done', `Finished ${session.workoutName}`, `${sets} set${sets === 1 ? '' : 's'}${volume > 0 ? ` · ${formatWeight(volume, unit).replace(/\.0+ /, ' ')} moved` : ''}`, session.finishedAt ?? Date.now());
  for (const pr of records) {
    const value = pr.kind === 'weight' ? formatWeight(pr.value, unit) : pr.kind === 'reps' ? `${pr.value} reps` : `${pr.value}`;
    await recordActivity(uid, 'record', `New record: ${pr.exerciseName}`, value);
  }
  if (isStreakMilestone(card.currentStreakDays)) {
    const name = firstName(profile?.displayName);
    await recordActivity(uid, 'streak', `${card.currentStreakDays}-day streak`, 'Every day counts.');
    await notifyBuddies(uid, `${card.currentStreakDays}:${session.date}`, 'buddy_streak', `${name} is on a ${card.currentStreakDays}-day streak`, 'Send some encouragement, or go match it.', profile?.displayName ?? null);
  }
};

export const afterWorkoutSkipped = async (uid: Id, profile: UserProfile | null, occurrence: Occurrence): Promise<void> => {
  await recordActivity(uid, 'workout_skipped', `Skipped ${occurrence.workoutName ?? 'a workout'}`, 'It happens. Next one counts double.');
  refreshPublicProfile(uid, profile).catch(() => undefined);
};

export const afterWorkoutPushed = async (uid: Id, occurrence: Occurrence, toDate: string): Promise<void> => {
  await recordActivity(uid, 'workout_pushed', `Moved ${occurrence.workoutName ?? 'a workout'}`, toDate === today() ? 'Doing it today instead.' : `Now on ${toDate}.`);
};

export const afterCycleFinished = async (uid: Id, cycleNumber: number, completionRate: number): Promise<void> => {
  await recordActivity(uid, 'cycle_done', `Finished cycle ${cycleNumber}`, `${Math.round(completionRate * 100)}% of workouts done`);
};

/** Flip a plan's buddy visibility; sharing it is worth a line in the feed. */
export const setPlanVisibleToBuddies = async (uid: Id, profile: UserProfile | null, plan: Plan, visible: boolean): Promise<void> => {
  await planRepository.setVisibleToBuddies(uid, plan.id, visible);
  if (visible && !plan.visibleToBuddies) await recordActivity(uid, 'plan_shared', `Shared a plan: ${plan.name}`, `${plan.workouts.length} workout${plan.workouts.length === 1 ? '' : 's'}`);
  refreshPublicProfile(uid, profile).catch(() => undefined);
};

/** Copy a buddy's shared plan into my account as an editable draft that remembers who made it. */
export const copyBuddyPlan = (uid: Id, plan: Plan, owner: { uid: Id; displayName: string | null }): Promise<Plan> => planRepository.copyTo(uid, plan, owner, newId);

export { formatInviteCode };
