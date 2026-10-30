import { LegendList } from '@legendapp/list/react-native';

import type { LegendListPositionSourceInterface } from '../../interface/legend-list-position-source.interface';
import type { LegendListProps } from '@legendapp/list/react-native';
import type { RefCallback } from 'react';

const MAINTAIN_VISIBLE_CONTENT_POSITION = { data: false, size: true };

export const BudgieLegendList = <TItem,>({
    extraData,
    maintainVisibleContentPosition,
    recycleItems,
    showsVerticalScrollIndicator,
    ...props
}: LegendListProps<TItem> & { readonly ref?: RefCallback<LegendListPositionSourceInterface> }) => (
    <LegendList
        {...props}
        extraData={extraData ?? props.renderItem}
        maintainVisibleContentPosition={maintainVisibleContentPosition ?? MAINTAIN_VISIBLE_CONTENT_POSITION}
        recycleItems={recycleItems ?? true}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator ?? false}
    />
);
