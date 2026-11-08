import React, { useCallback, useState } from 'react';
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { notices, NoticeDef } from '../../../../config/notices';
import { dueNotice, markSeen, NoticeContent } from '../../../../data/engine/notices';
import { useAuth } from '../../../../data/auth/AuthProvider';
import { usePlans } from '../../../../data/hooks/usePlans';
import { userRepository } from '../../../../data/repositories/userRepository';
import { NoticeSheet } from '../../../../components/overlays/NoticeSheet';
import { AppStackParams } from '../../../../appNavigators/AppStack';

/**
 * Shows the next notice due on this account (v1 #10.10), one per visit to the
 * Workout tab, and marks it seen when it is put away. A notice that doesn't
 * apply to this account (no content) is skipped without being marked, so it
 * can still show later if it comes to apply.
 */
export const NoticeHost = ({ blocked }: { blocked: boolean }) => {
  const navigation = useNavigation<NavigationProp<AppStackParams>>();
  const { uid, profile } = useAuth();
  const { plans } = usePlans();
  const [shown, setShown] = useState<{ notice: NoticeDef; content: NoticeContent } | null>(null);
  // Seen on this device before the profile catches up, so a dismissed notice never comes straight back.
  const [seenHere, setSeenHere] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!profile || blocked || shown) return;
      const seen = [...(profile.noticesSeen ?? []), ...seenHere];
      for (const n of notices) {
        if (!dueNotice([n], seen, profile.createdAt)) continue;
        const content = n.content({ profile, plans });
        if (content) {
          setShown({ notice: n, content });
          return;
        }
      }
    }, [profile, plans, blocked, shown, seenHere]),
  );

  const done = (then?: () => void) => {
    if (!shown) return;
    const id = shown.notice.id;
    setSeenHere(s => markSeen(s, id));
    setShown(null);
    if (uid) userRepository.update(uid, { noticesSeen: markSeen(profile?.noticesSeen, id) }).catch(err => console.warn('notice seen save failed', err));
    then?.();
  };

  return (
    <NoticeSheet
      open={shown !== null}
      content={shown?.content ?? null}
      onDone={() => done()}
      onSecondary={() => done(() => { if (shown?.content.secondary?.target === 'sharing') navigation.navigate('SharingScreen'); })}
    />
  );
};
