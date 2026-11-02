import { LegendList } from '@legendapp/list/react-native';

import type { LegendListProps, LegendListRef } from '@legendapp/list/react-native';
import type { Ref } from 'react';

const MAINTAIN_VISIBLE_CONTENT_POSITION = { data: false, size: true };

export const BudgieLegendList = <TItem,>({
    extraData,
    maintainVisibleContentPosition,
    recycleItems,
    showsVerticalScrollIndicator,
    ...props
}: LegendListProps<TItem> & { readonly ref?: Ref<LegendListRef> }) => (
    <LegendList
        {...props}
        extraData={extraData ?? props.renderItem}
        maintainVisibleContentPosition={maintainVisibleContentPosition ?? MAINTAIN_VISIBLE_CONTENT_POSITION}
        recycleItems={recycleItems ?? true}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator ?? false}
    />
);
