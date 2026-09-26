import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Share, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationProp, RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../data/auth/AuthProvider';
import { Buddy, Plan, PublicProfile } from '../../data/models';
import { buddyRepository } from '../../data/repositories/buddyRepository';
import { planRepository } from '../../data/repositories/planRepository';
import { addBuddy, lookupInviteCode, removeBuddy, shareMessage } from '../../data/services/buddyService';
import { formatInviteCode } from '../../data/engine/buddies';
import { describeSchedule } from '../Plans/components/planSummary';
import { CustomText } from '../../components/text/customText';
import { SurfaceCard } from '../../components/cards/SurfaceCard';
import { PrimaryButton } from '../../components/buttons/PrimaryButton';
import { Icon } from '../../components/icons/Icon';
import { directionIcons, generalIcons } from '../../components/icons/icon-library';
import { IronCard } from '../../components/buddies/IronCard';
import { useTheme } from '../../theme';
import { BuddyRoutes } from './routes';

type Relation = 'self' | 'accepted' | 'none';

/**
 * Someone's Iron Card, however you got here: a scanned or tapped link (by
 * code), or a row in your buddies list (by uid). Closes with the X. One
 * button says what you can do: Add buddy or Remove buddy. Adding is
 * immediate and mutual; having the card is the invitation. The same screen
 * serves before and after, so a card can always be brought back up.
 */
export const BuddyCardScreen = () => {
  const navigation = useNavigation<NavigationProp<BuddyRoutes>>();
  const { params } = useRoute<RouteProp<BuddyRoutes, 'BuddyCardScreen'>>();
  const { colors, spacing } = useTheme();
  const { uid, profile } = useAuth();
  const unit = profile?.weightUnit ?? 'lb';

  const [otherUid, setOtherUid] = useState<string | null>(params.uid ?? null);
  const [code, setCode] = useState<string | null>(params.code ?? null);
  const [card, setCard] = useState<PublicProfile | null | undefined>(undefined);
  const [row, setRow] = useState<Buddy | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [busy, setBusy] = useState(false);

  const relation: Relation | null = otherUid === null ? null : otherUid === uid ? 'self' : row?.status === 'accepted' ? 'accepted' : 'none';

  // Resolve who this is and load their card. By code: the public copy at
  // inviteCodes. By uid: my buddy row, then their live card if we're
  // buddies, else the copy at their code.
  const load = useCallback(async () => {
    if (!uid) return;
    try {
      let who = params.uid ?? null;
      let c = params.code ?? null;
      let mine: Buddy | null = who ? await buddyRepository.get(uid, who) : null;
      if (c) {
        const invite = await lookupInviteCode(c);
        if (!invite) {
          setNotFound(true);
          setCard(null);
          return;
        }
        who = invite.uid;
        mine = await buddyRepository.get(uid, who);
        setCard(invite.card);
      } else if (who) {
        c = mine?.inviteCode ?? null;
        if (mine?.status === 'accepted') {
          setCard((await buddyRepository.getPublicProfile(who).catch(() => null)) ?? (c ? (await lookupInviteCode(c))?.card ?? null : null));
        } else if (c) {
          setCard((await lookupInviteCode(c))?.card ?? null);
        } else {
          setCard(null);
        }
      }
      setOtherUid(who);
      setCode(c);
      setRow(mine);
    } catch (err) {
      console.warn(err);
      setCard(null);
    }
  }, [uid, params.uid, params.code]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Buddies' shared plans, once we're buddies.
  useEffect(() => {
    if (!otherUid || relation !== 'accepted') {
      setPlans(null);
      return;
    }
    planRepository
      .listSharedBy(otherUid)
      .then(list => setPlans(list.filter(p => p.status !== 'archived')))
      .catch(() => setPlans([]));
  }, [otherUid, relation, card?.sharedPlanCount]);

  const name = card?.displayName ?? row?.displayName ?? params.displayName ?? null;
  useLayoutEffect(() => {
    (navigation as any).setOptions({ title: name ?? 'Iron Card' });
  }, [navigation, name]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      await load();
    } catch (err) {
      console.warn(err);
      Alert.alert('Something went wrong', 'Try again in a moment.');
    } finally {
      setBusy(false);
    }
  };

  const add = () =>
    run(async () => {
      if (!uid || !code) return;
      const invite = await lookupInviteCode(code);
      if (invite) await addBuddy(uid, profile, invite);
    });
  const remove = () =>
    Alert.alert(`Remove ${name ?? 'this buddy'}?`, "You'll stop seeing each other's activity and plans. Either of you can add the other again from this card.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          run(async () => {
            if (uid && otherUid) await removeBuddy(uid, profile, otherUid);
          }),
      },
    ]);
  const share = () => {
    if (code) Share.share({ message: shareMessage(code, name) }).catch(() => undefined);
  };

  const action = () => {
    switch (relation) {
      case 'self':
        return <PrimaryButton label="Share my card" icon={generalIcons.share} variant="outline" onPress={share} />;
      case 'accepted':
        return <PrimaryButton label="Remove buddy" variant="outline" busy={busy} onPress={remove} />;
      case 'none':
        return <PrimaryButton label="Add buddy" icon={generalIcons.userPlus} busy={busy} disabled={!code} onPress={add} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.ground }}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl }}>
        {card === undefined ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xxl }} />
        ) : notFound ? (
          <View style={{ gap: spacing.md, paddingVertical: spacing.xl }}>
            <CustomText variant="heading" centered>No card for {formatInviteCode(params.code ?? '')}</CustomText>
            <CustomText variant="body" color={colors.inkMuted} centered>Check the link or code with your buddy. Theirs is behind the buddies button at the top of Profile.</CustomText>
          </View>
        ) : card === null ? (
          <CustomText variant="body" color={colors.inkMuted} centered>{name ?? 'This person'} hasn't logged a workout yet, so there's no card to show.</CustomText>
        ) : (
          <IronCard card={card} unit={unit} />
        )}

        {!notFound && action()}
        {relation === 'none' && card && (
          <CustomText variant="caption" color={colors.inkMuted} centered>Adding makes you buddies right away: you'll both see each other's streaks, workouts and shared plans.</CustomText>
        )}

        {relation === 'accepted' && (
          <View style={{ gap: spacing.sm }}>
            <CustomText variant="overline" color={colors.inkMuted}>Shared plans</CustomText>
            {plans === null ? (
              <ActivityIndicator color={colors.accent} />
            ) : plans.length === 0 ? (
              <SurfaceCard>
                <CustomText variant="body" color={colors.inkMuted}>{name ?? 'They'} hasn't shared any plans with buddies.</CustomText>
              </SurfaceCard>
            ) : (
              <SurfaceCard style={{ padding: 0 }}>
                {plans.map((p, i) => (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => navigation.navigate('BuddyPlanScreen', { ownerUid: otherUid!, planId: p.id, ownerName: name })}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}
                  >
                    <View style={{ flex: 1 }}>
                      <CustomText variant="bodyStrong">{p.name}</CustomText>
                      <CustomText variant="caption" color={colors.inkMuted}>{p.workouts.length} workout{p.workouts.length === 1 ? '' : 's'} · {describeSchedule(p)}</CustomText>
                    </View>
                    <Icon icon={directionIcons.angleRight} size={20} color={colors.inactive} />
                  </TouchableOpacity>
                ))}
              </SurfaceCard>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
