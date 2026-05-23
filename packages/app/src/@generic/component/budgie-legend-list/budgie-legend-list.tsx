import { LegendList } from '@legendapp/list/react-native';

import type { LegendListProps } from '@legendapp/list/react-native';

const MAINTAIN_VISIBLE_CONTENT_POSITION = { data: false, size: true };

export const BudgieLegendList = <TItem,>({
    maintainVisibleContentPosition,
    recycleItems,
    showsVerticalScrollIndicator,
    ...props
}: LegendListProps<TItem>) => (
    <LegendList
        {...props}
        maintainVisibleContentPosition={maintainVisibleContentPosition ?? MAINTAIN_VISIBLE_CONTENT_POSITION}
        recycleItems={recycleItems ?? true}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator ?? false}
    />
);
