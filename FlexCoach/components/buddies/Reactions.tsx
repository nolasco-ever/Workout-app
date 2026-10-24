import React, { useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { TouchableOpacity, View } from 'react-native';
import { ActivityReaction, Id, REACTION_EMOJI } from '../../data/models';
import { CustomText } from '../text/customText';
import { Icon } from '../icons/Icon';
import { generalIcons } from '../icons/icon-library';
import { useTheme } from '../../theme';
import { BubbleAnchor, ReactionBubble } from './ReactionBubble';

interface Props {
  reactions: Record<Id, ActivityReaction> | undefined;
  /** Whose reaction to highlight; null hides the picker (nothing to react as). */
  myUid: Id | null;
  /** Set an emoji, or null to take mine back. Absent: read-only chips. */
  onReact?: (emoji: string | null) => void;
  /** Chips only, no way to add one; for the Home card. */
  compact?: boolean;
  /**
   * A row to put the smile button at the right of (a title line, say),
   * instead of after the chips. The chips then sit on their own row below,
   * and nothing at all is drawn under the header until someone reacts.
   */
  header?: React.ReactNode;
}

/**
 * Reactions under a buddy's activity line: one chip per emoji with its
 * count, mine outlined in the accent. The smile button floats a bubble of
 * the emoji set above itself; tapping one sets it, tapping the one I
 * already gave takes it back, tapping a chip does the same for its emoji.
 * One reaction per person. A long press on any chip opens who reacted, as a
 * modal (v1 #5).
 */
export const Reactions = ({ reactions, myUid, onReact, compact = false, header }: Props) => {
  const { colors, spacing, radius } = useTheme();
  const [anchor, setAnchor] = useState<BubbleAnchor | null>(null);
  const navigation = useNavigation();
  const openWho = () => (navigation as any).navigate('ReactionsScreen', { reactions: reactions ?? {} });
  const button = useRef<React.ComponentRef<typeof View>>(null);
  const entries = Object.entries(reactions ?? {});
  const mine = myUid ? reactions?.[myUid]?.emoji ?? null : null;
  const counts = new Map<string, number>();
  for (const [, r] of entries) counts.set(r.emoji, (counts.get(r.emoji) ?? 0) + 1);
  const known: readonly string[] = REACTION_EMOJI;
  const ordered: string[] = [...known.filter(e => counts.has(e)), ...[...counts.keys()].filter(e => !known.includes(e))];
  const canReact = !!onReact && !!myUid;
  if (ordered.length === 0 && (compact || !canReact) && header === undefined) return null;

  const pick = (emoji: string) => {
    onReact?.(mine === emoji ? null : emoji);
    setAnchor(null);
  };
  const openBubble = () => {
    const node = button.current;
    if (!node) return;
    node.measureInWindow((x, y, width, height) => setAnchor({ x, y, width, height }));
  };

  const addButton = canReact && !compact && (
    <View ref={button} collapsable={false}>
      <TouchableOpacity
        onPress={openBubble}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Add a reaction"
        style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: anchor ? colors.accentTint : colors.surfaceRaised }}
      >
        <Icon icon={generalIcons.smilePlus} size={20} color={anchor ? colors.accent : colors.inkMuted} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View>
      {header !== undefined && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View style={{ flex: 1 }}>{header}</View>
          {addButton}
        </View>
      )}
      {(ordered.length > 0 || (header === undefined && canReact && !compact)) && (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.xs, marginTop: header !== undefined ? spacing.md : spacing.xs }}>
      {ordered.map(emoji => {
        const selected = mine === emoji;
        const count = counts.get(emoji) ?? 0;
        return (
          <TouchableOpacity
            key={emoji}
            disabled={!canReact && compact}
            onPress={canReact ? () => pick(emoji) : openWho}
            onLongPress={openWho}
            delayLongPress={300}
            accessibilityRole="button"
            accessibilityLabel={`${emoji} ${count}${selected ? ', yours' : ''}`}
            accessibilityHint="Hold to see who reacted"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: spacing.sm,
              height: 28,
              borderRadius: radius.pill,
              backgroundColor: selected ? colors.accentTint : colors.surfaceRaised,
              borderWidth: 1,
              borderColor: selected ? colors.accent : colors.transparent,
            }}
          >
            <CustomText variant="caption" style={{ fontSize: 15, lineHeight: 20 }}>{emoji}</CustomText>
            <CustomText variant="caption" color={selected ? colors.accent : colors.inkMuted}>{count}</CustomText>
          </TouchableOpacity>
        );
      })}
      {header === undefined && addButton}
      </View>
      )}
      {canReact && !compact && <ReactionBubble anchor={anchor} mine={mine} onPick={pick} onClose={() => setAnchor(null)} />}
    </View>
  );
};
