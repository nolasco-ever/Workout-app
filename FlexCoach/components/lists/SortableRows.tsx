import React, { useCallback } from 'react';
import { View } from 'react-native';
import type { AnimatedRef } from 'react-native-reanimated';
import Sortable, { SortableGridRenderItem } from 'react-native-sortables';
import { Icon } from '../icons/Icon';
import { generalIcons } from '../icons/icon-library';
import { useTheme } from '../../theme';

interface Props<T> {
  items: T[];
  keyOf: (item: T) => string;
  renderRow: (item: T, index: number) => React.ReactNode;
  onReorder: (items: T[]) => void;
  /** Animated ScrollView ref from reanimated's useAnimatedRef, for auto-scroll while dragging. */
  scrollableRef?: AnimatedRef<any>;
}

/**
 * A single-column drag-to-reorder list. Rows keep their own tap targets;
 * only the grip on the right starts a drag.
 */
export function SortableRows<T>({ items, keyOf, renderRow, onReorder, scrollableRef }: Props<T>) {
  const { colors, spacing } = useTheme();

  const renderItem = useCallback<SortableGridRenderItem<T>>(
    ({ item, index }) => (
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderTopWidth: index === 0 ? 0 : 1, borderTopColor: colors.line }}>
        <View style={{ flex: 1 }}>{renderRow(item, index)}</View>
        <Sortable.Handle>
          <View style={{ paddingVertical: spacing.lg, paddingHorizontal: spacing.md }}>
            <Icon icon={generalIcons.grip} size={20} color={colors.inactive} />
          </View>
        </Sortable.Handle>
      </View>
    ),
    [renderRow, colors, spacing],
  );

  return (
    <Sortable.Grid
      columns={1}
      data={items}
      keyExtractor={keyOf}
      renderItem={renderItem}
      customHandle
      // Single column: the row already spans the width, so allowing only
      // vertical over-drag pins the dragged row to its column.
      overDrag="vertical"
      enableActiveItemSnap={false}
      activeItemScale={1.02}
      activeItemShadowOpacity={0.15}
      inactiveItemOpacity={1}
      hapticsEnabled={false}
      scrollableRef={scrollableRef}
      onDragEnd={({ data }) => onReorder(data)}
    />
  );
}
