import { useEffect, useEffectEvent, useRef } from 'react';

import { isDefined } from '@rnw-community/shared';

import type { LegendListPositionSourceInterface } from '../../@generic/interface/legend-list-position-source.interface';
import type { TransactionsByDaySectionInterface } from '../interface/transactions-by-day-section.interface';
import type { SharedValue } from 'react-native-reanimated';

export const useTransactionListHeaderOffsets = (
    sections: readonly TransactionsByDaySectionInterface[],
    headerIndices: readonly number[],
    headerOffsets: SharedValue<number[]> | undefined
) => {
    const listRef = useRef<LegendListPositionSourceInterface | null>(null);

    const handleListRef = (list: LegendListPositionSourceInterface | null) => {
        listRef.current = list;
    };

    const publishHeaderOffsets = () => {
        const state = listRef.current?.getState();

        if (isDefined(state)) {
            headerOffsets?.set(headerIndices.map(index => state.positionAtIndex(index)));
        }
    };

    const handleSectionsChange = useEffectEvent(publishHeaderOffsets);

    useEffect(() => void handleSectionsChange(), [sections]);

    return { handleListRef, publishHeaderOffsets };
};
